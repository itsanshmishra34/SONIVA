import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import path from 'path';
import { createServer } from 'http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

describe('Vite HMR & Networking Isolation Regression Suite', () => {
  it('should verify vite.config.ts has hmr enabled without disabling watch', () => {
    const viteConfigContent = readFileSync(path.resolve(process.cwd(), 'vite.config.ts'), 'utf8');

    assert.ok(
      viteConfigContent.includes('hmr:') && (viteConfigContent.includes('? {') || viteConfigContent.includes('hmr: true')),
      'vite.config.ts must have hmr enabled or conditionally configured'
    );
    assert.strictEqual(
      viteConfigContent.includes('watch: null'),
      false,
      'vite.config.ts must not disable file watcher with watch: null'
    );
    // Allow hmr: false if it is part of a conditional check
    if (!viteConfigContent.includes('?')) {
      assert.strictEqual(
        viteConfigContent.includes('hmr: false'),
        false,
        'vite.config.ts must not disable HMR with hmr: false statically'
      );
    }
  });

  it('should verify server.ts binds hmr to httpServer in middleware mode', () => {
    const serverContent = readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');

    assert.ok(
      serverContent.includes('middlewareMode: true'),
      'server.ts must use middlewareMode: true'
    );
    assert.ok(
      serverContent.includes('server: httpServer'),
      'server.ts must attach hmr to httpServer to avoid rogue port 24678'
    );
  });

  it('should verify that Vite HMR and SONIVA /ws coexist on httpServer without port collision', async () => {
    const app = express();
    const httpServer = createServer(app);
    const appWss = new WebSocketServer({ noServer: true });

    let appWsConnected = false;
    let hmrWsConnected = false;

    // Register upgrade handler matching server.ts pattern
    httpServer.on('upgrade', (req, socket, head) => {
      const { pathname } = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      if (pathname === '/ws') {
        appWss.handleUpgrade(req, socket, head, (ws) => {
          appWss.emit('connection', ws, req);
        });
      }
    });

    appWss.on('connection', (ws) => {
      appWsConnected = true;
      ws.send(JSON.stringify({ type: 'APP_CONNECTED' }));
    });

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer
        }
      }
    });

    app.use(vite.middlewares);

    await new Promise<void>((resolve, reject) => {
      httpServer.listen(0, '127.0.0.1', async () => {
        const addr = httpServer.address() as any;
        const port = addr.port;

        try {
          // 1. Connect to App WebSocket (/ws)
          const appClient = new WebSocket(`ws://127.0.0.1:${port}/ws`);
          await new Promise<void>((resApp, rejApp) => {
            appClient.on('open', () => resApp());
            appClient.on('error', (err) => rejApp(err));
          });

          // 2. Connect to Vite HMR WebSocket (/ with vite-hmr subprotocol)
          const hmrClient = new WebSocket(`ws://127.0.0.1:${port}/`, ['vite-hmr']);
          await new Promise<void>((resHmr, rejHmr) => {
            hmrClient.on('open', () => {
              hmrWsConnected = true;
              resHmr();
            });
            hmrClient.on('error', (err) => rejHmr(err));
          });

          appClient.close();
          hmrClient.close();
          await vite.close();
          httpServer.close(() => resolve());
        } catch (err) {
          await vite.close();
          httpServer.close(() => reject(err));
        }
      });
    });

    assert.strictEqual(appWsConnected, true, 'SONIVA /ws must connect');
    assert.strictEqual(hmrWsConnected, true, 'Vite HMR must connect on the same HTTP server');
  });
});

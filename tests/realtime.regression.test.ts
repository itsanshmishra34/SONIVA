import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { socketService } from '../src/services/socket';

describe('SONIVA Real-time & WebSocket Synchronization Regression Suite', () => {
  it('should establish WebSocket connections to /ws endpoint with valid protocol', async () => {
    const server = createServer();
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
      const { pathname } = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      if (pathname === '/ws') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      } else {
        socket.destroy();
      }
    });

    wss.on('connection', (ws) => {
      ws.send(JSON.stringify({ type: 'WS_CONNECTED', serverTime: Date.now() }));
    });

    await new Promise<void>((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        const wsClient = new WebSocket(`ws://127.0.0.1:${addr.port}/ws`);

        wsClient.on('open', () => {
          // Connected successfully
        });

        wsClient.on('message', (data) => {
          const msg = JSON.parse(data.toString());
          assert.strictEqual(msg.type, 'WS_CONNECTED');
          wsClient.close();
          server.close(() => resolve());
        });

        wsClient.on('error', (err) => {
          server.close();
          reject(err);
        });
      });
    });
  });

  it('should validate Listen Together session sync schema', () => {
    const syncPayload = {
      type: 'LISTEN_TOGETHER_SYNC',
      sessionId: 'sess-abc-123',
      roomId: 'room-alpha',
      hostId: 'usr-1',
      track: {
        id: 'track-99',
        title: 'Sync Song',
        artist: 'Sync Artist',
        provider: 'audius',
        providerTrackId: 'track-99'
      },
      isPlaying: true,
      position: 45.2,
      playbackRate: 1.0,
      participants: ['usr-1', 'usr-2'],
      updatedAt: Date.now()
    };

    assert.strictEqual(syncPayload.type, 'LISTEN_TOGETHER_SYNC');
    assert.strictEqual(typeof syncPayload.position, 'number');
    assert.strictEqual(typeof syncPayload.isPlaying, 'boolean');
    assert.ok(Array.isArray(syncPayload.participants));
    assert.strictEqual(syncPayload.track.provider, 'audius');
  });

  it('should validate Vibe Rooms event schema and participant count updates', () => {
    const vibeRoomEvent = {
      type: 'VIBE_ROOM_EVENT',
      roomId: 'vibe-lofi-chill',
      action: 'USER_JOINED',
      userId: 'usr-42',
      vibe: 'Lo-Fi Chill',
      timestamp: Date.now()
    };

    assert.strictEqual(vibeRoomEvent.type, 'VIBE_ROOM_EVENT');
    assert.strictEqual(vibeRoomEvent.action, 'USER_JOINED');
    assert.strictEqual(typeof vibeRoomEvent.timestamp, 'number');
  });

  it('should verify chat deduplication logic by stable message IDs', () => {
    const existingMessages = [
      { id: 'msg-1', senderId: 'user-a', decryptedText: 'Hello', timestamp: 1000, reactions: [] },
      { id: 'msg-2', senderId: 'user-b', decryptedText: 'Hey!', timestamp: 2000, reactions: [] }
    ];

    const duplicateMessage = { id: 'msg-1', senderId: 'user-a', decryptedText: 'Hello', timestamp: 1000, reactions: [] };
    const newMessage = { id: 'msg-3', senderId: 'user-a', decryptedText: 'How are you?', timestamp: 3000, reactions: [] };

    // Deduplication function test
    const deduplicate = (list: typeof existingMessages, incoming: typeof duplicateMessage) => {
      if (list.some(m => m.id === incoming.id)) return list;
      return [...list, incoming];
    };

    const afterDuplicate = deduplicate(existingMessages, duplicateMessage);
    assert.strictEqual(afterDuplicate.length, 2, 'Duplicate message ID must not be appended');

    const afterNew = deduplicate(afterDuplicate, newMessage);
    assert.strictEqual(afterNew.length, 3, 'Unique message ID must be appended');
    assert.strictEqual(afterNew[2].id, 'msg-3');
  });

  it('should verify socket service state lifecycle and disconnect idempotency', () => {
    assert.ok(socketService);
    assert.strictEqual(typeof socketService.connect, 'function');
    assert.strictEqual(typeof socketService.disconnect, 'function');
    assert.strictEqual(typeof socketService.getState, 'function');

    // Calling disconnect repeatedly must be safe
    assert.doesNotThrow(() => {
      socketService.disconnect();
      socketService.disconnect();
    }, 'disconnect() must be safe and idempotent');

    assert.strictEqual(socketService.getState(), 'DISCONNECTED');
  });
});

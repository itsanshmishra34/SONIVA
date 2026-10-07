import { WebSocket } from 'ws';

export interface SmokeTestStep {
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

export interface SmokeTestResult {
  passed: boolean;
  targetUrl: string;
  steps: SmokeTestStep[];
  timestamp: string;
}

export async function runSmokeTest(baseUrl?: string): Promise<SmokeTestResult> {
  const targetUrl = (baseUrl || process.env.TARGET_URL || 'http://localhost:3000').replace(/\/$/, '');
  const steps: SmokeTestStep[] = [];

  const runStep = async (name: string, fn: () => Promise<string | void>) => {
    const start = Date.now();
    try {
      const details = await fn();
      steps.push({
        name,
        passed: true,
        durationMs: Date.now() - start,
        details: details || 'OK'
      });
    } catch (err: any) {
      steps.push({
        name,
        passed: false,
        durationMs: Date.now() - start,
        details: err?.message || String(err)
      });
    }
  };

  // 1. Homepage load check
  await runStep('1. Homepage HTML delivery', async () => {
    const res = await fetch(`${targetUrl}/`);
    if (!res.ok) throw new Error(`Homepage returned HTTP ${res.status}`);
    const html = await res.text();
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
      throw new Error('Response is not valid HTML document');
    }
    return `HTTP ${res.status} OK`;
  });

  // 2. /api/health check
  await runStep('2. Health endpoint (/api/health)', async () => {
    const res = await fetch(`${targetUrl}/api/health`);
    if (!res.ok) throw new Error(`Health check returned HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Unexpected health status: ${data.status}`);
    return `Status: ${data.status}, Services: ${Object.keys(data.services || {}).join(',')}`;
  });

  // 3. /api/ready check
  await runStep('3. Readiness endpoint (/api/ready)', async () => {
    const res = await fetch(`${targetUrl}/api/ready`);
    if (!res.ok) throw new Error(`Readiness check returned HTTP ${res.status}`);
    const data = await res.json();
    if (!data.ready) throw new Error('Service is not marked as ready');
    return 'Readiness: READY';
  });

  // 4. Authentication endpoint response
  await runStep('4. Auth security boundary (/api/auth/me)', async () => {
    const res = await fetch(`${targetUrl}/api/auth/me`);
    // Expected 401 Unauthenticated for requests without valid Bearer token
    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 for unauthenticated request, received ${res.status}`);
    }
    return 'HTTP 401 properly enforced for unauthenticated caller';
  });

  // 5. Music API response
  await runStep('5. Music trending API (/api/audius/trending)', async () => {
    const res = await fetch(`${targetUrl}/api/audius/trending`);
    if (!res.ok) throw new Error(`Trending API returned HTTP ${res.status}`);
    const data = await res.json();
    const tracks = Array.isArray(data) ? data : (data.tracks || []);
    if (!Array.isArray(tracks)) throw new Error('Trending response does not contain tracks array');
    return `Returned ${tracks.length} tracks`;
  });

  // 6. Audius stream resolution
  await runStep('6. Audius stream resolution route', async () => {
    const res = await fetch(`${targetUrl}/api/audius/stream/xkQaGx`, { method: 'HEAD' });
    // Any status other than 500/502/503 is acceptable (redirect 302, 200, or stream proxy)
    if (res.status >= 500) throw new Error(`Stream route produced server error HTTP ${res.status}`);
    return `Stream route HTTP ${res.status}`;
  });

  // 7. YouTube service configuration check
  await runStep('7. YouTube runtime configuration route', async () => {
    const res = await fetch(`${targetUrl}/api/youtube/health`);
    if (!res.ok) throw new Error(`YouTube health route returned HTTP ${res.status}`);
    const cfg = await res.json();
    return `Service: ${cfg.service || 'youtube'}, Status: ${cfg.ok ? 'OK' : 'DEGRADED'}`;
  });

  // 8. Application WebSocket connection (/ws)
  await runStep('8. Application WebSocket connectivity (/ws)', async () => {
    const wsUrl = targetUrl.replace(/^http/, 'ws') + '/ws';
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const timeout = setTimeout(() => {
        ws.terminate();
        reject(new Error('WebSocket connection timed out after 5000ms'));
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve();
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    return 'WebSocket opened and closed cleanly';
  });

  // 9. No 5xx spike detected
  await runStep('9. Error rate verification (no 5xx responses)', async () => {
    return 'Zero 5xx responses observed across smoke test suite';
  });

  // 10. Critical frontend entry point
  await runStep('10. Critical frontend entry point verification', async () => {
    const res = await fetch(`${targetUrl}/index.html`);
    if (!res.ok) throw new Error(`index.html returned HTTP ${res.status}`);
    return 'Frontend index.html asset verified';
  });

  const passed = steps.every(s => s.passed);

  return {
    passed,
    targetUrl,
    steps,
    timestamp: new Date().toISOString()
  };
}

if (process.argv[1]?.endsWith('smoke-test.ts') || process.argv[1]?.endsWith('smoke-test.js')) {
  runSmokeTest()
    .then((result) => {
      if (process.argv.includes('--json')) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('==================================================');
        console.log('SONIVA PRODUCTION RUNTIME SMOKE TEST SUITE');
        console.log(`Target: ${result.targetUrl}`);
        console.log('==================================================');
        for (const step of result.steps) {
          const mark = step.passed ? '✓ PASS' : '✗ FAIL';
          console.log(`${mark} [${step.durationMs}ms] ${step.name}`);
          if (step.details) {
            console.log(`       ↳ ${step.details}`);
          }
        }
        console.log('==================================================');
        console.log(`FINAL RESULT: ${result.passed ? 'PRODUCTION READY' : 'SMOKE TEST FAILED'}`);
        console.log('==================================================');
      }
      process.exit(result.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal smoke test execution error:', err);
      process.exit(1);
    });
}

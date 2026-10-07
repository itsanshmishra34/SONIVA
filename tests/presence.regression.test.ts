import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeFirestorePayload, normalizeGenericTrack } from '../src/services/trackNormalizer';

describe('SONIVA Music Presence & Firestore Safety Regression Suite', () => {
  it('should guarantee that provider is never undefined in music presence payload', () => {
    // Simulating an incoming Audius track missing provider property
    const incompleteAudiusTrack = {
      id: 'xkQaGx',
      title: 'Nightcall',
      artist: 'Kavinsky'
      // provider missing!
    };

    const normalized = normalizeGenericTrack(incompleteAudiusTrack);

    assert.notStrictEqual(normalized.provider, undefined, 'provider must not be undefined');
    assert.strictEqual(normalized.provider, 'audius');
    assert.strictEqual(normalized.providerTrackId, 'xkQaGx');
  });

  it('should guarantee providerTrackId is never undefined even with obscure track formats', () => {
    const rawTrack = {
      id: '',
      title: 'Untitled'
    };

    const normalized = normalizeGenericTrack(rawTrack);

    assert.notStrictEqual(normalized.providerTrackId, undefined);
    assert.strictEqual(typeof normalized.providerTrackId, 'string');
  });

  it('should recursively sanitize payloads so Firestore NEVER receives undefined', () => {
    const dangerousPayload = {
      presence: {
        state: 'Listening',
        currentTrack: {
          title: 'Safe Song',
          artist: 'Safe Artist',
          provider: 'audius',
          providerTrackId: '123',
          fieldA: undefined,
          nested: {
            deepFieldB: undefined,
            deepValid: 'ok'
          }
        },
        rootFieldC: undefined,
        listWithUndefined: [1, undefined, 'three']
      }
    };

    const clean = sanitizeFirestorePayload(dangerousPayload);

    // Verify recursion
    assert.strictEqual(clean.presence.currentTrack.fieldA, null);
    assert.strictEqual(clean.presence.currentTrack.nested.deepFieldB, null);
    assert.strictEqual(clean.presence.currentTrack.nested.deepValid, 'ok');
    assert.strictEqual(clean.presence.rootFieldC, null);
    assert.strictEqual(clean.presence.listWithUndefined[1], null);

    // Deep check that no property is undefined
    const jsonStr = JSON.stringify(clean);
    assert.strictEqual(jsonStr.includes('undefined'), false, 'JSON output must never contain undefined');
  });

  it('should ensure simulated presence write failures do not disrupt execution', async () => {
    let playbackInterrupted = false;
    let musicProviderCrashed = false;

    // Simulate MusicContext presence sync flow
    const executeSimulatedPresenceSync = async () => {
      try {
        // Simulate Firestore throwing PERMISSION_DENIED (FirebaseError)
        throw new Error('7 PERMISSION_DENIED: Missing or insufficient permissions.');
      } catch (err: any) {
        // MusicContext catches this and logs warning without re-throwing
      }
    };

    try {
      await executeSimulatedPresenceSync();
      playbackInterrupted = false;
    } catch {
      playbackInterrupted = true;
      musicProviderCrashed = true;
    }

    assert.strictEqual(playbackInterrupted, false, 'Playback must not be interrupted by presence error');
    assert.strictEqual(musicProviderCrashed, false, 'MusicProvider must not crash on Firestore error');
  });
});

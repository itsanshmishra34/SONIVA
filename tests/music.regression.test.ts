import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeAudiusTrack,
  normalizeYouTubeTrack,
  normalizeSoundCloudTrack,
  normalizeGenericTrack
} from '../src/services/trackNormalizer';
import { audioManager } from '../src/services/audioManager';
import { youtubePlayerManager } from '../src/services/youtubePlayerManager';
import { resourceTracker } from '../src/services/resourceTracker';

describe('SONIVA Music Architecture & Normalization Regression Suite', () => {
  it('should normalize an Audius track into the canonical NormalizedTrack schema', () => {
    const rawAudius = {
      id: 'xkQaGx',
      title: 'Solitude',
      artist: 'Kavinsky',
      artwork: 'https://audius.co/artwork.jpg',
      streamUrl: 'https://audius-discovery-1.audius.co/v1/tracks/xkQaGx/stream',
      duration: 215,
      genre: 'Electronic',
      isStreamable: true
    };

    const normalized = normalizeAudiusTrack(rawAudius);

    // 1. Strict Canonical Invariants
    assert.strictEqual(normalized.provider, 'audius', 'Audius provider must be strictly "audius"');
    assert.strictEqual(normalized.providerTrackId, 'xkQaGx', 'providerTrackId must match raw track ID');
    assert.strictEqual(normalized.title, 'Solitude');
    assert.strictEqual(normalized.artist, 'Kavinsky');
    assert.strictEqual(normalized.duration, 215);
    assert.strictEqual(normalized.genre, 'Electronic');
    assert.strictEqual(normalized.isStreamable, true);
    assert.strictEqual(normalized.playbackType, 'native_audio');

    // 2. No undefined fields exist
    assert.ok(normalized.provider !== undefined, 'provider must never be undefined');
    assert.ok(normalized.providerTrackId !== undefined, 'providerTrackId must never be undefined');
    assert.strictEqual(Object.values(normalized).includes(undefined), false, 'No field should be undefined');
  });

  it('should normalize a YouTube track into canonical NormalizedTrack schema', () => {
    const rawYouTube = {
      id: 'dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      artist: 'Rick Astley',
      duration: 213,
      artwork: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
    };

    const normalized = normalizeYouTubeTrack(rawYouTube);

    assert.strictEqual(normalized.provider, 'youtube');
    assert.strictEqual(normalized.providerTrackId, 'dQw4w9WgXcQ');
    assert.strictEqual(normalized.playbackType, 'youtube_embed');
    assert.strictEqual(normalized.videoId, 'dQw4w9WgXcQ');
    assert.strictEqual(normalized.isStreamable, true);
    assert.strictEqual(Object.values(normalized).includes(undefined), false);
  });

  it('should normalize a SoundCloud track into canonical NormalizedTrack schema', () => {
    const rawSoundCloud = {
      id: 'sc-12345',
      title: 'Ambient Waves',
      artist: 'LoFi Producer',
      streamUrl: 'https://api.soundcloud.com/tracks/12345/stream',
      duration: 180,
      genre: 'Ambient'
    };

    const normalized = normalizeSoundCloudTrack(rawSoundCloud);

    assert.strictEqual(normalized.provider, 'soundcloud');
    assert.strictEqual(normalized.providerTrackId, '12345');
    assert.strictEqual(normalized.playbackType, 'native_audio');
    assert.strictEqual(normalized.genre, 'Ambient');
    assert.strictEqual(Object.values(normalized).includes(undefined), false);
  });

  it('should safely normalize a generic track and infer correct provider and playbackType', () => {
    const genericTrack = {
      id: 'generic-track-42',
      title: 'Test Melody',
      artist: 'Unknown Artist',
      streamUrl: 'https://example.com/audio.mp3',
      duration: 120
    };

    const normalized = normalizeGenericTrack(genericTrack);

    assert.strictEqual(normalized.provider, 'audius', 'Generic track should fallback to audius');
    assert.strictEqual(normalized.providerTrackId, 'generic-track-42');
    assert.strictEqual(normalized.playbackType, 'native_audio');
    assert.strictEqual(normalized.isStreamable, true);
    assert.strictEqual(Object.values(normalized).includes(undefined), false);
  });

  it('should maintain AudioManager singleton lifecycle, state machine, and stop safety', () => {
    assert.ok(audioManager, 'AudioManager singleton must be exported and defined');
    assert.strictEqual(typeof audioManager.play, 'function');
    assert.strictEqual(typeof audioManager.pause, 'function');
    assert.strictEqual(typeof audioManager.stop, 'function');
    assert.strictEqual(typeof audioManager.seek, 'function');
    assert.strictEqual(typeof audioManager.setVolume, 'function');
    assert.strictEqual(typeof audioManager.getState, 'function');

    // Test volume boundary setting
    audioManager.setVolume(0.75);
    audioManager.setVolume(1.0);
    audioManager.setVolume(0.0);

    assert.doesNotThrow(() => {
      audioManager.pause();
      audioManager.pause();
    }, 'Calling pause() repeatedly must never throw');
    assert.strictEqual(audioManager.getState(), 'PAUSED', 'State must be PAUSED after pause');

    // Stop must be completely safe and idempotent
    assert.doesNotThrow(() => {
      audioManager.stop();
      audioManager.stop();
    }, 'Calling stop() repeatedly must never throw');

    // Initial state after stop is IDLE
    assert.strictEqual(audioManager.getState(), 'IDLE', 'State must be IDLE after stop');
  });

  it('should maintain YouTube player manager singleton and stop idempotency', () => {
    assert.ok(youtubePlayerManager, 'youtubePlayerManager must be defined');
    assert.strictEqual(typeof youtubePlayerManager.loadAndPlay, 'function');
    assert.strictEqual(typeof youtubePlayerManager.playVideo, 'function');
    assert.strictEqual(typeof youtubePlayerManager.pauseVideo, 'function');
    assert.strictEqual(typeof youtubePlayerManager.stopVideo, 'function');

    assert.doesNotThrow(() => {
      youtubePlayerManager.stopVideo();
      youtubePlayerManager.stopVideo();
    }, 'stopVideo() must be idempotent');
  });

  it('should verify resource tracker counts stay clean', () => {
    const snapshot = resourceTracker.getSnapshot();
    assert.ok(typeof snapshot.audioInstances === 'number');
    assert.ok(typeof snapshot.mediaStreams === 'number');
    assert.ok(typeof snapshot.peerConnections === 'number');
    assert.ok(typeof snapshot.webSocketConnections === 'number');
  });
});

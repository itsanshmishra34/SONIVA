import { Track, NormalizedTrack } from '../types';

/**
 * Normalizes an Audius track into the canonical track structure.
 * Guarantees that `provider` is strictly 'audius', and no undefined values exist.
 */
export function normalizeAudiusTrack(raw: any): Track {
  const id = String(raw?.id || raw?.providerTrackId || 'audius-track');
  const streamUrl = raw?.streamUrl || `/api/audius/stream/${encodeURIComponent(id)}`;
  const duration = typeof raw?.duration === 'number' && !isNaN(raw.duration) ? raw.duration : 180;
  const artwork = raw?.artwork || raw?.artworkUrl || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg';

  return {
    id,
    provider: 'audius',
    providerTrackId: String(raw?.providerTrackId || id),
    providerId: String(raw?.providerId || id),
    title: String(raw?.title || 'Unknown Title'),
    artist: String(raw?.artist || raw?.user?.name || 'Audius Artist'),
    artwork,
    artworkUrl: artwork,
    streamUrl,
    duration,
    durationMs: typeof raw?.durationMs === 'number' && !isNaN(raw.durationMs) ? raw.durationMs : duration * 1000,
    genre: String(raw?.genre || 'Electronic'),
    isStreamable: raw?.isStreamable !== false && raw?.is_streamable !== false,
    playable: true,
    playbackType: 'native_audio',
    videoId: null,
    youtubeVideoId: null,
    soundcloudTrackId: null,
    album: raw?.album || null,
    isFavorite: !!raw?.isFavorite
  };
}

/**
 * Normalizes a YouTube track into the canonical track structure.
 * Guarantees that `provider` is strictly 'youtube', and no undefined values exist.
 */
export function normalizeYouTubeTrack(raw: any): Track {
  const rawId = String(raw?.videoId || raw?.youtubeVideoId || raw?.providerTrackId || raw?.id || '');
  const cleanVideoId = rawId.startsWith('yt-') ? rawId.replace('yt-', '') : rawId;
  const id = raw?.id?.startsWith('yt-') ? raw.id : `yt-${cleanVideoId}`;
  const duration = typeof raw?.duration === 'number' && !isNaN(raw.duration) ? raw.duration : 240;
  const artwork = raw?.artwork || (cleanVideoId ? `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg` : '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg');

  return {
    id,
    provider: 'youtube',
    providerTrackId: cleanVideoId,
    providerId: cleanVideoId,
    videoId: cleanVideoId,
    youtubeVideoId: cleanVideoId,
    title: String(raw?.title || 'YouTube Music'),
    artist: String(raw?.artist || 'YouTube Artist'),
    artwork,
    artworkUrl: raw?.artworkUrl || artwork,
    streamUrl: raw?.streamUrl || null,
    duration,
    durationMs: typeof raw?.durationMs === 'number' && !isNaN(raw.durationMs) ? raw.durationMs : duration * 1000,
    genre: String(raw?.genre || 'Music Video'),
    isStreamable: true,
    playable: true,
    playbackType: 'youtube_embed',
    soundcloudTrackId: null,
    album: raw?.album || null,
    isFavorite: !!raw?.isFavorite
  };
}

/**
 * Normalizes a SoundCloud track into the canonical track structure.
 * Guarantees that `provider` is strictly 'soundcloud', and no undefined values exist.
 */
export function normalizeSoundCloudTrack(raw: any): Track {
  const id = String(raw?.id || raw?.soundcloudTrackId || 'sc-track');
  const scId = String(raw?.soundcloudTrackId || (id.startsWith('sc-') ? id.replace('sc-', '') : id));
  const duration = typeof raw?.duration === 'number' && !isNaN(raw.duration) ? raw.duration : 200;
  const artwork = raw?.artwork || raw?.artworkUrl || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg';

  return {
    id: id.startsWith('sc-') ? id : `sc-${id}`,
    provider: 'soundcloud',
    providerTrackId: scId,
    providerId: scId,
    soundcloudTrackId: scId,
    title: String(raw?.title || 'SoundCloud Track'),
    artist: String(raw?.artist || 'SoundCloud Artist'),
    artwork,
    artworkUrl: artwork,
    streamUrl: raw?.streamUrl || null,
    duration,
    durationMs: typeof raw?.durationMs === 'number' && !isNaN(raw.durationMs) ? raw.durationMs : duration * 1000,
    genre: String(raw?.genre || 'Audio'),
    isStreamable: raw?.isStreamable !== false,
    playable: true,
    playbackType: 'native_audio',
    videoId: null,
    youtubeVideoId: null,
    album: raw?.album || null,
    isFavorite: !!raw?.isFavorite
  };
}

/**
 * Converts any generic track into a canonical normalized track model.
 * Guarantees provider, providerTrackId, playbackType, and no undefined fields.
 */
export function normalizeGenericTrack(raw: any): Track {
  if (!raw) {
    return normalizeAudiusTrack({
      id: 'default-track',
      title: 'Midnight Echoes',
      artist: 'Aura Bloom',
      streamUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
      duration: 147,
      genre: 'Lo-Fi'
    });
  }

  // Detect YouTube
  if (
    raw.provider === 'youtube' ||
    raw.playbackType === 'youtube_embed' ||
    raw.youtubeVideoId ||
    raw.videoId ||
    (raw.id && String(raw.id).startsWith('yt-'))
  ) {
    return normalizeYouTubeTrack(raw);
  }

  // Detect SoundCloud
  if (
    raw.provider === 'soundcloud' ||
    raw.soundcloudTrackId ||
    (raw.id && String(raw.id).startsWith('sc-'))
  ) {
    return normalizeSoundCloudTrack(raw);
  }

  // Default to Audius
  return normalizeAudiusTrack(raw);
}

/**
 * Returns strictly the canonical NormalizedTrack representation.
 */
export function toCanonicalNormalizedTrack(raw: any): NormalizedTrack {
  const t = normalizeGenericTrack(raw);
  return {
    id: t.id,
    provider: t.provider as 'audius' | 'youtube' | 'soundcloud',
    providerTrackId: t.providerTrackId || t.id,
    title: t.title,
    artist: t.artist,
    artwork: t.artwork || null,
    streamUrl: t.streamUrl || null,
    duration: t.duration || null,
    genre: t.genre || null,
    isStreamable: t.isStreamable !== false,
    playbackType: t.playbackType || 'native_audio',
    videoId: t.videoId || null
  };
}

/**
 * Recursively sanitizes any payload destined for Firestore.
 * Firestore strictly forbids `undefined` values and throws FirebaseError.
 * This function converts `undefined` to `null` or strips it, ensuring safe writes.
 */
export function sanitizeFirestorePayload<T>(input: T): T {
  if (input === undefined) {
    return null as any;
  }
  if (input === null || typeof input !== 'object') {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeFirestorePayload) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) {
      clean[key] = null;
    } else {
      clean[key] = sanitizeFirestorePayload(value);
    }
  }
  return clean as T;
}

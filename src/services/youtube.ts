import { Track } from '../types';
import { normalizeYouTubeTrack } from './trackNormalizer';

export interface YouTubeSearchResult {
  ok: boolean;
  provider: 'youtube';
  available: boolean;
  status: 'success' | 'error' | 'unavailable';
  count: number;
  message?: string;
  error?: string;
  tracks: Track[];
}

export class YouTubeMusicService {
  /**
   * Search YouTube for songs, artists, or Bollywood keywords with structured diagnostics
   */
  public static async search(query: string, maxResults: number = 15): Promise<YouTubeSearchResult> {
    const q = (query || '').trim();
    console.log(`[YT_SEARCH_START] query="${q}"`);

    try {
      const url = `/api/youtube/search?q=${encodeURIComponent(q)}&maxResults=${maxResults}`;
      console.log(`[YT_SEARCH_REQUEST] endpoint=${url}`);
      const res = await fetch(url);
      console.log(`[YT_SEARCH_RESPONSE] status=${res.status}`);

      if (res.ok) {
        const data = await res.json();
        const tracks: Track[] = Array.isArray(data.tracks)
          ? data.tracks.map((t: any) => normalizeYouTubeTrack(t))
          : [];

        console.log(`[YT_SEARCH_NORMALIZED] count=${tracks.length}`);
        console.log(`[YT_SEARCH_FILTERED] count=${tracks.length}`);

        return {
          ok: data.ok !== false,
          provider: 'youtube',
          available: data.available !== false,
          status: data.status || (data.available === false ? 'unavailable' : 'success'),
          count: tracks.length,
          message: data.message,
          error: data.error,
          tracks
        };
      } else {
        console.warn(`[YT_SEARCH_NOTICE] status=${res.status} reason="HTTP status ${res.status}"`);
        return {
          ok: false,
          provider: 'youtube',
          available: false,
          status: 'error',
          count: 0,
          message: `YouTube search status ${res.status}`,
          tracks: []
        };
      }
    } catch (e: any) {
      console.warn(`[YT_SEARCH_NOTICE] status=500 reason="${e?.message || 'Network notice'}"`);
      return {
        ok: false,
        provider: 'youtube',
        available: false,
        status: 'error',
        count: 0,
        message: 'Network request issue',
        tracks: []
      };
    }
  }

  /**
   * Fetch video details for a specific YouTube video ID
   */
  public static async getVideo(videoId: string): Promise<Track | null> {
    try {
      const url = `/api/youtube/video/${encodeURIComponent(videoId)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.track) {
          return normalizeYouTubeTrack(data.track);
        }
      }
    } catch (e) {
      console.warn('[YouTubeMusicService] Video details request failed:', e);
    }
    return null;
  }
}

import { Track } from '../types';
import { normalizeSoundCloudTrack } from './trackNormalizer';

export interface SoundCloudConfigStatus {
  configured: boolean;
  message?: string;
}

export class SoundCloudMusicService {
  private static configStatus: SoundCloudConfigStatus | null = null;

  /**
   * Search SoundCloud via backend proxy using official SoundCloud Developer API
   */
  public static async search(query: string, maxResults: number = 15): Promise<{ tracks: Track[]; configured: boolean; message?: string }> {
    if (!query.trim()) {
      return { tracks: [], configured: true };
    }

    console.log('[SOUNDCLOUD_SEARCH_START]', query);
    try {
      const url = `/api/soundcloud/search?q=${encodeURIComponent(query)}&limit=${maxResults}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 503 || errorData.error === 'SOUNDCLOUD_NOT_CONFIGURED') {
          console.warn('[SOUNDCLOUD_NOT_CONFIGURED]', errorData.message || 'SoundCloud credentials missing');
          this.configStatus = { configured: false, message: errorData.message || 'SoundCloud API client ID is not configured.' };
          return { tracks: [], configured: false, message: this.configStatus.message };
        }
        console.warn('[SOUNDCLOUD_SEARCH_ERROR]', res.status, errorData);
        return { tracks: [], configured: true };
      }

      const data = await res.json();
      if (data.ok && Array.isArray(data.tracks)) {
        console.log('[SOUNDCLOUD_SEARCH_SUCCESS]', data.tracks.length, 'tracks returned');
        this.configStatus = { configured: true };
        const normalized = data.tracks.map((t: any) => normalizeSoundCloudTrack(t));
        return { tracks: normalized, configured: true };
      } else if (data.error === 'SOUNDCLOUD_NOT_CONFIGURED') {
        this.configStatus = { configured: false, message: data.message };
        return { tracks: [], configured: false, message: data.message };
      }
    } catch (e: any) {
      console.warn('[SOUNDCLOUD_SEARCH_EXCEPTION]', e.message || e);
    }

    return { tracks: [], configured: true };
  }

  /**
   * Resolve official playable stream URL for a SoundCloud track
   */
  public static async resolveStreamUrl(trackId: string): Promise<string> {
    if (!trackId) {
      throw new Error('SoundCloud track ID is required for audio stream resolution');
    }

    const endpoint = `/api/soundcloud/stream/${encodeURIComponent(trackId)}`;
    console.log('[SOUNDCLOUD_STREAM_REQUEST]', trackId, endpoint);

    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.streamUrl) {
          console.log('[SOUNDCLOUD_STREAM_SUCCESS]', trackId);
          return data.streamUrl;
        }
      } else if (res.status === 503) {
        throw new Error('SoundCloud credentials are not configured on the server.');
      }
    } catch (e: any) {
      console.error('[SOUNDCLOUD_STREAM_ERROR]', trackId, e.message || e);
      throw e;
    }

    throw new Error('Unable to resolve SoundCloud stream URL.');
  }

  public static getConfigStatus(): SoundCloudConfigStatus | null {
    return this.configStatus;
  }
}

import { Track, MusicProviderType } from '../types';
import { MusicService as AudiusApi } from './audius';
import { SoundCloudMusicService as SoundCloudApi } from './soundcloud';
import { YouTubeMusicService as YouTubeApi, YouTubeSearchResult } from './youtube';
import { audioManager } from './audioManager';
import { 
  normalizeGenericTrack, 
  normalizeAudiusTrack, 
  normalizeSoundCloudTrack, 
  normalizeYouTubeTrack 
} from './trackNormalizer';

export interface ProviderStatusItem {
  available: boolean;
  status: 'success' | 'error' | 'unavailable';
  count: number;
  message?: string;
  error?: string;
}

export interface ProviderSearchResult {
  ok: boolean;
  providers: {
    audius: ProviderStatusItem;
    soundcloud: ProviderStatusItem;
    youtube: ProviderStatusItem;
  };
  tracks: Track[];
}

export interface IMusicProvider {
  readonly providerName: MusicProviderType;
  searchTracks(query: string, limit?: number): Promise<Track[]>;
  resolveStreamUrl(track: Track): Promise<string>;
  play(track: Track): Promise<void>;
  pause(): void;
  resume(): Promise<void>;
  seek(positionSeconds: number): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  isPaused(): boolean;
  destroy(): void;
}

export class AudiusMusicService implements IMusicProvider {
  public readonly providerName: MusicProviderType = 'audius';

  public async searchTracks(query: string, limit: number = 15): Promise<Track[]> {
    if (!query.trim()) {
      const trending = await AudiusApi.getTrendingTracks();
      return trending.map(t => normalizeAudiusTrack(t));
    }
    const tracks = await AudiusApi.searchTracks(query);
    return tracks.slice(0, limit).map(t => normalizeAudiusTrack(t));
  }

  public async resolveStreamUrl(track: Track): Promise<string> {
    return await AudiusApi.resolvePlayableAudioUrl(track.id, track);
  }

  public async play(track: Track): Promise<void> {
    const resolvedUrl = await this.resolveStreamUrl(track);
    const resolvedTrack = normalizeAudiusTrack({ ...track, streamUrl: resolvedUrl });
    await audioManager.loadAndPlay(resolvedTrack);
  }

  public pause(): void {
    audioManager.pause();
  }

  public async resume(): Promise<void> {
    await audioManager.play();
  }

  public seek(positionSeconds: number): void {
    audioManager.seek(positionSeconds);
  }

  public setVolume(volume: number): void {
    audioManager.setVolume(volume);
  }

  public getCurrentTime(): number {
    return audioManager.getCurrentTime();
  }

  public getDuration(): number {
    return audioManager.getDuration();
  }

  public isPaused(): boolean {
    return audioManager.isPaused();
  }

  public destroy(): void {
    audioManager.pause();
  }
}

export class SoundCloudMusicService implements IMusicProvider {
  public readonly providerName: MusicProviderType = 'soundcloud';

  public async searchTracks(query: string, limit: number = 15): Promise<Track[]> {
    if (!query.trim()) return [];
    const result = await SoundCloudApi.search(query, limit);
    return result.tracks;
  }

  public async resolveStreamUrl(track: Track): Promise<string> {
    const trackId = track.soundcloudTrackId || track.id.replace('sc-', '');
    return await SoundCloudApi.resolveStreamUrl(trackId);
  }

  public async play(track: Track): Promise<void> {
    const resolvedUrl = await this.resolveStreamUrl(track);
    const resolvedTrack = normalizeSoundCloudTrack({ ...track, streamUrl: resolvedUrl });
    await audioManager.loadAndPlay(resolvedTrack);
  }

  public pause(): void {
    audioManager.pause();
  }

  public async resume(): Promise<void> {
    await audioManager.play();
  }

  public seek(positionSeconds: number): void {
    audioManager.seek(positionSeconds);
  }

  public setVolume(volume: number): void {
    audioManager.setVolume(volume);
  }

  public getCurrentTime(): number {
    return audioManager.getCurrentTime();
  }

  public getDuration(): number {
    return audioManager.getDuration();
  }

  public isPaused(): boolean {
    return audioManager.isPaused();
  }

  public destroy(): void {
    audioManager.pause();
  }
}

function calculateClientRelevance(query: string, item: { title?: string; artist?: string; genre?: string; album?: string | null }): number {
  const q = (query || '').toLowerCase().trim();
  if (!q) return 1;
  const title = (item.title || '').toLowerCase().trim();
  const artist = (item.artist || '').toLowerCase().trim();
  const genre = (item.genre || '').toLowerCase().trim();
  const album = (item.album || '').toLowerCase().trim();

  if (title === q) return 100;
  if (title.startsWith(q)) return 90;
  if (title.includes(q)) return 75;
  if (artist === q) return 70;
  if (artist.startsWith(q)) return 65;
  if (artist.includes(q)) return 55;
  if (album.includes(q)) return 45;
  if (genre.includes(q)) return 35;

  const words = q.split(/\s+/).filter(Boolean);
  let wordMatches = 0;
  for (const w of words) {
    if (title.includes(w) || artist.includes(w)) {
      wordMatches++;
    }
  }

  if (words.length > 0 && wordMatches > 0) {
    return (wordMatches / words.length) * 30;
  }

  return 0;
}

export class UnifiedMusicService {
  public static async searchTracks(query: string, options?: { provider?: MusicProviderType | 'all'; limit?: number }): Promise<ProviderSearchResult> {
    const q = query.trim();
    const limit = options?.limit || 15;
    const requestedProvider = options?.provider || 'all';

    console.log(`[SEARCH_PROVIDER] provider=${requestedProvider} query="${q}"`);

    // Attempt unified server search
    try {
      const serverUrl = `/api/music/search?q=${encodeURIComponent(q)}&limit=${limit}&provider=${encodeURIComponent(requestedProvider)}`;
      const res = await fetch(serverUrl).catch(() => null);
      if (res && res.ok) {
        const data: ProviderSearchResult = await res.json();
        if (data.ok && Array.isArray(data.tracks)) {
          const finalTracks = (requestedProvider === 'all'
            ? data.tracks
            : data.tracks.filter(t => t.provider === requestedProvider)
          ).map(t => normalizeGenericTrack(t));
          console.log(`[SEARCH_RESULT] provider=${requestedProvider} count=${finalTracks.length}`);
          return {
            ...data,
            tracks: finalTracks
          };
        }
      }
    } catch (e) {
      console.warn('[UNIFIED_MUSIC_SEARCH_SERVER_NOTICE] Direct server search failed, proceeding with direct provider query:', e);
    }

    // Parallel, independent search requests via Promise.allSettled
    const [audiusSettled, soundcloudSettled, youtubeSettled] = await Promise.allSettled([
      (requestedProvider === 'all' || requestedProvider === 'audius')
        ? AudiusApi.searchTracks(q)
        : Promise.resolve([]),
      (requestedProvider === 'all' || requestedProvider === 'soundcloud')
        ? SoundCloudApi.search(q, limit)
        : Promise.resolve({ tracks: [] as Track[], configured: false, message: 'SoundCloud is not configured on the server.' }),
      (requestedProvider === 'all' || requestedProvider === 'youtube')
        ? YouTubeApi.search(q, limit)
        : Promise.resolve({ ok: true, provider: 'youtube' as const, available: false, status: 'unavailable' as const, count: 0, tracks: [] as Track[] })
    ]);

    let audiusTracks: Track[] = [];
    let audiusStatus: ProviderStatusItem = { available: true, status: 'success', count: 0 };
    if (audiusSettled.status === 'fulfilled') {
      const raw = audiusSettled.value;
      audiusTracks = (Array.isArray(raw) ? raw : []).slice(0, limit).map(t => normalizeAudiusTrack(t));
      audiusStatus = { available: true, status: 'success', count: audiusTracks.length };
      console.log(`[SEARCH_RESULT] provider=audius count=${audiusTracks.length}`);
    } else {
      audiusStatus = { available: false, status: 'error', count: 0, message: 'Audius search failed' };
    }

    let soundcloudTracks: Track[] = [];
    let soundcloudStatus: ProviderStatusItem = { available: false, status: 'unavailable', count: 0, message: 'SoundCloud is not configured on the server.' };
    if (soundcloudSettled.status === 'fulfilled') {
      const scRes = soundcloudSettled.value;
      soundcloudTracks = scRes.tracks || [];
      soundcloudStatus = {
        available: scRes.configured,
        status: scRes.configured ? 'success' : 'unavailable',
        count: soundcloudTracks.length,
        message: scRes.message || (scRes.configured ? undefined : 'SoundCloud is not configured on the server.')
      };
      console.log(`[SEARCH_RESULT] provider=soundcloud count=${soundcloudTracks.length}`);
    } else {
      soundcloudStatus = { available: false, status: 'error', count: 0, message: 'SoundCloud search failed' };
    }

    let youtubeTracks: Track[] = [];
    let youtubeStatus: ProviderStatusItem = { available: true, status: 'success', count: 0 };
    if (youtubeSettled.status === 'fulfilled') {
      const ytRes = youtubeSettled.value as YouTubeSearchResult;
      youtubeTracks = ytRes.tracks || [];
      youtubeStatus = {
        available: ytRes.available,
        status: ytRes.status,
        count: youtubeTracks.length,
        message: ytRes.message
      };
      console.log(`[SEARCH_RESULT] provider=youtube count=${youtubeTracks.length}`);
    } else {
      youtubeStatus = { available: false, status: 'error', count: 0, message: 'YouTube search failed' };
    }

    // Provider filtering MUST be authoritative
    let mergedTracks: Track[] = [];
    if (requestedProvider === 'audius') {
      mergedTracks = audiusTracks;
    } else if (requestedProvider === 'soundcloud') {
      mergedTracks = soundcloudTracks;
    } else if (requestedProvider === 'youtube') {
      mergedTracks = youtubeTracks;
    } else {
      mergedTracks = [...audiusTracks, ...soundcloudTracks, ...youtubeTracks];
    }

    const deduplicated = this.deduplicateTracks(mergedTracks);

    // Sort deduplicated results by relevance score
    deduplicated.sort((a, b) => {
      const relA = calculateClientRelevance(q, a);
      const relB = calculateClientRelevance(q, b);
      return relB - relA;
    });

    return {
      ok: true,
      providers: {
        audius: audiusStatus,
        soundcloud: soundcloudStatus,
        youtube: youtubeStatus
      },
      tracks: deduplicated
    };
  }

  public static async resolvePlayableStreamUrl(track: Track): Promise<string> {
    if (!track) {
      throw new Error('Track is required for stream resolution');
    }

    const provider = track.provider || 'audius';

    if (provider === 'soundcloud' && track.soundcloudTrackId) {
      return await SoundCloudApi.resolveStreamUrl(track.soundcloudTrackId);
    }

    if (provider === 'audius' || !provider) {
      return await AudiusApi.resolvePlayableAudioUrl(track.id, track);
    }

    if (provider === 'youtube' && track.streamUrl) {
      return track.streamUrl;
    }

    return track.streamUrl || '';
  }

  private static deduplicateTracks(tracks: Track[]): Track[] {
    const seen = new Set<string>();
    return tracks.filter(t => {
      const key = `${t.title.toLowerCase().trim()}|${t.artist.toLowerCase().trim()}|${t.provider}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

/**
 * Global Centralized MusicService Class
 * Dispatches play/pause/seek requests to the appropriate provider abstraction independently of UI.
 */
export class MusicService {
  private static instance: MusicService;
  private providers: Map<MusicProviderType, IMusicProvider> = new Map();
  private activeProvider: IMusicProvider;

  private constructor() {
    const audius = new AudiusMusicService();
    const soundcloud = new SoundCloudMusicService();

    this.providers.set('audius', audius);
    this.providers.set('soundcloud', soundcloud);

    this.activeProvider = audius;
  }

  public static getInstance(): MusicService {
    if (!MusicService.instance) {
      MusicService.instance = new MusicService();
    }
    return MusicService.instance;
  }

  public getProvider(name: MusicProviderType): IMusicProvider {
    return this.providers.get(name) || this.providers.get('audius')!;
  }

  public async searchTracks(query: string, provider: MusicProviderType = 'audius'): Promise<Track[]> {
    const p = this.getProvider(provider);
    return await p.searchTracks(query);
  }

  public async play(track: Track): Promise<void> {
    const providerName = track.provider || 'audius';
    const provider = this.getProvider(providerName);

    if (this.activeProvider && this.activeProvider !== provider) {
      console.log(`[MUSIC_SERVICE] Switching active provider from ${this.activeProvider.providerName} to ${providerName}`);
      this.activeProvider.pause();
    }

    this.activeProvider = provider;
    await provider.play(track);
  }

  public pause(): void {
    if (this.activeProvider) {
      this.activeProvider.pause();
    }
  }

  public async resume(): Promise<void> {
    if (this.activeProvider) {
      await this.activeProvider.resume();
    }
  }

  public seek(positionSeconds: number): void {
    if (this.activeProvider) {
      this.activeProvider.seek(positionSeconds);
    }
  }

  public setVolume(volume: number): void {
    if (this.activeProvider) {
      this.activeProvider.setVolume(volume);
    }
  }

  public getCurrentTime(): number {
    return this.activeProvider ? this.activeProvider.getCurrentTime() : 0;
  }

  public getDuration(): number {
    return this.activeProvider ? this.activeProvider.getDuration() : 0;
  }

  public isPaused(): boolean {
    return this.activeProvider ? this.activeProvider.isPaused() : true;
  }

  public destroy(): void {
    if (this.activeProvider) {
      this.activeProvider.destroy();
    }
    this.providers.forEach(p => p.destroy());
  }
}

export const musicServiceManager = MusicService.getInstance();

import { Track } from '../types';
import { normalizeGenericTrack } from './trackNormalizer';
import { resourceTracker } from './resourceTracker';

export type PlaybackMachineState = 
  | 'IDLE'
  | 'LOADING'
  | 'READY'
  | 'PLAYING'
  | 'PAUSED'
  | 'STOPPING'
  | 'ENDED'
  | 'ERROR';

export type AudioEvent = 
  | 'play' 
  | 'play_blocked' 
  | 'pause' 
  | 'stop'
  | 'timeupdate' 
  | 'loadedmetadata' 
  | 'canplay' 
  | 'ended' 
  | 'error'
  | 'statechange';

export type AudioEventCallback = (data?: any) => void;

/**
 * Redacts query parameters (signatures, tokens) from logged stream URLs.
 */
export function redactStreamUrl(url?: string | null): string {
  if (!url) return '';
  try {
    const queryIdx = url.indexOf('?');
    if (queryIdx !== -1) {
      return `${url.substring(0, queryIdx)}?...REDACTED`;
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Centralized AudioManager Singleton with Authoritative Playback State Machine
 * Initialized outside of React render cycles to guarantee a single persistent HTMLAudioElement
 * across the entire application lifecycle, surviving all navigation and component unmounts.
 */
class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: Track | null = null;
  private listeners: Map<AudioEvent, Set<AudioEventCallback>> = new Map();
  private isInitialized = false;
  private lastProgressLogTime = 0;
  
  // Authoritative State Machine & Request Identity
  private state: PlaybackMachineState = 'IDLE';
  private currentRequestId = 0;
  private fallbackCurrentTime = 0;

  constructor() {
    this.init();
  }

  public init(): HTMLAudioElement | null {
    if (this.isInitialized && this.audio) return this.audio;
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      console.log('[AUDIO_INIT] Instantiating persistent singleton HTMLAudioElement');
      this.audio = new Audio();
      this.audio.crossOrigin = 'anonymous';
      this.audio.preload = 'auto';
      this.audio.volume = 0.8;
      this.audio.muted = false;
      this.setupNativeListeners();
      this.isInitialized = true;
      resourceTracker.trackAudioInstance(1);
    }
    return this.audio;
  }

  public getState(): PlaybackMachineState {
    return this.state;
  }

  private transitionState(newState: PlaybackMachineState, reason?: string) {
    const prevState = this.state;
    if (prevState === newState) return;
    this.state = newState;
    resourceTracker.logTransition('AudioManager', {
      safeIdentifier: this.currentTrack?.id || 'none',
      previousState: prevState,
      nextState: newState,
      event: reason || 'state_transition'
    });
    this.emit('statechange', { previous: prevState, current: newState });
  }

  private setupNativeListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('play', () => {
      console.log('[AUDIO_PLAY] Audio element emitted native play event at:', this.audio?.currentTime);
      this.transitionState('PLAYING', 'native_play');
      this.emit('play');
    });

    this.audio.addEventListener('playing', () => {
      console.log('[AUDIO_PLAY_SUCCESS] Audio is now actively playing');
      this.transitionState('PLAYING', 'native_playing');
      this.emit('play');
    });

    this.audio.addEventListener('pause', () => {
      console.log('[AUDIO_PAUSED] Audio element emitted native pause event at:', this.audio?.currentTime);
      if (this.state !== 'STOPPING' && this.state !== 'ENDED' && this.state !== 'IDLE') {
        this.transitionState('PAUSED', 'native_pause');
      }
      this.emit('pause');
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        const curTime = this.audio.currentTime;
        this.emit('timeupdate', curTime);

        // Throttled progress logging (~once per second)
        const now = Date.now();
        if (now - this.lastProgressLogTime >= 1000) {
          this.lastProgressLogTime = now;
          console.log('[AUDIO_PROGRESS]', {
            trackId: this.currentTrack?.id,
            currentTime: curTime.toFixed(2),
            duration: this.audio.duration ? this.audio.duration.toFixed(2) : 'unknown'
          });
        }
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      console.log('[AUDIO_LOAD] Metadata loaded. Duration:', this.audio?.duration);
      console.log('[AUDIO_READY]', this.currentTrack?.id, {
        duration: this.audio?.duration || 0,
        readyState: this.audio?.readyState
      });
      if (this.state === 'LOADING') {
        this.transitionState('READY', 'metadata_loaded');
      }
      if (this.audio) {
        this.emit('loadedmetadata', this.audio.duration || 0);
      }
    });

    this.audio.addEventListener('canplay', () => {
      console.log('[AUDIO_CANPLAY] Browser audio buffer ready for playback');
      if (this.state === 'LOADING') {
        this.transitionState('READY', 'canplay');
      }
      this.emit('canplay');
    });

    this.audio.addEventListener('ended', () => {
      console.log('[AUDIO_ENDED] Playback completed naturally');
      this.transitionState('ENDED', 'natural_end');
      this.emit('ended');
    });

    this.audio.addEventListener('error', () => {
      const err = this.audio?.error;
      console.error('[AUDIO_SOURCE_FAILURE]', {
        trackId: this.currentTrack?.id,
        streamUrl: redactStreamUrl(this.audio?.src || this.currentTrack?.streamUrl),
        audioErrorCode: err?.code,
        audioErrorMessage: err?.message,
        readyState: this.audio?.readyState,
        networkState: this.audio?.networkState
      });
      this.transitionState('ERROR', 'source_error');
      this.emit('error', err);
    });
  }

  public subscribe(event: AudioEvent, callback: AudioEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: AudioEvent, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[AudioManager] Error in ${event} callback:`, e);
        }
      });
    }
  }

  /**
   * Assigns source to audio element and loads it WITHOUT playing (for default track preparation).
   * Safe to call repeatedly.
   */
  public loadTrack(track: Track): void {
    this.init();
    const safeTrack = normalizeGenericTrack(track);
    if (!safeTrack || !safeTrack.streamUrl) {
      console.warn('[AUDIO_NO_SOURCE] Track has no stream URL');
      throw new Error('Track has no valid stream URL');
    }

    if (!this.audio) {
      this.currentTrack = safeTrack;
      this.transitionState('READY', 'server_load_track');
      return;
    }

    const requestId = ++this.currentRequestId;
    const isSameTrack = this.currentTrack?.id === safeTrack.id && 
      (this.audio.src === safeTrack.streamUrl || this.audio.src.endsWith(safeTrack.streamUrl));

    if (isSameTrack && this.audio.src && this.audio.src !== '') {
      return;
    }

    this.transitionState('LOADING', 'load_track');
    console.log('[AUDIO_SRC_SET]', safeTrack.id, redactStreamUrl(safeTrack.streamUrl));
    console.log('[AUDIO_SRC_CHANGE] Loading new source URL into audio element:', redactStreamUrl(safeTrack.streamUrl));
    this.currentTrack = safeTrack;
    this.audio.src = safeTrack.streamUrl;
    this.audio.currentTime = 0;
    this.audio.playbackRate = 1.0;
    this.audio.load();
  }

  /**
   * Deterministic load and play with Play Promise Safety & generation tracking.
   * If a subsequent play/stop/pause was invoked before this resolves, the older promise will not force playback.
   */
  public async loadAndPlay(track: Track): Promise<void> {
    this.init();
    if (!this.audio) throw new Error('Audio element not available');

    const requestId = ++this.currentRequestId;
    const safeTrack = normalizeGenericTrack(track);

    if (!safeTrack || !safeTrack.streamUrl) {
      console.warn('[AUDIO_NO_SOURCE] Track has no stream URL');
      throw new Error('Track has no valid stream URL');
    }

    const isSameTrack = this.currentTrack?.id === safeTrack.id && 
      (this.audio.src === safeTrack.streamUrl || this.audio.src.endsWith(safeTrack.streamUrl));

    if (isSameTrack && this.audio.src && this.audio.src !== '') {
      console.log('[AUDIO_PLAY_REQUEST]', safeTrack.id, redactStreamUrl(this.audio.src));
      try {
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        // Guard against stale request resolution
        if (requestId !== this.currentRequestId || this.state === 'PAUSED' || this.state === 'STOPPING' || this.state === 'IDLE') {
          console.log('[AUDIO_PLAY_SUPERSEDED] Play promise completed but request was superseded/stopped. Pausing.');
          this.audio.pause();
          return;
        }
        this.transitionState('PLAYING', 'play_resolved');
        console.log('[AUDIO_PLAY_SUCCESS] Playback active');
      } catch (err: any) {
        if (requestId !== this.currentRequestId) return;
        if (err.name === 'NotAllowedError') {
          console.warn('[AUDIO_PLAY_BLOCKED] Playback blocked by browser autoplay policy');
          this.transitionState('PAUSED', 'autoplay_blocked');
          this.emit('play_blocked', err);
        } else if (err.name === 'AbortError') {
          console.log('[AUDIO_PLAY_ABORTED] Play request was interrupted by a new request or pause.');
        } else {
          console.error('[AUDIO_PLAY_ERROR] Playback failed:', err.name, err.message);
          this.transitionState('ERROR', 'play_error');
          this.emit('error', err);
        }
        throw err;
      }
      return;
    }

    // New track
    this.transitionState('LOADING', 'load_and_play');
    console.log('[AUDIO_SRC_SET]', safeTrack.id, redactStreamUrl(safeTrack.streamUrl));
    console.log('[AUDIO_SRC_CHANGE] Loading new source URL:', redactStreamUrl(safeTrack.streamUrl));
    this.currentTrack = safeTrack;
    this.audio.src = safeTrack.streamUrl;
    this.audio.currentTime = 0;
    this.audio.playbackRate = 1.0;
    this.audio.load();

    console.log('[AUDIO_PLAY_REQUEST]', safeTrack.id, redactStreamUrl(safeTrack.streamUrl));
    try {
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      if (requestId !== this.currentRequestId || this.state === 'PAUSED' || this.state === 'STOPPING' || this.state === 'IDLE') {
        console.log('[AUDIO_PLAY_SUPERSEDED] Play promise completed but request was superseded/stopped. Pausing.');
        this.audio.pause();
        return;
      }
      this.transitionState('PLAYING', 'play_resolved');
      console.log('[AUDIO_PLAY_SUCCESS] Playback started');
    } catch (err: any) {
      if (requestId !== this.currentRequestId) return;
      if (err.name === 'NotAllowedError') {
        console.warn('[AUDIO_PLAY_BLOCKED] Playback blocked by browser autoplay policy');
        this.transitionState('PAUSED', 'autoplay_blocked');
        this.emit('play_blocked', err);
      } else if (err.name === 'AbortError') {
        console.log('[AUDIO_PLAY_ABORTED] Play request was interrupted by a new request or pause.');
      } else {
        console.error('[AUDIO_PLAY_ERROR] Playback failed:', err.name, err.message);
        this.transitionState('ERROR', 'play_error');
        this.emit('error', err);
      }
      throw err;
    }
  }

  /**
   * Authoritative Play method with generation safety.
   */
  public async play(): Promise<void> {
    this.init();
    if (!this.audio) throw new Error('Audio element not available');

    const requestId = ++this.currentRequestId;

    if (!this.audio.src || this.audio.src === '') {
      if (this.currentTrack?.streamUrl) {
        console.log('[AUDIO_SRC_SET]', this.currentTrack.id, redactStreamUrl(this.currentTrack.streamUrl));
        this.audio.src = this.currentTrack.streamUrl;
        this.audio.load();
      } else {
        console.warn('[AUDIO_NO_SOURCE] audio.src is empty and no current track');
        throw new Error('No audio source loaded');
      }
    }

    console.log('[AUDIO_PLAY_REQUEST]', this.currentTrack?.id || 'unknown', redactStreamUrl(this.audio.src));
    try {
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      if (requestId !== this.currentRequestId || this.state === 'PAUSED' || this.state === 'STOPPING' || this.state === 'IDLE') {
        console.log('[AUDIO_PLAY_SUPERSEDED] Play promise completed but request was superseded/stopped. Pausing.');
        this.audio.pause();
        return;
      }
      this.transitionState('PLAYING', 'play_resolved');
      console.log('[AUDIO_PLAY_SUCCESS] Playback started');
    } catch (err: any) {
      if (requestId !== this.currentRequestId) return;
      if (err.name === 'NotAllowedError') {
        console.warn('[AUDIO_PLAY_BLOCKED] Playback blocked by browser autoplay policy');
        this.transitionState('PAUSED', 'autoplay_blocked');
        this.emit('play_blocked', err);
      } else if (err.name === 'AbortError') {
        console.log('[AUDIO_PLAY_ABORTED] Play request was interrupted by a new request or pause.');
      } else {
        console.error('[AUDIO_PLAY_ERROR] Playback failed:', err.name, err.message);
        this.transitionState('ERROR', 'play_error');
        this.emit('error', err);
      }
      throw err;
    }
  }

  /**
   * Immediately pauses native audio element and invalidates pending play promises.
   * Safe to call repeatedly without error.
   */
  public pause(): void {
    ++this.currentRequestId; // Invalidate any pending play promises
    if (this.audio) {
      console.log('[AUDIO_PAUSED] Native pause requested at position:', this.audio.currentTime);
      this.audio.pause();
    }
    this.transitionState('PAUSED', 'user_pause');
  }

  /**
   * CRITICAL STOP METHOD:
   * Immediately stops playback, resets currentTime to 0, invalidates pending play requests,
   * transitions state to IDLE/STOPPING.
   * Safe to call repeatedly (`stop() -> stop()`).
   */
  public stop(): void {
    ++this.currentRequestId; // Invalidate any pending play requests
    console.log('[AUDIO_STOP] Stopping playback and resetting state machine to IDLE');
    this.fallbackCurrentTime = 0;
    if (this.audio) {
      this.audio.pause();
      try {
        this.audio.currentTime = 0;
      } catch (e) {}
    }
    this.transitionState('IDLE', 'user_stop');
    this.emit('stop');
    this.emit('pause');
  }

  /**
   * Seek safely to timestamp in seconds.
   */
  public seek(timeSeconds: number): void {
    const validTime = Math.max(0, isNaN(timeSeconds) ? 0 : timeSeconds);
    this.fallbackCurrentTime = validTime;
    if (this.audio) {
      console.log('[AUDIO_SEEK] Seeking to timestamp:', validTime.toFixed(2));
      try {
        this.audio.currentTime = validTime;
      } catch (e) {
        console.warn('[AUDIO_SEEK_ERROR] Could not set currentTime:', e);
      }
    }
  }

  public setVolume(volume: number): void {
    if (this.audio) {
      const clamped = Math.max(0, Math.min(1, isNaN(volume) ? 0.8 : volume));
      this.audio.volume = clamped;
    }
  }

  public setMuted(muted: boolean): void {
    if (this.audio) {
      this.audio.muted = !!muted;
    }
  }

  public setPlaybackRate(rate: number): void {
    if (this.audio) {
      const safeRate = Math.max(0.5, Math.min(2.0, isNaN(rate) ? 1.0 : rate));
      this.audio.playbackRate = safeRate;
    }
  }

  public getCurrentTime(): number {
    return this.audio ? this.audio.currentTime : this.fallbackCurrentTime;
  }

  public getDuration(): number {
    return this.audio?.duration || 0;
  }

  public isPaused(): boolean {
    return this.audio ? this.audio.paused : true;
  }

  public getReadyState(): number {
    return this.audio?.readyState || 0;
  }

  public getNetworkState(): number {
    return this.audio?.networkState || 0;
  }

  public getSrc(): string {
    return this.audio?.src || '';
  }

  public hasSource(): boolean {
    return !!(this.audio ? (this.audio.src && this.audio.src !== '') : this.currentTrack?.streamUrl);
  }

  public getTrack(): Track | null {
    return this.currentTrack;
  }

  public setTrack(track: Track | null): void {
    const safeTrack = track ? normalizeGenericTrack(track) : null;
    this.currentTrack = safeTrack;
    if (this.audio && safeTrack?.streamUrl && !this.audio.src) {
      this.audio.src = safeTrack.streamUrl;
    }
  }

  public destroy(): void {
    this.stop();
    this.listeners.clear();
    if (this.audio) {
      this.audio.src = '';
      this.audio = null;
      resourceTracker.trackAudioInstance(-1);
    }
    this.isInitialized = false;
  }
}

// Global Singleton Instance
export const audioManager = new AudioManager();

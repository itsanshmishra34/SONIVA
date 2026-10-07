/**
 * Centralized YouTube Player Manager Singleton
 * Manages the single persistent YT.Player instance across the entire application.
 */

import { resourceTracker } from './resourceTracker';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

type EventListener = (...args: any[]) => void;

class YouTubePlayerManager {
  private static instance: YouTubePlayerManager;
  private apiLoadingPromise: Promise<void> | null = null;
  private initPromise: Promise<any> | null = null;
  private isApiReady = false;
  private playerInstance: any = null;
  private currentVideoId: string | null = null;
  private pendingVideoId: string | null = null;
  private isPlayerReady = false;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private containerId: string = 'global-youtube-player';
  private currentRequestId = 0;

  private constructor() {}

  public static getInstance(): YouTubePlayerManager {
    if (!YouTubePlayerManager.instance) {
      YouTubePlayerManager.instance = new YouTubePlayerManager();
    }
    return YouTubePlayerManager.instance;
  }

  /**
   * Subscribe to player lifecycle and playback events.
   */
  public subscribe(event: string, callback: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
      }
    };
  }

  private emit(event: string, ...args: any[]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(...args);
        } catch (err) {
          console.error(`[YOUTUBE_MANAGER_EVENT_ERROR] event=${event}`, err);
        }
      });
    }
  }

  /**
   * Loads the YouTube IFrame API script exactly once.
   */
  public loadAPI(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }

    if (this.isApiReady && window.YT && window.YT.Player) {
      return Promise.resolve();
    }

    if (this.apiLoadingPromise) {
      return this.apiLoadingPromise;
    }

    this.apiLoadingPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      if (window.YT && window.YT.Player) {
        this.isApiReady = true;
        resolve();
        return;
      }

      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (existingCallback) existingCallback();
        this.isApiReady = true;
        console.log('[YOUTUBE_MANAGER_API_READY]');
        resolve();
      };

      if (!document.getElementById('youtube-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      // Polling fallback
      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          this.isApiReady = true;
          clearInterval(interval);
          resolve();
        }
      }, 200);

      // Timeout after 30s
      setTimeout(() => {
        clearInterval(interval);
        if (!this.isApiReady) {
          reject(new Error('YouTube IFrame API load timeout (30s)'));
        }
      }, 30000);
    });

    return this.apiLoadingPromise;
  }

  /**
   * Initializes the single persistent YT.Player instance in the designated container.
   */
  public async initPlayer(containerId: string = this.containerId): Promise<any> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }

    this.containerId = containerId;
    await this.loadAPI();

    if (this.playerInstance && typeof this.playerInstance.loadVideoById === 'function') {
      return this.playerInstance;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.width = '320px';
      container.style.height = '180px';
      document.body.appendChild(container);
    }

    console.log('[YOUTUBE_MANAGER_INIT_PLAYER] Initializing singleton player in container:', containerId);
    console.log('[YT_PLAYER_INIT] containerId=' + containerId);
    this.isPlayerReady = false;

    this.initPromise = new Promise((resolve) => {
      try {
        this.playerInstance = new window.YT.Player(containerId, {
          width: '320',
          height: '180',
          playerVars: {
            autoplay: 0,
            controls: 1,
            playsinline: 1,
            enablejsapi: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin
          },
          events: {
            onReady: () => {
              console.log('[YOUTUBE_MANAGER_PLAYER_READY]');
              console.log('[YT_PLAYER_READY]');
              this.isPlayerReady = true;
              this.initPromise = null;
              this.emit('ready');

              if (this.pendingVideoId) {
                const videoId = this.pendingVideoId;
                this.pendingVideoId = null;
                this.loadAndPlay(videoId);
              }
              resolve(this.playerInstance);
            },
            onStateChange: (event: any) => {
              const state = event.data;
              this.emit('stateChange', state);

              switch (state) {
                case -1: // UNSTARTED
                  this.emit('unstarted');
                  break;
                case 0: // ENDED
                  console.log('[YOUTUBE_MANAGER_ENDED]');
                  console.log('[YT_PLAYER_ENDED]');
                  this.emit('ended');
                  break;
                case 1: // PLAYING
                  console.log('[YOUTUBE_MANAGER_PLAYING]');
                  console.log('[YT_PLAYER_PLAY]');
                  this.emit('play');
                  break;
                case 2: // PAUSED
                  console.log('[YOUTUBE_MANAGER_PAUSED]');
                  console.log('[YT_PLAYER_PAUSE]');
                  this.emit('pause');
                  break;
                case 3: // BUFFERING
                  this.emit('buffering');
                  break;
                case 5: // CUED
                  this.emit('cued');
                  break;
              }
            },
            onError: (event: any) => {
              const errCode = event.data;
              console.error('[YOUTUBE_MANAGER_ERROR]', errCode);
              console.error('[YT_PLAYER_ERROR]', errCode);
              this.emit('error', errCode);
            }
          }
        });
      } catch (err) {
        console.error('[YOUTUBE_MANAGER_INIT_EXCEPTION]', err);
        this.initPromise = null;
        resolve(null);
      }
    });

    return this.initPromise;
  }

  /**
   * Loads the specified YouTube videoId into the singleton player and starts playback.
   */
  public async loadAndPlay(videoId: string): Promise<void> {
    if (!videoId) return;

    const requestId = ++this.currentRequestId;
    const cleanId = videoId.startsWith('yt-') ? videoId.replace('yt-', '') : videoId;
    this.currentVideoId = cleanId;

    if (!this.playerInstance || !this.isPlayerReady) {
      console.log('[YOUTUBE_MANAGER_QUEUE_VIDEO]', cleanId);
      this.pendingVideoId = cleanId;
      await this.initPlayer();
      return;
    }

    try {
      console.log('[YOUTUBE_MANAGER_LOAD_AND_PLAY]', cleanId);
      console.log('[YT_PLAYER_LOAD] videoId=' + cleanId);
      this.playerInstance.loadVideoById({
        videoId: cleanId,
        startSeconds: 0
      });
      if (requestId === this.currentRequestId) {
        this.playerInstance.playVideo();
      }
    } catch (e) {
      console.warn('[YOUTUBE_MANAGER_LOAD_ERROR]', e);
    }
  }

  public playVideo(videoId?: string): void {
    const requestId = ++this.currentRequestId;
    if (videoId) {
      this.loadAndPlay(videoId);
      return;
    }

    if (this.isPlayerReady && this.playerInstance && typeof this.playerInstance.playVideo === 'function') {
      console.log('[YOUTUBE_MANAGER_PLAY]');
      this.playerInstance.playVideo();
    } else if (this.currentVideoId) {
      this.loadAndPlay(this.currentVideoId);
    }
  }

  public pauseVideo(): void {
    ++this.currentRequestId;
    if (this.playerInstance && typeof this.playerInstance.pauseVideo === 'function') {
      console.log('[YOUTUBE_MANAGER_PAUSE]');
      this.playerInstance.pauseVideo();
    }
  }

  /**
   * Authoritative Stop method:
   * Pauses or stops the YouTube player, resets state, and invalidates pending play requests.
   * Safe to call repeatedly.
   */
  public stopVideo(): void {
    ++this.currentRequestId;
    console.log('[YOUTUBE_MANAGER_STOP]');
    if (this.playerInstance && typeof this.playerInstance.stopVideo === 'function') {
      try {
        this.playerInstance.stopVideo();
      } catch (e) {
        try {
          this.playerInstance.pauseVideo();
        } catch (e2) {}
      }
    } else if (this.playerInstance && typeof this.playerInstance.pauseVideo === 'function') {
      this.playerInstance.pauseVideo();
    }
    this.emit('pause');
  }

  public seekTo(seconds: number, allowSeekAhead: boolean = true): void {
    if (this.playerInstance && typeof this.playerInstance.seekTo === 'function') {
      const safeSec = Math.max(0, isNaN(seconds) ? 0 : seconds);
      console.log('[YOUTUBE_MANAGER_SEEK]', safeSec);
      console.log('[YT_PLAYER_SEEK] seconds=' + safeSec);
      this.playerInstance.seekTo(safeSec, allowSeekAhead);
    }
  }

  public setVolume(volumePercent: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(isNaN(volumePercent) ? 80 : volumePercent)));
    if (this.playerInstance && typeof this.playerInstance.setVolume === 'function') {
      this.playerInstance.setVolume(clamped);
    }
  }

  public mute(): void {
    if (this.playerInstance && typeof this.playerInstance.mute === 'function') {
      this.playerInstance.mute();
    }
  }

  public unMute(): void {
    if (this.playerInstance && typeof this.playerInstance.unMute === 'function') {
      this.playerInstance.unMute();
    }
  }

  public isMuted(): boolean {
    if (this.playerInstance && typeof this.playerInstance.isMuted === 'function') {
      return this.playerInstance.isMuted();
    }
    return false;
  }

  public getCurrentTime(): number {
    if (this.playerInstance && typeof this.playerInstance.getCurrentTime === 'function') {
      try {
        const t = this.playerInstance.getCurrentTime();
        return typeof t === 'number' && !isNaN(t) ? t : 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  public getDuration(): number {
    if (this.playerInstance && typeof this.playerInstance.getDuration === 'function') {
      try {
        const d = this.playerInstance.getDuration();
        return typeof d === 'number' && !isNaN(d) ? d : 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  public getPlayerState(): number {
    if (this.playerInstance && typeof this.playerInstance.getPlayerState === 'function') {
      try {
        return this.playerInstance.getPlayerState();
      } catch (e) {
        return -1;
      }
    }
    return -1;
  }

  public getVideoId(): string | null {
    return this.currentVideoId || this.pendingVideoId;
  }

  public isReady(): boolean {
    return this.isPlayerReady;
  }

  public destroyPlayer(): void {
    this.stopVideo();
    if (this.playerInstance && typeof this.playerInstance.destroy === 'function') {
      try {
        this.playerInstance.destroy();
      } catch (e) {}
    }
    this.playerInstance = null;
    this.initPromise = null;
    this.isPlayerReady = false;
    this.pendingVideoId = null;
  }
}

export const youtubePlayerManager = YouTubePlayerManager.getInstance();

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track, ListenTogetherHistoryItem } from '../types';
import { MusicService } from '../services/audius';
import { UnifiedMusicService } from '../services/MusicService';
import { socketService } from '../services/socket';
import { audioManager, redactStreamUrl, PlaybackMachineState } from '../services/audioManager';
import { youtubePlayerManager } from '../services/youtubePlayerManager';
import { db, auth as clientAuth } from '../services/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { 
  normalizeGenericTrack, 
  normalizeYouTubeTrack, 
  sanitizeFirestorePayload 
} from '../services/trackNormalizer';
import { resourceTracker } from '../services/resourceTracker';

export interface ListenRoomState {
  sessionId: string;
  roomId: string;
  hostId: string;
  track: Track | null;
  isPlaying: boolean;
  position: number;
  updatedAt: number;
  playbackRate: number;
  queue: Track[];
  participants: string[];
}

export type PlayerStatus = 'idle' | 'resolving' | 'ready' | 'playing' | 'paused' | 'stopping' | 'ended' | 'error';

interface MusicContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playerStatus: PlayerStatus;
  playbackState: PlaybackMachineState;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  queue: Track[];
  favorites: Track[];
  isListenTogetherActive: boolean;
  listenSessionId: string | null;
  listenRoomState: ListenRoomState | null;
  driftMs: number;
  syncStatus: 'synced' | 'adjusting_rate' | 'seeking' | 'standalone';
  activeListenersCount: number;
  listenTogetherHistory: ListenTogetherHistoryItem[];
  audioError: string | null;
  audioErrorDetail: string | null;
  isAutoplayBlocked: boolean;
  activeYouTubeTrack: Track | null;
  isYouTubePlayerOpen: boolean;
  openYouTubePlayer: (track: Track) => void;
  closeYouTubePlayer: () => void;
  clearAudioError: () => void;
  resolveAutoplayBlock: () => void;
  retryCurrentTrack: () => void;
  playTrack: (track: Track) => void;
  loadTrackIntoAudio: (track: Track, autoPlay?: boolean) => Promise<void>;
  togglePlay: () => void;
  stopTrack: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (time: number) => void;
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  toggleFavorite: (track: Track) => void;
  startListenTogether: (roomId: string, partnerName?: string) => void;
  leaveListenTogether: () => void;
  recordListenTogetherTrack: (track: Track, partnerName?: string) => void;
  clearListenTogetherHistory: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Application State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => {
    const initial = audioManager.getTrack();
    return initial ? normalizeGenericTrack(initial) : null;
  });
  const [isPlaying, setIsPlaying] = useState(() => !audioManager.isPaused());
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>(() => !audioManager.isPaused() ? 'playing' : 'idle');
  const [playbackState, setPlaybackState] = useState<PlaybackMachineState>(() => audioManager.getState());
  const [currentTime, setCurrentTime] = useState(() => audioManager.getCurrentTime());
  const [duration, setDuration] = useState(() => audioManager.getDuration());
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [favorites, setFavorites] = useState<Track[]>([]);

  // Audio lifecycle & Error state
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioErrorDetail, setAudioErrorDetail] = useState<string | null>(null);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  // Listen Together Shared Room State
  const [isListenTogetherActive, setIsListenTogetherActive] = useState(false);
  const [listenSessionId, setListenSessionId] = useState<string | null>(null);
  const [listenTogetherPartner, setListenTogetherPartner] = useState<string>('Partner');
  const [listenRoomState, setListenRoomState] = useState<ListenRoomState | null>(null);
  const [driftMs, setDriftMs] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'adjusting_rate' | 'seeking' | 'standalone'>('standalone');
  const [activeListenersCount, setActiveListenersCount] = useState(1);

  // Synchronous Refs to avoid stale closures & feedback loops
  const currentTrackRef = useRef<Track | null>(currentTrack);
  const queueRef = useRef<Track[]>(queue);
  const isRepeatRef = useRef(isRepeat);
  const isShuffleRef = useRef(isShuffle);
  const isListenTogetherActiveRef = useRef(isListenTogetherActive);
  const listenSessionIdRef = useRef<string | null>(listenSessionId);
  const lastAuthoritativeStateRef = useRef<ListenRoomState | null>(null);
  const lastSyncSeekTimeRef = useRef<number>(0);
  const isLocalActionRef = useRef<boolean>(false);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { isRepeatRef.current = isRepeat; }, [isRepeat]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { isListenTogetherActiveRef.current = isListenTogetherActive; }, [isListenTogetherActive]);
  useEffect(() => { listenSessionIdRef.current = listenSessionId; }, [listenSessionId]);

  // Real-Time Now Playing Presence Sync (Strictly Observational, NEVER controls playback)
  useEffect(() => {
    const syncPresence = async () => {
      try {
        const user = clientAuth.currentUser;
        if (!user) return;

        const userDocRef = doc(db, 'users', user.uid);
        const safeTrack = currentTrack
          ? {
              title: currentTrack.title || 'Unknown Title',
              artist: currentTrack.artist || 'Unknown Artist',
              provider: currentTrack.provider || (currentTrack.videoId || currentTrack.youtubeVideoId || currentTrack.id?.startsWith('yt-') ? 'youtube' : 'audius'),
              providerTrackId: currentTrack.providerTrackId || currentTrack.id || currentTrack.videoId || currentTrack.youtubeVideoId || '',
              artworkUrl: currentTrack.artwork || currentTrack.artworkUrl || ''
            }
          : null;

        const presenceData = sanitizeFirestorePayload({
          presence: {
            state: isPlaying ? 'Listening' : 'Away',
            currentTrack: safeTrack,
            isPlaying,
            updatedAt: Date.now()
          }
        });

        try {
          await updateDoc(userDocRef, presenceData);
        } catch (updateErr: any) {
          try {
            await setDoc(userDocRef, presenceData, { merge: true });
          } catch (setErr: any) {
            console.warn('[MUSIC_PRESENCE_SYNC_ERROR] Failed to set presence in Firestore:', setErr?.message || setErr);
          }
        }
      } catch (err: any) {
        console.warn('[MUSIC_PRESENCE_SYNC_UNCAUGHT_GUARD] Non-blocking presence update error:', err?.message || err);
      }
    };

    syncPresence();
  }, [currentTrack, isPlaying]);

  const clearAudioError = useCallback(() => {
    console.log('[MUSIC_CONTEXT_CLEAR_ERROR] Clearing audio error state');
    setAudioError(null);
    setAudioErrorDetail(null);
    setPlayerStatus(isPlaying ? 'playing' : 'paused');
  }, [isPlaying]);

  const handlePlayError = useCallback((err: any) => {
    console.error('[MUSIC_CONTEXT_ERROR_EVENT] Playback error encountered:', {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      track: currentTrackRef.current?.title,
      streamUrl: currentTrackRef.current?.streamUrl
    });

    if (err && err.name === 'NotAllowedError') {
      console.warn('[MUSIC_CONTEXT_AUTOPLAY_BLOCK] Autoplay blocked by browser policy; user gesture required.');
      setIsAutoplayBlocked(true);
      setIsPlaying(false);
      setPlayerStatus('paused');
    } else if (err && err.name === 'AbortError') {
      console.log('[MUSIC_CONTEXT_ABORT] Play request was safely superseded.');
    } else {
      console.error('[AUDIO_SOURCE_FAILURE]', {
        trackId: currentTrackRef.current?.id,
        streamUrl: currentTrackRef.current?.streamUrl,
        audioErrorCode: err?.code || 4,
        audioErrorMessage: err?.message || 'Format error / unsupported media',
        readyState: audioManager.getReadyState(),
        networkState: audioManager.getNetworkState()
      });
      setAudioError('Playback unavailable for this track.');
      setAudioErrorDetail('Audio stream could not be loaded.');
      setIsPlaying(false);
      setPlayerStatus('error');
    }
  }, []);

  const resolveAutoplayBlock = useCallback(() => {
    setIsAutoplayBlocked(false);
    setAudioError(null);
    setAudioErrorDetail(null);
    if (currentTrackRef.current) {
      console.log('[MUSIC_CONTEXT_PLAY_CALL] [RESOLVE_AUTOPLAY] User gesture unlocking audio play for:', currentTrackRef.current.title);
      audioManager.play()
        .then(() => {
          console.log('[MUSIC_CONTEXT_PLAY_SUCCESS] Autoplay block successfully resolved for track:', currentTrackRef.current?.title);
          setIsPlaying(true);
          setIsAutoplayBlocked(false);
          setPlayerStatus('playing');
        })
        .catch(handlePlayError);
    }
  }, [handlePlayError]);

  // Listen Together History State
  const [listenTogetherHistory, setListenTogetherHistory] = useState<ListenTogetherHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('soniva_listen_together_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved listen together history:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('soniva_listen_together_history', JSON.stringify(listenTogetherHistory));
    } catch (e) {}
  }, [listenTogetherHistory]);

  const recordListenTogetherTrack = useCallback((track: Track, partnerName?: string) => {
    const item: ListenTogetherHistoryItem = {
      id: `lth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      track,
      playedAt: Date.now(),
      sessionId: listenSessionIdRef.current || 'sync-room',
      partnerName: partnerName || listenTogetherPartner || 'Room Listener'
    };
    setListenTogetherHistory((prev) => [
      item,
      ...prev.filter(p => p.track.id !== track.id || (Date.now() - p.playedAt > 1000 * 60 * 30))
    ].slice(0, 30));
  }, [listenTogetherPartner]);

  const clearListenTogetherHistory = useCallback(() => {
    setListenTogetherHistory([]);
    try {
      localStorage.removeItem('soniva_listen_together_history');
    } catch (e) {}
  }, []);

  // --------------------------------------------------------------------------
  // BROADCAST REALTIME ACTIONS TO LISTEN TOGETHER ROOM (WHEN ACTIVE ONLY)
  // --------------------------------------------------------------------------
  const broadcastSyncAction = (action: string, trackData?: Track, pos?: number, queueData?: Track[]) => {
    if (isListenTogetherActiveRef.current && listenSessionIdRef.current) {
      isLocalActionRef.current = true;
      const position = pos !== undefined ? pos : audioManager.getCurrentTime();
      socketService.send({
        type: 'listen:sync',
        roomId: listenSessionIdRef.current,
        action,
        track: trackData || currentTrackRef.current,
        position,
        currentTime: position,
        queue: queueData || queueRef.current
      });
      setTimeout(() => {
        isLocalActionRef.current = false;
      }, 500);
    }
  };

  // --------------------------------------------------------------------------
  // UNIFIED CENTRALIZED TRACK LOADING PIPELINE
  // --------------------------------------------------------------------------
  const loadTrackIntoAudio = useCallback(async (rawTrack: Track, autoPlay: boolean = false) => {
    if (!rawTrack || !rawTrack.id) {
      console.warn('[MUSIC_CONTEXT_ERROR_EVENT] [INVALID_SOURCE] Invalid track provided to loadTrackIntoAudio');
      return;
    }
    const track = normalizeGenericTrack(rawTrack);

    console.log('[MUSIC_CONTEXT_TRACK_SELECT]', track.id, track.title);
    console.log('[AUDIO_RESOLVE_START]', track.id, track.title);

    setAudioError(null);
    setAudioErrorDetail(null);
    setIsAutoplayBlocked(false);
    setPlayerStatus('resolving');

    if (track.isStreamable === false) {
      console.warn('[AUDIO_RESOLVE_FAILED]', track.id, 'Track is marked non-streamable');
      setAudioError('Playback unavailable for this track.');
      setAudioErrorDetail('Track is restricted or unavailable.');
      setIsPlaying(false);
      setPlayerStatus('error');
      return;
    }

    try {
      console.log('[AUDIO_RESOLVE_PIPELINE_BEFORE_CALL] Invoking stream resolver for track:', {
        trackId: track.id,
        provider: track.provider,
        title: track.title,
        streamUrl: redactStreamUrl(track.streamUrl)
      });
      const resolvedStreamUrl = await UnifiedMusicService.resolvePlayableStreamUrl(track);
      console.log('[AUDIO_RESOLVE_PIPELINE_AFTER_CALL] Stream resolver returned successfully:', {
        trackId: track.id,
        resolvedStreamUrl: redactStreamUrl(resolvedStreamUrl)
      });

      const resolvedTrack: Track = normalizeGenericTrack({
        ...track,
        streamUrl: resolvedStreamUrl
      });

      setCurrentTrack(resolvedTrack);
      if (isListenTogetherActiveRef.current) {
        recordListenTogetherTrack(resolvedTrack);
      }

      if (autoPlay) {
        console.log('[AUDIO_PLAY_REQUEST]', resolvedTrack.id, resolvedStreamUrl);
        await audioManager.loadAndPlay(resolvedTrack);
        setIsPlaying(true);
        setPlayerStatus('playing');
        broadcastSyncAction('change_track', resolvedTrack, 0);
      } else {
        audioManager.loadTrack(resolvedTrack);
        setPlayerStatus('ready');
      }
    } catch (err: any) {
      console.error('[AUDIO_RESOLVE_FAILED]', track.id, err?.message || err);
      handlePlayError(err);
    }
  }, [handlePlayError, recordListenTogetherTrack]);

  const playTrackRef = useRef<((track: Track) => void) | null>(null);

  // --------------------------------------------------------------------------
  // SUBSCRIBE TO PERSISTENT AUDIOMANAGER SINGLETON EVENTS
  // --------------------------------------------------------------------------
  useEffect(() => {
    console.log('[MUSIC_CONTEXT_INIT] Subscribing to persistent AudioManager events');

    const unsubPlay = audioManager.subscribe('play', () => {
      console.log('[AUDIO_PLAY_SUCCESS] Received native play/playing event from audio element');
      setIsPlaying(true);
      setPlayerStatus('playing');
      setAudioError(null);
      setAudioErrorDetail(null);
      setIsAutoplayBlocked(false);
    });

    const unsubPlayBlocked = audioManager.subscribe('play_blocked', () => {
      console.warn('[AUDIO_PLAY_BLOCKED] Autoplay policy blocked playback');
      setIsAutoplayBlocked(true);
      setIsPlaying(false);
      setPlayerStatus('paused');
    });

    const unsubPause = audioManager.subscribe('pause', () => {
      console.log('[AUDIO_PAUSED] Received native pause event from audio element');
      setIsPlaying(false);
      setPlayerStatus(prev => prev === 'error' ? 'error' : 'paused');
    });

    const unsubStop = audioManager.subscribe('stop', () => {
      console.log('[AUDIO_STOP_EVENT] Received native stop event from audio element');
      setIsPlaying(false);
      setPlayerStatus('idle');
    });

    const unsubStateChange = audioManager.subscribe('statechange', (data: any) => {
      if (data?.current) {
        setPlaybackState(data.current);
      }
    });

    const unsubTimeUpdate = audioManager.subscribe('timeupdate', (time: number) => {
      setCurrentTime(time);
    });

    const unsubLoadedMetadata = audioManager.subscribe('loadedmetadata', (dur: number) => {
      console.log('[MUSIC_CONTEXT_LOADED_METADATA] Audio metadata loaded. Duration:', dur);
      setDuration(dur || 180);
      setPlayerStatus(prev => prev === 'resolving' ? 'ready' : prev);
    });

    const unsubCanPlay = audioManager.subscribe('canplay', () => {
      console.log('[MUSIC_CONTEXT_CANPLAY] Audio element is ready to play (canplay event)');
      setAudioError(null);
      setAudioErrorDetail(null);
      setPlayerStatus(prev => prev === 'resolving' ? 'ready' : prev);
    });

    const unsubEnded = audioManager.subscribe('ended', () => {
      console.log('[MUSIC_CONTEXT_ENDED] Track finished playing naturally');
      setIsPlaying(false);
      setPlayerStatus('ended');

      if (isRepeatRef.current) {
        console.log('[MUSIC_CONTEXT_REPEAT] Repeating current track');
        audioManager.seek(0);
        audioManager.play().catch(handlePlayError);
      } else {
        const q = queueRef.current;
        const cur = currentTrackRef.current;
        if (q.length === 0) {
          setPlayerStatus('idle');
          return;
        }
        const currentIndex = q.findIndex((t) => t.id === cur?.id);
        let nextIndex = -1;
        if (isShuffleRef.current) {
          nextIndex = Math.floor(Math.random() * q.length);
        } else if (currentIndex >= 0 && currentIndex < q.length - 1) {
          nextIndex = currentIndex + 1;
        }
        if (nextIndex >= 0 && q[nextIndex] && playTrackRef.current) {
          console.log('[MUSIC_CONTEXT_AUTO_ADVANCE] Advancing to next track in queue:', q[nextIndex].title);
          playTrackRef.current(q[nextIndex]);
        } else {
          setPlayerStatus('idle');
        }
      }
    });

    const unsubError = audioManager.subscribe('error', (err: any) => {
      let errorMsg = 'Playback unavailable for this track.';
      if (err) {
        switch (err.code) {
          case 1: errorMsg = 'Playback aborted by user or network.'; break;
          case 2: errorMsg = 'Network error loading audio stream.'; break;
          case 3: errorMsg = 'Audio decoding failed or corrupt media.'; break;
          case 4: errorMsg = 'Audio format/source not supported or unavailable.'; break;
        }
      }
      setAudioError(errorMsg);
      setAudioErrorDetail('Audio stream could not be loaded.');
      setIsPlaying(false);
      setPlayerStatus('error');
    });

    // Seed initial trending catalog and prepare default track without auto-starting
    if (queueRef.current.length === 0) {
      MusicService.getTrendingTracks().then((tracks) => {
        if (tracks.length > 0) {
          console.log('[MUSIC_CONTEXT_CATALOG_SEED] Loaded default trending catalog:', tracks.length, 'tracks');
          setQueue(tracks);
          if (!currentTrackRef.current) {
            loadTrackIntoAudio(tracks[0], false);
          }
        }
      });
    }

    return () => {
      console.log('[MUSIC_CONTEXT_CLEANUP] Cleaning up AudioManager event subscriptions');
      unsubPlay();
      unsubPlayBlocked();
      unsubPause();
      unsubStop();
      unsubStateChange();
      unsubTimeUpdate();
      unsubLoadedMetadata();
      unsubCanPlay();
      unsubEnded();
      unsubError();
    };
  }, [handlePlayError, loadTrackIntoAudio]);

  // --------------------------------------------------------------------------
  // SUBSCRIBE TO PERSISTENT YOUTUBE SINGLETON EVENTS
  // --------------------------------------------------------------------------
  useEffect(() => {
    console.log('[MUSIC_CONTEXT_INIT] Subscribing to persistent YouTubePlayerManager events');

    const unsubPlay = youtubePlayerManager.subscribe('play', () => {
      if (currentTrackRef.current?.provider === 'youtube') {
        console.log('[YOUTUBE_PLAY_SUCCESS] Received play event from YouTube player');
        setIsPlaying(true);
        setPlayerStatus('playing');
        setAudioError(null);
        setAudioErrorDetail(null);
        setIsAutoplayBlocked(false);
      }
    });

    const unsubPause = youtubePlayerManager.subscribe('pause', () => {
      if (currentTrackRef.current?.provider === 'youtube') {
        console.log('[YOUTUBE_PAUSED] Received pause event from YouTube player');
        setIsPlaying(false);
        setPlayerStatus((prev) => (prev === 'error' ? 'error' : 'paused'));
      }
    });

    const unsubBuffering = youtubePlayerManager.subscribe('buffering', () => {
      if (currentTrackRef.current?.provider === 'youtube') {
        setPlayerStatus('resolving');
      }
    });

    const unsubEnded = youtubePlayerManager.subscribe('ended', () => {
      if (currentTrackRef.current?.provider === 'youtube') {
        console.log('[MUSIC_CONTEXT_YOUTUBE_ENDED] YouTube track finished playing');
        setIsPlaying(false);
        setPlayerStatus('ended');

        if (isRepeatRef.current) {
          console.log('[MUSIC_CONTEXT_YOUTUBE_REPEAT] Repeating current YouTube track');
          youtubePlayerManager.seekTo(0);
          youtubePlayerManager.playVideo();
        } else {
          const q = queueRef.current;
          const cur = currentTrackRef.current;
          if (q.length === 0) {
            setPlayerStatus('idle');
            return;
          }
          const currentIndex = q.findIndex((t) => t.id === cur?.id);
          let nextIndex = -1;
          if (isShuffleRef.current) {
            nextIndex = Math.floor(Math.random() * q.length);
          } else if (currentIndex >= 0 && currentIndex < q.length - 1) {
            nextIndex = currentIndex + 1;
          }
          if (nextIndex >= 0 && q[nextIndex] && playTrackRef.current) {
            console.log('[MUSIC_CONTEXT_YOUTUBE_AUTO_ADVANCE] Advancing to next track in queue:', q[nextIndex].title);
            playTrackRef.current(q[nextIndex]);
          } else {
            setPlayerStatus('idle');
          }
        }
      }
    });

    const unsubError = youtubePlayerManager.subscribe('error', (errCode: number) => {
      if (currentTrackRef.current?.provider === 'youtube') {
        let msg = "Can't play this video inside SONIVA.";
        let detail = 'Playback error reported by YouTube.';
        if (errCode === 101 || errCode === 150) {
          msg = 'This video cannot be played inside SONIVA (embedding disabled by owner).';
          detail = 'Video owner restricts embedding.';
        } else if (errCode === 100 || errCode === 2) {
          msg = 'Video unavailable or removed on YouTube.';
          detail = 'Video not found.';
        }
        console.error('[YOUTUBE_PLAYBACK_ERROR]', errCode, msg);
        setAudioError(msg);
        setAudioErrorDetail(detail);
        setIsPlaying(false);
        setPlayerStatus('error');
      }
    });

    return () => {
      unsubPlay();
      unsubPause();
      unsubBuffering();
      unsubEnded();
      unsubError();
    };
  }, []);

  // Time & duration polling for YouTube player
  useEffect(() => {
    if (!isPlaying || currentTrack?.provider !== 'youtube') return;

    const interval = setInterval(() => {
      const cur = youtubePlayerManager.getCurrentTime();
      const dur = youtubePlayerManager.getDuration();
      if (cur >= 0) {
        setCurrentTime(cur);
      }
      if (dur > 0) {
        setDuration(dur);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  // --------------------------------------------------------------------------
  // LISTEN TOGETHER SYNC ENGINE (GATED BEHIND ACTIVE SESSIONS ONLY)
  // --------------------------------------------------------------------------
  const syncWithRoomState = useCallback(async (state: ListenRoomState, serverTimestamp: number) => {
    if (!isListenTogetherActiveRef.current || !listenSessionIdRef.current) {
      return;
    }
    if (!state || !state.track) return;
    if (isLocalActionRef.current) return;

    lastAuthoritativeStateRef.current = state;
    setListenRoomState(state);
    setActiveListenersCount(Math.max(2, state.participants?.length || 2));

    const now = Date.now();
    const latencySec = Math.max(0, (now - serverTimestamp) / 1000);
    const expectedPos = state.isPlaying
      ? Math.max(0, state.position + latencySec * (state.playbackRate || 1.0))
      : state.position;

    if (state.queue && state.queue.length > 0) {
      setQueue(state.queue);
    }

    const currentTrackId = currentTrackRef.current?.id;
    const isNewTrack = !currentTrackId || currentTrackId !== state.track.id;
    const isYT = state.track.provider === 'youtube' || !!state.track.youtubeVideoId || state.track.id.startsWith('yt-');

    if (isYT) {
      const ytTrack = normalizeYouTubeTrack(state.track);
      const videoId = ytTrack.videoId || ytTrack.youtubeVideoId || '';

      if (isNewTrack) {
        audioManager.stop();
        setCurrentTrack(ytTrack);
        recordListenTogetherTrack(ytTrack);
        youtubePlayerManager.loadAndPlay(videoId);
        if (expectedPos > 0) {
          youtubePlayerManager.seekTo(expectedPos, true);
        }
        if (!state.isPlaying) {
          youtubePlayerManager.pauseVideo();
          setIsPlaying(false);
          setPlayerStatus('paused');
        } else {
          setIsPlaying(true);
          setPlayerStatus('playing');
        }
        setSyncStatus('synced');
        setDriftMs(0);
      } else {
        if (state.isPlaying && !isPlaying) {
          youtubePlayerManager.playVideo(videoId);
          setIsPlaying(true);
          setPlayerStatus('playing');
        } else if (!state.isPlaying && isPlaying) {
          youtubePlayerManager.pauseVideo();
          setIsPlaying(false);
          setPlayerStatus('paused');
        }

        const ytCurTime = youtubePlayerManager.getCurrentTime();
        const driftSec = ytCurTime - expectedPos;
        const absDriftMs = Math.round(Math.abs(driftSec) * 1000);
        setDriftMs(Math.round(driftSec * 1000));

        if (absDriftMs > 2500) {
          const timeSinceLastSeek = now - lastSyncSeekTimeRef.current;
          if (timeSinceLastSeek > 3000) {
            youtubePlayerManager.seekTo(expectedPos, true);
            lastSyncSeekTimeRef.current = now;
            setSyncStatus('seeking');
          }
        } else {
          setSyncStatus('synced');
        }
      }
      return;
    }

    if (isNewTrack) {
      console.log('[MUSIC_CONTEXT_TRACK_SELECT] [LISTEN_TOGETHER] Syncing new room track:', {
        trackId: state.track.id,
        title: state.track.title,
        streamUrl: state.track.streamUrl,
        expectedPosition: expectedPos,
        roomIsPlaying: state.isPlaying
      });

      try {
        youtubePlayerManager.stopVideo();
        const resolvedStreamUrl = await MusicService.resolvePlayableAudioUrl(state.track.id, state.track);
        const resolvedTrack = normalizeGenericTrack({ ...state.track, streamUrl: resolvedStreamUrl });
        setCurrentTrack(resolvedTrack);
        recordListenTogetherTrack(resolvedTrack);

        await audioManager.loadAndPlay(resolvedTrack);
        audioManager.seek(expectedPos);
        if (!state.isPlaying) {
          audioManager.pause();
          setIsPlaying(false);
          setPlayerStatus('paused');
        } else {
          setIsPlaying(true);
          setPlayerStatus('playing');
        }
      } catch (err: any) {
        console.error('[MUSIC_CONTEXT_ERROR_EVENT] [LISTEN_TOGETHER] Failed to load/play synced room track:', err);
        handlePlayError(err);
      }

      setSyncStatus('synced');
      setDriftMs(0);
    } else {
      youtubePlayerManager.stopVideo();
      if (state.isPlaying && audioManager.isPaused()) {
        audioManager.play().then(() => {
          setIsPlaying(true);
          setPlayerStatus('playing');
        }).catch(handlePlayError);
      } else if (!state.isPlaying && !audioManager.isPaused()) {
        audioManager.pause();
        setIsPlaying(false);
        setPlayerStatus('paused');
      }

      const driftSec = audioManager.getCurrentTime() - expectedPos;
      const absDriftMs = Math.round(Math.abs(driftSec) * 1000);
      setDriftMs(Math.round(driftSec * 1000));

      if (absDriftMs < 200) {
        audioManager.setPlaybackRate(1.0);
        setSyncStatus('synced');
      } else if (absDriftMs >= 200 && absDriftMs <= 800) {
        audioManager.setPlaybackRate(driftSec < 0 ? 1.03 : 0.97);
        setSyncStatus('adjusting_rate');
      } else {
        const timeSinceLastSeek = now - lastSyncSeekTimeRef.current;
        if (timeSinceLastSeek > 3000) {
          audioManager.seek(expectedPos);
          audioManager.setPlaybackRate(1.0);
          lastSyncSeekTimeRef.current = now;
          setSyncStatus('seeking');
        }
      }
    }
  }, [handlePlayError, isPlaying, recordListenTogetherTrack]);

  // Subscribe to Listen Together socket events ONCE
  useEffect(() => {
    const unsubSync = socketService.on('listen:sync', (data: any) => {
      if (data.state && isListenTogetherActiveRef.current) {
        syncWithRoomState(data.state, data.serverTimestamp || Date.now());
      }
    });

    const unsubInit = socketService.on('listen:init_state', (data: any) => {
      if (data.state && isListenTogetherActiveRef.current) {
        syncWithRoomState(data.state, data.serverTimestamp || Date.now());
      }
    });

    return () => {
      unsubSync();
      unsubInit();
    };
  }, [syncWithRoomState]);

  // YouTube Player State
  const [activeYouTubeTrack, setActiveYouTubeTrack] = useState<Track | null>(null);
  const [isYouTubePlayerOpen, setIsYouTubePlayerOpen] = useState(false);

  const openYouTubePlayer = useCallback((track: Track) => {
    setActiveYouTubeTrack(track);
    setIsYouTubePlayerOpen(true);
  }, []);

  const closeYouTubePlayer = useCallback(() => {
    setActiveYouTubeTrack(null);
    setIsYouTubePlayerOpen(false);
  }, []);

  // --------------------------------------------------------------------------
  // CONTROLLER ACTIONS
  // --------------------------------------------------------------------------
  const playTrackInternal = useCallback((rawTrack: Track) => {
    if (!rawTrack) return;
    const track = normalizeGenericTrack(rawTrack);
    const isYT = track.provider === 'youtube' || !!track.youtubeVideoId || track.id.startsWith('yt-');
    if (isYT) {
      const normalizedYtTrack = normalizeYouTubeTrack(track);
      const videoId = normalizedYtTrack.videoId || normalizedYtTrack.youtubeVideoId || '';

      console.log('[MUSIC_CONTEXT_PLAY_YOUTUBE]', { title: normalizedYtTrack.title, videoId });

      // Stop standard HTML5 audio to prevent simultaneous playback
      audioManager.stop();

      setCurrentTrack(normalizedYtTrack);
      setDuration(normalizedYtTrack.duration || 240);
      setCurrentTime(0);
      setAudioError(null);
      setAudioErrorDetail(null);
      setIsAutoplayBlocked(false);
      setPlayerStatus('resolving');

      if (isListenTogetherActiveRef.current) {
        recordListenTogetherTrack(normalizedYtTrack);
      }

      if (videoId) {
        youtubePlayerManager.loadAndPlay(videoId);
      }
      setIsPlaying(true);
      setPlayerStatus('playing');
      broadcastSyncAction('change_track', normalizedYtTrack, 0);
    } else {
      // Stop YouTube player if active to prevent simultaneous playback
      youtubePlayerManager.stopVideo();
      closeYouTubePlayer();
      loadTrackIntoAudio(track, true);
    }
  }, [closeYouTubePlayer, loadTrackIntoAudio, recordListenTogetherTrack]);

  useEffect(() => {
    playTrackRef.current = playTrackInternal;
  }, [playTrackInternal]);

  /**
   * CRITICAL AUTHORITATIVE STOP METHOD:
   * Immediately stops playback, resets state to 'idle', resets position,
   * halts both native audio and YouTube player.
   */
  const stopTrack = useCallback(() => {
    console.log('[MUSIC_CONTEXT_STOP] User requested explicit stop of audio playback');
    audioManager.stop();
    youtubePlayerManager.stopVideo();
    setIsPlaying(false);
    setPlayerStatus('idle');
    setCurrentTime(0);
    setAudioError(null);
    setAudioErrorDetail(null);
    setIsAutoplayBlocked(false);
    if (currentTrackRef.current) {
      broadcastSyncAction('pause', currentTrackRef.current, 0);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    const track = currentTrackRef.current;
    if (!track) {
      console.warn('[MUSIC_CONTEXT_TOGGLE_PLAY] Cannot toggle play: no track is currently selected');
      return;
    }

    setAudioError(null);
    setAudioErrorDetail(null);
    setIsAutoplayBlocked(false);

    const isYT = track.provider === 'youtube' || !!track.youtubeVideoId || track.id.startsWith('yt-');
    if (isYT) {
      if (isPlaying) {
        console.log('[MUSIC_CONTEXT_YOUTUBE_PAUSE]');
        youtubePlayerManager.pauseVideo();
        setIsPlaying(false);
        setPlayerStatus('paused');
        broadcastSyncAction('pause', track, youtubePlayerManager.getCurrentTime());
      } else {
        console.log('[MUSIC_CONTEXT_YOUTUBE_PLAY]');
        const rawId = track.youtubeVideoId || (track.id.startsWith('yt-') ? track.id.replace('yt-', '') : track.id);
        const videoId = (rawId && rawId.length === 11) ? rawId : (rawId && rawId.length > 11 ? rawId.slice(-11) : rawId);
        // Guarantee native audio is stopped
        audioManager.stop();
        youtubePlayerManager.playVideo(videoId);
        setIsPlaying(true);
        setPlayerStatus('playing');
        broadcastSyncAction('play', track, youtubePlayerManager.getCurrentTime());
      }
      return;
    }

    if (!audioManager.isPaused()) {
      console.log('[AUDIO_PAUSE] User requested pause at timestamp:', audioManager.getCurrentTime());
      audioManager.pause();
      setIsPlaying(false);
      setPlayerStatus('paused');
      broadcastSyncAction('pause', track, audioManager.getCurrentTime());
    } else {
      // Guarantee YouTube is stopped
      youtubePlayerManager.stopVideo();

      if (isListenTogetherActiveRef.current) {
        recordListenTogetherTrack(track);
      }

      if (!audioManager.hasSource()) {
        console.log('[MUSIC_CONTEXT_PLAY_CALL] Audio source not yet loaded in element; loading and playing:', track.title);
        await loadTrackIntoAudio(track, true);
        return;
      }

      console.log('[AUDIO_PLAY_REQUEST]', track.id, audioManager.getSrc());
      audioManager.play()
        .then(() => {
          console.log('[AUDIO_PLAY_SUCCESS] Playback started');
          setIsPlaying(true);
          setPlayerStatus('playing');
          setIsAutoplayBlocked(false);
          broadcastSyncAction('play', track, audioManager.getCurrentTime());
        })
        .catch((err) => {
          console.error('[MUSIC_CONTEXT_ERROR_EVENT] audioManager.play promise rejected on togglePlay:', err);
          handlePlayError(err);
        });
    }
  }, [handlePlayError, isPlaying, loadTrackIntoAudio, recordListenTogetherTrack]);

  const retryCurrentTrack = useCallback(() => {
    if (currentTrackRef.current) {
      console.log('[MUSIC_CONTEXT_RETRY] Retrying playback for current track:', currentTrackRef.current.title);
      clearAudioError();
      const isYT = currentTrackRef.current.provider === 'youtube' || !!currentTrackRef.current.youtubeVideoId;
      if (isYT) {
        playTrackInternal(currentTrackRef.current);
      } else {
        loadTrackIntoAudio(currentTrackRef.current, true);
      }
    }
  }, [clearAudioError, loadTrackIntoAudio, playTrackInternal]);

  const nextTrack = useCallback(() => {
    const q = queueRef.current;
    console.log('[MUSIC_CONTEXT_NEXT_TRACK] Next track requested. Queue length:', q.length);
    if (q.length === 0) return;
    const currentIndex = q.findIndex((t) => t.id === currentTrackRef.current?.id);
    let nextIndex = 0;
    if (isShuffleRef.current) {
      nextIndex = Math.floor(Math.random() * q.length);
    } else if (currentIndex >= 0 && currentIndex < q.length - 1) {
      nextIndex = currentIndex + 1;
    }
    const nextT = q[nextIndex];
    if (nextT) {
      console.log('[MUSIC_CONTEXT_TRACK_SELECT] Selected next track from queue:', nextT.title);
      playTrackInternal(nextT);
      broadcastSyncAction('next', nextT, 0);
    }
  }, [playTrackInternal]);

  const previousTrack = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) return;

    const isYT = currentTrackRef.current?.provider === 'youtube' || !!currentTrackRef.current?.youtubeVideoId;
    const curPos = isYT ? youtubePlayerManager.getCurrentTime() : audioManager.getCurrentTime();

    if (curPos > 3) {
      console.log('[MUSIC_CONTEXT_SEEK] Replaying current track from 0:00');
      if (isYT) {
        youtubePlayerManager.seekTo(0);
      } else {
        audioManager.seek(0);
      }
      setCurrentTime(0);
      return;
    }

    const currentIndex = q.findIndex((t) => t.id === currentTrackRef.current?.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : q.length - 1;
    const prevT = q[prevIndex];
    if (prevT) {
      console.log('[MUSIC_CONTEXT_TRACK_SELECT] Selected previous track from queue:', prevT.title);
      playTrackInternal(prevT);
      broadcastSyncAction('previous', prevT, 0);
    }
  }, [playTrackInternal]);

  const seek = useCallback((time: number) => {
    const isYT = currentTrackRef.current?.provider === 'youtube' || !!currentTrackRef.current?.youtubeVideoId;
    if (isYT) {
      console.log('[MUSIC_CONTEXT_SEEK_YOUTUBE] Seeking YouTube player to (seconds):', time);
      youtubePlayerManager.seekTo(time, true);
    } else {
      console.log('[MUSIC_CONTEXT_SEEK] Seeking audio element to position (seconds):', time);
      audioManager.seek(time);
    }
    setCurrentTime(time);
    broadcastSyncAction('seek', undefined, time);
  }, []);

  const setVolumeLevel = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    console.log('[MUSIC_CONTEXT_VOLUME_CHANGE] Setting audio volume level to:', clamped);
    setVolume(clamped);
    audioManager.setVolume(clamped);
    youtubePlayerManager.setVolume(clamped * 100);
    if (clamped > 0 && isMuted) {
      console.log('[MUSIC_CONTEXT_VOLUME_CHANGE] Automatically unmuting due to positive volume slider adjustment');
      setIsMuted(false);
      audioManager.setMuted(false);
      youtubePlayerManager.unMute();
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const newMute = !isMuted;
    console.log('[MUSIC_CONTEXT_VOLUME_CHANGE] Toggling mute state to:', newMute);
    setIsMuted(newMute);
    audioManager.setMuted(newMute);
    if (newMute) {
      youtubePlayerManager.mute();
    } else {
      youtubePlayerManager.unMute();
    }
  }, [isMuted]);

  const toggleShuffle = useCallback(() => setIsShuffle(prev => !prev), []);
  const toggleRepeat = useCallback(() => setIsRepeat(prev => !prev), []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => {
      const updated = [...prev, track];
      broadcastSyncAction('queue_update', undefined, undefined, updated);
      return updated;
    });
  }, []);

  const playNextInQueue = useCallback((track: Track) => {
    if (!currentTrackRef.current) {
      loadTrackIntoAudio(track, true);
      return;
    }
    setQueue(prev => {
      const cur = currentTrackRef.current;
      const currentIndex = prev.findIndex((t) => t.id === cur?.id);
      const newQueue = [...prev];
      newQueue.splice(currentIndex + 1, 0, track);
      broadcastSyncAction('queue_update', undefined, undefined, newQueue);
      return newQueue;
    });
  }, [loadTrackIntoAudio]);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue(prev => {
      const updated = prev.filter((t) => t.id !== trackId);
      broadcastSyncAction('queue_update', undefined, undefined, updated);
      return updated;
    });
  }, []);

  // Liked Songs
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const idToken = await clientAuth.currentUser?.getIdToken();
        if (!idToken) return;
        const res = await fetch('/api/music/favorites', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites || []);
        }
      } catch (e) {
        console.error('Failed to fetch favorites:', e);
      }
    };
    fetchFavorites();
  }, []);

  const toggleFavorite = useCallback(async (track: Track) => {
    const isLiked = favorites.some(t => t.id === track.id);
    const idToken = await clientAuth.currentUser?.getIdToken();
    if (!idToken) return;

    if (isLiked) {
      setFavorites(prev => prev.filter(t => t.id !== track.id));
      await fetch(`/api/music/favorites/${track.provider}:${track.providerId || track.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` }
      });
    } else {
      setFavorites(prev => [...prev, track]);
      await fetch('/api/music/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ track })
      });
    }
  }, [favorites]);

  // Launch or Join Listen Together Session
  const startListenTogether = useCallback((roomId: string, partnerName?: string) => {
    console.log('[AudioManager] Starting/Joining Listen Together room:', roomId);
    setIsListenTogetherActive(true);
    setListenSessionId(roomId);
    if (partnerName) {
      setListenTogetherPartner(partnerName);
    }
    if (currentTrackRef.current) {
      recordListenTogetherTrack(currentTrackRef.current, partnerName);
    }

    socketService.joinRoom(roomId);
    socketService.send({
      type: 'listen:get_state',
      roomId
    });

    if (currentTrackRef.current) {
      broadcastSyncAction('play', currentTrackRef.current, audioManager.getCurrentTime());
    }
  }, [recordListenTogetherTrack]);

  const leaveListenTogether = useCallback(() => {
    console.log('[AudioManager] Leaving Listen Together room');
    setIsListenTogetherActive(false);
    setListenSessionId(null);
    setListenRoomState(null);
    setSyncStatus('standalone');
    setDriftMs(0);
    audioManager.setPlaybackRate(1.0);
  }, []);

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playerStatus,
        playbackState,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        isRepeat,
        queue,
        favorites,
        isListenTogetherActive,
        listenSessionId,
        listenRoomState,
        driftMs,
        syncStatus,
        activeListenersCount,
        listenTogetherHistory,
        audioError,
        audioErrorDetail,
        isAutoplayBlocked,
        activeYouTubeTrack,
        isYouTubePlayerOpen,
        openYouTubePlayer,
        closeYouTubePlayer,
        clearAudioError,
        resolveAutoplayBlock,
        retryCurrentTrack,
        playTrack: playTrackInternal,
        loadTrackIntoAudio,
        togglePlay,
        stopTrack,
        nextTrack,
        previousTrack,
        seek,
        setVolumeLevel,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        toggleFavorite,
        startListenTogether,
        leaveListenTogether,
        recordListenTogetherTrack,
        clearListenTogetherHistory
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within a MusicProvider');
  return context;
};

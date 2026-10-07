import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Track } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface RoomPlaybackState {
  roomId: string;
  provider: 'public_sync';
  source: 'youtube';
  videoId: string;
  title: string;
  artist?: string;
  artworkUrl?: string;
  durationMs: number;
  isPlaying: boolean;
  positionMs: number;
  updatedAt: any;
  controllerUid: string;
}

interface PublicSyncContextType {
  isPublicSyncActive: boolean;
  roomPlaybackState: RoomPlaybackState | null;
  isController: boolean;
  activeRoomId: string | null;
  joinPublicSyncRoom: (roomId: string) => Promise<void>;
  leavePublicSyncRoom: () => Promise<void>;
  setRoomTrack: (track: Track) => Promise<void>;
  toggleRoomPlay: () => Promise<void>;
  seekRoom: (positionMs: number) => Promise<void>;
  claimControl: () => Promise<void>;
  localPlayerRef: React.MutableRefObject<any>;
  registerLocalPlayer: (player: any) => void;
  syncLocalToRemote: () => void;
}

const PublicSyncContext = createContext<PublicSyncContextType | undefined>(undefined);

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[FIRESTORE_ERROR]', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const PublicSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomPlaybackState, setRoomPlaybackState] = useState<RoomPlaybackState | null>(null);
  const [isPublicSyncActive, setIsPublicSyncActive] = useState(false);

  // Use ref to keep track of player instance
  const localPlayerRef = useRef<any>(null);
  const unsubSnapshotRef = useRef<(() => void) | null>(null);
  const isUpdatingRef = useRef(false);

  const currentUserUid = auth.currentUser?.uid || 'guest';
  const isController = roomPlaybackState?.controllerUid === currentUserUid;

  const registerLocalPlayer = useCallback((player: any) => {
    localPlayerRef.current = player;
    console.log('[PUBLIC_SYNC_PROVIDER] Local player registered');
  }, []);

  // Synchronize local player state to Firestore (called periodically by the controller)
  const syncLocalToRemote = useCallback(async () => {
    if (!activeRoomId || !isPublicSyncActive || !isController || isUpdatingRef.current) return;
    if (!localPlayerRef.current || typeof localPlayerRef.current.getCurrentTime !== 'function') return;

    try {
      const positionMs = Math.round(localPlayerRef.current.getCurrentTime() * 1000);
      const isPlayerPlaying = localPlayerRef.current.getPlayerState() === 1; // 1 = PLAYING in YouTube Player API

      // Avoid redundant Firestore updates if nothing major has changed
      if (roomPlaybackState) {
        const drift = Math.abs(roomPlaybackState.positionMs - positionMs);
        if (roomPlaybackState.isPlaying === isPlayerPlaying && drift < 2000) {
          return;
        }
      }

      isUpdatingRef.current = true;
      const roomRef = doc(db, 'public_sync_rooms', activeRoomId);
      await updateDoc(roomRef, {
        positionMs,
        isPlaying: isPlayerPlaying,
        updatedAt: serverTimestamp(),
      });
      console.log('[PUBLIC_SYNC_PROVIDER] Synced local state to Firestore:', { positionMs, isPlayerPlaying });
    } catch (error) {
      console.error('[PUBLIC_SYNC_PROVIDER] Error syncing local to Firestore:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [activeRoomId, isPublicSyncActive, isController, roomPlaybackState]);

  // Periodic controller updates
  useEffect(() => {
    if (!isPublicSyncActive || !isController) return;

    const interval = setInterval(() => {
      syncLocalToRemote();
    }, 3000);

    return () => clearInterval(interval);
  }, [isPublicSyncActive, isController, syncLocalToRemote]);

  // Leave active room and unsubscribe
  const leavePublicSyncRoom = useCallback(async () => {
    console.log('[PUBLIC_SYNC_PROVIDER] Leaving Public Sync Room:', activeRoomId);
    if (unsubSnapshotRef.current) {
      unsubSnapshotRef.current();
      unsubSnapshotRef.current = null;
    }
    setIsPublicSyncActive(false);
    setActiveRoomId(null);
    setRoomPlaybackState(null);
  }, [activeRoomId]);

  // Join a Public Sync Room
  const joinPublicSyncRoom = useCallback(async (roomId: string) => {
    await leavePublicSyncRoom();
    console.log('[PUBLIC_SYNC_PROVIDER] Joining Public Sync Room:', roomId);
    setActiveRoomId(roomId);
    setIsPublicSyncActive(true);

    const path = `public_sync_rooms/${roomId}`;
    const roomRef = doc(db, 'public_sync_rooms', roomId);

    try {
      unsubSnapshotRef.current = onSnapshot(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
          console.log('[PUBLIC_SYNC_PROVIDER] Room doc does not exist yet. Creating default...');
          // Initial default state if room doesn't exist
          const defaultState: RoomPlaybackState = {
            roomId,
            provider: 'public_sync',
            source: 'youtube',
            videoId: 'K4DyBUG242c', // Default premium Bollywood song video (Arijit Singh)
            title: 'Kesariya - Brahmastra',
            artist: 'Arijit Singh',
            artworkUrl: '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg',
            durationMs: 268000,
            isPlaying: false,
            positionMs: 0,
            updatedAt: serverTimestamp(),
            controllerUid: auth.currentUser?.uid || 'guest',
          };

          setDoc(roomRef, defaultState).catch((err) => {
            handleFirestoreError(err, OperationType.CREATE, path);
          });
          return;
        }

        const data = snapshot.data() as RoomPlaybackState;
        setRoomPlaybackState(data);
        console.log('[PUBLIC_SYNC_PROVIDER] Received remote Firestore update:', data);

        // Sync receiver local player to the remote Firestore state
        const isCurrentlyController = data.controllerUid === (auth.currentUser?.uid || 'guest');
        if (!isCurrentlyController && localPlayerRef.current) {
          const player = localPlayerRef.current;
          
          // 1. Sync Track/VideoId
          if (typeof player.loadVideoById === 'function') {
            const currentVideoUrl = player.getVideoUrl ? player.getVideoUrl() : '';
            const match = currentVideoUrl.match(/[?&]v=([^&#]+)/) || currentVideoUrl.match(/embed\/([^&#?]+)/);
            const currentVideoId = match ? match[1] : '';

            if (currentVideoId !== data.videoId) {
              console.log('[PUBLIC_SYNC_PROVIDER] Loading new videoId:', data.videoId);
              player.loadVideoById({
                videoId: data.videoId,
                startSeconds: data.positionMs / 1000,
              });
              if (!data.isPlaying) {
                setTimeout(() => player.pauseVideo(), 500);
              }
              return;
            }
          }

          // 2. Sync Playback State (Play/Pause)
          const playerState = typeof player.getPlayerState === 'function' ? player.getPlayerState() : -1;
          if (data.isPlaying && playerState !== 1 && typeof player.playVideo === 'function') {
            console.log('[PUBLIC_SYNC_PROVIDER] Playing local video to match room');
            player.playVideo();
          } else if (!data.isPlaying && playerState === 1 && typeof player.pauseVideo === 'function') {
            console.log('[PUBLIC_SYNC_PROVIDER] Pausing local video to match room');
            player.pauseVideo();
          }

          // 3. Sync Position (Drift Compensation)
          if (typeof player.getCurrentTime === 'function' && typeof player.seekTo === 'function') {
            const localTimeMs = player.getCurrentTime() * 1000;
            // Calculate actual expected time considering network latency / time passed since updatedAt
            let expectedTimeMs = data.positionMs;
            if (data.isPlaying && data.updatedAt) {
              const updatedTime = data.updatedAt.toDate ? data.updatedAt.toDate().getTime() : new Date(data.updatedAt).getTime();
              const elapsedMs = Date.now() - updatedTime;
              expectedTimeMs += elapsedMs;
            }

            const driftMs = Math.abs(localTimeMs - expectedTimeMs);
            if (driftMs > 3000) {
              console.log(`[PUBLIC_SYNC_PROVIDER] Correcting drift (${driftMs}ms). Seeking to: ${expectedTimeMs / 1000}s`);
              player.seekTo(expectedTimeMs / 1000, true);
            }
          }
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }, [leavePublicSyncRoom]);

  // Clean up snapshot on unmount
  useEffect(() => {
    return () => {
      if (unsubSnapshotRef.current) {
        unsubSnapshotRef.current();
      }
    };
  }, []);

  // HOST CONTROL: Set active song
  const setRoomTrack = useCallback(async (track: Track) => {
    if (!activeRoomId || !isPublicSyncActive) return;
    const path = `public_sync_rooms/${activeRoomId}`;
    const roomRef = doc(db, 'public_sync_rooms', activeRoomId);

    // Get 11-character video ID
    const rawId = track.youtubeVideoId || (track.id.startsWith('yt-') ? track.id.replace('yt-', '') : track.id);
    const videoId = (rawId && rawId.length === 11) ? rawId : (rawId && rawId.length > 11 ? rawId.slice(-11) : rawId);

    if (!videoId || videoId.length !== 11) {
      console.error('[PUBLIC_SYNC_PROVIDER] Invalid videoId for Room Sync:', videoId);
      return;
    }

    try {
      isUpdatingRef.current = true;
      const updateData: Partial<RoomPlaybackState> = {
        videoId,
        title: track.title,
        artist: track.artist || 'YouTube Artist',
        artworkUrl: track.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg',
        durationMs: (track.duration || 240) * 1000,
        isPlaying: true,
        positionMs: 0,
        updatedAt: serverTimestamp(),
        controllerUid: auth.currentUser?.uid || 'guest',
      };

      await updateDoc(roomRef, updateData);
      console.log('[PUBLIC_SYNC_PROVIDER] Host changed track:', updateData);

      // Instantly load track on host's player
      if (localPlayerRef.current && typeof localPlayerRef.current.loadVideoById === 'function') {
        localPlayerRef.current.loadVideoById({
          videoId,
          startSeconds: 0,
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [activeRoomId, isPublicSyncActive]);

  // HOST CONTROL: Toggle Play/Pause
  const toggleRoomPlay = useCallback(async () => {
    if (!activeRoomId || !isPublicSyncActive || !roomPlaybackState) return;
    const path = `public_sync_rooms/${activeRoomId}`;
    const roomRef = doc(db, 'public_sync_rooms', activeRoomId);

    const isPlayingNew = !roomPlaybackState.isPlaying;
    const positionMs = localPlayerRef.current && typeof localPlayerRef.current.getCurrentTime === 'function'
      ? Math.round(localPlayerRef.current.getCurrentTime() * 1000)
      : roomPlaybackState.positionMs;

    try {
      isUpdatingRef.current = true;
      await updateDoc(roomRef, {
        isPlaying: isPlayingNew,
        positionMs,
        updatedAt: serverTimestamp(),
        controllerUid: auth.currentUser?.uid || 'guest',
      });

      // Update host's local player directly
      if (localPlayerRef.current) {
        if (isPlayingNew && typeof localPlayerRef.current.playVideo === 'function') {
          localPlayerRef.current.playVideo();
        } else if (!isPlayingNew && typeof localPlayerRef.current.pauseVideo === 'function') {
          localPlayerRef.current.pauseVideo();
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [activeRoomId, isPublicSyncActive, roomPlaybackState]);

  // HOST CONTROL: Seek Room
  const seekRoom = useCallback(async (positionMs: number) => {
    if (!activeRoomId || !isPublicSyncActive || !roomPlaybackState) return;
    const path = `public_sync_rooms/${activeRoomId}`;
    const roomRef = doc(db, 'public_sync_rooms', activeRoomId);

    try {
      isUpdatingRef.current = true;
      await updateDoc(roomRef, {
        positionMs,
        updatedAt: serverTimestamp(),
        controllerUid: auth.currentUser?.uid || 'guest',
      });

      // Seek host's local player directly
      if (localPlayerRef.current && typeof localPlayerRef.current.seekTo === 'function') {
        localPlayerRef.current.seekTo(positionMs / 1000, true);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [activeRoomId, isPublicSyncActive, roomPlaybackState]);

  // CLAIM CONTROL: Become the host/controller
  const claimControl = useCallback(async () => {
    if (!activeRoomId || !isPublicSyncActive || !roomPlaybackState) return;
    const path = `public_sync_rooms/${activeRoomId}`;
    const roomRef = doc(db, 'public_sync_rooms', activeRoomId);

    try {
      isUpdatingRef.current = true;
      await updateDoc(roomRef, {
        controllerUid: auth.currentUser?.uid || 'guest',
        updatedAt: serverTimestamp(),
      });
      console.log('[PUBLIC_SYNC_PROVIDER] Control claimed by:', auth.currentUser?.uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [activeRoomId, isPublicSyncActive, roomPlaybackState]);

  return (
    <PublicSyncContext.Provider
      value={{
        isPublicSyncActive,
        roomPlaybackState,
        isController,
        activeRoomId,
        joinPublicSyncRoom,
        leavePublicSyncRoom,
        setRoomTrack,
        toggleRoomPlay,
        seekRoom,
        claimControl,
        localPlayerRef,
        registerLocalPlayer,
        syncLocalToRemote,
      }}
    >
      {children}
    </PublicSyncContext.Provider>
  );
};

export const usePublicSync = () => {
  const context = useContext(PublicSyncContext);
  if (!context) throw new Error('usePublicSync must be used within a PublicSyncProvider');
  return context;
};

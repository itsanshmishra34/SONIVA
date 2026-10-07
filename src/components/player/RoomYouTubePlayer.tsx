import React, { useEffect, useRef, useState } from 'react';
import { usePublicSync } from '../../context/PublicSyncProvider';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { Play, Pause, Radio, RefreshCw, Volume2, VolumeX, Shield, Users, Maximize2 } from 'lucide-react';

interface RoomYouTubePlayerProps {
  roomId: string;
}

export const RoomYouTubePlayer: React.FC<RoomYouTubePlayerProps> = ({ roomId }) => {
  const {
    isPublicSyncActive,
    roomPlaybackState,
    isController,
    claimControl,
    registerLocalPlayer,
    toggleRoomPlay,
    seekRoom,
    syncLocalToRemote,
  } = usePublicSync();

  const { user } = useAuth();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [playerState, setPlayerState] = useState<number>(-1); // -1: unstarted, 1: playing, 2: paused, etc.

  // Use unique DOM container ID per room to avoid collision
  const containerId = `room-yt-player-${roomId}`;

  useEffect(() => {
    if (!isPublicSyncActive || !roomPlaybackState?.videoId || !playerContainerRef.current) return;

    let iframeApiLoaded = false;
    let checkInterval: any = null;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      clearInterval(checkInterval);

      // Clean up any existing content in the container to ensure fresh mounting
      if (playerContainerRef.current) {
        playerContainerRef.current.innerHTML = `<div id="${containerId}-inner" style="width: 100%; height: 100%;"></div>`;
      }

      const player = new window.YT.Player(`${containerId}-inner`, {
        width: '100%',
        height: '100%',
        videoId: roomPlaybackState.videoId,
        playerVars: {
          autoplay: roomPlaybackState.isPlaying ? 1 : 0,
          controls: 0, // Custom controls
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            console.log('[RoomYouTubePlayer] YT.Player ready');
            const p = event.target;
            p.setVolume(volume);
            if (isMuted) p.mute();
            setYtPlayer(p);
            registerLocalPlayer(p);

            // Sync initial state
            setDurationSec(p.getDuration() || 180);
            
            // If the room was already playing, start play and adjust drift
            if (roomPlaybackState.isPlaying) {
              p.playVideo();
              const expectedSec = roomPlaybackState.positionMs / 1000;
              p.seekTo(expectedSec, true);
            }
          },
          onStateChange: (event: any) => {
            setPlayerState(event.data);
            
            // Update duration if not set
            if (event.target.getDuration()) {
              setDurationSec(event.target.getDuration());
            }

            // Only controller broadcasts manual state transitions
            if (isController) {
              if (event.data === 1) { // PLAYING
                toggleRoomPlay(); // Ensure room state matches playing
              } else if (event.data === 2) { // PAUSED
                toggleRoomPlay(); // Ensure room state matches paused
              }
            }
          },
          onError: (event: any) => {
            console.error('[RoomYouTubePlayer] Error playing video:', event.data);
          }
        }
      });
    };

    // Load IFrame API if not already present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Poll for YT object readiness
    checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        initPlayer();
      }
    }, 200);

    return () => {
      clearInterval(checkInterval);
      if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        try {
          ytPlayer.destroy();
        } catch (e) {}
      }
      setYtPlayer(null);
    };
  }, [isPublicSyncActive, roomPlaybackState?.videoId]);

  // Periodic time tracker for custom seekbar
  useEffect(() => {
    if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;

    const interval = setInterval(() => {
      try {
        const t = ytPlayer.getCurrentTime();
        setCurrentTimeSec(t);
      } catch (e) {}
    }, 500);

    return () => clearInterval(interval);
  }, [ytPlayer]);

  if (!isPublicSyncActive || !roomPlaybackState || !roomPlaybackState.videoId) return null;

  // Render Volume Toggle
  const handleToggleMute = () => {
    if (!ytPlayer) return;
    if (isMuted) {
      ytPlayer.unMute();
      setIsMuted(false);
    } else {
      ytPlayer.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (ytPlayer) {
      ytPlayer.setVolume(val);
      if (val > 0 && isMuted) {
        ytPlayer.unMute();
        setIsMuted(false);
      }
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isController) return; // Only controller can seek room
    const seconds = parseFloat(e.target.value);
    seekRoom(seconds * 1000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl backdrop-blur-2xl animate-in slide-in-from-top duration-300">
      {/* Video frame and header row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Aspect Video frame */}
        <div className="relative aspect-video w-full md:w-56 shrink-0 bg-black rounded-xl overflow-hidden border border-white/10 shadow-inner flex items-center justify-center">
          <div ref={playerContainerRef} className="absolute inset-0 w-full h-full" />
          {/* Subtle blocking overlay so user can't accidentally click YouTube internals */}
          <div className="absolute inset-0 z-10 bg-transparent cursor-pointer" />
        </div>

        {/* Info, Controller identity & play stats */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 text-left">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold text-[9px] tracking-wider uppercase flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
                <span>Public Sync Mode</span>
              </span>

              {isController ? (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold text-[9px] tracking-wider uppercase flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-cyan-400" />
                  <span>Room Controller</span>
                </span>
              ) : (
                <button
                  onClick={claimControl}
                  className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-200 font-bold text-[9px] tracking-wider uppercase flex items-center gap-1 transition-all cursor-pointer"
                  title="Become the room controller to skip, play, or pause for everyone."
                >
                  <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                  <span>Claim Control</span>
                </button>
              )}
            </div>

            <h4 className="text-sm font-bold text-white truncate">{roomPlaybackState.title}</h4>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {roomPlaybackState.artist || 'YouTube Studio'}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 border-t border-white/5 pt-2">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan-400" />
              <span>Synced Listeners</span>
            </span>
            <span className="font-mono text-cyan-300">Active Room Playback</span>
          </div>
        </div>
      </div>

      {/* Control row (Seek bar and buttons) */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        {/* Custom seekbar */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono text-slate-400 shrink-0 w-8 text-right">
            {formatTime(currentTimeSec)}
          </span>
          <input
            type="range"
            min={0}
            max={durationSec || 100}
            step={1}
            value={currentTimeSec}
            onChange={handleSeekChange}
            disabled={!isController}
            className={`flex-1 h-1 rounded-lg appearance-none bg-white/10 focus:outline-none cursor-pointer ${
              isController ? 'accent-cyan-400 hover:bg-white/20' : 'accent-slate-500 opacity-50 cursor-not-allowed'
            }`}
          />
          <span className="text-[10px] font-mono text-slate-400 shrink-0 w-8 text-left">
            {formatTime(durationSec)}
          </span>
        </div>

        {/* Buttons and volume row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {isController ? (
              <LiquidGlassButton
                size="sm"
                variant="primary"
                glow={true}
                onClick={toggleRoomPlay}
                className="p-2 w-9 h-9 flex items-center justify-center rounded-xl"
              >
                {roomPlaybackState.isPlaying ? (
                  <Pause className="w-4 h-4 fill-white text-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                )}
              </LiquidGlassButton>
            ) : (
              <div className="text-[11px] text-slate-400 font-medium px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Syncing from Host</span>
              </div>
            )}
          </div>

          {/* Volume controls (strictly client-side local volume) */}
          <div className="flex items-center gap-2 w-32 md:w-36">
            <button
              onClick={handleToggleMute}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-white/10 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

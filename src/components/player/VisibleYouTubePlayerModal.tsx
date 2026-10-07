import React, { useEffect, useRef, useState } from 'react';
import { Track } from '../../types';
import { useMusic } from '../../context/MusicContext';
import { youtubePlayerManager } from '../../services/youtubePlayerManager';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { X, ExternalLink, Play, Pause, AlertCircle, Sparkles } from 'lucide-react';

interface VisibleYouTubePlayerModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onSendInChat?: (track: Track) => void;
}

export const VisibleYouTubePlayerModal: React.FC<VisibleYouTubePlayerModalProps> = ({
  track,
  isOpen,
  onClose,
  onSendInChat
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const [playerState, setPlayerState] = useState<number | null>(null); // -1, 0, 1, 2, 3, 5
  const [playerStatusText, setPlayerStatusText] = useState<string>('LOADING PLAYER');
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Extract / verify 11-char videoId
  const rawId = track?.youtubeVideoId || (track?.id?.startsWith('yt-') ? track.id.replace('yt-', '') : track?.id);
  const videoId = (rawId && rawId.length === 11) ? rawId : (rawId && rawId.length > 11 ? rawId.slice(-11) : rawId);

  // Log [YOUTUBE_RESULT_SELECTED] when track/videoId changes and modal is open
  useEffect(() => {
    if (isOpen && track) {
      console.log('[YOUTUBE_RESULT_SELECTED]', {
        provider: 'youtube',
        id: track.id,
        videoId,
        title: track.title,
        providerUrl: track.providerUrl || `https://www.youtube.com/watch?v=${videoId}`
      });
    }
  }, [isOpen, track, videoId]);

  // Initialize player via YouTubePlayerManager when modal opens and videoId is present
  useEffect(() => {
    if (!isOpen || !videoId || !playerContainerRef.current) return;

    if (!videoId || videoId.length !== 11) {
      setEmbedError('Unable to load this YouTube video (Invalid video ID).');
      setPlayerStatusText('VIDEO UNAVAILABLE');
      return;
    }

    setEmbedError(null);
    setPlayerStatusText('LOADING PLAYER');
    setIsPlayerReady(false);

    const unsubReady = youtubePlayerManager.subscribe('ready', () => {
      setIsPlayerReady(true);
      setPlayerStatusText('PLAYER READY');
    });

    const unsubState = youtubePlayerManager.subscribe('stateChange', (state: number) => {
      setPlayerState(state);
      switch (state) {
        case -1:
          setPlayerStatusText('UNSTARTED');
          break;
        case 0:
          setPlayerStatusText('ENDED');
          break;
        case 1:
          setPlayerStatusText('PLAYING');
          break;
        case 2:
          setPlayerStatusText('PAUSED');
          break;
        case 3:
          setPlayerStatusText('BUFFERING');
          break;
        case 5:
          setPlayerStatusText('CUED');
          break;
        default:
          setPlayerStatusText('READY');
      }
    });

    const unsubError = youtubePlayerManager.subscribe('error', (errCode: number) => {
      let msg = 'Playback is unavailable inside SONIVA for this video.';
      if (errCode === 2 || errCode === 100) {
        msg = 'Video unavailable, removed, or private.';
        setPlayerStatusText('VIDEO UNAVAILABLE');
      } else if (errCode === 101 || errCode === 150) {
        msg = 'This video cannot be played inside SONIVA (embedding disabled by owner).';
        setPlayerStatusText('EMBEDDING DISABLED');
      } else if (errCode === 153) {
        msg = 'Your browser/embed context does not provide the required playback identity.';
        setPlayerStatusText('PLAYBACK BLOCKED');
      }
      setEmbedError(msg);
    });

    youtubePlayerManager.loadAndPlay(videoId).catch((err) => {
      console.error('[YOUTUBE_MANAGER_INIT_ERROR]', err);
      setEmbedError('Failed to initialize YouTube IFrame API.');
      setPlayerStatusText('VIDEO UNAVAILABLE');
    });

    return () => {
      unsubReady();
      unsubState();
      unsubError();
    };
  }, [isOpen, videoId]);

  const handlePlayRequest = () => {
    console.log('[YOUTUBE_PLAYER_PLAY_REQUEST]');
    if (videoId) {
      youtubePlayerManager.playVideo(videoId);
    } else {
      youtubePlayerManager.playVideo();
    }
  };

  const handlePauseRequest = () => {
    console.log('[YOUTUBE_PLAYER_PAUSE_REQUEST]');
    youtubePlayerManager.pauseVideo();
  };

  if (!isOpen || !track) return null;

  const youtubeWatchUrl = track.providerUrl || `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-3xl flex flex-col p-6 overflow-hidden shadow-2xl border-white/20">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full bg-rose-600/30 border border-rose-500/40 text-rose-300 font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              ▶ YouTube Player ({playerStatusText})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={youtubeWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open on YouTube"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
            >
              <span>OPEN ON YOUTUBE</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              onClick={() => {
                youtubePlayerManager.destroyPlayer();
                onClose();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visible Embedded YouTube Video Frame (Minimum 200x200 viewport, 16:9 aspect ratio) */}
        <div className="relative w-full aspect-video min-h-[220px] rounded-2xl overflow-hidden bg-black/90 border border-white/15 my-4 shadow-2xl flex items-center justify-center">
          <div ref={playerContainerRef} className="w-full h-full" />

          {/* Embed Restriction or Error Overlay */}
          {embedError && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
              <AlertCircle className="w-10 h-10 text-rose-400 animate-bounce" />
              <div className="space-y-1 max-w-md">
                <h4 className="text-sm font-bold text-white">YouTube Playback Notice</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{embedError}</p>
              </div>
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>OPEN ON YOUTUBE</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Track Details & Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-sm md:text-base font-bold text-white truncate">{track.title}</h3>
            <p className="text-xs text-cyan-300 truncate mt-0.5">{track.artist}</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {playerState === 1 ? (
              <LiquidGlassButton size="sm" variant="secondary" onClick={handlePauseRequest} className="gap-1.5 text-xs">
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </LiquidGlassButton>
            ) : (
              <LiquidGlassButton
                size="sm"
                variant="primary"
                glow={true}
                onClick={handlePlayRequest}
                disabled={!isPlayerReady}
                className="gap-1.5 text-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isPlayerReady ? 'Play' : 'Loading Player...'}</span>
              </LiquidGlassButton>
            )}

            {onSendInChat && (
              <LiquidGlassButton
                size="sm"
                variant="secondary"
                onClick={() => onSendInChat(track)}
                className="text-xs"
              >
                Share
              </LiquidGlassButton>
            )}
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
};

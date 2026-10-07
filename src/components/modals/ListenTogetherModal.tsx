import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { useTheme } from '../../context/ThemeContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { MusicVisualizerEqualizer } from '../ui/MusicVisualizerEqualizer';
import { Radio, Play, Pause, X, Music, Check, Disc3 } from 'lucide-react';

interface ListenTogetherModalProps {
  isOpen: boolean;
  partnerName?: string;
  roomId?: string;
  onClose: () => void;
  onOpenSearch: () => void;
}

export const ListenTogetherModal: React.FC<ListenTogetherModalProps> = ({
  isOpen,
  partnerName,
  roomId,
  onClose,
  onOpenSearch
}) => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    isListenTogetherActive,
    startListenTogether,
    leaveListenTogether
  } = useMusic();
  const { triggerFloatingEmoji } = useTheme();

  if (!isOpen) return null;

  const handleToggleSync = () => {
    if (isListenTogetherActive) {
      leaveListenTogether();
    } else {
      const targetRoom = roomId || `room-${Date.now().toString(36)}`;
      startListenTogether(targetRoom, partnerName || 'Listening Room');
      triggerFloatingEmoji('🎧');
      triggerFloatingEmoji('✨');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xl">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-md p-6 space-y-6 animate-modal-enter">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-base font-bold text-white tracking-tight">LISTEN TOGETHER</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Song in Session */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-4">
          <div className="relative">
            <img
              src={currentTrack?.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
              alt={currentTrack?.title || 'Song'}
              className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-lg"
            />
            {isPlaying && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 border-2 border-slate-950 flex items-center justify-center text-[10px]">
                🎵
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
                {isListenTogetherActive ? 'Live Synchronized' : 'Ready to Sync'}
              </span>
              {isPlaying && (
                <MusicVisualizerEqualizer isPlaying={true} color="cyan" bars={4} />
              )}
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {currentTrack?.title || 'Select a track to begin'}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {currentTrack?.artist || 'Audius stream'}
            </div>
          </div>
        </div>

        {/* Features Info */}
        <div className="space-y-2 text-xs text-slate-300 bg-white/[0.02] p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-cyan-300">
            <Check className="w-4 h-4" />
            <span>Shared playback: play, pause, seek, and skip in real-time</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300">
            <Check className="w-4 h-4" />
            <span>Sub-second drift compensation algorithm</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300">
            <Check className="w-4 h-4" />
            <span>Shared queue where both users can add tracks</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <LiquidGlassButton
            variant={isListenTogetherActive ? 'danger' : 'primary'}
            size="lg"
            glow={!isListenTogetherActive}
            onClick={handleToggleSync}
            className="w-full gap-2"
          >
            <Radio className="w-4 h-4" />
            <span>{isListenTogetherActive ? 'Leave Shared Session' : 'Start Listen Together'}</span>
          </LiquidGlassButton>

          <LiquidGlassButton
            variant="secondary"
            size="md"
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full gap-2"
          >
            <Music className="w-4 h-4" />
            <span>Choose Different Song from Audius</span>
          </LiquidGlassButton>
        </div>
      </LiquidGlassCard>
    </div>
  );
};

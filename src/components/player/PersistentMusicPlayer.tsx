import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { useTheme } from '../../context/ThemeContext';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { MusicVisualizerEqualizer } from '../ui/MusicVisualizerEqualizer';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  ListMusic,
  Radio,
  Share2
} from 'lucide-react';

interface PersistentMusicPlayerProps {
  onOpenSearch: () => void;
  onOpenListenTogether: () => void;
}

export const PersistentMusicPlayer: React.FC<PersistentMusicPlayerProps> = ({
  onOpenSearch,
  onOpenListenTogether
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    isRepeat,
    queue,
    favorites,
    isListenTogetherActive,
    driftMs,
    syncStatus,
    audioError,
    audioErrorDetail,
    isAutoplayBlocked,
    resolveAutoplayBlock,
    retryCurrentTrack,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolumeLevel,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    playTrack
  } = useMusic();

  const { triggerFloatingEmoji } = useTheme();
  const [showQueue, setShowQueue] = useState(false);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isFav = currentTrack ? favorites.some((f) => f.id === currentTrack.id) : false;

  const handleFavoriteClick = () => {
    if (!currentTrack) return;
    toggleFavorite(currentTrack);
    triggerFloatingEmoji('❤️');
  };

  if (!currentTrack) {
    return (
      <div className="w-full px-3 md:px-6 py-2 relative shrink-0">
        <div className="h-16 md:h-18 bg-slate-950/65 backdrop-blur-3xl border border-white/20 rounded-2xl md:rounded-3xl flex items-center justify-between px-4 md:px-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-slate-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs md:text-sm font-semibold text-slate-200">No song playing</div>
              <div className="text-[11px] text-slate-400">Select a vibe to start background music</div>
            </div>
          </div>
          <LiquidGlassButton size="sm" variant="secondary" onClick={onOpenSearch}>
            Explore Music
          </LiquidGlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-6 py-2 relative shrink-0">
      {/* Floating Queue Drawer in Liquid Glass (anchored upward above player) */}
      {showQueue && (
        <div className="absolute bottom-full right-4 md:right-8 mb-2 w-84 max-h-96 bg-slate-950/90 backdrop-blur-3xl border border-white/25 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden flex flex-col liquid-refraction">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Shared Queue ({queue.length})
            </div>
            <button
              onClick={() => setShowQueue(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto mt-2 space-y-1 relative z-10">
            {queue.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                onClick={() => playTrack(track)}
                className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer text-left transition-all ${
                  track.id === currentTrack.id
                    ? 'bg-cyan-500/25 border border-cyan-400/40 shadow-sm'
                    : 'hover:bg-white/[0.08] border border-transparent'
                }`}
              >
                <img
                  src={track.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                  alt={track.title}
                  className="w-10 h-10 rounded-xl object-cover border border-white/15"
                />
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-semibold truncate ${track.id === currentTrack.id ? 'text-cyan-200' : 'text-slate-100'}`}>
                    {track.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{track.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reserved Liquid Glass Bottom Bar Container */}
      <footer className="h-18 md:h-20 w-full relative">
        {audioError && (
          <div className="absolute top-[-42px] left-1/2 transform -translate-x-1/2 px-4 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/40 backdrop-blur-2xl text-rose-200 text-[11px] font-medium tracking-wide flex items-center gap-2.5 shadow-xl shadow-black/60 z-30 animate-in slide-in-from-bottom duration-250">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
            <span className="font-semibold text-rose-100">{audioError}</span>
            {audioErrorDetail && (
              <span className="text-rose-300/80 text-[10px] hidden sm:inline border-l border-rose-500/30 pl-2">
                {audioErrorDetail}
              </span>
            )}
            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <button
                onClick={retryCurrentTrack}
                className="px-2 py-0.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/40 text-white font-bold text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={nextTrack}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Next Track
              </button>
            </div>
          </div>
        )}

        {isAutoplayBlocked && (
          <div className="absolute top-[-36px] left-1/2 transform -translate-x-1/2 px-4 py-1.5 rounded-full bg-amber-500/25 border border-amber-500/40 backdrop-blur-2xl text-amber-200 text-[10px] font-bold tracking-wide flex items-center gap-2 shadow-lg shadow-black/40 z-30 animate-in slide-in-from-bottom duration-250">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>🎵 Ready to play</span>
            <button
              onClick={resolveAutoplayBlock}
              className="px-2.5 py-0.5 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 border border-amber-400/40 text-white font-extrabold text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              ▶ Start Music
            </button>
          </div>
        )}

        {/* Ambient Artwork Glow Layer expanding behind the player */}
        <div
          className="absolute inset-0 -top-2 rounded-3xl blur-2xl opacity-40 transition-all duration-700 pointer-events-none"
          style={{
            background: isPlaying
              ? 'radial-gradient(ellipse at center, rgba(6,182,212,0.5) 0%, rgba(139,92,246,0.4) 40%, transparent 75%)'
              : 'radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, transparent 70%)'
          }}
        />

        {/* Real Liquid Glass Bar */}
        <div className="relative h-full w-full bg-slate-950/45 backdrop-blur-3xl border border-white/[0.22] rounded-3xl flex items-center justify-between px-4 md:px-8 shadow-[0_16px_40px_rgba(0,0,0,0.65)] liquid-refraction overflow-hidden">
          {/* Top specular edge reflection */}
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-10" />

          {/* Track Info */}
          <div className="flex items-center gap-2.5 flex-1 md:flex-initial md:w-1/4 md:min-w-[200px] min-w-0 relative z-10">
            <div className="relative group cursor-pointer shrink-0" onClick={onOpenSearch}>
              <img
                src={currentTrack.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                alt={currentTrack.title}
                className={`w-10 h-10 md:w-13 md:h-13 rounded-xl md:rounded-2xl object-cover border border-white/20 shadow-xl shadow-black/50 transition-all ${
                  isPlaying ? 'scale-100 ring-2 ring-cyan-400/50' : 'scale-95 opacity-85'
                }`}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 rounded-xl md:rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white">🎵</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  onClick={onOpenSearch}
                  className="text-xs md:text-sm font-bold text-white truncate block hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {currentTrack.title}
                </span>
                {isPlaying && (
                  <MusicVisualizerEqualizer isPlaying={true} color="cyan" bars={4} className="shrink-0" />
                )}
                {isListenTogetherActive && (
                  <span className="text-[8px] md:text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 shrink-0 flex items-center gap-1 shadow-md shadow-cyan-950/50 truncate max-w-[80px] md:max-w-none">
                    <span className="w-1 h-1 rounded-full bg-cyan-300 animate-pulse" />
                    <span>🎧 SYNC</span>
                  </span>
                )}
              </div>
              <div className="text-[10px] md:text-xs text-slate-300 truncate mt-0.5 flex items-center gap-1 flex-wrap">
                <span className="truncate">{currentTrack.artist}</span>
              </div>
            </div>

            <button
              onClick={handleFavoriteClick}
              className={`p-2 rounded-xl transition-colors cursor-pointer hidden sm:block ${
                isFav ? 'text-rose-400 hover:text-rose-300' : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Favorite"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Central Controls & Seek Slider - Hidden on Mobile */}
          <div className="hidden md:flex flex-col items-center gap-1.5 w-2/4 max-w-xl px-4 relative z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isShuffle ? 'text-cyan-300' : 'text-slate-400 hover:text-white'}`}
                title="Shuffle"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={previousTrack}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className={`w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 via-violet-500 to-fuchsia-500 text-slate-950 flex items-center justify-center border-2 border-white/45 backdrop-blur-xl soniva-play-btn cursor-pointer transition-all duration-300 transform active:scale-95 ${
                  isPlaying 
                    ? 'shadow-[0_0_25px_rgba(6,182,212,0.85)] hover:shadow-[0_0_35px_rgba(236,72,153,0.95)] scale-105' 
                    : 'shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.7)]'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950 text-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 text-slate-950 ml-0.5" />}
              </button>

              <button
                onClick={nextTrack}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Next Track (N)"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isRepeat ? 'text-cyan-300' : 'text-slate-400 hover:text-white'}`}
                title="Repeat Track"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Time & Scrubber */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-[11px] text-slate-300 font-mono tabular-nums w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 180}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="flex-1 h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              />
              <span className="text-[11px] text-slate-300 font-mono tabular-nums w-8">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right Actions: Listen Together, Queue, Volume */}
          <div className="flex items-center justify-end gap-2 md:gap-3 md:w-1/4 relative z-10 shrink-0">
            {/* Mobile-Only Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="md:hidden w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-600 text-white flex items-center justify-center shadow-md border border-white/20 active:scale-95 cursor-pointer shrink-0 soniva-play-btn"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>

            <LiquidGlassButton
              size="sm"
              variant={isListenTogetherActive ? 'primary' : 'secondary'}
              onClick={onOpenListenTogether}
              className="hidden sm:inline-flex text-xs shrink-0"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Listen Together</span>
            </LiquidGlassButton>

            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`p-2 md:p-2.5 rounded-xl md:rounded-2xl border transition-all cursor-pointer backdrop-blur-xl shrink-0 ${
                showQueue ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50 shadow-md' : 'bg-white/[0.08] text-slate-300 hover:text-white border-white/15 hover:bg-white/[0.14]'
              }`}
              title="Queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <button
                onClick={toggleMute}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolumeLevel(Number(e.target.value))}
                className="w-20 h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Slim Mini-Scrubber line for mobile viewports */}
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/5 overflow-hidden md:hidden">
            <div 
              className="bg-cyan-400 h-full transition-all duration-300 shadow-[0_0_4px_rgba(6,182,212,0.8)]" 
              style={{ width: `${(currentTime / (duration || 180)) * 100}%` }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

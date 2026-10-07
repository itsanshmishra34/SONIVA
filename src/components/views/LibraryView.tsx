import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { useTheme } from '../../context/ThemeContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import {
  Bookmark,
  Heart,
  Play,
  Radio,
  Plus,
  Music2,
  History,
  Trash2,
  Users,
  Check,
  Disc3
} from 'lucide-react';
import { Track } from '../../types';

interface LibraryViewProps {
  onOpenSearch: () => void;
  onOpenListenTogether: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onOpenSearch,
  onOpenListenTogether
}) => {
  const {
    favorites,
    playTrack,
    queue,
    addToQueue,
    toggleFavorite,
    listenTogetherHistory,
    clearListenTogetherHistory,
    startListenTogether
  } = useMusic();

  const { triggerFloatingEmoji } = useTheme();
  const [clearedNotice, setClearedNotice] = useState(false);

  const formatPlayedAt = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleClearHistory = () => {
    clearListenTogetherHistory();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2200);
  };

  const handleReplayInSync = (track: Track, partnerName?: string) => {
    playTrack(track);
    startListenTogether(`replay-${Date.now().toString(36)}`, partnerName);
    triggerFloatingEmoji('🎧');
    triggerFloatingEmoji('✨');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 md:pb-32 space-y-10 max-w-5xl mx-auto w-full animate-page-enter">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-cyan-400" />
            <span>Music Library</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Your liked tracks, synchronized sessions, and listening history
          </p>
        </div>

        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Music</span>
        </button>
      </div>

      {/* --- NEW SECTION: LISTENING HISTORY (LISTEN TOGETHER SESSIONS) --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Listening History</span>
                <span className="text-xs font-normal text-slate-400">
                  · Listen Together Sessions ({listenTogetherHistory.length})
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Tracks experienced together in synchronized sessions with live drift-locking
              </p>
            </div>
          </div>

          {listenTogetherHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs transition-colors cursor-pointer"
              title="Clear Session History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {clearedNotice && (
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Listening history cleared.</span>
          </div>
        )}

        {listenTogetherHistory.length === 0 ? (
          <LiquidGlassCard depth={2} className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
              <Radio className="w-6 h-6 animate-pulse text-cyan-500/60" />
            </div>
            <div className="text-sm font-semibold text-white">No Listen Together sessions recorded yet</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Start a synchronized session from any chat or invite a partner to <span className="text-cyan-300">Listen Together</span>. Songs played while in sync will be saved right here.
            </p>
            <div className="pt-2">
              <LiquidGlassButton size="sm" variant="secondary" onClick={onOpenListenTogether}>
                Launch Listen Together
              </LiquidGlassButton>
            </div>
          </LiquidGlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {listenTogetherHistory.map((item) => {
              const isFav = favorites.some((f) => f.id === item.track.id);

              return (
                <LiquidGlassCard
                  key={item.id}
                  depth={2}
                  className="p-3.5 flex items-center justify-between gap-4 hover:border-cyan-500/30 transition-all group"
                >
                  {/* Track Artwork & Metadata */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className="relative shrink-0 cursor-pointer group/art"
                      onClick={() => playTrack(item.track)}
                    >
                      <img
                        src={item.track.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                        alt={item.track.title}
                        className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-md group-hover/art:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover/art:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 fill-white text-white" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {item.track.title}
                        </span>
                        <span className="text-[10px] text-cyan-400/90 font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 shrink-0 flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 text-cyan-400" />
                          Synced Session
                        </span>
                      </div>

                      {/* Clean Unboxed Metadata with Typographic Separator */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="truncate">{item.track.artist}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="truncate">{item.track.genre}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Users className="w-3 h-3 text-cyan-400" />
                          <span>{item.partnerName || 'Room Listener'}</span>
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {formatPlayedAt(item.playedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        toggleFavorite(item.track);
                        triggerFloatingEmoji('❤️');
                      }}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isFav
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
                      }`}
                      title={isFav ? 'Favorited' : 'Add to Favorites'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400' : ''}`} />
                    </button>

                    <button
                      onClick={() => {
                        addToQueue(item.track);
                        triggerFloatingEmoji('🎵');
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                      title="Add to queue"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleReplayInSync(item.track, item.partnerName)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors cursor-pointer"
                      title="Replay in Listen Together mode"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sync Again</span>
                    </button>
                  </div>
                </LiquidGlassCard>
              );
            })}
          </div>
        )}
      </section>

      {/* Liked Songs */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          <span>Liked Songs ({favorites.length})</span>
        </h2>

        {favorites.length === 0 ? (
          <LiquidGlassCard depth={2} className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
              <Heart className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium text-white">No favorite songs yet</div>
            <div className="text-xs text-slate-400 max-w-sm mx-auto">
              Click the heart icon on any song card or in the player bar to save it to your private library.
            </div>
          </LiquidGlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favorites.map((track) => (
              <LiquidGlassCard
                key={track.id}
                depth={2}
                onClick={() => playTrack(track)}
                className="p-3 flex items-center justify-between cursor-pointer hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={track.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                    alt={track.title}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{track.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{track.artist} · {track.genre}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                    <Play className="w-3.5 h-3.5 fill-cyan-300" />
                  </span>
                </div>
              </LiquidGlassCard>
            ))}
          </div>
        )}
      </section>

      {/* Recently Streamed Queue */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Music2 className="w-4 h-4 text-violet-400" />
          <span>Recently Streamed Catalog</span>
        </h2>

        <div className="space-y-2">
          {queue.slice(0, 5).map((track) => (
            <div
              key={track.id}
              onClick={() => playTrack(track)}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={track.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                  alt={track.title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <div className="text-xs font-semibold text-white">{track.title}</div>
                  <div className="text-[11px] text-slate-400">{track.artist} · {track.genre}</div>
                </div>
              </div>
              <Play className="w-4 h-4 text-slate-500 hover:text-white" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

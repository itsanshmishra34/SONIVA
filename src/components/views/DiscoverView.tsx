import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { useTheme } from '../../context/ThemeContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { Radio, Play, Sparkles, Compass, Disc3, Flame, Clock } from 'lucide-react';

interface DiscoverViewProps {
  onOpenFindSomeone: () => void;
  onOpenCreatePrivate: () => void;
  onOpenSearch: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onOpenFindSomeone,
  onOpenCreatePrivate,
  onOpenSearch
}) => {
  const { queue, playTrack } = useMusic();
  const { triggerFloatingEmoji } = useTheme();

  const curatedVibes = [
    { title: 'Late Night Chillout', genre: 'Lo-Fi', desc: 'Mellow beats and quiet company', count: '142 listeners' },
    { title: 'Synthwave Highway', genre: 'Synthwave', desc: '80s retro-futuristic cruise', count: '89 listeners' },
    { title: 'Deep Ambient Lounge', genre: 'Ambient', desc: 'Spacious soundscapes for focused minds', count: '64 listeners' },
    { title: 'Indie Twilight', genre: 'Indie', desc: 'Acoustic warmth and raw melodies', count: '118 listeners' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 md:pb-32 space-y-8 max-w-6xl mx-auto w-full">
      {/* Hero Atmosphere Banner */}
      <LiquidGlassCard depth={3} glow={true} className="p-8 md:p-10 relative overflow-hidden">
        <div className="max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>MUSIC-FIRST SOCIAL ROOMS</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            Connect through song before saying a word.
          </h1>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            People are here. Music is playing. Jump into a synchronized stream, chat with end-to-end encryption, or sing harmonies together.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <LiquidGlassButton
              variant="primary"
              size="lg"
              glow={true}
              onClick={() => {
                triggerFloatingEmoji('🎧');
                onOpenFindSomeone();
              }}
              className="gap-2 text-xs font-bold"
            >
              <Radio className="w-4 h-4" />
              <span>FIND SOMEONE (RANDOM CONNECT)</span>
            </LiquidGlassButton>

            <LiquidGlassButton
              variant="secondary"
              size="lg"
              onClick={onOpenCreatePrivate}
              className="gap-2 text-xs"
            >
              <span>Create 6-Digit Private Room</span>
            </LiquidGlassButton>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Vibe Channels */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Flame className="w-4 h-4 text-cyan-400" />
            <span>Popular Vibe Lounges</span>
          </h2>
          <button onClick={onOpenSearch} className="text-xs text-cyan-400 hover:text-cyan-300">
            View Audius Catalog
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {curatedVibes.map((vibe, index) => (
            <div key={vibe.title} style={{ animationDelay: `${Math.min(index * 40, 250)}ms` }} className="animate-subtle-fade-up flex flex-col">
              <LiquidGlassCard
                depth={2}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 cursor-pointer group h-full"
                onClick={onOpenFindSomeone}
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    {vibe.genre}
                  </span>
                  <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {vibe.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{vibe.desc}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5">
                  <span>{vibe.count}</span>
                  <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">
                    Enter Vibe →
                  </span>
                </div>
              </LiquidGlassCard>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Tracks Stream */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-violet-400" />
          <span>Curated Audius Waveform</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {queue.slice(0, 6).map((track, index) => (
            <div
              key={track.id}
              onClick={() => playTrack(track)}
              style={{ animationDelay: `${Math.min(index * 30, 250)}ms` }}
              className="animate-subtle-fade-up flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={track.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                    alt={track.title}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 fill-white text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{track.title}</div>
                  <div className="text-[11px] text-slate-400 truncate">{track.artist}</div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-500">{Math.floor(track.duration / 60)}:00</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

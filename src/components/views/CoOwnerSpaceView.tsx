import React from 'react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { Sparkles, Heart, Music2, MessageSquare, Star, Zap } from 'lucide-react';

export const CoOwnerSpaceView: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-28 md:pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-5xl mx-auto">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold tracking-widest uppercase">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>Verified Co-Owner Lounge</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Your SONIVA Space
        </h1>
        <p className="text-slate-400 text-sm max-w-xl">
          Welcome back, Sunaina. This is your private dashboard for special vibes and shared memories within the SONIVA ecosystem.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Shared Vibes */}
        <LiquidGlassCard depth={2} glow={true} className="p-6 space-y-4 hover:border-cyan-400/40 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Shared Vibes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curated tracks and special audio moments hand-picked for the co-owner experience.
            </p>
          </div>
          <button className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-white transition-all">
            Explore Memories
          </button>
        </LiquidGlassCard>

        {/* Private Notes */}
        <LiquidGlassCard depth={2} glow={true} className="p-6 space-y-4 hover:border-violet-400/40 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Private Notes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Securely encrypted thoughts and design inspirations for the future of SONIVA.
            </p>
          </div>
          <button className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-white transition-all">
            View Notes
          </button>
        </LiquidGlassCard>

        {/* Infrastructure & Controls */}
        <LiquidGlassCard depth={2} glow={true} className="p-6 space-y-4 hover:border-pink-400/40 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Lounge Control</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Special ambient lighting presets and experimental features currently in staging.
            </p>
          </div>
          <button className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-white transition-all">
            Open Controls
          </button>
        </LiquidGlassCard>
      </div>

      {/* Shared Playlist Section */}
      <LiquidGlassCard depth={3} className="p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <Music2 className="w-24 h-24 text-cyan-400/5 rotate-12" />
        </div>
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30">
              <Star className="w-5 h-5 text-cyan-300 fill-current" />
            </div>
            <h2 className="text-xl font-bold text-white">Our Shared Rhythm</h2>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                    <Music2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">Special Memory Track #{i}</div>
                    <div className="text-[10px] text-slate-500">Added to Co-Owner Lounge</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-600">3:4{i}</div>
              </div>
            ))}
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
};

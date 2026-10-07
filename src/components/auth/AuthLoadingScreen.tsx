import React from 'react';
import { MusicReactiveAurora } from '../ui/MusicReactiveAurora';

export const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950 text-white select-none">
      <MusicReactiveAurora />

      {/* Floating music note accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-1/4 left-1/4 text-2xl text-cyan-400/40 animate-pulse">♪</span>
        <span className="absolute top-1/3 right-1/4 text-3xl text-violet-400/35 animate-bounce">♫</span>
        <span className="absolute bottom-1/3 left-1/3 text-xl text-pink-400/30 animate-pulse">♬</span>
        <span className="absolute bottom-1/4 right-1/3 text-2xl text-cyan-300/40">✨</span>
      </div>

      {/* Central Liquid Glass Card */}
      <div className="relative z-10 w-full max-w-sm mx-4 p-8 rounded-3xl bg-white/[0.06] border border-white/20 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col items-center text-center space-y-5 overflow-hidden liquid-refraction">
        {/* Top Edge Reflection */}
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

        {/* Glowing Brand Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/40 via-violet-500/40 to-pink-500/40 border border-white/30 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-cyan-950/50 backdrop-blur-xl">
            S
          </div>
          <span className="absolute -bottom-1 -right-1 text-base">🎧</span>
        </div>

        <div className="space-y-1.5">
          <div className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>SONIVA</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <p className="text-xs text-cyan-200/90 font-medium">
            Preparing your space...
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 rounded-full animate-[pulse_1.5s_infinite] w-2/3 mx-auto" />
        </div>

        <div className="text-[11px] text-slate-400 font-mono tracking-wide">
          Connecting encrypted audio lounge
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { Mail, Linkedin, Sparkles, ShieldCheck } from 'lucide-react';

export const OwnerCreditsSection: React.FC = () => {
  return (
    <section className="py-12 px-6 max-w-5xl mx-auto">
      <LiquidGlassCard depth={3} glow={true} className="p-8 md:p-12 relative overflow-hidden text-center space-y-8 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
        {/* Floating background decorative notes */}
        <div className="absolute top-6 left-8 text-3xl text-cyan-400/25 select-none pointer-events-none animate-bounce">
          🎵
        </div>
        <div className="absolute bottom-8 right-10 text-3xl text-violet-400/25 select-none pointer-events-none animate-pulse">
          🎶
        </div>
        <div className="absolute top-1/2 right-8 text-2xl text-pink-400/25 select-none pointer-events-none">
          ✨
        </div>

        {/* Abstract Initial Icon in Liquid Glass */}
        <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-cyan-500/30 via-violet-600/40 to-pink-500/30 border border-white/30 mx-auto flex items-center justify-center text-white font-extrabold text-3xl shadow-[0_8px_30px_rgba(6,182,212,0.30)] backdrop-blur-2xl">
          S
        </div>

        {/* Brand Lockup */}
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2.5 flex-wrap">
            <span>SONIVA</span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/35 backdrop-blur-xl">
              Listen · Chat · Connect · Sing
            </span>
          </h2>
          <p className="text-sm md:text-base text-cyan-300 font-medium">
            Meet through music, not profiles.
          </p>
          <p className="text-xs md:text-sm text-slate-300 max-w-lg mx-auto pt-1 leading-relaxed">
            SONIVA is built with the idea that great conversations can begin with a shared song. A digital room where people hang out and connect through shared rhythm.
          </p>
        </div>

        {/* Ownership Section Header */}
        <div className="pt-2">
          <div className="text-xs uppercase font-bold tracking-widest text-cyan-400/90 mb-6">
            OWNERSHIP & DEVELOPMENT
          </div>

          {/* Two Creator Cards Side-by-Side on Desktop, Stacked on Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            {/* Ayush Mishra Card */}
            <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-lg hover:border-emerald-400/40 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] space-y-4 animate-in fade-in duration-500 relative group">
              <div className="absolute -top-3 left-4 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
                Owned & Developed By
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">Ayush Mishra</h3>
                  <p className="text-xs text-slate-400">Creator</p>
                </div>
                <span className="text-xs text-emerald-300 flex items-center gap-1 font-semibold bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/30 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" /> Creator
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <a
                  href="mailto:itsanshmishra34@gmail.com"
                  aria-label="Email Ayush Mishra"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-slate-200 hover:text-white transition-all group/link"
                >
                  <Mail className="w-4 h-4 text-emerald-400 group-hover/link:scale-110 transition-transform shrink-0" />
                  <span className="truncate">itsanshmishra34@gmail.com</span>
                </a>

                <a
                  href="https://www.linkedin.com/in/ayush-mishra-12b36a37a/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Ayush Mishra LinkedIn profile"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-emerald-300 hover:text-white transition-all group/link"
                >
                  <Linkedin className="w-4 h-4 text-emerald-400 group-hover/link:scale-110 transition-transform shrink-0" />
                  <span>LinkedIn Profile</span>
                </a>
              </div>
            </div>

            {/* Sunaina Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-tr from-cyan-500/[0.07] via-violet-500/[0.07] to-pink-500/[0.07] border border-cyan-400/30 backdrop-blur-xl shadow-lg hover:border-cyan-400/60 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] space-y-4 animate-in fade-in duration-700 delay-100 relative group">
              <div className="absolute -top-3 left-4 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded text-[10px] font-bold text-cyan-400 uppercase tracking-tighter">
                Co-Owner
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">Sunaina</h3>
                  <p className="text-xs text-cyan-200/80">Co-Owner</p>
                </div>
                <span className="text-xs text-cyan-300 flex items-center gap-1 font-semibold bg-cyan-500/20 px-2.5 py-1 rounded-full border border-cyan-400/40 shadow-sm animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" /> Co-Owner
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <a
                  href="mailto:snaina6330@gmail.com"
                  aria-label="Email Sunaina"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-slate-200 hover:text-white transition-all group/link"
                >
                  <Mail className="w-4 h-4 text-cyan-400 group-hover/link:scale-110 transition-transform shrink-0" />
                  <span className="truncate">snaina6330@gmail.com</span>
                </a>

                <a
                  href="https://www.linkedin.com/in/sunaina-bansal-b5107a374/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Sunaina LinkedIn profile"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-cyan-300 hover:text-white transition-all group/link"
                >
                  <Linkedin className="w-4 h-4 text-cyan-400 group-hover/link:scale-110 transition-transform shrink-0" />
                  <span>LinkedIn Profile</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright & Ownership notice */}
        <div className="text-xs text-slate-400 pt-4 border-t border-white/10">
          © 2026 SONIVA. All rights reserved. Owned & Developed by Ayush Mishra. Co-Owned by Sunaina.
        </div>
      </LiquidGlassCard>
    </section>
  );
};

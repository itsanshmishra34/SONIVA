import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, X } from 'lucide-react';

export const CoOwnerIntroModal: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'co_owner') return;

    const sessionShown = sessionStorage.getItem('soniva_co_owner_intro_shown');
    if (sessionShown) return;

    console.log('[CO_OWNER_WELCOME_START]');
    setIsVisible(true);
    sessionStorage.setItem('soniva_co_owner_intro_shown', 'true');

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timingMultiplier = prefersReducedMotion ? 0.3 : 1;

    const timers = [
      setTimeout(() => setStep(1), 1000 * timingMultiplier), // Aurora reveal
      setTimeout(() => setStep(2), 2200 * timingMultiplier), // SONIVA Logo
      setTimeout(() => setStep(3), 3500 * timingMultiplier), // Ayush reveal & slide
      setTimeout(() => {
        console.log('[CO_OWNER_REVEAL]');
        setStep(4);
      }, 4800 * timingMultiplier), // Sunaina reveal
      setTimeout(() => setStep(5), 6200 * timingMultiplier), // Message & connection line
      setTimeout(() => setStep(6), 7800 * timingMultiplier), // Final message & ready
      setTimeout(() => {
        console.log('[CO_OWNER_WELCOME_COMPLETE]');
        setIsVisible(false);
      }, 9500 * timingMultiplier), // Fade out into app
    ];

    return () => timers.forEach(clearTimeout);
  }, [user]);

  // Escape key support to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        console.log('[CO_OWNER_WELCOME_SKIP]');
        setIsSkipped(true);
        setIsVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible || isSkipped || !user || user.role !== 'co_owner') return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#05070D]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-slate-100 animate-in fade-in duration-500 overflow-hidden">
      {/* Subtle Ambient Aurora background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] transition-all duration-1000 ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-500/10 blur-[120px] transition-all duration-1000 ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        <div className={`absolute top-1/2 right-1/3 w-80 h-80 rounded-full bg-magenta-500/10 blur-[140px] transition-all duration-1000 ${step >= 1 ? 'opacity-80 scale-100' : 'opacity-0 scale-50'}`} />
      </div>

      {/* Skip button */}
      <button
        onClick={() => {
          console.log('[CO_OWNER_WELCOME_SKIP]');
          setIsSkipped(true);
          setIsVisible(false);
        }}
        className="absolute top-6 right-6 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-slate-300 hover:text-white transition-all backdrop-blur-xl cursor-pointer z-10"
      >
        SKIP INTRO (ESC)
      </button>

      {/* Cinematic Content Container */}
      <div className="relative z-10 max-w-xl w-full text-center space-y-8 flex flex-col items-center justify-center min-h-[400px]">
        {/* Step 0: Initial text */}
        {step === 0 && (
          <div className="animate-in fade-in duration-700 text-slate-400 text-sm tracking-widest uppercase font-medium">
            A little something was waiting for you...
          </div>
        )}

        {/* Step 1 & 2: Logo & Subtitle */}
        {step >= 2 && (
          <div className={`space-y-3 transition-all duration-700 ${step >= 2 ? 'opacity-100 filter-none scale-100' : 'opacity-0 blur-md scale-95'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-extrabold tracking-widest">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>PRIVATE EXPERIENCE</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              SONIVA
            </h1>
            <p className="text-xs tracking-[0.25em] text-cyan-300/80 font-medium uppercase">
              LISTEN · CHAT · CONNECT
            </p>
          </div>
        )}

        {/* Step 3 & 4: Two-Signature Reveal */}
        {step >= 3 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 w-full">
            {/* Ayush */}
            <div className={`p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl transition-all duration-700 ${step >= 3 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="text-sm font-bold text-white">AYUSH</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Owner & Developer</div>
            </div>

            {/* Connection Line (Step 5) */}
            {step >= 5 && (
              <div className="hidden sm:flex items-center w-16 relative">
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-cyan-400 mx-auto shadow-lg shadow-cyan-400/50 animate-ping" />
              </div>
            )}

            {/* Sunaina */}
            <div className={`p-5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-violet-500/20 to-pink-500/20 border border-cyan-400/40 backdrop-blur-2xl shadow-xl shadow-cyan-950/40 transition-all duration-700 ${step >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div className="text-base font-extrabold text-white flex items-center gap-2 justify-center">
                <span>SUNAINA</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <div className="text-[10px] text-cyan-200 font-bold uppercase tracking-wider mt-0.5">Co-Owner</div>
            </div>
          </div>
        )}

        {/* Step 5 & 6: Personal Message & Final Ready */}
        {step >= 5 && (
          <div className="space-y-2 animate-in fade-in duration-700 pt-2">
            <p className="text-sm text-slate-200 font-medium">
              "Welcome to your side of SONIVA."
            </p>
            <p className="text-xs text-slate-400 italic">
              Some spaces are built. Some become memories.
            </p>
          </div>
        )}

        {step >= 6 && (
          <div className="space-y-3 animate-in zoom-in-95 duration-700 pt-4 border-t border-white/10 w-full max-w-xs mx-auto">
            <div className="text-xs font-bold tracking-widest text-cyan-300 uppercase">
              LISTEN · CHAT · CONNECT · SING
            </div>
            <div className="text-xs text-white font-semibold">
              Your space is ready.
            </div>
          </div>
        )}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-1/3 left-1/5 text-lg animate-float-rise opacity-40">✨</span>
        <span className="absolute bottom-1/3 right-1/5 text-lg animate-float-rise opacity-40" style={{ animationDelay: '1s' }}>🌙</span>
        <span className="absolute top-2/3 left-2/3 text-lg animate-float-rise opacity-40" style={{ animationDelay: '2s' }}>🎵</span>
      </div>
    </div>
  );
};

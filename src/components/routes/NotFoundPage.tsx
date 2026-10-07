import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
      <LiquidGlassCard depth={3} glow={true} className="max-w-md w-full p-8 text-center space-y-6 relative z-10 border-white/20">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/30 to-violet-500/30 border border-white/20 flex items-center justify-center mx-auto text-cyan-300 shadow-xl">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '12s' }} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">404</h1>
          <h2 className="text-base font-bold text-cyan-300 uppercase tracking-wider">Page Not Found</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The vibe or route you are looking for does not exist or has been moved.
          </p>
        </div>

        <LiquidGlassButton
          variant="primary"
          size="lg"
          glow={true}
          onClick={() => navigate('/')}
          className="w-full gap-2 text-xs font-bold justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SONIVA</span>
        </LiquidGlassButton>
      </LiquidGlassCard>
    </div>
  );
};

import React, { useState } from 'react';

interface LiquidGlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  glow = false,
  className = '',
  children,
  onClick,
  disabled,
  ...props
}) => {
  const [ripple, setRipple] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true
    });
    setTimeout(() => setRipple(prev => ({ ...prev, active: false })), 400);
    onClick?.(e);
  };

  const baseStyles = 'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-250 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 overflow-hidden';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-xs md:text-sm px-4.5 py-2.5 gap-2',
    lg: 'text-sm md:text-base px-6 py-3 gap-2.5',
    icon: 'p-2 rounded-full w-10 h-10'
  };

  // Real liquid glass button styles with internal highlights and backdrop filters
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-violet-600/50 via-indigo-600/40 to-cyan-500/50 hover:from-violet-500/60 hover:to-cyan-400/60 text-white shadow-[0_8px_24px_rgba(6,182,212,0.25)] hover:shadow-[0_10px_28px_rgba(6,182,212,0.40)] border border-white/30 hover:border-white/50 backdrop-blur-xl hover:-translate-y-0.5',
    secondary:
      'bg-white/[0.08] hover:bg-white/[0.15] text-slate-100 hover:text-white border border-white/[0.16] hover:border-white/[0.28] backdrop-blur-xl shadow-lg shadow-black/25 hover:shadow-cyan-950/20 hover:-translate-y-0.5',
    accent:
      'bg-gradient-to-r from-pink-500/50 via-purple-600/45 to-violet-600/50 hover:from-pink-400/60 hover:to-violet-500/60 text-white shadow-[0_8px_24px_rgba(236,72,153,0.25)] hover:shadow-[0_10px_28px_rgba(236,72,153,0.40)] border border-white/30 hover:border-white/50 backdrop-blur-xl hover:-translate-y-0.5',
    ghost:
      'bg-transparent hover:bg-white/[0.08] text-slate-300 hover:text-white border border-transparent hover:border-white/10 backdrop-blur-md',
    danger:
      'bg-rose-500/25 hover:bg-rose-500/35 text-rose-200 hover:text-white border border-rose-500/35 backdrop-blur-xl shadow-lg shadow-rose-950/20'
  };

  const glowStyles = glow ? 'shadow-[0_0_28px_rgba(6,182,212,0.45)] border-cyan-400/50' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${glowStyles} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {/* Top specular edge reflection highlight */}
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Internal refractive liquid shimmer */}
      <span className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-60 pointer-events-none" />

      {/* Ripple Animation */}
      {ripple.active && (
        <span
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
          style={{
            left: ripple.x - 14,
            top: ripple.y - 14,
            width: 28,
            height: 28
          }}
        />
      )}

      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

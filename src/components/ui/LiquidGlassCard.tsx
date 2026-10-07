import React from 'react';

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  depth?: 1 | 2 | 3 | 4 | 5;
  glow?: boolean;
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  depth = 2,
  glow = false,
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  // Use our specialized glass depth utility classes
  const depthClassMap = {
    1: 'glass-depth-1',
    2: 'glass-depth-2',
    3: 'glass-depth-3',
    4: 'glass-depth-4',
    5: 'glass-depth-5'
  };

  const glowClass = glow
    ? 'shadow-[0_0_40px_rgba(6,182,212,0.18)] border-cyan-400/30'
    : '';

  const interactiveClass = interactive
    ? 'hover:-translate-y-0.5 hover:border-white/30 hover:shadow-2xl hover:shadow-cyan-950/20 cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-2xl transition-all duration-300 relative overflow-hidden liquid-refraction ${depthClassMap[depth]} ${glowClass} ${interactiveClass} ${className}`}
      {...props}
    >
      {/* Top Specular Glass Edge Light */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-10" />

      {/* Internal Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

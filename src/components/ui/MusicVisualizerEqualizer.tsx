import React from 'react';

interface MusicVisualizerEqualizerProps {
  isPlaying?: boolean;
  bars?: number;
  className?: string;
  color?: 'cyan' | 'violet' | 'rose' | 'amber' | 'emerald';
}

export const MusicVisualizerEqualizer: React.FC<MusicVisualizerEqualizerProps> = ({
  isPlaying = false,
  bars = 4,
  className = '',
  color = 'cyan'
}) => {
  const colorMap = {
    cyan: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
    violet: 'bg-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
    rose: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    amber: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    emerald: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
  };

  const animClasses = ['animate-eq-1', 'animate-eq-2', 'animate-eq-3', 'animate-eq-4'];

  return (
    <div className={`flex items-end gap-0.5 h-3.5 px-1 py-0.5 select-none ${className}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`w-0.5 rounded-full transition-all duration-300 ${colorMap[color]} ${
            isPlaying ? animClasses[i % animClasses.length] : 'h-1 opacity-50'
          }`}
          style={{
            height: isPlaying ? undefined : '25%'
          }}
        />
      ))}
    </div>
  );
};

import React from 'react';

interface GlassSkeletonProps {
  className?: string;
  count?: number;
  type?: 'card' | 'row' | 'avatar' | 'text';
}

export const GlassSkeletonLoader: React.FC<GlassSkeletonProps> = ({
  className = '',
  count = 1,
  type = 'card'
}) => {
  const renderItem = (index: number) => {
    if (type === 'row') {
      return (
        <div
          key={index}
          className={`flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md overflow-hidden relative animate-glass-shimmer ${className}`}
        >
          <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-white/15 rounded-md" />
            <div className="h-2.5 w-1/2 bg-white/10 rounded-md" />
          </div>
        </div>
      );
    }

    if (type === 'avatar') {
      return (
        <div
          key={index}
          className={`w-10 h-10 rounded-xl bg-white/10 animate-glass-shimmer border border-white/10 ${className}`}
        />
      );
    }

    if (type === 'text') {
      return (
        <div key={index} className="space-y-2 w-full">
          <div className={`h-3 bg-white/15 rounded-md animate-glass-shimmer ${className}`} />
        </div>
      );
    }

    // Default 'card'
    return (
      <div
        key={index}
        className={`p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md overflow-hidden relative animate-glass-shimmer space-y-3 ${className}`}
      >
        <div className="w-full aspect-square rounded-xl bg-white/10" />
        <div className="h-3.5 w-4/5 bg-white/15 rounded-md" />
        <div className="h-2.5 w-1/2 bg-white/10 rounded-md" />
      </div>
    );
  };

  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => renderItem(i))}
    </div>
  );
};

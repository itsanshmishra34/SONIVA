import React from 'react';

interface AnimatedRouteViewProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AnimatedRouteView provides a unified, cinematic page transition for all views.
 * Uses hardware-accelerated transform + opacity with smooth spring easing.
 * Never creates layout shifts or page jumping.
 */
export const AnimatedRouteView: React.FC<AnimatedRouteViewProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`flex-1 min-h-0 flex flex-col overflow-hidden animate-page-enter ${className}`}>
      {children}
    </div>
  );
};

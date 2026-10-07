import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const AmbientFloatingEmojis: React.FC = () => {
  const { floatingEmojis } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {floatingEmojis.map((item) => (
        <div
          key={item.id}
          className="absolute text-2xl select-none animate-float-rise transition-transform"
          style={{
            left: `${item.x}%`,
            bottom: `${100 - item.y}%`
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
};

import React, { createContext, useContext, useState } from 'react';
import { ThemeMode } from '../types';

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  floatingEmojis: FloatingEmoji[];
  triggerFloatingEmoji: (emoji: string, originX?: number, originY?: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('aurora-night');
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  const triggerFloatingEmoji = (emoji: string, originX?: number, originY?: number) => {
    const id = `fe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const x = originX !== undefined ? originX : Math.random() * 80 + 10;
    const y = originY !== undefined ? originY : Math.random() * 40 + 50;

    const newEmoji: FloatingEmoji = { id, emoji, x, y };
    setFloatingEmojis((prev) => [...prev.slice(-15), newEmoji]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, floatingEmojis, triggerFloatingEmoji }}>
      <div className={`min-h-screen text-slate-100 selection:bg-cyan-500/30 font-sans ${theme}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Music2, Radio, Bookmark } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MobileBottomNavProps {
  onOpenFindSomeone: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenFindSomeone }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerFloatingEmoji } = useTheme();

  const currentPath = location.pathname;

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'chats', label: 'Chats', icon: MessageSquare, path: '/chat' },
    { id: 'music', label: 'Music', icon: Music2, path: '/music' },
    { id: 'connect', label: 'Connect', icon: Radio, action: onOpenFindSomeone },
    { id: 'library', label: 'Library', icon: Bookmark, path: '/library' },
  ];

  const isItemActive = (item: typeof navItems[0]) => {
    if (item.path === '/') return currentPath === '/';
    if (!item.path) return false;
    return currentPath.startsWith(item.path);
  };

  return (
    <div className="md:hidden w-full h-14 bg-slate-950/65 backdrop-blur-3xl border-t border-white/[0.12] flex items-center justify-around px-2 pb-safe z-30 relative shrink-0">
      {/* Top Specular Edge Line */}
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = isItemActive(item);

        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.action) {
                item.action();
              } else if (item.path) {
                navigate(item.path);
              }
              triggerFloatingEmoji('✨');
            }}
            className="flex flex-col items-center justify-center gap-1 w-14 h-full relative group cursor-pointer"
          >
            {isActive && (
              <span className="absolute -top-px w-6 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
            )}
            
            <Icon
              className={`w-5 h-5 transition-transform duration-200 ${
                isActive
                  ? 'text-cyan-400 scale-110'
                  : 'text-slate-400 group-hover:text-cyan-300 group-active:scale-90'
              }`}
            />
            <span
              className={`text-[9px] font-bold tracking-tight transition-colors duration-200 ${
                isActive ? 'text-white font-extrabold' : 'text-slate-400 font-semibold'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

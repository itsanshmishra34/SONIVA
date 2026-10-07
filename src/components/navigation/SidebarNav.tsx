import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeMode } from '../../types';
import {
  Home,
  Compass,
  Radio,
  MessageSquare,
  Video,
  Music2,
  Mic,
  Bookmark,
  Bell,
  Settings,
  ShieldAlert,
  Moon,
  Sun,
  Flame,
  Star,
  Lightbulb,
  LogOut,
  Headphones
} from 'lucide-react';

interface SidebarNavProps {
  onOpenFindSomeone?: () => void;
  onOpenFeedback?: () => void;
  onOpenSuggest?: () => void;
  onOpenSearch?: () => void;
  onOpenCamera?: () => void;
  activeView?: string;
  onSelectView?: (view: string) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  onOpenFindSomeone,
  onOpenFeedback,
  onOpenSuggest,
  onOpenSearch,
  onOpenCamera,
  activeView,
  onSelectView
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { theme, setTheme, triggerFloatingEmoji } = useTheme();

  const currentPath = location.pathname;

  // Personalized Greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return { text: 'Late night', icon: '🌌' };
    if (hour < 12) return { text: 'Good morning', icon: '🎧' };
    if (hour < 17) return { text: 'Good afternoon', icon: '☀️' };
    return { text: 'Good evening', icon: '🌙' };
  };

  const greeting = getGreeting();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'chats', label: 'Chats', icon: MessageSquare, path: '/chat' },
    { id: 'vibe-rooms', label: 'Vibe Rooms', icon: Compass, path: '/vibe-rooms' },
    { id: 'music', label: 'Music Discovery', icon: Music2, path: '/music' },
    { id: 'random', label: 'Random Connect', icon: Radio, action: onOpenFindSomeone },
    { id: 'sing', label: 'Sing Together', icon: Mic, path: '/sing-together' },
    { id: 'camera', label: 'Camera', icon: Video, path: '/camera' },
    { id: 'library', label: 'Library', icon: Bookmark, path: '/library' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
    ...(user?.role === 'co_owner' ? [{ id: 'coowner-space', label: 'Co-Owner Space', icon: Star, path: '/coowner-space' }] : []),
    { id: 'credits', label: 'About & Creator', icon: Headphones, path: '/credits' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Dashboard', icon: ShieldAlert, path: '/admin' }] : [])
  ];

  const cycleTheme = () => {
    const next: ThemeMode =
      theme === 'aurora-night'
        ? 'sunset-lounge'
        : theme === 'sunset-lounge'
        ? 'pure-black'
        : 'aurora-night';
    setTheme(next);
    triggerFloatingEmoji('✨');
  };

  const isPathActive = (item: typeof navItems[0]) => {
    if (item.path === '/') return currentPath === '/';
    if (!item.path) return false;
    return currentPath.startsWith(item.path);
  };

  return (
    <nav className="hidden md:flex w-64 h-full bg-slate-950/35 backdrop-blur-2xl border-r border-white/[0.12] shadow-[4px_0_30px_rgba(0,0,0,0.35)] flex-col p-3.5 shrink-0 z-20 relative overflow-hidden liquid-refraction">
      {/* Top Specular Edge Highlight */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* TOP: Brand & Personalized Greeting */}
      <div className="shrink-0 space-y-3 pb-2 relative z-10">
        {/* Brand Lockup */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 px-2 pt-1 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/40 via-violet-500/40 to-pink-500/40 border border-white/30 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-cyan-950/40 backdrop-blur-xl group-hover:scale-105 transition-transform">
            S
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>SONIVA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-cyan-300/90 font-medium tracking-wide">
              Listen · Chat · Connect
            </div>
          </div>
        </div>

        {/* Personalized Greeting Card in Liquid Glass */}
        {user && (
          <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/[0.15] backdrop-blur-xl shadow-lg shadow-black/20 space-y-1 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
              <span>{greeting.icon}</span>
              <span className="truncate">{greeting.text}, {user.displayName.split(' ')[0]}</span>
            </div>
            <div className="text-[11px] text-slate-300">
              Ready to find your vibe?
            </div>
          </div>
        )}
      </div>

      {/* MIDDLE: Scrollable Navigation Links */}
      <div className="flex-1 min-h-0 overflow-y-auto py-1 space-y-1 relative z-10 pr-0.5 scrollbar-thin">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = isPathActive(item) || activeView === item.id;
          return (
            <button
              key={item.id}
              style={{
                animationDelay: `${index * 35}ms`
              }}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.path) {
                  navigate(item.path);
                }
                if (onSelectView) {
                  onSelectView(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 relative overflow-hidden group cursor-pointer animate-msg-enter ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/25 via-violet-600/25 to-pink-500/15 text-white border border-cyan-400/40 shadow-lg shadow-cyan-950/30 backdrop-blur-xl translate-x-1'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-white/15 border border-transparent hover:translate-x-0.5'
              }`}
            >
              {isActive ? (
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent pointer-events-none" />
              ) : (
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              )}
              <Icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)] shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* BOTTOM: Pinned Footer Actions */}
      <div className="shrink-0 pt-2.5 border-t border-white/[0.12] space-y-2 relative z-10">
        {/* Feedback & Feature Request buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onOpenFeedback ? onOpenFeedback() : navigate('/feedback')}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white/[0.05] text-[11px] font-medium text-slate-300 hover:text-white border border-white/10 transition-colors backdrop-blur-md premium-interactive cursor-pointer"
          >
            <Star className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Rate App</span>
          </button>

          <button
            onClick={() => onOpenSuggest ? onOpenSuggest() : navigate('/suggest-feature')}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white/[0.05] text-[11px] font-medium text-slate-300 hover:text-white border border-white/10 transition-colors backdrop-blur-md premium-interactive cursor-pointer"
          >
            <Lightbulb className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">Suggest</span>
          </button>
        </div>

        {/* Theme Switcher */}
        <button
          onClick={cycleTheme}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-xs text-slate-200 transition-colors backdrop-blur-md cursor-pointer"
        >
          <span className="text-[11px] text-slate-400">Theme</span>
          <span className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold capitalize">
            {theme === 'aurora-night' ? '🌌 Aurora' : theme === 'sunset-lounge' ? '🌅 Sunset' : '🖤 OLED'}
          </span>
        </button>

        {/* Current User Session Bar in Liquid Glass */}
        {user && (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600/40 to-cyan-500/40 border border-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                {user.displayName[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{user.displayName}</div>
                <div className="text-[10px] text-slate-400 truncate">@{user.username}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Settings, User, Music, Shield, Bell, HardDrive, LogOut } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const navItems = [
    { label: 'Profile', path: '/settings/profile', icon: User },
    { label: 'Music', path: '/settings/music', icon: Music },
    { label: 'Privacy', path: '/settings/privacy', icon: Shield },
    { label: 'Notifications', path: '/settings/notifications', icon: Bell },
    { label: 'Playback', path: '/settings/playback', icon: HardDrive },
    { label: 'Account', path: '/settings/account', icon: LogOut },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 md:pb-32 max-w-5xl mx-auto w-full animate-page-enter">
      <div className="pb-6 border-b border-white/10 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Settings className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <span>Settings & Preferences</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure profile, music discovery, audio playback and security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible scrollbar-none whitespace-nowrap gap-2 md:space-y-1.5 shrink-0 -mx-6 px-6 md:mx-0 md:px-0 pb-3 md:pb-0 border-b border-white/5 md:border-none">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0 ${
                isActive 
                  ? 'bg-gradient-to-r from-cyan-500/25 to-violet-600/20 text-white border border-cyan-400/40 shadow-md backdrop-blur-xl md:translate-x-1' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="md:col-span-3 animate-page-enter min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

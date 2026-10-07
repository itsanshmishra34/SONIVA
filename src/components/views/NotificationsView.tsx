import React from 'react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { Bell, Radio, Mic, Music2, Heart, CheckCircle2, ShieldCheck } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const notifications = [
    {
      id: 'notif-1',
      icon: Radio,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      title: 'Listen Together Session Ready',
      desc: 'Shared room state synchronized with Audius. Connect anytime to stream in sync.',
      time: '10m ago'
    },
    {
      id: 'notif-2',
      icon: Music2,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20',
      title: 'Trending Audius Playlist',
      desc: 'Lo-Fi Night Vibes and Synthwave Horizons have been added to the trending queue.',
      time: '1h ago'
    },
    {
      id: 'notif-3',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      title: 'Private Encrypted Channel',
      desc: 'All messages and shared song cards are protected by authenticated cryptography.',
      time: '3h ago'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 md:pb-32 space-y-6 max-w-4xl mx-auto w-full animate-page-enter">
      <div className="pb-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-cyan-400" />
            <span>Notifications</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live updates, room invitations, and musical activity</p>
        </div>
        <span className="text-xs text-cyan-300 font-semibold px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30">
          All Caught Up
        </span>
      </div>

      <div className="space-y-3">
        {notifications.map((n, idx) => {
          const Icon = n.icon;
          return (
            <LiquidGlassCard
              key={n.id}
              depth={2}
              style={{ animationDelay: `${idx * 60}ms` }}
              className="p-4 flex items-start gap-4 hover:border-white/25 transition-all animate-msg-enter soniva-song-card"
            >
              <div className={`w-10 h-10 rounded-2xl ${n.bgColor} border border-white/15 flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${n.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white truncate">{n.title}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">{n.time}</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{n.desc}</p>
              </div>
            </LiquidGlassCard>
          );
        })}
      </div>
    </div>
  );
};

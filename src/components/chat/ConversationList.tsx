import React, { useState, useEffect } from 'react';
import { Conversation } from '../../types';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { socketService } from '../../services/socket';
import { Search, Radio, KeyRound, Lock, Plus, Music2 } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (convo: Conversation) => void;
  onOpenFindSomeone: () => void;
  onOpenCreatePrivate: () => void;
  onOpenJoinCode: () => void;
  onOpenSearch: () => void;
  className?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenFindSomeone,
  onOpenCreatePrivate,
  onOpenJoinCode,
  onOpenSearch,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsub = socketService.on('chat:typing', (data: any) => {
      if (data.roomId) {
        setTypingMap((prev) => ({
          ...prev,
          [data.roomId]: !!data.isTyping
        }));
      }
    });
    return () => unsub();
  }, []);

  const filtered = conversations.filter(
    (c) =>
      c.participant.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.participant.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className={`w-full md:w-80 flex flex-col h-full bg-slate-950/25 backdrop-blur-2xl border-r border-white/[0.10] shrink-0 relative overflow-hidden liquid-refraction ${className}`}>
      {/* Top Header & Fast Actions */}
      <div className="p-4 border-b border-white/[0.10] space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-white">Chats</span>
            <span className="text-xs text-slate-400 font-mono">({conversations.length})</span>
          </div>

          <LiquidGlassButton
            size="sm"
            variant="ghost"
            onClick={onOpenSearch}
            className="text-xs text-cyan-300 hover:text-white"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search</span>
          </LiquidGlassButton>
        </div>

        {/* Quick Connect & Private Access Code Buttons in Liquid Glass */}
        <div className="grid grid-cols-2 gap-2">
          <LiquidGlassButton
            size="sm"
            variant="secondary"
            onClick={onOpenCreatePrivate}
            className="text-xs font-semibold py-2"
          >
            <Lock className="w-3.5 h-3.5 text-violet-400" />
            <span>Create Private</span>
          </LiquidGlassButton>

          <LiquidGlassButton
            size="sm"
            variant="secondary"
            onClick={onOpenJoinCode}
            className="text-xs font-semibold py-2"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Join With Code</span>
          </LiquidGlassButton>
        </div>

        {/* Primary Find Someone Banner Button */}
        <LiquidGlassButton
          variant="primary"
          size="md"
          glow={true}
          onClick={onOpenFindSomeone}
          className="w-full text-xs font-bold py-3 shadow-[0_4px_20px_rgba(6,182,212,0.30)]"
        >
          <Radio className="w-4 h-4 text-cyan-200 animate-pulse" />
          <span>FIND SOMEONE (RANDOM CONNECT)</span>
        </LiquidGlassButton>

        {/* Liquid Glass Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-white/[0.06] border border-white/[0.14] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-white/[0.10] backdrop-blur-xl transition-all"
          />
        </div>
      </div>

      {/* Conversations Scroll View */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 relative z-10">
        {filtered.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center mx-auto text-slate-400 backdrop-blur-xl">
              <Music2 className="w-6 h-6" />
            </div>
            <div className="text-xs text-slate-300">
              No conversations found. Click <span className="text-cyan-300 font-semibold">Find Someone</span> to match by music vibe!
            </div>
          </div>
        ) : (
          filtered.map((convo, index) => {
            const isActive = convo.roomId === activeConversationId;
            return (
              <div
                key={convo.id}
                onClick={() => onSelectConversation(convo)}
                style={{ animationDelay: `${Math.min(index * 30, 250)}ms` }}
                className={`animate-subtle-fade-up flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all border relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 via-violet-600/15 to-transparent border-cyan-400/40 shadow-xl shadow-cyan-950/30 backdrop-blur-2xl'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/[0.15] backdrop-blur-lg'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
                )}

                {/* Initial Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/40 border border-white/20 flex items-center justify-center text-slate-100 font-bold text-sm shadow-md backdrop-blur-xl">
                    {convo.participant.displayName[0]?.toUpperCase() || 'U'}
                  </div>
                  {convo.participant.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-slate-100 truncate">
                        {convo.participant.displayName}
                      </span>
                    </div>
                    <span className="text-[10px] text-cyan-300 font-semibold shrink-0">
                      {convo.compatibilityScore}% match
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    {typingMap[convo.roomId] ? (
                      <span className="truncate pr-2 text-cyan-300 text-[11px] flex items-center gap-1 font-medium animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span>typing...</span>
                      </span>
                    ) : (
                      <span className="truncate pr-2 text-slate-300 text-[11px]">
                        {convo.lastMessage || 'Private encrypted room'}
                      </span>
                    )}
                    {convo.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-bold shadow-sm shadow-cyan-400/50">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

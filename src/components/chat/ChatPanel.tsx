import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, Track } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useMusic } from '../../context/MusicContext';
import { useTheme } from '../../context/ThemeContext';
import { usePublicSync } from '../../context/PublicSyncProvider';
import { RoomYouTubePlayer } from '../player/RoomYouTubePlayer';
import { socketService } from '../../services/socket';
import { e2eeService } from '../../services/e2ee';
import { auth } from '../../services/firebase';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { CHAT_THEMES, ChatThemeId, getChatTheme } from './chatThemes';
import { ChatThemeSelectorModal } from './ChatThemeSelectorModal';
import {
  Send,
  Radio,
  Mic,
  Phone,
  ShieldCheck,
  Music,
  Smile,
  MoreVertical,
  Flag,
  Play,
  Pause,
  Heart,
  Plus,
  Palette,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  ArrowLeft,
  Trash2,
  AlertTriangle
} from 'lucide-react';

function groupReactions(reactions?: { emoji: string; userId: string }[]) {
  if (!reactions || reactions.length === 0) return [];
  const map = new Map<string, { emoji: string; count: number; userIds: string[] }>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count += 1;
      existing.userIds.push(r.userId);
    } else {
      map.set(r.emoji, { emoji: r.emoji, count: 1, userIds: [r.userId] });
    }
  }
  return Array.from(map.values());
}

interface ChatPanelProps {
  partner: User;
  roomId: string;
  compatibilityScore: number;
  onStartListenTogether: () => void;
  onStartSingTogether: () => void;
  onStartVoiceCall: () => void;
  onOpenSongSearch: () => void;
  onReportUser: (user: User) => void;
  onBackToList?: () => void;
  className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  partner,
  roomId,
  compatibilityScore,
  onStartListenTogether,
  onStartSingTogether,
  onStartVoiceCall,
  onOpenSongSearch,
  onReportUser,
  onBackToList,
  className = ''
}) => {
  const { user } = useAuth();
  const { playTrack, addToQueue, currentTrack, isPlaying, togglePlay, isListenTogetherActive, driftMs, syncStatus } = useMusic();
  const { triggerFloatingEmoji } = useTheme();
  
  const { isPublicSyncActive, joinPublicSyncRoom, leavePublicSyncRoom } = usePublicSync();

  const handleTogglePublicSync = () => {
    if (isPublicSyncActive) {
      leavePublicSyncRoom();
      triggerFloatingEmoji('👋');
    } else {
      joinPublicSyncRoom(roomId);
      triggerFloatingEmoji('📺');
      triggerFloatingEmoji('✨');
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions]);

  // Chat Theme per room with persistent localStorage fallback
  const [currentThemeId, setCurrentThemeId] = useState<ChatThemeId>(() => {
    const saved = localStorage.getItem(`soniva_chat_theme_${roomId}`);
    if (saved && saved in CHAT_THEMES) return saved as ChatThemeId;
    const globalDefault = localStorage.getItem('soniva_default_chat_theme');
    if (globalDefault && globalDefault in CHAT_THEMES) return globalDefault as ChatThemeId;
    return 'frosted-obsidian';
  });

  const theme = getChatTheme(currentThemeId);

  const handleSelectTheme = (themeId: ChatThemeId, applyGlobally = false) => {
    setCurrentThemeId(themeId);
    localStorage.setItem(`soniva_chat_theme_${roomId}`, themeId);
    if (applyGlobally) {
      localStorage.setItem('soniva_default_chat_theme', themeId);
    }
    triggerFloatingEmoji('✨');
  };

  // Date and Time formatting helpers for message timestamps
  const formatMessageTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFullDateTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const isSameDay = (t1?: number, t2?: number) => {
    if (!t1 || !t2) return false;
    const d1 = new Date(t1);
    const d2 = new Date(t2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const formatDateSeparator = (timestamp?: number) => {
    if (!timestamp) return '';
    const now = new Date();
    if (isSameDay(timestamp, now.getTime())) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameDay(timestamp, yesterday.getTime())) return 'Yesterday';
    return new Date(timestamp).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const partnerTypingTimeoutRef = useRef<any>(null);

  const handleClearChat = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const res = await fetch(`/api/chat/clear/${roomId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (res.ok) {
        setMessages([]);
        setShowOptions(false);
        setShowClearConfirm(false);
      }
    } catch (e) {
      console.error('[CHAT_PANEL] Failed to clear chat:', e);
    }
  };

  // Initialize and join room
  useEffect(() => {
    socketService.joinRoom(roomId);

    // Initial greeting / contextual message if empty
    const initDefaultMessages = async () => {
      const welcomePlaintext = `Hey! Found you through ${partner.musicInterests[0] || 'music'}. Listening to anything good right now? 🎧`;
      const enc = await e2eeService.encrypt(welcomePlaintext, roomId);

      const sampleMsg: ChatMessage = {
        id: `msg-init-${partner.id}`,
        roomId,
        senderId: partner.id,
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        decryptedText: welcomePlaintext,
        messageType: 'text',
        timestamp: Date.now() - 1000 * 60 * 3,
        reactions: [],
        status: 'read'
      };

      setMessages([sampleMsg]);

      // Inform partner that their initial messages have been read
      socketService.send({
        type: 'chat:read_receipt',
        roomId,
        messageIds: [`msg-init-${partner.id}`],
        timestamp: Date.now()
      });
    };

    initDefaultMessages();

    // Socket message listener
    const unsubMessage = socketService.on('chat:e2ee_message', async (data: any) => {
      let decrypted = data.ciphertext;
      if (data.ciphertext && data.iv) {
        decrypted = await e2eeService.decrypt(data.ciphertext, data.iv, roomId);
      }

      const isFromPartner = data.senderId === partner.id;

      const newMsg: ChatMessage = {
        id: data.id,
        roomId: data.roomId,
        senderId: data.senderId,
        ciphertext: data.ciphertext,
        iv: data.iv,
        decryptedText: decrypted,
        messageType: data.messageType || 'text',
        metadata: data.metadata,
        timestamp: data.timestamp || Date.now(),
        reactions: data.reactions || [],
        status: isFromPartner ? 'read' : 'delivered'
      };

      setMessages((prev) => {
        // If already exists by server ID, ignore
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        // If matching an optimistic message from self, replace the temporary optimistic placeholder
        const optIndex = prev.findIndex((m) => 
          (m.status === 'sending' || m.id.startsWith('msg-')) && 
          m.senderId === newMsg.senderId && 
          m.ciphertext === newMsg.ciphertext
        );
        if (optIndex !== -1) {
          const updated = [...prev];
          updated[optIndex] = newMsg;
          return updated;
        }
        return [...prev, newMsg];
      });

      // If message is from partner, we immediately acknowledge and send a read receipt back!
      if (isFromPartner) {
        socketService.send({
          type: 'chat:read_receipt',
          roomId,
          messageIds: [data.id],
          timestamp: Date.now()
        });
      }

      if (newMsg.messageType === 'song_card') {
        triggerFloatingEmoji('🎵');
      }
    });

    // Message Server Ack listener
    const unsubAck = socketService.on('chat:message_ack', (data: any) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === data.id && msg.status === 'sending') {
            return { ...msg, status: 'delivered' };
          }
          return msg;
        })
      );
    });

    // Read Receipt listener (when partner reads our messages)
    const unsubReadReceipt = socketService.on('chat:read_receipt', (data: any) => {
      if (data.roomId === roomId && (data.readerId === partner.id || !data.readerId)) {
        const targetIds: string[] = Array.isArray(data.messageIds) ? data.messageIds : [];
        setMessages((prev) =>
          prev.map((msg) => {
            const isMyMsg = msg.senderId === user?.id || msg.senderId === 'self';
            if (isMyMsg) {
              if (targetIds.length === 0 || targetIds.includes(msg.id) || msg.timestamp <= (data.timestamp || Date.now())) {
                return {
                  ...msg,
                  status: 'read',
                  readAt: data.timestamp || Date.now()
                };
              }
            }
            return msg;
          })
        );
      }
    });

    // Typing listener
    const unsubTyping = socketService.on('chat:typing', (data: any) => {
      if (data.userId === partner.id || (data.roomId === roomId && data.userId !== user?.id)) {
        setIsPartnerTyping(!!data.isTyping);
        if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
        if (data.isTyping) {
          partnerTypingTimeoutRef.current = setTimeout(() => {
            setIsPartnerTyping(false);
          }, 3500);
        }
      }
    });

    // Reaction listener
    const unsubReaction = socketService.on('chat:reaction', (data: any) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === data.messageId) {
            const clean = msg.reactions.filter((r) => r.userId !== data.userId);
            return {
              ...msg,
              reactions: [...clean, { emoji: data.emoji, userId: data.userId }]
            };
          }
          return msg;
        })
      );
    });

    return () => {
      unsubMessage();
      unsubAck();
      unsubReadReceipt();
      unsubTyping();
      unsubReaction();
      if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [roomId, partner.id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (!val.trim()) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketService.send({
        type: 'chat:typing',
        roomId,
        isTyping: false
      });
      return;
    }

    socketService.send({
      type: 'chat:typing',
      roomId,
      isTyping: true
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.send({
        type: 'chat:typing',
        roomId,
        isTyping: false
      });
    }, 1500);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const plaintext = inputText.trim();
    setInputText('');

    // Immediately cancel typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.send({
      type: 'chat:typing',
      roomId,
      isTyping: false
    });

    const { ciphertext, iv } = await e2eeService.encrypt(plaintext, roomId);

    const tempId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      roomId,
      senderId: user?.id || 'self',
      ciphertext,
      iv,
      decryptedText: plaintext,
      messageType: 'text',
      timestamp: Date.now(),
      reactions: [],
      status: 'sending'
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    socketService.send({
      type: 'chat:e2ee_message',
      roomId,
      ciphertext,
      iv,
      messageType: 'text'
    });
  };

  const handleSendCurrentTrack = async () => {
    if (!currentTrack) return;
    const plaintext = `Sharing song: ${currentTrack.title} by ${currentTrack.artist}`;
    const { ciphertext, iv } = await e2eeService.encrypt(plaintext, roomId);

    const tempId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      roomId,
      senderId: user?.id || 'self',
      ciphertext,
      iv,
      decryptedText: plaintext,
      messageType: 'song_card',
      metadata: { track: currentTrack },
      timestamp: Date.now(),
      reactions: [],
      status: 'sending'
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    socketService.send({
      type: 'chat:e2ee_message',
      roomId,
      ciphertext,
      iv,
      messageType: 'song_card',
      metadata: { track: currentTrack }
    });

    triggerFloatingEmoji('🎵');
  };

  const handleReaction = (messageId: string, emoji: string, x?: number, y?: number) => {
    socketService.send({
      type: 'chat:reaction',
      roomId,
      messageId,
      emoji
    });
    triggerFloatingEmoji(emoji, x, y);
  };

  const handleVoiceMemo = async () => {
    setIsRecordingVoice(true);
    setTimeout(async () => {
      setIsRecordingVoice(false);
      const plaintext = 'Voice memo (0:08)';
      const { ciphertext, iv } = await e2eeService.encrypt(plaintext, roomId);

      const tempId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        roomId,
        senderId: user?.id || 'self',
        ciphertext,
        iv,
        decryptedText: plaintext,
        messageType: 'voice_memo',
        metadata: { voiceDuration: 8 },
        timestamp: Date.now(),
        reactions: [],
        status: 'sending'
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      socketService.send({
        type: 'chat:e2ee_message',
        roomId,
        ciphertext,
        iv,
        messageType: 'voice_memo',
        metadata: { voiceDuration: 8 }
      });
      triggerFloatingEmoji('🎤');
    }, 2000);
  };

  return (
    <div className={`flex-1 min-w-0 h-full min-h-0 flex flex-col ${theme.containerBg} overflow-hidden relative liquid-refraction transition-colors duration-300 ${className}`}>
      {/* Top Specular Edge Line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-20" />

      {/* Top Glass Header */}
      <header className={`h-16 px-4 md:px-6 ${theme.headerBg} border-b border-white/[0.12] shadow-md flex items-center justify-between z-20 shrink-0 relative transition-colors duration-300`}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 hover:text-white border border-white/15 transition-colors cursor-pointer shrink-0"
              title="Back to chats"
              aria-label="Back to chats"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-violet-500/40 border border-white/25 flex items-center justify-center text-slate-100 font-bold text-sm shadow-lg backdrop-blur-xl">
              {partner.displayName[0]?.toUpperCase() || 'U'}
            </div>
            {partner.isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-sm" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight truncate">
                {partner.displayName}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline truncate">@{partner.username}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
              <span className={`${theme.accentText} font-semibold shrink-0`}>
                {compatibilityScore}% Vibe Match
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              {partner.currentSong ? (
                <span className="text-slate-300 truncate flex items-center gap-1 font-medium">
                  <span className="text-violet-400">🎵</span> {partner.currentSong.title}
                </span>
              ) : (
                <span className="text-slate-400 truncate">Listening to quiet room</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Theme Selector Button */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 h-8.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
            title={`Current Theme: ${theme.name}. Click to change palette.`}
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>{theme.name}</span>
          </button>

          <button
            onClick={onStartListenTogether}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 h-8.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-xs font-semibold text-cyan-200 transition-colors cursor-pointer"
            title="Start synchronized music listening"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Listen Together</span>
          </button>

          <button
            onClick={handleTogglePublicSync}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 h-8.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isPublicSyncActive
                ? 'bg-rose-500/25 text-rose-200 border-rose-400/60 shadow-sm'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-400/30'
            }`}
            title="Toggle YouTube Video Sync"
          >
            <Radio className={`w-3.5 h-3.5 ${isPublicSyncActive ? 'text-rose-400 animate-pulse' : 'text-rose-400'}`} />
            <span>YouTube Sync</span>
          </button>

          <button
            onClick={onStartSingTogether}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 h-8.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/40 text-xs font-semibold text-violet-200 transition-colors cursor-pointer"
            title="Sing Together Karaoke"
          >
            <Mic className="w-3.5 h-3.5 text-violet-400" />
            <span>Sing</span>
          </button>

          <button
            onClick={onStartVoiceCall}
            className="w-8.5 h-8.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 flex items-center justify-center transition-colors cursor-pointer"
            title="Voice Call"
            aria-label="Voice Call"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
          </button>

          {/* More Options Menu */}
          <div className="relative" ref={optionsMenuRef}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="w-8.5 h-8.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 hover:text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
              title="More Options"
              aria-label="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-full mt-1.5 w-54 bg-slate-950/95 backdrop-blur-3xl border border-white/20 rounded-2xl p-1.5 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setShowOptions(false);
                    setIsThemeModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 text-left transition-colors cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Customize Theme ({theme.name})</span>
                </button>
                <button
                  onClick={() => {
                    setShowOptions(false);
                    onStartListenTogether();
                  }}
                  className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-cyan-300 hover:bg-cyan-500/15 text-left transition-colors cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Listen Together</span>
                </button>
                <button
                  onClick={() => {
                    setShowOptions(false);
                    handleTogglePublicSync();
                  }}
                  className="md:hidden w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-500/15 text-left transition-colors cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>YouTube Sync</span>
                </button>
                <button
                  onClick={() => {
                    setShowOptions(false);
                    onStartSingTogether();
                  }}
                  className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-violet-300 hover:bg-violet-500/15 text-left transition-colors cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span>Sing Together</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    setShowOptions(false);
                    setShowClearConfirm(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-500/15 text-left transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Clear Chat</span>
                </button>
                <button
                  onClick={() => {
                    setShowOptions(false);
                    onReportUser(partner);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-500/15 text-left transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Report or Block</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Theme Selector Modal */}
      <ChatThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentThemeId={currentThemeId}
        onSelectTheme={handleSelectTheme}
        partnerName={partner.displayName}
      />

      {/* Clear Chat Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearChat}
        title="Clear this chat?"
        message="Are you sure you want to delete all messages in this conversation? This will permanently erase the chat history for both participants."
        confirmLabel="Clear Chat"
      />

      {/* Compact Truthful Security Notice */}
      <div className="h-8 px-4 bg-slate-900/40 border-b border-white/[0.08] backdrop-blur-md flex items-center justify-between text-[11px] text-slate-300 shrink-0 select-none z-10">
        <div className="flex items-center gap-1.5 truncate">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">🔒 Client-encrypted messaging · Messages are encrypted client-side using Web Crypto AES-GCM (256-bit).</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-mono shrink-0 pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{theme.name}</span>
        </div>
      </div>

      {/* Public YouTube Sync Room Player */}
      {isPublicSyncActive && (
        <div className="px-4 py-2.5 border-b border-white/10 shrink-0 z-10">
          <RoomYouTubePlayer roomId={roomId} />
        </div>
      )}

      {/* Dedicated Compact Listening Together Bar */}
      {isListenTogetherActive && currentTrack && (
        <div className="h-12 px-4 bg-gradient-to-r from-cyan-950/70 via-slate-900/60 to-violet-950/70 border-b border-cyan-400/30 backdrop-blur-xl flex items-center justify-between shrink-0 gap-3 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={currentTrack.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                alt={currentTrack.title}
                className="w-8 h-8 rounded-lg object-cover border border-white/20 shadow-md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {currentTrack.title} · <span className="text-slate-400 font-normal">{currentTrack.artist}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-[10px] font-mono text-cyan-300 font-medium hidden sm:inline">
              🎧 {syncStatus === 'synced' ? 'Synchronized' : 'Syncing'} (±{Math.abs(driftMs)}ms)
            </span>
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer shadow-sm"
              title={isPlaying ? 'Pause for both' : 'Play for both'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Message Viewport: flex: 1; min-height: 0; min-width: 0; overflow-y: auto */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 md:p-6 space-y-3.5 scrollbar-thin">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === user?.id || msg.senderId === 'self';
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDateSeparator = index === 0 || !isSameDay(prevMsg?.timestamp, msg.timestamp);

          return (
            <React.Fragment key={msg.id}>
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="flex items-center justify-center my-2 select-none">
                  <div className="px-3 py-0.5 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-400 shadow-sm">
                    {formatDateSeparator(msg.timestamp)}
                  </div>
                </div>
              )}

              {/* Message Row */}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-msg-enter w-full min-w-0`}>
                {/* Outgoing Message (Me) */}
                {isMe ? (
                  <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%] min-w-0">
                    {/* Quick Reaction Bar on Hover (left side of sent bubble) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-slate-950/85 backdrop-blur-xl border border-white/20 rounded-full px-1.5 py-0.5 shadow-lg shrink-0">
                      {['❤️', '🔥', '😂', '😮', '😴'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg.id, emoji)}
                          className="hover:scale-130 transition-transform text-xs p-0.5 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2.5 transition-all text-sm leading-relaxed backdrop-blur-2xl relative overflow-hidden border ${theme.myBubble} rounded-br-xs min-w-0 max-w-full shadow-md`}
                    >
                      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                      {/* Text Message */}
                      {msg.messageType === 'text' && (
                        <div className="whitespace-pre-wrap break-words min-w-0 w-full overflow-wrap-anywhere">{msg.decryptedText}</div>
                      )}

                      {/* Song Card */}
                      {msg.messageType === 'song_card' && msg.metadata?.track && (
                        <div className="w-60 md:w-68 space-y-2.5 p-1">
                          <div className="flex items-center gap-3">
                            <img
                              src={msg.metadata.track.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                              alt={msg.metadata.track.title}
                              className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-md shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate text-white">
                                {msg.metadata.track.title}
                              </div>
                              <div className="text-[11px] text-slate-300 truncate">
                                {msg.metadata.track.artist}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1.5 border-t border-white/10">
                            <button
                              onClick={() => playTrack(msg.metadata!.track!)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold text-white transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" /> Play
                            </button>
                            <button
                              onClick={() => addToQueue(msg.metadata!.track!)}
                              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                              title="Add to queue"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Voice Memo */}
                      {msg.messageType === 'voice_memo' && (
                        <div className="flex items-center gap-3 w-52 py-1">
                          <button className="w-7 h-7 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                            <Play className="w-3 h-3 fill-slate-950 ml-0.5" />
                          </button>
                          <div className="flex-1 flex items-center gap-1">
                            {[40, 70, 30, 90, 60, 40, 80, 50, 70, 30].map((h, idx) => (
                              <div
                                key={idx}
                                className="flex-1 bg-white/50 rounded-full"
                                style={{ height: `${h * 0.2}px` }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-300 font-mono">0:08</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Incoming Message (Partner) */
                  <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%] min-w-0">
                    {/* Partner Avatar Initial */}
                    <div
                      className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500/25 to-violet-500/35 border border-white/15 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0 mb-0.5 select-none"
                      title={partner.displayName}
                    >
                      {partner.displayName[0]?.toUpperCase() || 'P'}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2.5 transition-all text-sm leading-relaxed backdrop-blur-2xl relative overflow-hidden border ${theme.partnerBubble} rounded-bl-xs min-w-0 max-w-full shadow-md`}
                    >
                      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                      {/* Text Message */}
                      {msg.messageType === 'text' && (
                        <div className="whitespace-pre-wrap break-words min-w-0 w-full overflow-wrap-anywhere">{msg.decryptedText}</div>
                      )}

                      {/* Song Card */}
                      {msg.messageType === 'song_card' && msg.metadata?.track && (
                        <div className="w-60 md:w-68 space-y-2.5 p-1">
                          <div className="flex items-center gap-3">
                            <img
                              src={msg.metadata.track.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                              alt={msg.metadata.track.title}
                              className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-md shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate text-white">
                                {msg.metadata.track.title}
                              </div>
                              <div className="text-[11px] text-slate-300 truncate">
                                {msg.metadata.track.artist}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1.5 border-t border-white/10">
                            <button
                              onClick={() => playTrack(msg.metadata!.track!)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold text-white transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" /> Play
                            </button>
                            <button
                              onClick={() => addToQueue(msg.metadata!.track!)}
                              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                              title="Add to queue"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Voice Memo */}
                      {msg.messageType === 'voice_memo' && (
                        <div className="flex items-center gap-3 w-52 py-1">
                          <button className="w-7 h-7 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                            <Play className="w-3 h-3 fill-slate-950 ml-0.5" />
                          </button>
                          <div className="flex-1 flex items-center gap-1">
                            {[40, 70, 30, 90, 60, 40, 80, 50, 70, 30].map((h, idx) => (
                              <div
                                key={idx}
                                className="flex-1 bg-white/50 rounded-full"
                                style={{ height: `${h * 0.2}px` }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-300 font-mono">0:08</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Reaction Bar on Hover (right side of incoming bubble) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-slate-950/85 backdrop-blur-xl border border-white/20 rounded-full px-1.5 py-0.5 shadow-lg shrink-0">
                      {['❤️', '🔥', '😂', '😮', '😴'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg.id, emoji)}
                          className="hover:scale-130 transition-transform text-xs p-0.5 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Footer: Timestamp and Delivery/Read Status right below bubble */}
                <div className={`flex items-center gap-1 mt-1 text-[10px] font-mono text-slate-400 select-none ${isMe ? 'pr-1 justify-end' : 'pl-9 justify-start'}`}>
                  <span>{formatMessageTime(msg.timestamp)}</span>
                  {isMe && (
                    <span
                      className="inline-flex items-center ml-0.5"
                      title={
                        msg.status === 'read'
                          ? `Read ${msg.readAt ? new Date(msg.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
                          : msg.status === 'delivered'
                          ? 'Delivered'
                          : msg.status === 'sending'
                          ? 'Sending...'
                          : 'Sent'
                      }
                    >
                      {msg.status === 'read' ? (
                        <CheckCheck className={`w-3.5 h-3.5 ${theme.readCheckColor}`} />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-white/50" />
                      ) : msg.status === 'sending' ? (
                        <Clock className="w-3.5 h-3.5 text-white/40 animate-pulse" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-white/50" />
                      )}
                    </span>
                  )}
                </div>

                {/* Grouped Reactions directly beneath the message */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`flex flex-wrap items-center gap-1 mt-1 ${isMe ? 'justify-end pr-1' : 'justify-start pl-9'}`}>
                    {groupReactions(msg.reactions).map((group, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleReaction(msg.id, group.emoji)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-white/15 text-xs text-slate-200 hover:bg-white/10 transition-transform active:scale-95 shadow-sm cursor-pointer animate-reaction-pop"
                      >
                        <span>{group.emoji}</span>
                        {group.count > 1 && <span className="text-[10px] font-mono text-slate-400">{group.count}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* Real-Time 'Is Typing...' Indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2.5 text-xs text-slate-300 pl-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-violet-500/40 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0">
              {partner.displayName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex items-center gap-2 py-1.5 px-3 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-md">
              <span className="font-medium text-slate-200 text-xs">
                {partner.displayName} is typing
              </span>
              <div className="flex items-center gap-1 ml-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${theme.typingDotColor} animate-bounce`}
                  style={{ animationDuration: '0.9s', animationDelay: '0ms' }}
                />
                <span
                  className={`w-1.5 h-1.5 rounded-full ${theme.typingDotColor} animate-bounce`}
                  style={{ animationDuration: '0.9s', animationDelay: '150ms' }}
                />
                <span
                  className={`w-1.5 h-1.5 rounded-full ${theme.typingDotColor} animate-bounce`}
                  style={{ animationDuration: '0.9s', animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Bottom Composer inside Chat Workspace */}
      <footer className={`shrink-0 p-3 md:p-4 ${theme.footerBg} border-t border-white/[0.12] relative transition-colors duration-300 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20`}>
        {/* Floating Quick Emojis */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-4 mb-2 bg-slate-950/95 backdrop-blur-3xl border border-white/20 rounded-2xl p-2.5 shadow-2xl z-40 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
            {['🎧', '🎵', '🎶', '✨', '💜', '❤️', '🔥', '🎤', '🌙', '💬'].map((emo) => (
              <button
                key={emo}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev + emo);
                  setShowEmojiPicker(false);
                }}
                className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
              >
                {emo}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
            title="Insert emoji"
            aria-label="Insert emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onOpenSongSearch}
            className="p-2 rounded-xl text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/15 transition-colors cursor-pointer shrink-0"
            title="Share Song from catalog"
            aria-label="Share song"
          >
            <Music className="w-5 h-5" />
          </button>

          {currentTrack && (
            <button
              type="button"
              onClick={handleSendCurrentTrack}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-slate-200 hover:text-white border border-white/15 backdrop-blur-md cursor-pointer shrink-0 transition-colors"
              title="Share current track"
            >
              <span>Share Playing</span>
            </button>
          )}

          <div className="flex-1 relative min-w-0">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Send message..."
              className={`w-full bg-white/[0.06] border border-white/[0.15] rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none ${theme.inputBorder} focus:bg-white/[0.10] backdrop-blur-2xl transition-all`}
            />
          </div>

          <button
            type="button"
            onClick={handleVoiceMemo}
            className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              isRecordingVoice
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Record Voice Memo"
            aria-label="Record Voice Memo"
          >
            <Mic className="w-5 h-5" />
          </button>

          <LiquidGlassButton
            type="submit"
            variant="primary"
            size="md"
            glow={true}
            disabled={!inputText.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </LiquidGlassButton>
        </form>
      </footer>
    </div>
  );
};

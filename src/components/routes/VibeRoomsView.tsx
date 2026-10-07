import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMusic } from '../../context/MusicContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../services/firebase';
import { Track } from '../../types';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { MusicVisualizerEqualizer } from '../ui/MusicVisualizerEqualizer';
import { 
  Radio, X, Send, Play, Plus, Trash2, Clock, 
  MessageSquare, Users, Sparkles, Compass, Music, ShieldCheck
} from 'lucide-react';
import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, 
  addDoc, query, orderBy, serverTimestamp, getDocs 
} from 'firebase/firestore';

interface RoomDef {
  id: string;
  name: string;
  vibe: string;
  icon: string;
  bgGradient: string;
  color: string;
  defaultTrack: Track;
}

const DEFAULT_ROOMS: RoomDef[] = [
  {
    id: 'room-late-night',
    name: 'Late Night Chill',
    vibe: 'Chill',
    icon: '🌙',
    bgGradient: 'from-cyan-950/40 via-blue-900/10 to-transparent',
    color: 'text-cyan-300',
    defaultTrack: {
      id: 'yt-8sLS2knUa6M',
      provider: 'youtube',
      providerTrackId: '8sLS2knUa6M',
      videoId: '8sLS2knUa6M',
      youtubeVideoId: '8sLS2knUa6M',
      title: 'Phir Aur Kya Chahiye (Lo-Fi Chill)',
      artist: 'Arijit Singh',
      artwork: 'https://img.youtube.com/vi/8sLS2knUa6M/hqdefault.jpg',
      duration: 266,
      genre: 'Lo-Fi Chill',
      isStreamable: true,
      playable: true,
      playbackType: 'youtube_embed'
    }
  },
  {
    id: 'room-bollywood',
    name: 'Bollywood Lovers',
    vibe: 'Bollywood',
    icon: '✨',
    bgGradient: 'from-pink-950/40 via-rose-900/10 to-transparent',
    color: 'text-pink-300',
    defaultTrack: {
      id: 'yt-BddP6PYo2gs',
      provider: 'youtube',
      providerTrackId: 'BddP6PYo2gs',
      videoId: 'BddP6PYo2gs',
      youtubeVideoId: 'BddP6PYo2gs',
      title: 'Kesariya (Acoustic)',
      artist: 'Arijit Singh',
      artwork: 'https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg',
      duration: 268,
      genre: 'Bollywood',
      isStreamable: true,
      playable: true,
      playbackType: 'youtube_embed'
    }
  },
  {
    id: 'room-study',
    name: 'Study Mode',
    vibe: 'Focused',
    icon: '📚',
    bgGradient: 'from-amber-950/40 via-orange-900/10 to-transparent',
    color: 'text-amber-300',
    defaultTrack: {
      id: 'yt-jfKfPfyJRdk',
      provider: 'youtube',
      providerTrackId: 'jfKfPfyJRdk',
      videoId: 'jfKfPfyJRdk',
      youtubeVideoId: 'jfKfPfyJRdk',
      title: 'Lofi Focus Beats',
      artist: 'Lofi Girl',
      artwork: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
      duration: 300,
      genre: 'Focused Lo-Fi',
      isStreamable: true,
      playable: true,
      playbackType: 'youtube_embed'
    }
  },
  {
    id: 'room-party',
    name: 'Party Energy',
    vibe: 'Energetic',
    icon: '🎉',
    bgGradient: 'from-rose-950/40 via-purple-900/10 to-transparent',
    color: 'text-rose-300',
    defaultTrack: {
      id: 'yt-huxhqphtcA4',
      provider: 'youtube',
      providerTrackId: 'huxhqphtcA4',
      videoId: 'huxhqphtcA4',
      youtubeVideoId: 'huxhqphtcA4',
      title: 'Club Anthems (Remix)',
      artist: 'Sony Music Party',
      artwork: 'https://img.youtube.com/vi/huxhqphtcA4/hqdefault.jpg',
      duration: 200,
      genre: 'Party EDM',
      isStreamable: true,
      playable: true,
      playbackType: 'youtube_embed'
    }
  },
  {
    id: 'room-sad',
    name: 'Sad Hours',
    vibe: 'Melancholic',
    icon: '🌧️',
    bgGradient: 'from-violet-950/40 via-indigo-900/10 to-transparent',
    color: 'text-violet-300',
    defaultTrack: {
      id: 'yt-8sLS2knUa6M',
      provider: 'youtube',
      providerTrackId: '8sLS2knUa6M',
      videoId: '8sLS2knUa6M',
      youtubeVideoId: '8sLS2knUa6M',
      title: 'Sad Hours Instrumental',
      artist: 'Aura Bloom',
      artwork: 'https://img.youtube.com/vi/8sLS2knUa6M/hqdefault.jpg',
      duration: 266,
      genre: 'Melancholic Instrumental',
      isStreamable: true,
      playable: true,
      playbackType: 'youtube_embed'
    }
  },
  {
    id: 'room-feel-good',
    name: 'Feel Good',
    vibe: 'Happy',
    icon: '☀️',
    bgGradient: 'from-emerald-950/40 via-teal-900/10 to-transparent',
    color: 'text-emerald-300',
    defaultTrack: {
      id: 'yt-Z1x6O8G8k3Y',
      provider: 'youtube',
      providerTrackId: 'Z1x6O8G8k3Y',
      videoId: 'Z1x6O8G8k3Y',
      youtubeVideoId: 'Z1x6O8G8k3Y',
      title: 'Happy Acoustics',
      artist: 'KK Classics',
      artwork: 'https://img.youtube.com/vi/Z1x6O8G8k3Y/hqdefault.jpg',
      duration: 310,
      genre: 'Acoustic Pop',
      isStreamable: true,
      playable: true,
      playbackType: 'youtube_embed'
    }
  },
  {
    id: 'room-indie',
    name: 'Indie Discoveries',
    vibe: 'Indie',
    icon: '🎸',
    bgGradient: 'from-indigo-950/40 via-violet-900/10 to-transparent',
    color: 'text-indigo-300',
    defaultTrack: {
      id: 'yt-BddP6PYo2gs',
      provider: 'youtube',
      providerTrackId: 'BddP6PYo2gs',
      videoId: 'BddP6PYo2gs',
      youtubeVideoId: 'BddP6PYo2gs',
      title: 'Indie Wave Discovery',
      artist: 'Solstice Echo',
      artwork: 'https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg',
      duration: 268,
      genre: 'Indie Wave',
      isStreamable: true,
      playable: true,
      playbackType: 'youtube_embed'
    }
  },
  {
    id: 'room-lofi',
    name: 'Lo-Fi Focus',
    vibe: 'Lo-Fi',
    icon: '🎧',
    bgGradient: 'from-fuchsia-950/40 via-purple-900/10 to-transparent',
    color: 'text-fuchsia-300',
    defaultTrack: {
      id: 'yt-jfKfPfyJRdk',
      provider: 'youtube',
      providerTrackId: 'jfKfPfyJRdk',
      videoId: 'jfKfPfyJRdk',
      youtubeVideoId: 'jfKfPfyJRdk',
      title: 'Relaxing Lo-Fi',
      artist: 'Komorebi Sound',
      artwork: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
      duration: 300,
      genre: 'Lo-Fi',
      isStreamable: true,
      playable: true,
      playbackType: 'youtube_embed'
    }
  }
];

interface ChatMsg {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
}

interface Member {
  id: string;
  displayName: string;
  username: string;
  lastSeen: number;
  currentTrack?: { title: string; artist: string };
}

export const VibeRoomsView: React.FC = () => {
  const { roomId: urlRoomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusic();
  const { triggerFloatingEmoji } = useTheme();

  const [activeRoomId, setActiveRoomId] = useState<string | null>(urlRoomId || null);
  const [roomPresences, setRoomPresences] = useState<Record<string, number>>({});
  const [currentTracks, setCurrentTracks] = useState<Record<string, string>>({});
  const [isPlayingMap, setIsPlayingMap] = useState<Record<string, boolean>>({});

  // Active room specific state
  const [members, setMembers] = useState<Member[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [inputText, setInputText] = useState('');
  const [queue, setQueue] = useState<Track[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeRoom = DEFAULT_ROOMS.find(r => r.id === activeRoomId);

  // Sync route path changes with component state
  useEffect(() => {
    setActiveRoomId(urlRoomId || null);
  }, [urlRoomId]);

  // Real-time aggregate counts for ALL default rooms
  useEffect(() => {
    const unsubscribes = DEFAULT_ROOMS.map(room => {
      const collRef = collection(db, `vibeRooms/${room.id}/members`);
      return onSnapshot(collRef, (snapshot) => {
        const count = snapshot.docs.length;
        setRoomPresences(prev => ({ ...prev, [room.id]: count }));

        // Resolve current tracks inside the room from first host
        if (count > 0) {
          const firstMember = snapshot.docs[0].data() as any;
          if (firstMember?.currentTrack) {
            setCurrentTracks(prev => ({ ...prev, [room.id]: firstMember.currentTrack.title }));
            setIsPlayingMap(prev => ({ ...prev, [room.id]: true }));
          } else {
            setCurrentTracks(prev => ({ ...prev, [room.id]: room.defaultTrack.title }));
            setIsPlayingMap(prev => ({ ...prev, [room.id]: false }));
          }
        } else {
          setCurrentTracks(prev => ({ ...prev, [room.id]: room.defaultTrack.title }));
          setIsPlayingMap(prev => ({ ...prev, [room.id]: false }));
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  // Real-time Presence, Chat, and Queue inside selected Vibe Room
  useEffect(() => {
    if (!user || !activeRoomId) return;

    // 1. Join Room write & periodic Heartbeat update
    const memberDocRef = doc(db, `vibeRooms/${activeRoomId}/members`, user.id);
    const writePresence = () => {
      setDoc(memberDocRef, {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        lastSeen: Date.now(),
        currentTrack: currentTrack ? { title: currentTrack.title, artist: currentTrack.artist } : null
      }).catch(() => {});
    };

    writePresence();

    const heartbeat = setInterval(writePresence, 30000);

    // 2. Real-time Members List updates
    const membersCollRef = collection(db, `vibeRooms/${activeRoomId}/members`);
    const unsubscribeMembers = onSnapshot(membersCollRef, (snapshot) => {
      const activeMembers: Member[] = [];
      const threshold = Date.now() - 120000; // 2 minutes threshold for inactive users

      snapshot.docs.forEach(doc => {
        const data = doc.data() as any;
        if (data.lastSeen > threshold) {
          activeMembers.push({
            id: data.id,
            displayName: data.displayName || 'Viber',
            username: data.username || 'user',
            lastSeen: data.lastSeen,
            currentTrack: data.currentTrack
          });
        }
      });
      setMembers(activeMembers);
    });

    // 3. Real-time Room Chat updates
    const chatCollRef = collection(db, `vibeRooms/${activeRoomId}/messages`);
    const chatQuery = query(chatCollRef, orderBy('createdAt', 'asc'));
    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const msgs: ChatMsg[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          text: data.text || '',
          senderId: data.senderId || '',
          senderName: data.senderName || 'Viber',
          createdAt: data.createdAt
        });
      });
      setChatMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // 4. Real-time Shared Queue updates
    const queueCollRef = collection(db, `vibeRooms/${activeRoomId}/queue`);
    const unsubscribeQueue = onSnapshot(queueCollRef, (snapshot) => {
      const q: Track[] = [];
      snapshot.docs.forEach(doc => {
        q.push(doc.data() as Track);
      });
      setQueue(q);
    });

    // Clean up join write on unmount / room leave
    return () => {
      clearInterval(heartbeat);
      unsubscribeMembers();
      unsubscribeChat();
      unsubscribeQueue();
      deleteDoc(memberDocRef).catch(() => {});
    };
  }, [user, activeRoomId, currentTrack]);

  // Handle Room Chat Message Submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeRoomId || !inputText.trim()) return;

    try {
      const chatCollRef = collection(db, `vibeRooms/${activeRoomId}/messages`);
      await addDoc(chatCollRef, {
        text: inputText,
        senderId: user.id,
        senderName: user.displayName,
        createdAt: serverTimestamp()
      });
      setInputText('');
      triggerFloatingEmoji('💬');
    } catch (err) {
      console.error('[ROOM_CHAT_ERROR]', err);
    }
  };

  // Add standard song into room queue
  const handleAddToRoomQueue = async (track: Track) => {
    if (!activeRoomId) return;
    try {
      const queueDocRef = doc(db, `vibeRooms/${activeRoomId}/queue`, track.id);
      await setDoc(queueDocRef, track);
      triggerFloatingEmoji('🎵');
    } catch (err) {
      console.warn('[ROOM_QUEUE_ADD_FAIL]', err);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    triggerFloatingEmoji('✨');
    navigate(`/vibe-rooms/${roomId}`);
  };

  const handleLeaveRoom = () => {
    triggerFloatingEmoji('👋');
    navigate('/vibe-rooms');
  };

  // --- 1. RENDER ACTIVE ROOM SCREEN ---
  if (activeRoomId && activeRoom) {
    return (
      <div className="flex-1 overflow-hidden w-full h-full flex flex-col p-4 md:p-8 space-y-6 animate-page-enter">
        {/* Room Header Banner */}
        <LiquidGlassCard depth={3} className="p-4 md:p-6 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-violet-500/30 border border-white/20 flex items-center justify-center text-2xl shadow-lg shrink-0">
              {activeRoom.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight uppercase truncate">{activeRoom.name}</h1>
                <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Vibe: {activeRoom.vibe}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">Listening live with {members.length} friends</p>
            </div>
          </div>

          <LiquidGlassButton variant="secondary" size="sm" onClick={handleLeaveRoom} className="shrink-0 font-bold">
            Leave Room
          </LiquidGlassButton>
        </LiquidGlassCard>

        {/* Multi-Panel Grid for Workspace */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Currently Playing & Queue (Col 1) */}
          <div className="lg:col-span-1 min-h-0 flex flex-col space-y-4">
            {/* Playing Status */}
            <LiquidGlassCard depth={2} className="p-4 space-y-4 shrink-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Currently Spinning</span>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={currentTrack?.artwork || activeRoom.defaultTrack.artwork}
                  alt={currentTrack?.title || activeRoom.defaultTrack.title}
                  className={`w-14 h-14 rounded-xl object-cover border border-white/10 shadow-md ${isPlaying ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '10s' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{currentTrack?.title || activeRoom.defaultTrack.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{currentTrack?.artist || activeRoom.defaultTrack.artist}</div>
                </div>
                <button
                  onClick={() => playTrack(currentTrack || activeRoom.defaultTrack)}
                  className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            </LiquidGlassCard>

            {/* Members / Participants list */}
            <LiquidGlassCard depth={2} className="p-4 flex-1 min-h-0 flex flex-col">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-white/5 shrink-0">
                <Users className="w-3.5 h-3.5 text-violet-400" />
                <span>Listeners Inside ({members.length})</span>
              </div>

              <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 scrollbar-thin pr-1">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600/30 to-cyan-500/30 border border-white/15 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {m.displayName[0]?.toUpperCase() || 'P'}
                      </div>
                      <span className="font-semibold text-slate-200 truncate">{m.displayName}</span>
                    </div>
                    {m.currentTrack && (
                      <span className="text-[10px] text-cyan-400 font-semibold truncate max-w-[120px]">
                        🎵 {m.currentTrack.title}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </LiquidGlassCard>
          </div>

          {/* MIDDLE: Realtime Room Chat Panel (Col 2) */}
          <LiquidGlassCard depth={2} className="lg:col-span-2 min-h-0 flex flex-col p-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-white/5 shrink-0">
              <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
              <span>Room Session Chat</span>
            </div>

            {/* Chat message list viewport */}
            <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3 scrollbar-thin pr-1">
              {chatMessages.map(msg => {
                const isSelf = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-0.5`}>
                    <span className="text-[9px] text-slate-500 font-semibold pl-1 pr-1">{msg.senderName}</span>
                    <div className={`p-2.5 rounded-2xl text-xs max-w-[85%] border ${
                      isSelf ? 'bg-cyan-500/15 border-cyan-400/20 text-white rounded-tr-xs' : 'bg-white/[0.04] border-white/5 text-slate-200 rounded-tl-xs'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Message composer input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-white/5 shrink-0">
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Share your music thoughts with the room..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-600 hover:from-cyan-300 text-white shadow-md cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </LiquidGlassCard>
        </div>
      </div>
    );
  }

  // --- 2. RENDER ROOMS LISTING SCREEN ---
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-28 md:pb-32 space-y-8 max-w-6xl mx-auto w-full animate-page-enter">
      {/* Listing Header */}
      <div className="pb-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Compass className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <span>Vibe Rooms</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Join real-time music circles with listeners tuned to your frequency</p>
        </div>

        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold">{Object.values(roomPresences).reduce((a, b) => a + b, 0)} users active</span>
        </div>
      </div>

      {/* Grid of Available Vibe Rooms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DEFAULT_ROOMS.map(room => {
          const count = roomPresences[room.id] || 0;
          const currentSongTitle = currentTracks[room.id] || room.defaultTrack.title;
          const isPlaying = isPlayingMap[room.id] || false;

          return (
            <LiquidGlassCard
              key={room.id}
              depth={2}
              className={`p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all group overflow-hidden relative bg-gradient-to-tr ${room.bgGradient}`}
            >
              <div className="space-y-3.5">
                {/* Room top indicators */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-300 shrink-0">
                    {room.icon}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 font-mono">
                    <Users className="w-3.5 h-3.5 text-violet-400" />
                    <span>{count} Vibing</span>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors uppercase tracking-wide">
                    {room.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Vibe</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${room.color}`}>{room.vibe}</span>
                  </div>
                </div>

                {/* Now Playing Area */}
                <div className="pt-2.5 border-t border-white/5 space-y-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Spinning Now</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={room.defaultTrack.artwork}
                        alt="artwork"
                        className="w-8 h-8 rounded-lg object-cover border border-white/10 shadow-sm"
                      />
                      {isPlaying && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-slate-300 block truncate leading-tight">
                        {currentSongTitle}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Join Action button */}
              <div className="pt-2">
                <LiquidGlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleJoinRoom(room.id)}
                  className="w-full justify-center text-xs"
                >
                  Join Room
                </LiquidGlassButton>
              </div>
            </LiquidGlassCard>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMusic } from '../../context/MusicContext';
import { useTheme } from '../../context/ThemeContext';
import { Track } from '../../types';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { DailyMoodTracker } from '../music/DailyMoodTracker';
import { MusicVisualizerEqualizer } from '../ui/MusicVisualizerEqualizer';
import { 
  MessageSquare, 
  Compass, 
  Radio, 
  Mic, 
  Video, 
  Settings, 
  Play, 
  Flame, 
  Sparkles, 
  Headphones,
  Music2,
  Star,
  Lightbulb
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { queue, playTrack, addToQueue, currentTrack, isPlaying } = useMusic();
  const { triggerFloatingEmoji } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return { text: 'Late Night Vibe', icon: '🌌' };
    if (hour < 12) return { text: 'Good Morning', icon: '🎧' };
    if (hour < 17) return { text: 'Good Afternoon', icon: '☀️' };
    return { text: 'Good Evening', icon: '🌙' };
  };

  const greeting = getGreeting();

  const welcomeTracks: Track[] = [
    {
      id: 'welcome-1',
      title: 'Sunrise Glow',
      artist: 'Solstice Echo',
      artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
      streamUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
      duration: 180,
      genre: 'Chill-positive',
      provider: 'audius',
      isStreamable: true
    },
    {
      id: 'welcome-2',
      title: 'Electric Energy',
      artist: 'Komorebi Sound',
      artwork: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&h=300&fit=crop',
      streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
      duration: 210,
      genre: 'Energetic',
      provider: 'audius',
      isStreamable: true
    },
    {
      id: 'welcome-3',
      title: 'Happy Horizons',
      artist: 'Aura Bloom',
      artwork: 'https://images.unsplash.com/photo-1514525253361-bee8a4874a73?w=300&h=300&fit=crop',
      streamUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
      duration: 165,
      genre: 'Happy',
      provider: 'audius',
      isStreamable: true
    }
  ];

  const handlePlayWelcomeMix = () => {
    if (welcomeTracks.length > 0) {
      playTrack(welcomeTracks[0]);
      // Add others to queue
      welcomeTracks.slice(1).forEach(t => addToQueue(t));
    }
  };

  const quickFeatures = [
    { title: 'Music Discovery', desc: 'Audius, YouTube, SoundCloud', path: '/music', icon: Music2, color: 'text-rose-400', bg: 'from-rose-500/20 to-pink-500/10' },
    { title: 'Chat & Connect', desc: 'End-to-End Encrypted Messaging', path: '/chat', icon: MessageSquare, color: 'text-cyan-400', bg: 'from-cyan-500/20 to-blue-500/10' },
    { title: 'Vibe Rooms', desc: 'Realtime Shared Audio Spaces', path: '/vibe-rooms', icon: Compass, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-500/10' },
    { title: 'Listen Together', desc: 'Synchronized Private Audio Rooms', path: '/listen-together', icon: Radio, color: 'text-indigo-400', bg: 'from-indigo-500/20 to-violet-500/10' },
    { title: 'Sing Together', desc: 'Audio Duet & Harmonies Studio', path: '/sing-together', icon: Mic, color: 'text-violet-400', bg: 'from-violet-500/20 to-purple-500/10' },
    { title: 'Settings', desc: 'Themes, Audio, Preferences', path: '/settings', icon: Settings, color: 'text-amber-400', bg: 'from-amber-500/20 to-orange-500/10' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 md:pb-32 space-y-8 max-w-6xl mx-auto w-full">
      {/* Hero Welcome Banner */}
      <LiquidGlassCard depth={3} glow={true} className="p-8 md:p-10 relative overflow-hidden">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-cyan-400 uppercase">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>SONIVA SOCIAL AUDIO</span>
          </div>

          <div className="space-y-1 animate-page-enter">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {greeting.text}{user ? `, ${user.displayName.split(' ')[0]}` : ''} {greeting.icon}
            </h1>
            <p className="text-lg md:text-xl font-medium bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-300 bg-clip-text text-transparent animate-pulse" style={{ animationDuration: '6s' }}>
              Ready for your vibe?
            </p>
          </div>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Welcome to SONIVA. Explore real-time YouTube & Audius music discovery, listen in sync with friends, or start encrypted private chats.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <LiquidGlassButton
              variant="primary"
              size="lg"
              glow={true}
              onClick={() => {
                triggerFloatingEmoji('🎵');
                navigate('/music');
              }}
              className="gap-2 text-xs font-bold"
            >
              <Music2 className="w-4 h-4" />
              <span>EXPLORE MUSIC DISCOVERY</span>
            </LiquidGlassButton>

            <LiquidGlassButton
              variant="secondary"
              size="lg"
              onClick={() => navigate('/chat')}
              className="gap-2 text-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>OPEN CHATS</span>
            </LiquidGlassButton>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Welcome Music Recommendations */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Welcome Mix</span>
          </h2>
          <LiquidGlassButton 
            variant="secondary" 
            size="sm" 
            onClick={handlePlayWelcomeMix}
            className="text-[10px] h-8 px-4 font-bold"
          >
            Play Welcome Mix
          </LiquidGlassButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {welcomeTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id || currentTrack?.title === track.title;
            return (
              <LiquidGlassCard
                key={track.id}
                depth={isCurrent ? 3 : 2}
                glow={isCurrent}
                className={`p-4 flex items-center gap-4 hover:border-cyan-500/40 group transition-all soniva-song-card cursor-pointer relative overflow-hidden ${
                  isCurrent 
                    ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30' 
                    : ''
                }`}
                onClick={() => playTrack(track)}
              >
                <div className="relative shrink-0 overflow-hidden rounded-xl">
                  <img
                    src={track.artwork}
                    alt={track.title}
                    className={`w-14 h-14 object-cover border border-white/10 group-hover:scale-105 transition-transform duration-300 ${
                      isCurrent && isPlaying ? 'animate-pulse' : ''
                    }`}
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Play className="w-5 h-5 fill-white text-white soniva-play-btn" />
                  </div>
                  {isCurrent && isPlaying && (
                    <div className="absolute inset-0 ring-2 ring-cyan-400 rounded-xl animate-ping opacity-35" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-bold truncate group-hover:text-cyan-300 transition-colors flex items-center gap-1.5 ${isCurrent ? 'text-cyan-300' : 'text-white'}`}>
                    <span>{track.title}</span>
                    <MusicVisualizerEqualizer 
                      isPlaying={isCurrent && isPlaying} 
                      bars={3} 
                      color={isCurrent ? 'cyan' : 'violet'} 
                      className="ml-1 shrink-0 scale-90"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mb-1">
                    {track.artist}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold tracking-wide flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-cyan-400' : 'bg-slate-500'}`} />
                    <span>{track.genre}</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    playTrack(track);
                  }}
                  className={`p-2.5 rounded-full transition-all cursor-pointer shrink-0 ${
                    isCurrent 
                      ? 'bg-cyan-500 text-slate-950 border border-cyan-400 opacity-100 shadow-[0_0_12px_rgba(6,182,212,0.6)] hover:scale-105' 
                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 opacity-0 group-hover:opacity-100 hover:bg-cyan-500/25 soniva-play-btn'
                  }`}
                  title="Play track"
                >
                  {isCurrent && isPlaying ? (
                    <span className="flex items-center justify-center w-3.5 h-3.5 font-extrabold text-[9px] uppercase tracking-tighter">On</span>
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
              </LiquidGlassCard>
            );
          })}
        </div>
      </div>

      {/* Daily Mood Tracker & Curated Vibe Playlist */}
      <DailyMoodTracker />

      {/* Main Feature Tiles */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Flame className="w-4 h-4 text-cyan-400" />
          <span>Made for your mood</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <LiquidGlassCard
                key={feat.path}
                depth={2}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 cursor-pointer group transition-all"
                onClick={() => navigate(feat.path)}
              >
                <div className="space-y-2">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${feat.bg} border border-white/10 flex items-center justify-center ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-cyan-400 font-semibold pt-2 border-t border-white/5">
                  <span>Launch Feature</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </LiquidGlassCard>
            );
          })}
        </div>
      </div>

      {/* Curated Queue / Trending Preview */}
      {queue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Headphones className="w-4 h-4 text-violet-400" />
              <span>Recently Played & Your Vibe</span>
            </h2>
            <button onClick={() => navigate('/music')} className="text-xs text-cyan-400 hover:text-cyan-300">
              View All Songs →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {queue.slice(0, 4).map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={track.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                      alt={track.title}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{track.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{track.artist}</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 font-semibold group-hover:underline">
                  ▶ Play
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

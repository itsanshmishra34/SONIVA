import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMusic } from '../../context/MusicContext';
import { useTheme } from '../../context/ThemeContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { Track } from '../../types';
import { Sparkles, Play, Heart, Check, Radio, Flame, Compass, Headphones } from 'lucide-react';

interface MoodOption {
  id: string;
  label: string;
  icon: string;
  tagline: string;
  color: string;
  bgGradient: string;
  searchQuery: string;
  curatedTracks: Track[];
}

export const DailyMoodTracker: React.FC = () => {
  const { user } = useAuth();
  const { playTrack, addToQueue } = useMusic();
  const { triggerFloatingEmoji } = useTheme();

  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSavedToday, setHasSavedToday] = useState(false);
  const [note, setNote] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const moodOptions: MoodOption[] = [
    {
      id: 'calm',
      label: 'Calm & Chill',
      icon: '🌌',
      tagline: 'Mellow beats, ambient soundscapes, and soothing acoustics',
      color: 'text-cyan-300',
      bgGradient: 'from-cyan-500/20 via-teal-500/10 to-transparent',
      searchQuery: 'Lo-Fi Chillout Bollywood Acoustic',
      curatedTracks: [
        {
          id: 'yt-kesariya-acoustic',
          provider: 'youtube',
          videoId: 'BddP6PYo2gs',
          youtubeVideoId: 'BddP6PYo2gs',
          title: 'Kesariya (Acoustic Unplugged)',
          artist: 'Arijit Singh',
          album: 'Brahmastra',
          artwork: 'https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg',
          duration: 268,
          durationMs: 268000,
          genre: 'Acoustic Chill',
          playable: true,
          playbackType: 'youtube_embed'
        },
        {
          id: 'yt-phir-kya-chahiye',
          provider: 'youtube',
          videoId: '8sLS2knUa6M',
          youtubeVideoId: '8sLS2knUa6M',
          title: 'Phir Aur Kya Chahiye (Soft Chill)',
          artist: 'Arijit Singh & Sachin-Jigar',
          album: 'Zara Hatke Zara Bachke',
          artwork: 'https://img.youtube.com/vi/8sLS2knUa6M/hqdefault.jpg',
          duration: 266,
          durationMs: 266000,
          genre: 'Lo-Fi Acoustic',
          playable: true,
          playbackType: 'youtube_embed'
        }
      ]
    },
    {
      id: 'energetic',
      label: 'High Energy',
      icon: '⚡',
      tagline: 'High-tempo dance anthems, electro hits, and pulse beats',
      color: 'text-amber-300',
      bgGradient: 'from-amber-500/20 via-rose-500/10 to-transparent',
      searchQuery: 'Bollywood Dance Hits Synthwave High Energy',
      curatedTracks: [
        {
          id: 'yt-besharam-rang',
          provider: 'youtube',
          videoId: 'huxhqphtcA4',
          youtubeVideoId: 'huxhqphtcA4',
          title: 'Besharam Rang (Club Remix)',
          artist: 'Shilpa Rao & Vishal-Shekhar',
          album: 'Pathaan',
          artwork: 'https://img.youtube.com/vi/huxhqphtcA4/hqdefault.jpg',
          duration: 200,
          durationMs: 200000,
          genre: 'Dance / Electro',
          playable: true,
          playbackType: 'youtube_embed'
        },
        {
          id: 'yt-jhoom-remix',
          provider: 'youtube',
          videoId: 'qO84v7Y-0O8',
          youtubeVideoId: 'qO84v7Y-0O8',
          title: 'Jhoom (High Energy Electronic)',
          artist: 'Ali Zafar',
          album: 'Single',
          artwork: 'https://img.youtube.com/vi/qO84v7Y-0O8/hqdefault.jpg',
          duration: 215,
          durationMs: 215000,
          genre: 'Dance',
          playable: true,
          playbackType: 'youtube_embed'
        }
      ]
    },
    {
      id: 'melancholic',
      label: 'Moody & Soulful',
      icon: '🌧️',
      tagline: 'Deep lyrics, emotional strings, and contemplative melodies',
      color: 'text-indigo-300',
      bgGradient: 'from-indigo-500/20 via-violet-500/10 to-transparent',
      searchQuery: 'Arijit Singh Sad Soulful Hits',
      curatedTracks: [
        {
          id: 'yt-agar-tum-saath-ho',
          provider: 'youtube',
          videoId: 'sK7riqg254H',
          youtubeVideoId: 'sK7riqg254H',
          title: 'Agar Tum Saath Ho (Soulful Version)',
          artist: 'Arijit Singh & Alka Yagnik',
          album: 'Tamasha',
          artwork: 'https://img.youtube.com/vi/sK7riqg254H/hqdefault.jpg',
          duration: 341,
          durationMs: 341000,
          genre: 'Soulful Sad',
          playable: true,
          playbackType: 'youtube_embed'
        }
      ]
    },
    {
      id: 'romantic',
      label: 'Romantic Vibe',
      icon: '💖',
      tagline: 'Heartfelt duets, sweet harmonies, and warm romantic tunes',
      color: 'text-pink-300',
      bgGradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
      searchQuery: 'Shreya Ghoshal Romantic Hits Duets',
      curatedTracks: [
        {
          id: 'yt-tere-vaaste',
          provider: 'youtube',
          videoId: 'A1yU3m4L5pQ',
          youtubeVideoId: 'A1yU3m4L5pQ',
          title: 'Tere Vaaste (Romantic Acoustic)',
          artist: 'Varun Jain & Sachin-Jigar',
          album: 'Zara Hatke Zara Bachke',
          artwork: 'https://img.youtube.com/vi/A1yU3m4L5pQ/hqdefault.jpg',
          duration: 190,
          durationMs: 190000,
          genre: 'Romantic',
          playable: true,
          playbackType: 'youtube_embed'
        }
      ]
    },
    {
      id: 'focused',
      label: 'Deep Focus',
      icon: '🎯',
      tagline: 'Flow state instrumental beats for deep work and study',
      color: 'text-violet-300',
      bgGradient: 'from-violet-500/20 via-indigo-500/10 to-transparent',
      searchQuery: 'Deep Focus Instrumental Study Synth',
      curatedTracks: [
        {
          id: 'yt-lofi-hiphop-focus',
          provider: 'youtube',
          videoId: 'jfKfPfyJRdk',
          youtubeVideoId: 'jfKfPfyJRdk',
          title: 'Lofi Focus Beats for Work & Study',
          artist: 'Lofi Girl Focus',
          album: 'Focus Waves',
          artwork: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
          duration: 300,
          durationMs: 300000,
          genre: 'Instrumental',
          playable: true,
          playbackType: 'youtube_embed'
        }
      ]
    },
    {
      id: 'nostalgic',
      label: 'Nostalgic 2000s',
      icon: '🌅',
      tagline: 'Timeless 2000s Bollywood classics and vintage vibes',
      color: 'text-emerald-300',
      bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      searchQuery: 'KK Sonu Nigam 2000s Bollywood Classics',
      curatedTracks: [
        {
          id: 'yt-kk-classics',
          provider: 'youtube',
          videoId: 'Z1x6O8G8k3Y',
          youtubeVideoId: 'Z1x6O8G8k3Y',
          title: 'Labon Ko (Classic Retro)',
          artist: 'KK',
          album: 'Bhool Bhulaiyaa',
          artwork: 'https://img.youtube.com/vi/Z1x6O8G8k3Y/hqdefault.jpg',
          duration: 310,
          durationMs: 310000,
          genre: 'Classic',
          playable: true,
          playbackType: 'youtube_embed'
        }
      ]
    }
  ];

  const handleSelectMood = async (mood: MoodOption) => {
    setSelectedMood(mood);
    triggerFloatingEmoji(mood.icon);
    setIsLoading(true);

    try {
      // Fetch dynamic tracks from YouTube search endpoint for this mood
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(mood.searchQuery)}&maxResults=10`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          setPlaylist(data.tracks);
        } else {
          setPlaylist(mood.curatedTracks);
        }
      } else {
        setPlaylist(mood.curatedTracks);
      }
    } catch (e) {
      setPlaylist(mood.curatedTracks);
    } finally {
      setIsLoading(false);
    }

    // Record mood log
    if (user) {
      try {
        await fetch('/api/mood/entry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.id}`
          },
          body: JSON.stringify({
            emotion: mood.id,
            emotionLabel: mood.label,
            icon: mood.icon,
            date: todayStr,
            note
          })
        });
        setHasSavedToday(true);
      } catch (err) {
        console.warn('[MOOD_LOG_NOTICE]', err);
      }
    }
  };

  const handlePlayVibePlaylist = () => {
    if (playlist.length === 0) return;
    triggerFloatingEmoji('🎧');
    playTrack(playlist[0]);
    if (playlist.length > 1) {
      playlist.slice(1).forEach((t) => addToQueue(t));
    }
  };

  return (
    <LiquidGlassCard depth={3} glow={true} className="p-6 md:p-8 space-y-6 relative overflow-hidden border-cyan-500/20">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-violet-500/30 border border-white/20 flex items-center justify-center text-xl shadow-lg">
            🎭
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">DAILY MOOD & VIBE TRACKER</h2>
              <span className="text-[11px] font-bold text-cyan-300 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Morning Vibe
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Select how you feel today and SONIVA will curate your morning mood playlist.
            </p>
          </div>
        </div>

        {hasSavedToday && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 tracking-wide select-none">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Saved for Today</span>
          </span>
        )}
      </div>

      {/* Mood Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {moodOptions.map((mood) => {
          const isSelected = selectedMood?.id === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => handleSelectMood(mood)}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'bg-gradient-to-tr from-cyan-500/30 via-violet-500/20 to-transparent border-cyan-400 shadow-xl shadow-cyan-950/40 scale-[1.02]'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{mood.icon}</span>
                {isSelected && <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />}
              </div>
              <div>
                <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'} group-hover:text-white`}>
                  {mood.label}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{mood.tagline}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Mood & Playlist Container */}
      {selectedMood && (
        <div className={`p-5 rounded-2xl bg-gradient-to-r ${selectedMood.bgGradient} border border-white/15 space-y-4 animate-in fade-in duration-300`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedMood.icon}</span>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>{selectedMood.label} Playlist</span>
                  <span className={`text-xs font-normal ${selectedMood.color}`}>({playlist.length} Vibe Tracks)</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">{selectedMood.tagline}</p>
              </div>
            </div>

            {playlist.length > 0 && (
              <LiquidGlassButton
                variant="primary"
                size="md"
                glow={true}
                onClick={handlePlayVibePlaylist}
                className="gap-2 text-xs font-bold shrink-0"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Vibe Playlist</span>
              </LiquidGlassButton>
            )}
          </div>

          {/* Playlist Track Items */}
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span>Curating your {selectedMood.label} vibe...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
              {playlist.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={track.artwork || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                      alt={track.title}
                      className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{track.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{track.artist}</div>
                    </div>
                  </div>

                  <span className="text-[11px] text-cyan-300 font-medium group-hover:underline shrink-0 ml-2">
                    ▶ Play
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </LiquidGlassCard>
  );
};

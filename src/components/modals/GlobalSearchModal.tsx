import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Track, User, MusicProviderType, WebSearchResult } from '../../types';
import { UnifiedMusicService } from '../../services/MusicService';
import { useMusic } from '../../context/MusicContext';
import { useTheme } from '../../context/ThemeContext';
import { usePublicSync } from '../../context/PublicSyncProvider';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { GoogleSearchClient, GoogleSearchResponse } from '../../services/googleSearchClient';
import { WebSearchResultCard } from '../search/WebSearchResultCard';
import {
  Search,
  X,
  Play,
  Pause,
  Plus,
  Heart,
  Radio,
  MessageSquare,
  Compass,
  CornerDownRight,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Globe
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUserToChat?: (user: User) => void;
  onSendTrackToChat?: (track: Track) => void;
  onStartListenTogether?: (track: Track) => void;
  inline?: boolean;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUserToChat,
  onSendTrackToChat,
  onStartListenTogether,
  inline = false
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUrlQuery = searchParams.get('q') || '';

  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    addToQueue,
    playNextInQueue,
    toggleFavorite,
    favorites,
    audioError
  } = useMusic();
  const { triggerFloatingEmoji } = useTheme();
  const { isPublicSyncActive, setRoomTrack } = usePublicSync();

  const [activeTab, setActiveTab] = useState<'songs' | 'artists' | 'playlists' | 'people' | 'rooms'>('songs');
  const [selectedProvider, setSelectedProvider] = useState<'all' | 'audius' | 'soundcloud' | 'youtube' | 'web'>('all');
  const [query, setQuery] = useState(initialUrlQuery);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [webResults, setWebResults] = useState<WebSearchResult[]>([]);
  const [people, setPeople] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scWarning, setScWarning] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<{ message: string; code?: string } | null>(null);
  const [providerStats, setProviderStats] = useState<{
    audius: { available: boolean; count: number; message?: string };
    soundcloud: { available: boolean; count: number; message?: string };
    youtube: { available: boolean; count: number; message?: string };
  }>({
    audius: { available: true, count: 0 },
    soundcloud: { available: false, count: 0 },
    youtube: { available: true, count: 0 }
  });

  // Keep query in sync with search params when inline
  useEffect(() => {
    if (inline) {
      const q = searchParams.get('q') || '';
      setQuery(q);
    }
  }, [searchParams, inline]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (inline) {
      if (val.trim()) {
        setSearchParams({ q: val }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  };

  // Quick Bollywood and trending suggestions
  const bollywoodSuggestions = [
    'Bollywood',
    'Hindi Hits',
    'Romantic Bollywood',
    'Hindi Classics',
    'Latest Bollywood',
    'Arijit Singh',
    'Shreya Ghoshal',
    'Sonu Nigam',
    'KK',
    'Jubin Nautiyal',
    'Atif Aslam',
    'Diljit Dosanjh',
    'AP Dhillon'
  ];

  useEffect(() => {
    if (!isOpen && !inline) return;

    const timer = setTimeout(() => {
      setIsLoading(true);
      setScWarning(null);
      setSearchError(null);

      if (activeTab === 'people') {
        fetch(`/api/users/search${query.trim() ? `?q=${encodeURIComponent(query)}` : ''}`)
          .then((r) => r.json())
          .then((d) => setPeople(d.users || []))
          .finally(() => setIsLoading(false));
      } else if (selectedProvider === 'web') {
        GoogleSearchClient.search(query)
          .then((res) => {
            if (res.success) {
              setWebResults(res.results || []);
            } else {
              setSearchError({ message: res.error || 'Web search failed', code: res.code });
              setWebResults([]);
            }
          })
          .catch((err) => {
            console.warn('[WEB_SEARCH_ERROR]', err);
            setSearchError({ message: 'Network error during web search' });
            setWebResults([]);
          })
          .finally(() => setIsLoading(false));
      } else {
        UnifiedMusicService.searchTracks(query, { provider: selectedProvider as any, limit: (selectedProvider === 'youtube' || selectedProvider === 'all') ? 25 : 20 })
          .then((result) => {
            // Strictly enforce that only tracks matching selectedProvider are displayed
            const normalizedTracks = (result.tracks || []).filter((t) => {
              if (selectedProvider === 'all') return true;
              return t.provider === selectedProvider;
            });
            setTracks(normalizedTracks);

            if (result.providers) {
              setProviderStats(result.providers);
            }

            if (selectedProvider === 'soundcloud' && !result.providers?.soundcloud?.available) {
              setScWarning(result.providers?.soundcloud?.message || 'SoundCloud credentials missing on server.');
            } else {
              setScWarning(null);
            }
          })
          .catch((e) => {
            console.warn('[GLOBAL_SEARCH_ERROR]', e);
            setTracks([]);
          })
          .finally(() => setIsLoading(false));
      }
    }, query.trim() ? 350 : 0);

    return () => clearTimeout(timer);
  }, [query, activeTab, selectedProvider, isOpen]);

  if (!isOpen && !inline) return null;

  const tabs = [
    { id: 'songs', label: 'Songs' },
    { id: 'artists', label: 'Artists' },
    { id: 'playlists', label: 'Playlists' },
    { id: 'people', label: 'People' },
    { id: 'rooms', label: 'Rooms' }
  ];

  const content = (
    <LiquidGlassCard depth={4} glow={true} className={`w-full ${inline ? 'max-w-4xl' : 'max-w-3xl max-h-[92vh] md:max-h-[88vh]'} flex flex-col p-6 overflow-y-auto overscroll-behavior-y-contain shadow-2xl border-white/20 relative pb-20 md:pb-16`} onClick={(e) => e.stopPropagation()}>
      {/* Header & Search Bar */}
      <div className="space-y-3.5 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight uppercase">
              {selectedProvider === 'web' ? 'Global Web Search' : 'Music Discovery & Search'}
            </h2>
          </div>
          {!inline && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            autoFocus={!inline}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={selectedProvider === 'web' ? "Search anything on Google..." : "Search Bollywood, Hindi songs, artists, Audius or YouTube..."}
            className="w-full bg-white/[0.06] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30"
          />
        </div>

          {/* Source Filter Switcher + Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Source Toggle: [ ALL ] [ AUDIUS ] [ SOUNDCLOUD ] [ YOUTUBE ] [ WEB ] */}
            <div className="inline-flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 shadow-inner overflow-x-auto max-w-full no-scrollbar">
              <button
                onClick={() => setSelectedProvider('all')}
                className={`py-1 px-3 rounded-lg text-[10px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedProvider === 'all'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setSelectedProvider('audius')}
                className={`py-1 px-3 rounded-lg text-[10px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedProvider === 'audius'
                    ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AUDIUS
              </button>
              <button
                onClick={() => setSelectedProvider('soundcloud')}
                className={`py-1 px-3 rounded-lg text-[10px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedProvider === 'soundcloud'
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SOUNDCLOUD
              </button>
              <button
                onClick={() => setSelectedProvider('youtube')}
                className={`py-1 px-3 rounded-lg text-[10px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedProvider === 'youtube'
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                YOUTUBE
              </button>
              <button
                onClick={() => setSelectedProvider('web')}
                className={`py-1 px-3 rounded-lg text-[10px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedProvider === 'web'
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3 h-3" />
                WEB
              </button>
            </div>

            {/* Category Tabs (Hidden for Web) */}
            {selectedProvider !== 'web' && (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-1 px-3 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-white/15 text-white border-white/25 shadow-sm'
                        : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bollywood Quick Search Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Quick:
            </span>
            {bollywoodSuggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => {
                  setQuery(sug);
                  triggerFloatingEmoji('🎵');
                }}
                className="py-1 px-2.5 rounded-lg text-[11px] font-semibold bg-white/[0.04] hover:bg-cyan-500/15 hover:text-cyan-300 hover:border-cyan-500/30 text-slate-300 border border-white/10 transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Results Container */}
        <div className="mt-3 space-y-2 pr-1">
          {/* Provider Status Indicator for ALL Tab */}
          {selectedProvider === 'all' && (
            <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-white/[0.03] border border-white/5 py-1.5 px-3 rounded-xl overflow-x-auto no-scrollbar">
              <span className={`flex items-center gap-1 font-semibold shrink-0 ${providerStats.audius.available ? 'text-indigo-300' : 'text-slate-400'}`}>
                <span>{providerStats.audius.available ? <span className="text-emerald-400">✓</span> : <span className="text-amber-400">⚠</span>}</span>
                Audius {providerStats.audius.available ? `(${providerStats.audius.count})` : '(unavailable)'}
              </span>
              <span className="text-slate-600 shrink-0">·</span>
              <span className={`flex items-center gap-1 font-semibold shrink-0 ${providerStats.soundcloud.available ? 'text-amber-300' : 'text-slate-400'}`}>
                <span>{providerStats.soundcloud.available ? <span className="text-emerald-400">✓</span> : <span className="text-amber-400">⚠</span>}</span>
                SoundCloud {providerStats.soundcloud.available ? `(${providerStats.soundcloud.count})` : '(unavailable)'}
              </span>
              <span className="text-slate-600 shrink-0">·</span>
              <span className={`flex items-center gap-1 font-semibold shrink-0 ${providerStats.youtube.available ? 'text-rose-300' : 'text-slate-400'}`}>
                <span>{providerStats.youtube.available ? <span className="text-emerald-400">✓</span> : <span className="text-amber-400">⚠</span>}</span>
                YouTube {providerStats.youtube.available ? `(${providerStats.youtube.count})` : '(unavailable)'}
              </span>
            </div>
          )}

          {scWarning && (
            <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{scWarning}</span>
            </div>
          )}

          {searchError && (
            <div className="mb-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-bold uppercase tracking-wider text-[10px] text-rose-300">
                  {searchError.code || 'SEARCH_ERROR'}
                </span>
                <span>{searchError.message}</span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <span>{query.trim() ? `Searching across ${selectedProvider.toUpperCase()}...` : 'Finding results...'}</span>
            </div>
          ) : activeTab === 'people' && selectedProvider !== 'web' ? (
            people.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-400">No listeners found matching criteria.</div>
            ) : (
              people.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-white/10 flex items-center justify-center font-bold text-sm text-white">
                      {p.displayName[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{p.displayName}</div>
                      <div className="text-[11px] text-slate-400">
                        @{p.username} <span className="text-slate-600">·</span> {p.gender}
                      </div>
                      <div className="text-[10px] text-cyan-400 mt-0.5">
                        {p.musicInterests.join(', ')}
                      </div>
                    </div>
                  </div>

                  {onSelectUserToChat && (
                    <button
                      onClick={() => {
                        onSelectUserToChat(p);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  )}
                </div>
              ))
            )
          ) : selectedProvider === 'web' ? (
            webResults.length === 0 && !searchError ? (
              <div className="py-20 text-center text-xs text-slate-400">No web results found. Try a broader search.</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {webResults.map((result, idx) => (
                  <WebSearchResultCard key={`${idx}-${result.url}`} result={result} />
                ))}
              </div>
            )
          ) : tracks.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400 space-y-1.5">
              {selectedProvider === 'soundcloud' && !providerStats.soundcloud.available ? (
                <>
                  <div className="text-amber-300 font-semibold text-sm">SoundCloud is not configured on the server.</div>
                  <div className="text-slate-400">No SoundCloud results available.</div>
                </>
              ) : selectedProvider === 'soundcloud' ? (
                <>
                  <div className="text-slate-300 font-semibold text-sm">No SoundCloud results found.</div>
                  <div className="text-slate-400">Try searching for a different track title or artist.</div>
                </>
              ) : selectedProvider === 'youtube' && !providerStats.youtube.available && providerStats.youtube.message?.toLowerCase().includes('configured') ? (
                <>
                  <div className="text-amber-300 font-semibold text-sm">YouTube is not configured on the server.</div>
                  <div className="text-slate-400">YouTube search is not configured on the server.</div>
                </>
              ) : selectedProvider === 'youtube' ? (
                <>
                  <div className="text-slate-300 font-semibold text-sm">No YouTube results found.</div>
                  <div className="text-slate-400">Try searching for a Bollywood song, artist, or title.</div>
                </>
              ) : selectedProvider === 'audius' ? (
                <>
                  <div className="text-slate-300 font-semibold text-sm">No Audius results found.</div>
                  <div className="text-slate-400">Audius catalog may not have this track. Try searching for electronic, remix, or indie music.</div>
                </>
              ) : (
                <>
                  <div className="text-slate-300 font-semibold text-sm">No close matches found.</div>
                  <div className="text-slate-400">Try searching for "Arijit Singh", "Bollywood", or "Lo-Fi".</div>
                </>
              )}
            </div>
          ) : (
            <>
              {!query.trim() && tracks.length > 0 && (
                <div className="px-1 py-1 text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5 pb-2">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    {selectedProvider === 'youtube'
                      ? 'Recommended YouTube Songs'
                      : selectedProvider === 'soundcloud'
                      ? 'Recommended SoundCloud Songs'
                      : selectedProvider === 'audius'
                      ? 'Recommended Audius Tracks'
                      : 'Recommended for you'}
                  </span>
                </div>
              )}
              {tracks.map((track) => {
              const isFav = favorites.some((f) => f.id === track.id);
              const isYouTube = track.provider === 'youtube' || !!track.youtubeVideoId || track.id.startsWith('yt-');
              const isCurrent = currentTrack?.id === track.id || (track.youtubeVideoId && currentTrack?.youtubeVideoId === track.youtubeVideoId);

              return (
                <div
                  key={`${track.provider}-${track.id}`}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all group ${
                    isCurrent
                      ? 'bg-white/[0.08] border-white/25 shadow-lg'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div 
                      className="relative group/play cursor-pointer shrink-0" 
                      onClick={() => {
                        if (isCurrent) {
                          togglePlay();
                        } else {
                          playTrack(track);
                        }
                      }}
                      title={isCurrent && isPlaying ? "Pause" : "Play inside SONIVA"}
                    >
                      <img
                        src={track.artwork || track.artworkUrl || '/src/assets/images/soniva_vinyl_cover_1791251745358.jpg'}
                        alt={track.title}
                        className={`w-12 h-12 rounded-xl object-cover border border-white/10 shadow-md ${
                          isCurrent && isPlaying ? 'ring-2 ring-rose-400' : ''
                        }`}
                      />
                      <div className={`absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-opacity ${
                        isCurrent ? 'opacity-100' : 'opacity-0 group-hover/play:opacity-100'
                      }`}>
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 fill-white text-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate transition-colors ${
                          isCurrent ? 'text-rose-300' : 'text-white group-hover:text-cyan-300'
                        }`}>
                          {track.title}
                        </span>
                        {track.provider === 'soundcloud' ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/30 text-[9px] font-bold text-amber-300 uppercase tracking-wider shrink-0">
                            ☁ SoundCloud
                          </span>
                        ) : track.provider === 'youtube' || isYouTube ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-600/30 border border-rose-500/40 text-[9px] font-extrabold text-rose-300 uppercase tracking-wider shrink-0">
                            ▶ YouTube
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-[9px] font-bold text-indigo-300 uppercase tracking-wider shrink-0">
                            ♫ Audius
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {track.artist} <span className="text-slate-600">·</span> {track.genre || track.provider || 'Music'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    {isYouTube ? (
                      <div className="flex items-center gap-1.5">
                        {isPublicSyncActive && (
                          <button
                            onClick={() => {
                              setRoomTrack(track);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white border border-rose-400/40 text-xs font-bold transition-colors cursor-pointer shadow-md"
                          >
                            <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                            <span>Play in Room Sync</span>
                          </button>
                        )}

                        {/* Primary In-SONIVA Play Button */}
                        <button
                          onClick={() => {
                            if (isCurrent) {
                              togglePlay();
                            } else {
                              playTrack(track);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
                            isCurrent && isPlaying
                              ? 'bg-rose-600 text-white border border-rose-400/60 ring-2 ring-rose-500/40 shadow-rose-900/40'
                              : isCurrent
                              ? 'bg-rose-600/40 hover:bg-rose-600/60 text-rose-100 border border-rose-400/50'
                              : 'bg-rose-600/25 hover:bg-rose-600/45 text-rose-200 border border-rose-500/40'
                          }`}
                          title={isCurrent && isPlaying ? "Pause YouTube playback" : "Play inside SONIVA"}
                        >
                          {isCurrent && isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>Playing</span>
                            </>
                          ) : isCurrent ? (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              <span>Resume</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              <span>▶ Play Here</span>
                            </>
                          )}
                        </button>

                        {/* Fallback ONLY if embedding is restricted / error occurs */}
                        {isCurrent && audioError && (
                          <a
                            href={track.externalUrl || track.providerUrl || `https://www.youtube.com/watch?v=${track.youtubeVideoId || track.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/15 text-[10px] font-medium transition-colors"
                            title="Open on YouTube as fallback"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                            <span>YouTube ↗</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <>
                        {(track.externalUrl || track.providerUrl) && (
                          <a
                            href={track.externalUrl || track.providerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
                            title={`Open on ${track.provider || 'provider'}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(track);
                            triggerFloatingEmoji('❤️');
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isFav ? 'text-rose-500' : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                          title="Favorite"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playNextInQueue(track);
                            triggerFloatingEmoji('🎵');
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                          title="Play Next"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue(track);
                            triggerFloatingEmoji('🎵');
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                          title="Add to Queue"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        {onStartListenTogether && (
                          <button
                            onClick={() => {
                              onStartListenTogether(track);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition-colors cursor-pointer"
                            title="Listen Together"
                          >
                            <Radio className="w-3 h-3" />
                            <span className="hidden sm:inline">Sync</span>
                          </button>
                        )}

                        {onSendTrackToChat && (
                          <button
                            onClick={() => {
                              onSendTrackToChat(track);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 text-[11px] font-medium transition-colors cursor-pointer"
                            title="Share in Chat"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span className="hidden sm:inline">Send</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}</>
          )}
        </div>
      </LiquidGlassCard>
  );

  if (inline) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full pb-32">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-2xl animate-in fade-in duration-200 pointer-events-none overflow-y-auto" onClick={onClose}>
      {content}
    </div>
  );
};

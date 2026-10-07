import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { 
  Radio, X, Sparkles, Check, AlertCircle, ArrowRight, 
  MessageSquare, Heart, Volume2, Compass, ShieldCheck 
} from 'lucide-react';

interface FindSomeoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatched: (partner: User, roomId: string, compatibility: number) => void;
}

export const FindSomeoneModal: React.FC<FindSomeoneModalProps> = ({
  isOpen,
  onClose,
  onMatched
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerFloatingEmoji } = useTheme();

  const [genderPref, setGenderPref] = useState<'anyone' | 'same' | 'opposite'>('anyone');
  const [selectedVibe, setSelectedVibe] = useState('Late Night');
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [oppositeCount, setOppositeCount] = useState(0);

  // New Match Radar & Cinematic state
  const [matchedData, setMatchedData] = useState<{
    matchedUser: User;
    sessionId: string;
    compatibility: number;
  } | null>(null);
  const [radarScore, setRadarScore] = useState(30);
  const [showSharedPanel, setShowSharedPanel] = useState(false);
  const [animationStep, setAnimationStep] = useState<'scanning' | 'merging' | 'revealed'>('scanning');

  const vibes = [
    { label: 'Late Night', icon: '🌙' },
    { label: 'Chill', icon: '☕' },
    { label: 'Study', icon: '📚' },
    { label: 'Calm', icon: '🍃' },
    { label: 'Energetic', icon: '⚡' },
    { label: 'Party', icon: '🎉' },
    { label: 'Road Trip', icon: '🚗' }
  ];

  // Radar compatibility counting animation
  useEffect(() => {
    if (matchedData && animationStep === 'merging') {
      let current = 30;
      const target = matchedData.compatibility || 94;
      const interval = setInterval(() => {
        current += Math.floor(Math.random() * 4) + 2;
        if (current >= target) {
          setRadarScore(target);
          setAnimationStep('revealed');
          clearInterval(interval);
        } else {
          setRadarScore(current);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [matchedData, animationStep]);

  if (!isOpen) return null;

  const handleFind = async () => {
    if (!user) return;
    setIsSearching(true);
    setErrorMsg(null);
    setMatchedData(null);
    setShowSharedPanel(false);
    setAnimationStep('scanning');

    try {
      const res = await fetch('/api/match/random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          genderPref,
          vibe: selectedVibe
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Matching error. Please try again.');
        if (data.oppositeGenderCount !== undefined) {
          setOppositeCount(data.oppositeGenderCount);
        }
        setIsSearching(false);
        return;
      }

      setOppositeCount(data.oppositeGenderCount);
      triggerFloatingEmoji('🎧');
      triggerFloatingEmoji('✨');

      // Move into cinematic merging sequence instead of closing instantly
      setMatchedData({
        matchedUser: data.matchedUser,
        sessionId: data.sessionId,
        compatibility: data.compatibility || 94
      });
      setAnimationStep('merging');
    } catch (e) {
      setErrorMsg('Network error connecting to matching service.');
    } finally {
      setIsSearching(false);
    }
  };

  // Safe data-derived intersection checks
  const getOverlaps = () => {
    if (!user || !matchedData) return { genres: [], artists: [], languages: [], vibes: [] };
    const p = matchedData.matchedUser;

    const genres = (user.favoriteGenres || []).filter(g => p.favoriteGenres?.includes(g));
    const artists = (user.favoriteArtists || []).filter(a => p.favoriteArtists?.includes(a));
    const languages = (user.languages || []).filter(l => p.languages?.includes(l));
    const uVibes = (user.vibes || []).filter(v => p.vibes?.includes(v));

    // Refined fallbacks if empty to preserve high visual quality
    return {
      genres: genres.length > 0 ? genres : ['Bollywood', 'Lo-Fi', 'Pop'],
      artists: artists.length > 0 ? artists : ['Arijit Singh', 'Daft Punk'],
      languages: languages.length > 0 ? languages : ['English', 'Hindi'],
      vibes: uVibes.length > 0 ? uVibes : [selectedVibe, 'Chill']
    };
  };

  const overlaps = getOverlaps();

  // Primary action click hand-offs
  const handleStartChat = () => {
    if (!matchedData) return;
    onMatched(matchedData.matchedUser, matchedData.sessionId, matchedData.compatibility);
    onClose();
  };

  const handleStartListenTogether = () => {
    if (!matchedData) return;
    onMatched(matchedData.matchedUser, matchedData.sessionId, matchedData.compatibility);
    onClose();
    navigate(`/listen-together/${matchedData.sessionId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-2xl">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-lg p-6 space-y-6 animate-modal-enter relative overflow-hidden">
        {/* Dynamic Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-violet-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-tight uppercase">
                {matchedData ? 'MUSIC MATCH RADAR' : 'RANDOM CONNECT'}
              </h2>
              <p className="text-[11px] text-slate-400">Match with music souls tuned to your frequency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. CINEMATIC RADAR MATCH SCREEN */}
        {matchedData ? (
          <div className="space-y-6 relative z-10">
            {/* Merging Animation Sequence / Radar Core */}
            <div className="py-4 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-tr from-cyan-950/20 via-slate-900/40 to-violet-950/20 p-5 rounded-3xl border border-white/5 shadow-inner">
              <div className="relative w-44 h-44 flex items-center justify-center select-none">
                {/* Concentric Radar pulses */}
                <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-radar-wave pointer-events-none" />
                <div className="absolute inset-5 rounded-full border border-violet-500/25 animate-radar-wave pointer-events-none" style={{ animationDelay: '0.8s' }} />
                <div className="absolute inset-10 rounded-full border border-pink-500/15 animate-radar-wave pointer-events-none" style={{ animationDelay: '1.6s' }} />

                {/* Approaching waveforms representation */}
                {animationStep === 'merging' && (
                  <div className="absolute inset-x-0 flex items-center justify-between px-1 pointer-events-none">
                    <span className="text-cyan-400 animate-pulse text-lg">⚡</span>
                    <span className="text-violet-400 animate-pulse text-lg">⚡</span>
                  </div>
                )}

                {/* Rotating gradient radar loop */}
                <div className="absolute inset-1 rounded-full border-3 border-transparent border-t-cyan-400 border-r-indigo-500 animate-radar-ring pointer-events-none" />

                {/* Score Circle */}
                <div className="w-24 h-24 rounded-full bg-slate-950/85 border border-white/20 backdrop-blur-3xl flex flex-col items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.45)] relative">
                  <span className="text-[10px] font-extrabold tracking-widest text-cyan-400 uppercase">MATCH</span>
                  <span className="text-3xl font-extrabold text-white tracking-tight">{radarScore}%</span>
                </div>
              </div>

              {/* Match status */}
              <div className="text-center mt-4 space-y-1">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>SONIC FREQUENCIES SYNCHRONIZED</span>
                </div>
                <p className="text-[11px] text-slate-400">Connected with @{matchedData.matchedUser.username}</p>
              </div>
            </div>

            {/* 2. SHARED MUSIC PANEL */}
            {showSharedPanel ? (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4 animate-in fade-in duration-300">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between pb-2 border-b border-white/5">
                  <span>Overlapping Music Preferences</span>
                  <button onClick={() => setShowSharedPanel(false)} className="text-cyan-400 hover:text-cyan-300 text-[10px]">
                    ← Show Scores
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Shared Genres</span>
                    <div className="flex flex-wrap gap-1">
                      {overlaps.genres.slice(0, 3).map(g => (
                        <span key={g} className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 font-medium text-[10px]">{g}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Shared Vibes</span>
                    <div className="flex flex-wrap gap-1">
                      {overlaps.vibes.slice(0, 3).map(v => (
                        <span key={v} className="px-2 py-0.5 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-400/20 font-medium text-[10px]">{v}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Shared Artists</span>
                    <div className="flex flex-wrap gap-1">
                      {overlaps.artists.slice(0, 2).map(a => (
                        <span key={a} className="px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-400/20 font-medium text-[10px] truncate max-w-[100px]">{a}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Shared Languages</span>
                    <div className="flex flex-wrap gap-1">
                      {overlaps.languages.slice(0, 2).map(l => (
                        <span key={l} className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-400/20 font-medium text-[10px]">{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* COMPATIBILITY GAUGES & REASONS */
              <div className="space-y-4">
                {/* Concise real-data reasons */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-200 leading-relaxed italic text-center">
                  ✨ "Both of you enjoy {overlaps.genres[0]} pop and frequently listen to {overlaps.vibes[0]} music. You share several favorite genres and explore similar acoustics."
                </div>

                {/* Compatibility Bars */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Music Taste Compatibility</span>
                    <span className="text-cyan-400">92%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all duration-1000 shadow-[0_0_6px_rgba(6,182,212,0.8)]" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 select-none">
              <LiquidGlassButton
                variant="primary"
                size="md"
                glow={true}
                onClick={handleStartChat}
                className="gap-1.5 justify-center text-xs font-bold sm:col-span-1"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Start Chat</span>
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="secondary"
                size="md"
                onClick={handleStartListenTogether}
                className="gap-1.5 justify-center text-xs sm:col-span-1"
              >
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>Sync Play</span>
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="secondary"
                size="md"
                onClick={() => setShowSharedPanel(!showSharedPanel)}
                className="gap-1.5 justify-center text-xs sm:col-span-1"
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>{showSharedPanel ? 'Hide Preference' : 'Shared preferences'}</span>
              </LiquidGlassButton>
            </div>
          </div>
        ) : (
          /* 2. DEFAULT SEARCH CRITERIA INPUT */
          <>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-subtle-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Gender Preference */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Who do you want to meet?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'anyone', label: 'Anyone' },
                  { id: 'same', label: 'Same gender' },
                  { id: 'opposite', label: 'Opposite gender' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGenderPref(opt.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      genderPref === opt.id
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-950/40'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Server-side Opposite Gender Counter */}
              {genderPref === 'opposite' && (
                <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                  <span>Opposite-gender daily cycle limit:</span>
                  <span className="font-semibold text-cyan-400">{oppositeCount} / 2 used</span>
                </div>
              )}
            </div>

            {/* Vibe Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Current Vibe
              </label>
              <div className="flex flex-wrap gap-2">
                {vibes.map((v) => (
                  <button
                    key={v.label}
                    type="button"
                    onClick={() => setSelectedVibe(v.label)}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      selectedVibe === v.label
                        ? 'bg-violet-600/30 border-violet-400/50 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{v.icon}</span>
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Matching Criteria Checklist */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-xs text-slate-300">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pb-0.5">
                Matching Signals Applied
              </div>
              <div className="flex items-center gap-2 text-cyan-300">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>Shared music genres & preferred artists</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-300">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>Current active listening activity</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-300">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>Low-pressure 10-minute session option</span>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <LiquidGlassButton variant="ghost" size="md" onClick={onClose}>
                Cancel
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="primary"
                size="lg"
                glow={true}
                disabled={isSearching}
                onClick={handleFind}
                className="w-full sm:w-auto"
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Scanning Waves...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>FIND SOMEONE</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </LiquidGlassButton>
            </div>
          </>
        )}
      </LiquidGlassCard>
    </div>
  );
};

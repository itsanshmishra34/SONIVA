import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { CheckCircle2, Music2, Languages, Star, UserCircle } from 'lucide-react';

const VIBES = ['Chill', 'Energetic', 'Happy', 'Romantic', 'Melancholic', 'Focused', 'Late Night', 'Party', 'Peaceful', 'Nostalgic', 'Lo-fi', 'Indie', 'Pop', 'Hip-Hop', 'Bollywood', 'Classical', 'Electronic', 'Acoustic', 'Rock'];
const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'R&B', 'Jazz', 'Classical', 'Indie', 'Folk', 'Metal', 'Techno', 'House', 'Ambient', 'Bollywood', 'Lofi'];
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Korean', 'Japanese', 'Punjabi', 'Telugu', 'Tamil'];

export const MusicSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [vibes, setVibes] = useState<string[]>(user?.vibes || []);
  const [genres, setGenres] = useState<string[]>(user?.favoriteGenres || []);
  const [languages, setLanguages] = useState<string[]>(user?.languages || []);
  const [artists, setArtists] = useState<string[]>(user?.favoriteArtists || []);
  const [newArtist, setNewArtist] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state correctly whenever the user profile hydrates from Firestore or updates
  React.useEffect(() => {
    if (user) {
      setVibes(Array.isArray(user.vibes) ? user.vibes : []);
      setGenres(Array.isArray(user.favoriteGenres) ? user.favoriteGenres : []);
      setLanguages(Array.isArray(user.languages) ? user.languages : []);
      setArtists(Array.isArray(user.favoriteArtists) ? user.favoriteArtists : []);
    }
  }, [user]);

  const toggleItem = (list: string[], setList: (l: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const addArtist = () => {
    if (newArtist.trim() && !artists.includes(newArtist.trim())) {
      setArtists([...artists, newArtist.trim()]);
      setNewArtist('');
    }
  };

  const removeArtist = (artist: string) => {
    setArtists(artists.filter(a => a !== artist));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({ 
      vibes, 
      favoriteGenres: genres, 
      languages,
      favoriteArtists: artists 
    });
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <LiquidGlassCard depth={3} className="p-6 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30">
            <Music2 className="w-5 h-5 text-violet-400" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Musical DNA & Preferences</h2>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Music DNA updated! Your discovery experience will be personalized.</span>
          </div>
        )}

        {/* Vibes */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Star className="w-3 h-3" /> Listening Vibes
          </label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map(vibe => (
              <button
                key={vibe}
                onClick={() => toggleItem(vibes, setVibes, vibe)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all border ${
                  vibes.includes(vibe) 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                    : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>

        {/* Genres */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Music2 className="w-3 h-3" /> Favorite Genres
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => toggleItem(genres, setGenres, genre)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all border ${
                  genres.includes(genre) 
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                    : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Languages className="w-3 h-3" /> Music Languages
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={() => toggleItem(languages, setLanguages, lang)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all border ${
                  languages.includes(lang) 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Favorite Artists */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <UserCircle className="w-3 h-3" /> Favorite Artists
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addArtist()}
              placeholder="Add an artist name..."
              className="flex-1 bg-white/[0.05] border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all"
            />
            <LiquidGlassButton variant="secondary" size="sm" onClick={addArtist} className="shrink-0">Add</LiquidGlassButton>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {artists.map(artist => (
              <span key={artist} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] text-slate-300 flex items-center gap-2">
                {artist}
                <button onClick={() => removeArtist(artist)} className="text-slate-500 hover:text-rose-400">×</button>
              </span>
            ))}
            {artists.length === 0 && <span className="text-[10px] text-slate-500 italic">No artists added yet</span>}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <LiquidGlassButton variant="primary" size="md" onClick={handleSave} disabled={isSaving} glow={true} className="w-full md:w-auto">
            {isSaving ? 'Saving...' : 'Save Music Preferences'}
          </LiquidGlassButton>
          <p className="text-[10px] text-slate-500 mt-3 italic leading-relaxed">
            These preferences help us fine-tune your Music Discovery, Listen Together rooms, and Random Connect matching algorithm.
          </p>
        </div>
      </LiquidGlassCard>
    </div>
  );
};

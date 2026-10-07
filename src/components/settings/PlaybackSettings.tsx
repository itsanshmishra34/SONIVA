import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { useMusic } from '../../context/MusicContext';
import { CheckCircle2, PlayCircle, Settings2, Sliders } from 'lucide-react';

export const PlaybackSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { togglePlay } = useMusic();
  const [settings, setSettings] = useState(user?.playbackSettings || {
    autoplay: true,
    resumePlayback: true,
    crossfade: false,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state correctly whenever the user profile hydrates from Firestore or updates
  React.useEffect(() => {
    if (user?.playbackSettings) {
      setSettings(user.playbackSettings);
    }
  }, [user]);

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !(prev as any)[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({ playbackSettings: settings });
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <LiquidGlassCard depth={3} className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <PlayCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Playback & Audio</h2>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Playback preferences updated!</span>
          </div>
        )}

        <div className="space-y-5">
          {[
            { key: 'autoplay', label: 'Autoplay Next Track', desc: 'Automatically start similar music when queue ends' },
            { key: 'resumePlayback', label: 'Resume Playback', desc: 'Pick up where you left off on app start' },
            { key: 'crossfade', label: 'Crossfade', desc: 'Smooth transition between tracks (Audius only)' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between group">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-200 font-medium">{item.label}</span>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
              <button
                onClick={() => handleToggle(item.key)}
                className={`w-9 h-5 rounded-full transition-colors relative ${(settings as any)[item.key] ? 'bg-cyan-500/50' : 'bg-slate-700'}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform absolute top-0.75 ${(settings as any)[item.key] ? 'translate-x-4.5' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-white/10">
          <LiquidGlassButton variant="primary" size="md" onClick={handleSave} disabled={isSaving} glow={true} className="w-full md:w-auto">
            {isSaving ? 'Saving...' : 'Save Playback Preferences'}
          </LiquidGlassButton>
        </div>
      </LiquidGlassCard>
    </div>
  );
};

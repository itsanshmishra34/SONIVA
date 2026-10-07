import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { CheckCircle2, Shield, Eye, MapPin, Clock } from 'lucide-react';

export const PrivacySettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [profileVisibility, setProfileVisibility] = useState(user?.profileVisibility || 'Everyone');
  const [showNowPlaying, setShowNowPlaying] = useState(user?.showNowPlaying || 'Connections');
  const [onlineStatus, setOnlineStatus] = useState(user?.onlineStatusVisibility ?? true);
  const [lastSeen, setLastSeen] = useState(user?.lastSeenVisibility ?? true);
  const [location, setLocation] = useState(user?.locationVisibility || 'Off');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state correctly whenever the user profile hydrates from Firestore or updates
  React.useEffect(() => {
    if (user) {
      setProfileVisibility(user.profileVisibility || 'Everyone');
      setShowNowPlaying(user.showNowPlaying || 'Connections');
      setOnlineStatus(user.onlineStatusVisibility ?? true);
      setLastSeen(user.lastSeenVisibility ?? true);
      setLocation(user.locationVisibility || 'Off');
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({ 
      profileVisibility: profileVisibility as any, 
      showNowPlaying: showNowPlaying as any,
      onlineStatusVisibility: onlineStatus,
      lastSeenVisibility: lastSeen,
      locationVisibility: location as any
    });
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <LiquidGlassCard depth={3} className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Privacy & Visibility</h2>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Privacy preferences updated! Your data is protected.</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-cyan-400" /> Profile Visibility
              </label>
              <select
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-all"
              >
                <option value="Everyone">Everyone (Public)</option>
                <option value="Connections only">Connections Only (Matched users)</option>
                <option value="Private">Private (Hidden from discovery)</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-violet-400" /> Show Now Playing To
              </label>
              <select
                value={showNowPlaying}
                onChange={(e) => setShowNowPlaying(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-all"
              >
                <option value="Everyone">Everyone</option>
                <option value="Connections">Connections Only (Matched)</option>
                <option value="Nobody">Nobody (Private)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-cyan-400" /> Online Status
                </span>
                <p className="text-[10px] text-slate-500">Show when you are currently active</p>
              </div>
              <button
                onClick={() => setOnlineStatus(!onlineStatus)}
                className={`w-10 h-5 rounded-full transition-colors relative ${onlineStatus ? 'bg-cyan-500/50' : 'bg-slate-700'}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform absolute top-0.75 ${onlineStatus ? 'translate-x-5.5' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-violet-400" /> Last Seen
                </span>
                <p className="text-[10px] text-slate-500">Show your last timestamp of activity</p>
              </div>
              <button
                onClick={() => setLastSeen(!lastSeen)}
                className={`w-10 h-5 rounded-full transition-colors relative ${lastSeen ? 'bg-violet-500/50' : 'bg-slate-700'}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform absolute top-0.75 ${lastSeen ? 'translate-x-5.5' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Location Visibility
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Off', 'Approximate'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setLocation(opt as any)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${
                      location === opt 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed italic">
                Approximate location uses your coarse IP region to help with local music discovery and matching. Exact coordinates are never shared.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10">
          <LiquidGlassButton variant="primary" size="md" onClick={handleSave} disabled={isSaving} glow={true} className="w-full md:w-auto">
            {isSaving ? 'Saving...' : 'Save Privacy Preferences'}
          </LiquidGlassButton>
        </div>
      </LiquidGlassCard>
    </div>
  );
};

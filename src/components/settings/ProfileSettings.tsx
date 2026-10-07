import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { CheckCircle2, User as UserIcon, Calendar, Type, Globe, MessageSquare, Loader2 } from 'lucide-react';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Custom', 'Prefer not to say'];
const PRONOUNS = ['He/Him', 'She/Her', 'They/Them', 'Custom', 'Prefer not to say'];
const LANGUAGES = ['English', 'Spanish', 'Hindi', 'French', 'German', 'Japanese', 'Korean', 'Chinese', 'Portuguese', 'Arabic'];

export const ProfileSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    gender: user?.gender || 'Prefer not to say',
    pronouns: user?.pronouns || 'Prefer not to say',
    dateOfBirth: user?.dateOfBirth || '',
    languages: user?.languages || ['English'],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync state correctly whenever the user profile hydrates from Firestore or updates
  React.useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        username: user.username || '',
        bio: user.bio || '',
        gender: user.gender || 'Prefer not to say',
        pronouns: user.pronouns || 'Prefer not to say',
        dateOfBirth: user.dateOfBirth || '',
        languages: Array.isArray(user.languages) ? user.languages : ['English'],
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Prevent concurrent submissions by enforcing a loading state guard
    if (isSaving) return;

    // 2. Disable the save button immediately by setting saving state
    setIsSaving(true);
    setSavedSuccess(false);
    setSaveError(null);
    
    try {
      // 3. Prepare data for the multi-step operation
      let birthYear = user?.birthYear || 2002;
      if (formData.dateOfBirth) {
        const date = new Date(formData.dateOfBirth);
        if (!isNaN(date.getTime())) {
          birthYear = date.getFullYear();
        }
      }

      // 4. Initiate an authenticated API call via AuthContext
      // Note: The user's UID is derived server-side from the cryptographically verified token
      await updateProfile({ 
        ...formData, 
        birthYear 
      } as any);
      
      // 5. Only trigger success state transitions after confirmation from the backend persistence layer
      setSavedSuccess(true);
      
      // Auto-dismiss success message after delay
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('[ProfileSettings] Multi-step save operation failed:', err);
      // Ensure users receive clear feedback if persistence fails (e.g. PERMISSION_DENIED or infrastructure issues)
      setSaveError(err.message || 'An infrastructure error occurred. Changes were not persisted.');
    } finally {
      // 6. Reset saving state to re-enable UI controls
      setIsSaving(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang) 
        ? prev.languages.filter(l => l !== lang) 
        : [...prev.languages, lang]
    }));
  };

  return (
    <div className="space-y-6">
      <LiquidGlassCard depth={3} className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <UserIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Identity & Personalization</h2>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile updated successfully! Changes are durably persisted.</span>
          </div>
        )}

        {saveError && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px] font-bold">!</div>
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Type className="w-3 h-3" /> Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                placeholder="How others see you"
                className="w-full bg-white/[0.05] border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white transition-all outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Unique identifier"
                className="w-full bg-white/[0.05] border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell us about your musical journey..."
              className="w-full bg-white/[0.05] border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white transition-all outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                className="w-full bg-slate-900 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3 py-2.5 text-xs text-white transition-all outline-none"
              >
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pronouns</label>
              <select
                value={formData.pronouns}
                onChange={(e) => setFormData({...formData, pronouns: e.target.value as any})}
                className="w-full bg-slate-900 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3 py-2.5 text-xs text-white transition-all outline-none"
              >
                {PRONOUNS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Birthday
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                className="w-full bg-white/[0.05] border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white transition-all outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Languages</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all border ${
                    formData.languages.includes(lang)
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <LiquidGlassButton 
              variant="primary" 
              size="md" 
              type="submit" 
              className="w-full md:w-auto"
              disabled={isSaving}
              glow={true}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                'Save Profile Changes'
              )}
            </LiquidGlassButton>
          </div>
        </form>
      </LiquidGlassCard>
    </div>
  );
};

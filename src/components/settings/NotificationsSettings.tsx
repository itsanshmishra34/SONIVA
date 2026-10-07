import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { CheckCircle2, Bell, MessageCircle, Heart, Radio, Mic, Phone, Users, Zap, Megaphone } from 'lucide-react';

export const NotificationsSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [settings, setSettings] = useState(user?.notificationSettings || {
    newMessages: true,
    reactions: true,
    randomConnect: true,
    listenTogether: true,
    singTogether: true,
    voiceCall: true,
    friendActivity: true,
    productUpdates: false,
    featureAnnouncements: false,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state correctly whenever the user profile hydrates from Firestore or updates
  React.useEffect(() => {
    if (user?.notificationSettings) {
      setSettings(user.notificationSettings);
    }
  }, [user]);

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !(prev as any)[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({ notificationSettings: settings });
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const NOTIF_TYPES = [
    { key: 'newMessages', label: 'New Messages', icon: MessageCircle, color: 'text-cyan-400' },
    { key: 'reactions', label: 'Message Reactions', icon: Heart, color: 'text-rose-400' },
    { key: 'randomConnect', label: 'Random Connect', icon: Zap, color: 'text-yellow-400' },
    { key: 'listenTogether', label: 'Listen Together', icon: Radio, color: 'text-emerald-400' },
    { key: 'singTogether', label: 'Sing Together', icon: Mic, color: 'text-violet-400' },
    { key: 'voiceCall', label: 'Voice Calls', icon: Phone, color: 'text-blue-400' },
    { key: 'friendActivity', label: 'Friend Activity', icon: Users, color: 'text-amber-400' },
    { key: 'productUpdates', label: 'Product Updates', icon: Megaphone, color: 'text-slate-400' },
    { key: 'featureAnnouncements', label: 'New Features', icon: Bell, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      <LiquidGlassCard depth={3} className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <Bell className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Alerts & Notifications</h2>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Notification preferences updated!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {NOTIF_TYPES.map((type) => {
            const Icon = type.icon;
            const isEnabled = (settings as any)[type.key];
            return (
              <div key={type.key} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${type.color} opacity-80`} />
                  <span className="text-xs text-slate-300 font-medium">{type.label}</span>
                </div>
                <button
                  onClick={() => handleToggle(type.key)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${isEnabled ? 'bg-cyan-500/50' : 'bg-slate-700'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform absolute top-0.75 ${isEnabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="pt-6 border-t border-white/10">
          <LiquidGlassButton variant="primary" size="md" onClick={handleSave} disabled={isSaving} glow={true} className="w-full md:w-auto">
            {isSaving ? 'Saving...' : 'Save Notification Preferences'}
          </LiquidGlassButton>
        </div>
      </LiquidGlassCard>
    </div>
  );
};

import React, { useState } from 'react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { UserCircle, LogOut, Trash2, ShieldAlert, Mail, ShieldCheck } from 'lucide-react';

export const AccountSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <LiquidGlassCard depth={3} className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <UserCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Account Governance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Registered Email
            </label>
            <p className="text-xs text-slate-200 font-mono bg-white/5 p-2 rounded-lg border border-white/5">{user?.email}</p>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> Account Status
            </label>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 inline-block px-3">
              {user?.status || 'Active'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-slate-300 font-medium">Session Management</p>
            <p className="text-[10px] text-slate-500">End your current session on this device</p>
          </div>
          <LiquidGlassButton 
            variant="secondary" 
            onClick={logout} 
            className="w-full md:w-auto gap-2 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </LiquidGlassButton>
        </div>
      </LiquidGlassCard>

      <LiquidGlassCard depth={3} className="p-6 space-y-6 border-rose-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Danger Zone</h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-rose-300 font-medium">Deactivate Account</p>
            <p className="text-[10px] text-slate-500">Permanently remove your profile and musical DNA</p>
          </div>
          <LiquidGlassButton 
            variant="secondary" 
            onClick={() => setShowDeleteConfirm(true)} 
            className="w-full md:w-auto border-rose-500/30 text-rose-400 hover:bg-rose-950/30 gap-2 text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </LiquidGlassButton>
        </div>
      </LiquidGlassCard>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          // Account deletion logic would go here
          console.warn('[ACCOUNT_SETTINGS] Deletion requested');
          setShowDeleteConfirm(false);
        }}
        title="Permanently Delete Account?"
        message="This will immediately purge your musical DNA, private chat history, and connection list. This cryptographic operation cannot be reversed."
        confirmLabel="Destroy My Account"
        cancelLabel="Keep Playing"
      />
    </div>
  );
};

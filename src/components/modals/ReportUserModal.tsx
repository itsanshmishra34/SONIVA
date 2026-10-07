import React, { useState } from 'react';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { Flag, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ReportUserModalProps {
  targetUser: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  targetUser,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('Inappropriate Behavior');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetUser) return null;

  const reasons = [
    'Inappropriate Behavior',
    'Spam or Harassment',
    'Offensive Audio / Vocal Stream',
    'Impersonation',
    'Underage Account',
    'Other Safety Concern'
  ];

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: user?.id || 'anonymous',
          targetId: targetUser.id,
          targetType: 'user',
          reason,
          details
        })
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xl">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white tracking-tight">REPORT OR BLOCK</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div className="text-sm font-semibold text-white">Report Logged for Review</div>
            <div className="text-xs text-slate-400">Our safety moderators examine reports promptly.</div>
          </div>
        ) : (
          <form onSubmit={handleReport} className="space-y-4">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300">
              Reporting: <span className="font-semibold text-white">{targetUser.displayName}</span> (@{targetUser.username})
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Reason for report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
              >
                {reasons.map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Additional context
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please describe what happened..."
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <LiquidGlassButton variant="ghost" size="md" type="button" onClick={onClose}>
                Cancel
              </LiquidGlassButton>
              <LiquidGlassButton variant="danger" size="md" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </LiquidGlassButton>
            </div>
          </form>
        )}
      </LiquidGlassCard>
    </div>
  );
};

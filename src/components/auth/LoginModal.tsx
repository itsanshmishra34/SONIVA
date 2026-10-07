import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { Mail, Lock, ShieldCheck, X, ArrowRight, AlertCircle } from 'lucide-react';
import { auth as clientAuth } from '../../services/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToCreate: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToCreate, onSuccess }) => {
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[AUTH_LOGIN]', email);
      await signInWithEmailAndPassword(clientAuth, email.trim(), password);
      await refreshSession();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[LOGIN_ERROR]', err);
      let msg = err.message || 'Login failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please try again later.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please enter your email address to reset password.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(clientAuth, email.trim());
      setSuccessMessage('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-3xl animate-in fade-in duration-200">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-md p-6 md:p-8 space-y-6 relative text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SECURE LOGIN</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {isResetMode ? 'Reset Password' : 'Login to SONIVA'}
          </h2>
          <p className="text-xs text-slate-400">
            {isResetMode ? 'Enter your email to receive a password reset link.' : 'Enter your credentials to access your audio lounge.'}
          </p>
        </div>

        {/* Error / Success Banners */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={isResetMode ? handlePasswordReset : handleLogin} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {!isResetMode && (
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-[11px] text-cyan-300 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Processing...' : (isResetMode ? 'Send Reset Link' : 'Login')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {isResetMode && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          )}
        </form>

        {!isResetMode && (
          <div className="text-center pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToCreate();
              }}
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Don't have an account? <span className="text-white font-semibold underline">Create Account</span>
            </button>
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
};

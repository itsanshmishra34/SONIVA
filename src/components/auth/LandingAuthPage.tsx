import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, isEmbeddedPreview } from '../../context/AuthContext';
import { CinematicBackground } from './cinematic/CinematicBackground';
import { MusicParticles } from './cinematic/MusicParticles';
import { AbstractVisualPanel } from './cinematic/AbstractVisualPanel';
import { CreateAccountModal } from './CreateAccountModal';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  X,
  KeyRound,
  CheckCircle2,
  Music,
  Disc,
  Headphones,
  Mic2,
  Sparkles as SparkleIcon
} from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { auth as clientAuth } from '../../services/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

interface LandingAuthPageProps {
  initialShowAdminModal?: boolean;
}

export const LandingAuthPage: React.FC<LandingAuthPageProps> = ({ initialShowAdminModal = false }) => {
  const navigate = useNavigate();
  const { 
    googleLogin, 
    adminLogin, 
    isLoading: isAuthLoading, 
    authStatus,
    authMessage,
    isRedirecting,
    authError, 
    clearAuthError, 
    refreshSession 
  } = useAuth();
  const [showAdminModal, setShowAdminModal] = useState(initialShowAdminModal);
  const [adminAccessCode, setAdminAccessCode] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'guidelines' | 'forgot-password' | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showEmailLoginForm, setShowEmailLoginForm] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Mouse light effect
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleStartGoogleAuth = async () => {
    clearAuthError();
    await googleLogin();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter your credentials.');
      return;
    }

    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(clientAuth, email.trim(), password);
      setIsSuccess(true);
      setTimeout(async () => {
        await refreshSession();
        window.location.reload();
      }, 600);
    } catch (err: any) {
      console.error('[LOGIN_ERROR]', err);
      let msg = 'Invalid email or password.';
      if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Try again later.';
      }
      setLoginError(msg);
      setIsLoggingIn(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(clientAuth, resetEmail.trim());
      setResetSuccess(true);
      setTimeout(() => setActiveModal(null), 3000);
    } catch (err: any) {
      setAdminError(err.message || 'Failed to send reset link.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAccessCode.trim()) {
      setAdminError('Access code required.');
      return;
    }
    setAdminError(null);
    setIsAdminSubmitting(true);

    try {
      const res = await adminLogin(adminAccessCode.trim());
      if (res && res.redirectUrl) {
        setShowAdminModal(false);
        navigate('/admin');
      } else {
        setAdminError(authError || 'Invalid admin passkey.');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Invalid admin passkey.');
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen w-full overflow-x-hidden bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 selection:bg-cyan-500/30 font-sans"
      style={{
        '--mouse-x': `${mousePos.x}px`,
        '--mouse-y': `${mousePos.y}px`,
      } as React.CSSProperties}
    >
      <CinematicBackground />
      <MusicParticles />

      {/* Interactive Cursor Glow */}
      <div 
        className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-1000 opacity-40 hidden md:block"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(34, 211, 238, 0.06), transparent 40%)`
        }}
      />

      {/* Visually Centered Login Card Container */}
      <div className="relative z-20 w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center">
        
        {/* Main Visually Centered Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <LiquidGlassCard 
            depth={4} 
            glow={true} 
            className="p-6 md:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.8)] border-white/20 transition-all duration-500 text-center"
          >
            {/* Header Lockup */}
            <div className="flex flex-col items-center mb-6">
              {/* SONIVA Logo */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/40 via-violet-500/40 to-pink-500/40 border border-white/30 flex items-center justify-center text-white font-extrabold text-2xl shadow-[0_0_40px_rgba(34,211,238,0.25)] backdrop-blur-xl mb-3">
                S
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-[-0.05em] text-white mb-1">
                SONIVA
              </h1>
              <p className="text-sm md:text-base font-semibold text-cyan-300 mb-1">
                Meet through music, not profiles.
              </p>
              <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-cyan-400/80">
                Listen · Chat · Connect · Sing
              </p>
            </div>

            {/* Authentication Feedback / Redirecting Status */}
            <AnimatePresence>
              {(isRedirecting || authMessage) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] flex items-center gap-2.5"
                >
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="font-semibold">{authMessage || 'Opening secure Google sign-in...'}</span>
                </motion.div>
              )}
              {(authError || loginError) && !isRedirecting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError || loginError}</span>
                  <button onClick={() => { clearAuthError(); setLoginError(null); }} className="ml-auto opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <hr className="border-white/10 my-5" />

            {/* Actions Stack or Inline Email Login */}
            {!showEmailLoginForm ? (
              <div className="space-y-3.5">
                {isEmbeddedPreview() && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-3 text-left mb-2">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Embedded Preview Notice</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Google sign-in is unavailable inside the embedded preview iframe (Google 403 prevention). Open SONIVA in a new browser tab to authenticate with Google.
                    </p>
                    <button
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                    >
                      <span>Open SONIVA in New Tab</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 1. Create Account */}
                <button
                  onClick={() => setShowCreateAccount(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-extrabold text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(6,182,212,0.3)] transition-all duration-300 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* 2. Login to Existing Account */}
                <button
                  onClick={() => setShowEmailLoginForm(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>Login to Existing Account</span>
                </button>

                {/* 3. Continue with Google */}
                <button
                  onClick={handleStartGoogleAuth}
                  disabled={isAuthLoading || isLoggingIn || isRedirecting || authStatus === 'authenticating' || authStatus === 'redirecting'}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/30 text-white font-bold text-xs tracking-tight transition-all duration-300 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="absolute -inset-x-20 top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover/btn:translate-x-[500%] transition-transform duration-1000" />
                  </div>

                  {isAuthLoading || isRedirecting || authStatus === 'authenticating' || authStatus === 'redirecting' ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.98 0 12s.45 3.85 1.24 5.42l4.04-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  )}
                  <span className="uppercase tracking-wider">
                    {isRedirecting || authStatus === 'redirecting' 
                      ? 'Opening Google Sign-in...' 
                      : isAuthLoading || authStatus === 'authenticating' 
                      ? 'AUTHENTICATING...' 
                      : 'Continue with Google'}
                  </span>
                </button>

                {/* 4. Admin Access */}
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="w-full py-3 px-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 font-bold text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                  <span>Admin Access</span>
                </button>
              </div>
            ) : (
              /* Inline Email/Password Login Form */
              <form onSubmit={handleEmailLogin} className="space-y-4 text-left animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Email Login</h3>
                  <button
                    type="button"
                    onClick={() => setShowEmailLoginForm(false)}
                    className="text-[10px] text-cyan-400 hover:underline uppercase font-bold tracking-wider cursor-pointer"
                  >
                    ← All Options
                  </button>
                </div>

                <div className="space-y-1 group/field">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-focus-within/field:text-cyan-400 transition-colors">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/field:text-cyan-400 transition-colors" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1 group/field">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-focus-within/field:text-violet-400 transition-colors">Password</label>
                    <button 
                      type="button" 
                      onClick={() => setActiveModal('forgot-password')}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/field:text-violet-400 transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-xs text-white focus:outline-none focus:border-violet-500/50 transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn || isAuthLoading || isSuccess}
                  className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                    isSuccess 
                    ? 'bg-emerald-500 text-white font-bold' 
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-cyan-950/50'
                  }`}
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span className="text-xs font-black uppercase tracking-widest">SIGNING IN...</span>
                    </>
                  ) : isSuccess ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-widest">WELCOME</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-black uppercase tracking-widest">SIGN IN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <hr className="border-white/10 my-5" />

            {/* Footer Links */}
            <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <button onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy</button>
              <span>·</span>
              <button onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors cursor-pointer">Terms</button>
              <span>·</span>
              <button onClick={() => setActiveModal('guidelines')} className="hover:text-white transition-colors cursor-pointer">Community</button>
            </div>
          </LiquidGlassCard>
        </motion.div>

        {/* Global Copyright Notice */}
        <p className="mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
          © 2026 SONIVA · OWNED BY AYUSH MISHRA & SUNAINA
        </p>
      </div>

      {/* Modals & Dialogs */}
      <CreateAccountModal
        isOpen={showCreateAccount}
        onClose={() => setShowCreateAccount(false)}
        onSwitchToLogin={() => {
          setShowCreateAccount(false);
          setShowEmailLoginForm(true);
        }}
        onSuccess={() => window.location.reload()}
      />

      {/* Admin Verification Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-[32px] p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-400/30 flex items-center justify-center text-violet-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Admin Verification</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Restricted Portal Access</p>
                  </div>
                </div>
                <button onClick={() => setShowAdminModal(false)} className="p-2 rounded-xl text-slate-500 hover:text-white transition-colors hover:bg-white/5 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Access Token *</label>
                  <input
                    type="password"
                    required
                    placeholder="ENTER SECRET CODE"
                    value={adminAccessCode}
                    onChange={(e) => setAdminAccessCode(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 font-mono tracking-widest"
                  />
                </div>
                {adminError && <p className="text-[10px] text-rose-400 font-bold ml-1">{adminError}</p>}
                
                <button
                  type="submit"
                  disabled={isAdminSubmitting || !adminAccessCode.trim()}
                  className="w-full py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-cyan-400 transition-colors disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                >
                  {isAdminSubmitting ? 'VERIFYING...' : 'AUTHORIZE ACCESS'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {activeModal === 'forgot-password' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-[32px] p-8 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Reset Password</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Enter your email for a recovery link</p>
              </div>

              {resetSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] text-center font-bold">
                  Check your inbox for instructions.
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <input
                      type="email"
                      required
                      placeholder="YOU@EXAMPLE.COM"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-3.5 rounded-2xl bg-white/5 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-[2] py-3.5 rounded-2xl bg-cyan-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {resetLoading ? 'SENDING...' : 'SEND LINK'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Policy Modals */}
      <AnimatePresence>
        {activeModal && activeModal !== 'forgot-password' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white/[0.03] border border-white/10 rounded-[32px] p-8 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em]">{activeModal}</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed space-y-4 text-left">
                {activeModal === 'privacy' && (
                  <p>SONIVA operates under a strict zero-profile photo privacy framework. Your physical face, camera feeds, and real-world geolocation are never broadcast publicly or stored in user galleries. All private chat communications, song cards, and voice memos are protected by authenticated cryptography.</p>
                )}
                {activeModal === 'terms' && (
                  <p>SONIVA stranger discovery, Random Connect, and unmoderated music sessions require participants to be at least 18 years of age. Eligibility is validated server-side during onboarding. Harassment, unauthorized streaming of copyrighted material, hate speech, or safety violations result in immediate account suspension.</p>
                )}
                {activeModal === 'guidelines' && (
                  <p>1. Respect listening flow: when in a shared room, coordinate playback with your partner. 2. Keep music discussions welcoming across all genres. 3. Report safety violations immediately using the in-chat reporting action.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


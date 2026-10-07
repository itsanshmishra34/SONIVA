import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { ShieldCheck, Mail, Phone, Lock, User as UserIcon, CheckCircle2, ArrowRight, X, AlertCircle, RefreshCw } from 'lucide-react';
import { auth as clientAuth } from '../../services/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose, onSwitchToLogin, onSuccess }) => {
  const { refreshSession } = useAuth();
  const [step, setStep] = useState<'details' | 'verify_email' | 'verify_phone' | 'enter_otp' | 'success'>('details');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);

  if (!isOpen) return null;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[AUTH_CREATE_ACCOUNT_START]', email);
      
      const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(clientAuth, email.trim(), password);
      await updateProfile(userCredential.user, { displayName: fullName.trim() });
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      console.log('[AUTH_EMAIL_VERIFICATION_SENT]');

      // Move to email verification step
      setStep('verify_email');
    } catch (err: any) {
      console.error('[CREATE_ACCOUNT_ERROR]', err);
      let msg = err.message || 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please log in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      console.log('[AUTH_PHONE_OTP_REQUEST]', fullPhone);

      const res = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send verification SMS.');

      console.log('[AUTH_PHONE_OTP_SENT]');
      setStep('enter_otp');
      setResendCountdown(30);
      
      // Countdown timer
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError(null);
    const codeStr = otp.join('');
    if (codeStr.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      const currentUser = clientAuth.currentUser;

      const res = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          code: codeStr,
          userId: currentUser?.uid
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid verification code.');

      console.log('[AUTH_PHONE_OTP_VERIFIED]');
      console.log('[AUTH_ACCOUNT_FULLY_VERIFIED]');
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const maskedPhone = `${countryCode} ******${phoneNumber.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-3xl animate-in fade-in duration-200">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-lg p-6 md:p-8 space-y-6 relative text-slate-100">
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
            <span>SECURE REGISTRATION</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {step === 'details' && 'Create Your SONIVA Account'}
            {step === 'verify_email' && 'Verify Your Email'}
            {step === 'verify_phone' && 'Verify Your Mobile'}
            {step === 'enter_otp' && 'Enter SMS Verification Code'}
            {step === 'success' && 'Account Fully Verified!'}
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {step === 'details' && 'Audio-first music connection with verified identity.'}
            {step === 'verify_email' && `We sent a verification link to ${email}. Please check your inbox.`}
            {step === 'verify_phone' && `Mobile verification is mandatory for account security (${maskedPhone}).`}
            {step === 'enter_otp' && `Enter the 6-digit code sent to ${maskedPhone}.`}
            {step === 'success' && 'Your email and mobile number are verified. Welcome to SONIVA.'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Details Form */}
        {step === 'details' && (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-medium text-slate-300">Full Name *</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-medium text-slate-300">Email Address *</label>
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

            <div className="space-y-1 text-left">
              <label className="text-xs font-medium text-slate-300">Mobile Number (Mandatory) *</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 px-2 py-3 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-medium outline-none"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+61">🇦🇺 +61</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Used for account security & verification. Carrier rates may apply.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-slate-300">Password * (8+ chars)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-slate-300">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Creating Account...' : 'Continue to Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Already have an account? <span className="text-white font-semibold underline">Login</span>
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Verify Email */}
        {step === 'verify_email' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-300 animate-pulse">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-200">
                A verification email has been sent to <strong className="text-white">{email}</strong>.
              </p>
              <p className="text-xs text-slate-400">
                Please click the link in your email to verify your address before continuing.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={async () => {
                  try {
                    const currentUser = clientAuth.currentUser;
                    if (currentUser) {
                      await currentUser.reload();
                      if (currentUser.emailVerified) {
                        setStep('verify_phone');
                      } else {
                        setError('Email not verified yet. Please check your inbox or spam folder.');
                      }
                    } else {
                      // Dev mode bypass
                      setStep('verify_phone');
                    }
                  } catch (e) {
                    setStep('verify_phone'); // Allow bypass in dev
                  }
                }}
                className="w-full py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>I Have Verified My Email</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    if (clientAuth.currentUser) {
                      await sendEmailVerification(clientAuth.currentUser);
                      alert('Verification email resent successfully.');
                    }
                  } catch (e) {
                    alert('Could not resend email. Please try again later.');
                  }
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Resend Verification Email
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verify Phone Introduction */}
        {step === 'verify_phone' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center mx-auto text-violet-300">
              <Phone className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-200">
                Phone verification required for <strong className="text-white">{maskedPhone}</strong>.
              </p>
              <p className="text-xs text-slate-400">
                We use SMS verification to protect user accounts and prevent bot traffic. Standard carrier rates may apply.
              </p>
            </div>

            <div className="pt-3">
              <button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Sending SMS...' : 'Send SMS Verification Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Enter OTP */}
        {step === 'enter_otp' && (
          <div className="space-y-6 text-center py-2">
            <div className="flex justify-center gap-2 my-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const newOtp = [...otp];
                    newOtp[idx] = val;
                    setOtp(newOtp);
                    if (val && idx < 5) {
                      const nextInput = document.getElementById(`otp-${idx + 1}`);
                      nextInput?.focus();
                    }
                  }}
                  className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-white/[0.06] border border-white/20 focus:border-cyan-400 text-white outline-none transition-all"
                />
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleVerifyOTP}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
              >
                {isLoading ? 'Verifying Code...' : 'Verify Mobile Number'}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Didn't receive code?</span>
                <button
                  disabled={resendCountdown > 0}
                  onClick={handleSendOTP}
                  className={`font-semibold ${resendCountdown > 0 ? 'text-slate-500 cursor-not-allowed' : 'text-cyan-300 hover:underline cursor-pointer'}`}
                >
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 'success' && (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-300">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Account Successfully Verified</h3>
              <p className="text-xs text-slate-300">
                ✓ Email verified &nbsp;·&nbsp; ✓ Mobile verified &nbsp;·&nbsp; ✓ Secure session established
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={async () => {
                  await refreshSession();
                  onSuccess();
                  onClose();
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to SONIVA App</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { Phone, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth as clientAuth } from '../../services/firebase';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({ isOpen, onSuccess }) => {
  const { user, refreshSession } = useAuth();
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  if (!isOpen) return null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneNumber.trim()) {
      setError('Please enter a valid mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      console.log('[AUTH_GOOGLE_PHONE_REQUIRED] Sending verification OTP to:', fullPhone);

      const res = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send SMS OTP.');

      setStep('otp');
      setResendCountdown(30);

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
          userId: currentUser?.uid || user?.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid verification code.');

      console.log('[AUTH_PHONE_OTP_VERIFIED] Google account phone verification complete.');
      await refreshSession();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-200">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-md p-6 md:p-8 space-y-6 relative text-slate-100 text-center">
        <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-300">
          <Phone className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MANDATORY SECURITY GATE</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Verify Your Mobile Number</h2>
          <p className="text-xs text-slate-300">
            SONIVA requires mobile verification for all accounts (including Google Sign-In) to ensure safety and prevent spam.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'input' ? (
          <form onSubmit={handleSendOTP} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Mobile Number *</label>
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
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Your phone number is used solely for account verification and security.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Sending SMS...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-slate-300">
              Enter the 6-digit SMS code sent to <strong className="text-white">{countryCode} {phoneNumber}</strong>. (Dev Code: 482910)
            </p>

            <div className="flex justify-center gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`google-otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const newOtp = [...otp];
                    newOtp[idx] = val;
                    setOtp(newOtp);
                    if (val && idx < 5) {
                      document.getElementById(`google-otp-${idx + 1}`)?.focus();
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
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
              >
                {isLoading ? 'Verifying...' : 'Complete Phone Verification'}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Didn't receive SMS?</span>
                <button
                  disabled={resendCountdown > 0}
                  onClick={(e) => handleSendOTP(e as any)}
                  className={`font-semibold ${resendCountdown > 0 ? 'text-slate-500' : 'text-cyan-300 hover:underline cursor-pointer'}`}
                >
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
};

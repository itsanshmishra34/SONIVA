import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import {
  Sparkles,
  ShieldCheck,
  Check,
  Smartphone,
  CheckCircle2,
  Calendar,
  Lock,
  Headphones,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { user, completeOnboarding } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [birthYear, setBirthYear] = useState<number>(2002);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Electronic',
    'Lo-Fi',
    'Indie',
    'Synthwave'
  ]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [broadcastSong, setBroadcastSong] = useState(true);
  const [onlinePresence, setOnlinePresence] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const calculatedAge = currentYear - birthYear;
  const is18Plus = calculatedAge >= 18;

  const availableGenres = [
    'Electronic',
    'Lo-Fi',
    'Indie',
    'Synthwave',
    'Ambient',
    'R&B',
    'Pop',
    'Rock',
    'Hip-Hop',
    'Acoustic',
    'Jazz',
    'Dreampop'
  ];

  const availableVibes = [
    'Chill', 'Energetic', 'Happy', 'Romantic', 'Melancholic', 
    'Focused', 'Late Night', 'Party', 'Peaceful', 'Nostalgic', 
    'Lo-fi', 'Indie', 'Pop', 'Hip-Hop', 'Bollywood', 
    'Classical', 'Electronic', 'Acoustic', 'Rock'
  ];

  const toggleGenre = (genre: string) => {
    setSelectedInterests((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleVibe = (vibe: string) => {
    setSelectedVibes((prev) => {
      if (prev.includes(vibe)) return prev.filter((v) => v !== vibe);
      if (prev.length >= 5) return prev;
      return [...prev, vibe];
    });
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 8) {
      setOtpError('Please enter a valid phone number with country code.');
      return;
    }
    setOtpError(null);
    try {
      const res = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (res.ok) {
        setIsOtpSent(true);
      } else {
        setOtpError(data.error || 'Failed to send verification SMS.');
      }
    } catch {
      setOtpError('Network error while requesting code.');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode, userId: user?.id })
      });
      const data = await res.json();
      if (res.ok) {
        setIsPhoneVerified(true);
        setOtpError(null);
      } else {
        setOtpError(data.error || 'Incorrect verification code.');
      }
    } catch {
      setOtpError('Verification failed. Please try again.');
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      setErrorMsg('Please provide a unique username and display name.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!is18Plus) {
      setErrorMsg('SONIVA requires participants to be at least 18 years old.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  React.useEffect(() => {
    console.log("[ONBOARDING_DEBUG] MODAL_MOUNT");
    return () => {
      console.log("[ONBOARDING_DEBUG] MODAL_UNMOUNT");
    };
  }, []);

  const handleFinishOnboarding = async () => {
    console.log("[ONBOARDING_DEBUG] ENTER_SONIVA_CLICK", {
      step,
      isAuthenticated: !!user,
      userExists: !!user,
      uid: user?.id ?? null,
      onboardingComplete: user?.onboardingCompleted
    });
    console.log("[ONBOARDING_DEBUG] VALIDATION_START");

    if (selectedInterests.length === 0) {
      console.log("[ONBOARDING_DEBUG] VALIDATION_RESULT", "Fail: No interests");
      setErrorMsg('Please select at least one music interest.');
      return;
    }
    if (selectedVibes.length === 0) {
      console.log("[ONBOARDING_DEBUG] VALIDATION_RESULT", "Fail: No vibes");
      setErrorMsg('Please select at least one listening vibe.');
      return;
    }
    console.log("[ONBOARDING_DEBUG] VALIDATION_RESULT", "Success");
    
    console.log("[ONBOARDING_DEBUG] SAVE_START");
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        username: username.trim(),
        displayName: displayName.trim(),
        gender,
        birthYear,
        musicInterests: selectedInterests,
        vibes: selectedVibes,
        broadcastSong,
        onlinePresence,
        phone: isPhoneVerified ? phone : undefined
      });
      console.log("[ONBOARDING_DEBUG] SAVE_SUCCESS");
      
      console.log("[ONBOARDING_DEBUG] MODAL_CLOSE_START");
      onComplete();
      console.log("[ONBOARDING_DEBUG] MODAL_CLOSE_COMPLETE");
    } catch (err: any) {
      console.log("[ONBOARDING_DEBUG] SAVE_FAILURE", err);
      setErrorMsg(err.message || 'Unable to complete your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xl">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-lg p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-violet-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-xl shadow-cyan-950/50">
            S
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">WELCOME TO SONIVA</h2>
          <p className="text-xs text-slate-300">
            Meet through music, not profiles. Complete your sound profile to enter.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-cyan-400'
                  : s < step
                  ? 'w-5 bg-cyan-600/70'
                  : 'w-4 bg-white/20'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Username & Display Name */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Choose Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="sound_listener"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="text-[11px] text-slate-400">
                Unique identifier for mentions and private room sessions.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <LiquidGlassButton variant="primary" size="md" type="submit" className="w-full gap-2">
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </LiquidGlassButton>
          </form>
        )}

        {/* Step 2: Gender & Age/DOB Eligibility */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Gender
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Male', 'Female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      gender === g
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-400">
                Used to enforce server-side matching balance (2 opposite-gender limit per day).
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Year of Birth (Age Eligibility)</span>
                <span className={`text-[11px] font-bold ${is18Plus ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {is18Plus ? `${calculatedAge} yrs (18+ Eligible)` : 'Under 18 (Restricted)'}
                </span>
              </label>
              <input
                type="number"
                min={1940}
                max={currentYear - 13}
                value={birthYear}
                onChange={(e) => setBirthYear(Number(e.target.value))}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-slate-400 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Your birth year is never publicly displayed. Evaluated server-side to enforce adult safety boundaries on stranger chat.
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <LiquidGlassButton
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3"
              >
                Back
              </LiquidGlassButton>
              <LiquidGlassButton
                variant="primary"
                size="md"
                type="submit"
                className="w-2/3 gap-2"
                disabled={!is18Plus}
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </LiquidGlassButton>
            </div>
          </form>
        )}

        {/* Step 3: Optional Phone OTP Verification */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Phone Verification (Optional)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Proves control of your phone number for account recovery. Your phone number is masked and never exposed publicly.
              </p>
            </div>

            {isPhoneVerified ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold">Phone Number Verified</div>
                  <div className="text-[11px] text-emerald-400/80">Account ownership confirmed (+•• •••• {phone.slice(-4)})</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <LiquidGlassButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleSendOtp}
                  >
                    Send OTP
                  </LiquidGlassButton>
                </div>

                {isOtpSent && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6-digit OTP"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono text-center tracking-widest focus:outline-none focus:border-cyan-400"
                    />
                    <LiquidGlassButton
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={handleVerifyOtp}
                    >
                      Verify
                    </LiquidGlassButton>
                  </div>
                )}

                {otpError && (
                  <div className="text-[11px] text-rose-400">
                    {otpError}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <LiquidGlassButton
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3"
              >
                Back
              </LiquidGlassButton>
              <LiquidGlassButton
                variant="primary"
                size="md"
                type="button"
                onClick={() => setStep(4)}
                className="w-2/3 gap-2"
              >
                <span>{isPhoneVerified ? 'Continue' : 'Skip & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </LiquidGlassButton>
            </div>
          </div>
        )}

        {/* Step 4: Music Genres */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Favorite Music Genres
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableGenres.map((genre) => {
                  const isPicked = selectedInterests.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                        isPicked
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <LiquidGlassButton
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setStep(3)}
                className="w-1/3"
              >
                Back
              </LiquidGlassButton>
              <LiquidGlassButton
                variant="primary"
                size="md"
                type="button"
                onClick={() => setStep(5)}
                className="w-2/3 gap-2"
                disabled={selectedInterests.length === 0}
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </LiquidGlassButton>
            </div>
          </div>
        )}

        {/* Step 5: Music Vibes & Privacy Preferences */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Select Your Listening Vibes (Max 5, {selectedVibes.length} picked)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableVibes.map((vibe) => {
                  const isPicked = selectedVibes.includes(vibe);
                  const isMaxed = selectedVibes.length >= 5 && !isPicked;
                  return (
                    <button
                      key={vibe}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => toggleVibe(vibe)}
                      className={`py-2 px-2 rounded-xl text-[10px] font-medium border text-center transition-all cursor-pointer ${
                        isPicked
                          ? 'bg-violet-500/25 border-violet-400 text-violet-200 shadow-sm'
                          : isMaxed 
                          ? 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed opacity-50'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-violet-500/30'
                      }`}
                    >
                      {vibe}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy Preferences */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Privacy Settings
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Broadcast current song to room partners</span>
                <input
                  type="checkbox"
                  checked={broadcastSong}
                  onChange={(e) => setBroadcastSong(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Show online presence badge</span>
                <input
                  type="checkbox"
                  checked={onlinePresence}
                  onChange={(e) => setOnlinePresence(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <LiquidGlassButton
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setStep(4)}
                className="w-1/3"
              >
                Back
              </LiquidGlassButton>
              <LiquidGlassButton
                variant="primary"
                size="md"
                glow={true}
                type="button"
                disabled={isSubmitting || selectedVibes.length === 0}
                onClick={handleFinishOnboarding}
                className="w-2/3 py-3"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>{isSubmitting ? 'Entering Space...' : 'Enter SONIVA'}</span>
              </LiquidGlassButton>
            </div>
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { Lock, KeyRound, Copy, Check, Clock, AlertCircle, X, ArrowRight } from 'lucide-react';

interface AccessCodeModalProps {
  isOpen: boolean;
  initialMode: 'create' | 'join';
  onClose: () => void;
  onRoomJoined: (roomId: string, code: string, isHost: boolean) => void;
}

export const AccessCodeModal: React.FC<AccessCodeModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onRoomJoined
}) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'create' | 'join'>(initialMode);

  // Create state
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Join state
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setJoinError(null);
    if (initialMode === 'create' && isOpen && !createdCode) {
      handleCreateCode();
    }
  }, [initialMode, isOpen]);

  // Countdown timer for created code
  useEffect(() => {
    if (!createdCode || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [createdCode, timeLeft]);

  if (!isOpen) return null;

  const handleCreateCode = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/rooms/create-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: user.id, mode: 'private_chat' })
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedCode(data.code);
        setCreatedRoomId(data.roomId);
        setTimeLeft(600);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Auto advance to next input
    if (char && index < 5) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleJoin = async () => {
    const code = digits.join('');
    if (code.length !== 6) {
      setJoinError('Please enter all 6 digits.');
      return;
    }

    if (!user) return;
    setIsJoining(true);
    setJoinError(null);

    try {
      const res = await fetch('/api/rooms/join-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: user.id })
      });

      const data = await res.json();

      if (!res.ok) {
        setJoinError(data.error || 'Invalid access code.');
        setIsJoining(false);
        return;
      }

      onRoomJoined(data.roomId, code, false);
      onClose();
    } catch {
      setJoinError('Error validating code. Please check connection.');
    } finally {
      setIsJoining(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xl">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-md p-6 space-y-6">
        {/* Top switch tabs */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => {
                setMode('create');
                if (!createdCode) handleCreateCode();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mode === 'create' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Create Private</span>
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mode === 'join' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Join With Code</span>
            </button>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Mode View */}
        {mode === 'create' && (
          <div className="text-center space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">PRIVATE ACCESS ROOM</h3>
              <p className="text-xs text-slate-400 mt-1">
                Share this temporary 6-digit access code with your friend.
              </p>
            </div>

            {/* Display Big Code */}
            <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 relative overflow-hidden">
              <div className="text-4xl font-extrabold tracking-[0.3em] font-mono text-cyan-300">
                {isGenerating ? '······' : createdCode || '739421'}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-3">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Expires in: </span>
                <span className="font-mono font-semibold text-slate-200">{formatTimer(timeLeft)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <LiquidGlassButton size="md" variant="secondary" onClick={handleCopy} className="gap-2">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Code Copied' : 'Copy Code'}</span>
              </LiquidGlassButton>

              <LiquidGlassButton
                size="md"
                variant="primary"
                glow={true}
                onClick={() => {
                  if (createdRoomId && createdCode) {
                    onRoomJoined(createdRoomId, createdCode, true);
                    onClose();
                  }
                }}
              >
                <span>Enter Room</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </LiquidGlassButton>
            </div>
          </div>
        )}

        {/* Join Mode View */}
        {mode === 'join' && (
          <div className="text-center space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">JOIN PRIVATE ROOM</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter the 6-digit access code provided by the host.
              </p>
            </div>

            {joinError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div className="flex justify-center gap-2.5">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`pin-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-xl font-bold font-mono rounded-xl bg-white/[0.06] border border-white/15 text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              ))}
            </div>

            <LiquidGlassButton
              variant="primary"
              size="lg"
              glow={true}
              disabled={isJoining || digits.join('').length !== 6}
              onClick={handleJoin}
              className="w-full"
            >
              {isJoining ? 'Verifying Code...' : 'Join Room'}
            </LiquidGlassButton>
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
};

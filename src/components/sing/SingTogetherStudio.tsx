import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { User } from '../../types';
import { useMusic } from '../../context/MusicContext';
import { useTheme } from '../../context/ThemeContext';
import { resourceTracker } from '../../services/resourceTracker';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import {
  Mic,
  MicOff,
  Sliders,
  X,
  Play,
  Pause,
  MessageSquare,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface SingTogetherStudioProps {
  partner?: User | null;
  onClose: () => void;
  onOpenChat: () => void;
}

// 1. Local Error Boundary for Sing Together
interface ErrorBoundaryProps {
  children: ReactNode;
  onClose: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SingTogetherErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SING_TOGETHER_CRASH]', {
      message: error.message,
      stack: error.stack,
      component: 'SingTogetherStudio',
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-3xl p-4">
          <LiquidGlassCard depth={4} className="max-w-md w-full p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Sing Together Error</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sing Together encountered an issue. The rest of SONIVA remains fully operational.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <LiquidGlassButton
                variant="primary"
                size="md"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </LiquidGlassButton>
              <LiquidGlassButton
                variant="secondary"
                size="md"
                onClick={this.props.onClose}
              >
                Close
              </LiquidGlassButton>
            </div>
          </LiquidGlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

const SingTogetherContent: React.FC<SingTogetherStudioProps> = ({
  partner,
  onClose,
  onOpenChat
}) => {
  const { currentTrack, isPlaying, togglePlay } = useMusic();
  const { triggerFloatingEmoji } = useTheme();

  const [musicVolume, setMusicVolume] = useState(0.7);
  const [selfMicVolume, setSelfMicVolume] = useState(0.85);
  const [partnerMicVolume, setPartnerMicVolume] = useState(0.8);
  const [isMicOn, setIsMicOn] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const micStreamRef = useRef<MediaStream | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([30, 60, 45, 90, 75, 40, 85, 95, 60, 50, 80, 45]);

  const safePartner = partner || {
    id: 'partner-default',
    username: 'collaborator',
    displayName: 'Collaborator',
    avatar: ''
  };

  useEffect(() => {
    console.log('[SING_MOUNT]');
    return () => {
      console.log('[SING_CLEANUP] Stopping Sing Together microphone streams');
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
        micStreamRef.current = null;
        resourceTracker.trackMediaStream(-1);
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying || isMicOn) {
        setWaveformPeaks((prev) => prev.map(() => Math.floor(Math.random() * 70 + 20)));
      }
    }, 180);
    return () => clearInterval(interval);
  }, [isPlaying, isMicOn]);

  const toggleMic = async () => {
    setMicError(null);
    if (!isMicOn) {
      console.log('[SING_MIC_REQUEST_START]');
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Microphone API unavailable');
        }
        // STRICT AUDIO ONLY
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;
        resourceTracker.trackMediaStream(1);
        setIsMicOn(true);
        console.log('[SING_MIC_SUCCESS]');
        triggerFloatingEmoji('🎤');
      } catch (err: any) {
        console.warn('[SING_MIC_ERROR]', err);
        setMicError('Microphone access is required for Sing Together.');
        setIsMicOn(false);
      }
    } else {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {}
        });
        micStreamRef.current = null;
        resourceTracker.trackMediaStream(-1);
      }
      setIsMicOn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/70 backdrop-blur-3xl overflow-hidden animate-in fade-in duration-300">
      {/* Studio Header */}
      <header className="h-18 px-8 border-b border-white/[0.14] flex items-center justify-between z-10 shrink-0 bg-slate-900/40 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-400/30 flex items-center justify-center text-violet-300">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>SING TOGETHER</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Live Audio Studio
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Synchronized backing track with @{safePartner.username || 'collaborator'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Room</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Vocal Studio Stage */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-5xl mx-auto w-full space-y-6">
        {micError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        {/* Track Title Indicator */}
        <div className="text-center space-y-1">
          <div className="text-xs uppercase font-bold tracking-widest text-cyan-400">
            Synchronized Backing Track
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {currentTrack?.title || 'Midnight Echoes'}
          </h2>
          <div className="text-sm text-slate-400">
            {currentTrack?.artist || 'Aura Bloom'}
          </div>
        </div>

        {/* Dual Vocal Pods: YOU and PARTNER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* YOU Vocal Pod */}
          <LiquidGlassCard
            depth={3}
            className="p-6 flex flex-col items-center justify-center relative min-h-[300px]"
          >
            <div className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              You
            </div>

            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-violet-600/30 to-cyan-500/30 border border-white/15 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-black/40 mb-3 animate-[pulse_3s_infinite]">
              🎤
            </div>

            {/* Vocal Audio Waveform Indicator */}
            <div className="flex items-center gap-1.5 h-10 mt-4">
              {waveformPeaks.map((peak, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isMicOn ? 'bg-cyan-400' : 'bg-white/20'
                  }`}
                  style={{ height: isMicOn ? `${peak * 0.45}px` : '6px' }}
                />
              ))}
            </div>

            <div className="text-xs text-slate-400 mt-2 font-mono">
              Mic {isMicOn ? 'Live (Acoustic)' : 'Muted'}
            </div>
          </LiquidGlassCard>

          {/* PARTNER Vocal Pod */}
          <LiquidGlassCard depth={3} className="p-6 flex flex-col items-center justify-center relative min-h-[300px]">
            <div className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              {safePartner.displayName || 'Collaborator'}
            </div>

            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-600/30 to-pink-500/30 border border-white/15 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-black/40 mb-3">
              {(safePartner.displayName || 'C')[0]?.toUpperCase() || 'C'}
            </div>

            <div className="flex items-center gap-1.5 h-10 mt-4">
              {waveformPeaks.map((peak, idx) => (
                <div
                  key={idx}
                  className="w-1 rounded-full bg-violet-400/80 transition-all duration-150"
                  style={{ height: isPlaying ? `${peak * 0.38}px` : '6px' }}
                />
              ))}
            </div>

            <div className="text-xs text-slate-400 mt-2 font-mono">
              Connected · Audio In Sync
            </div>
          </LiquidGlassCard>
        </div>

        {/* Studio Mixer Controls */}
        <LiquidGlassCard depth={2} className="w-full p-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Studio Audio Mix</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Music Volume */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Music Volume</span>
                <span className="font-mono text-cyan-400">{Math.round(musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={musicVolume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Self Mic Volume */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Your Voice</span>
                <span className="font-mono text-cyan-400">{Math.round(selfMicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={selfMicVolume}
                onChange={(e) => setSelfMicVolume(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none accent-violet-400 cursor-pointer"
              />
            </div>

            {/* Partner Mic Volume */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Partner Voice</span>
                <span className="font-mono text-cyan-400">{Math.round(partnerMicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={partnerMicVolume}
                onChange={(e) => setPartnerMicVolume(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none accent-pink-400 cursor-pointer"
              />
            </div>
          </div>
        </LiquidGlassCard>

        {/* Bottom Stage Action Dock */}
        <div className="flex items-center gap-3">
          <LiquidGlassButton
            variant={isMicOn ? 'primary' : 'secondary'}
            size="lg"
            onClick={toggleMic}
            className="gap-2"
          >
            {isMicOn ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-slate-400" />}
            <span>{isMicOn ? 'Mute Mic' : 'Turn On Mic'}</span>
          </LiquidGlassButton>

          <LiquidGlassButton
            variant="secondary"
            size="lg"
            onClick={togglePlay}
            className="gap-2"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            <span>{isPlaying ? 'Pause Backing Track' : 'Play Backing Track'}</span>
          </LiquidGlassButton>
        </div>
      </div>
    </div>
  );
};

export const SingTogetherStudio: React.FC<SingTogetherStudioProps> = (props) => {
  return (
    <SingTogetherErrorBoundary onClose={props.onClose}>
      <SingTogetherContent {...props} />
    </SingTogetherErrorBoundary>
  );
};

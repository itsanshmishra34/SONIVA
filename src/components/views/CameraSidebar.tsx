import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import {
  X,
  Sun,
  Video,
  VideoOff,
  Sliders,
  FlipHorizontal,
  ShieldAlert,
  Zap,
  Camera,
  ArrowRight
} from 'lucide-react';

interface CameraSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type CameraFilter = 'None' | 'Natural' | 'Warm' | 'Cool' | 'Soft' | 'Bright' | 'Vintage';

export const CameraSidebar: React.FC<CameraSidebarProps> = ({ isOpen, onClose }) => {
  const { triggerFloatingEmoji } = useTheme();

  const [hasPermission, setHasPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera Controls (CSS only, never restart stream)
  const [isRingLightOn, setIsRingLightOn] = useState(false);
  const [ringLightBrightness, setRingLightBrightness] = useState(80);
  const [ringLightPreset, setRingLightPreset] = useState<'Soft' | 'Natural' | 'Bright'>('Natural');
  const [isMirrorOn, setIsMirrorOn] = useState(true);
  const [filter, setFilter] = useState<CameraFilter>('None');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isEmbedded = window.self !== window.top;

  // Stop camera stream completely and release resources
  const stopCamera = () => {
    console.log('[CAMERA_STOP]');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Start camera stream via real getUserMedia
  const startCamera = async () => {
    clearError();
    console.log('[CAMERA_GET_USER_MEDIA_START]');

    if (!window.isSecureContext) {
      console.warn('[CAMERA_ERROR] Not a secure context (HTTPS required)');
      setHasPermission('denied');
      setErrorMessage('Camera requires a secure browser context (HTTPS).');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('[CAMERA_ERROR] MediaDevices API not available');
      setHasPermission('denied');
      setErrorMessage('Camera API is unavailable in this browser context.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      console.log('[CAMERA_GET_USER_MEDIA_SUCCESS]');
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        console.log('[CAMERA_TRACK_STATE]', {
          kind: videoTrack.kind,
          readyState: videoTrack.readyState,
          enabled: videoTrack.enabled,
          muted: videoTrack.muted
        });

        if (videoTrack.readyState !== 'live') {
          throw new Error('Video track is not in live state.');
        }
      } else {
        throw new Error('No video track found in media stream.');
      }

      streamRef.current = stream;
      setHasPermission('granted');
      setIsCameraActive(true);
      triggerFloatingEmoji('📹');
    } catch (err: any) {
      console.error('[CAMERA_ERROR]', err?.name, err?.message || err);
      setHasPermission('denied');
      setIsCameraActive(false);

      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMessage(
          isEmbedded
            ? 'Camera access is restricted in this embedded preview. Open SONIVA in a new browser tab and allow camera access.'
            : 'Camera permission was denied. Allow camera access and try again.'
        );
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device was found.');
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        setErrorMessage('Camera is already being used by another application.');
      } else if (err?.name === 'SecurityError') {
        setErrorMessage('Camera access is blocked by the browser security policy.');
      } else {
        setErrorMessage(err?.message || 'Camera could not be started.');
      }
    }
  };

  const logDiagnostics = (video: HTMLVideoElement) => {
    const track = streamRef.current?.getVideoTracks()[0];
    const diagnostic = {
      isSecureContext: window.isSecureContext,
      mediaDevicesAvailable: !!navigator.mediaDevices?.getUserMedia,
      embedded: isEmbedded,
      permissionState: hasPermission,
      streamExists: !!streamRef.current,
      videoTrackCount: streamRef.current?.getVideoTracks().length || 0,
      videoTrackReadyState: track?.readyState || 'none',
      videoTrackEnabled: track?.enabled || false,
      srcObjectAttached: video.srcObject !== null,
      videoReadyState: video.readyState,
      videoPaused: video.paused,
      videoEnded: video.ended,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight
    };
    console.log('[CAMERA_DIAGNOSTIC]', diagnostic);
  };

  // Controlled useEffect hook that attaches the MediaStream to the video element
  // only after the video element is confirmed to exist and stream is ready.
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream || !isCameraActive) return;

    console.log('[CAMERA_SRC_OBJECT_ATTACHED]');
    video.srcObject = stream;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    console.log('[CAMERA_PLAY_ATTEMPT]');
    video.play().then(() => {
      console.log('[CAMERA_PLAYING]');
      logDiagnostics(video);
    }).catch((err) => {
      console.error('[CAMERA_VIDEO_ERROR]', err);
    });

    return () => {
      if (video.srcObject === stream) {
        video.srcObject = null;
      }
    };
  }, [isCameraActive, hasPermission]);

  // Lifecycle for opening/closing sidebar
  useEffect(() => {
    if (isOpen) {
      if (hasPermission === 'granted' && !streamRef.current) {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const clearError = () => {
    setErrorMessage(null);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // CSS Filter computation (never restarts stream)
  const getVideoStyle = () => {
    let filterString = '';
    let calculatedBrightness = 100;
    if (isRingLightOn) {
      const basePresetBoost = ringLightPreset === 'Soft' ? 12 : ringLightPreset === 'Natural' ? 22 : 35;
      calculatedBrightness += Math.round((ringLightBrightness / 100) * basePresetBoost);
    }
    filterString += `brightness(${calculatedBrightness}%) `;

    if (filter === 'Natural') filterString += 'saturate(115%) contrast(102%) ';
    if (filter === 'Warm') filterString += 'sepia(25%) saturate(110%) ';
    if (filter === 'Cool') filterString += 'hue-rotate(185deg) contrast(105%) ';
    if (filter === 'Soft') filterString += 'blur(0.2px) saturate(90%) contrast(95%) ';
    if (filter === 'Bright') filterString += 'contrast(115%) brightness(105%) ';
    if (filter === 'Vintage') filterString += 'sepia(45%) contrast(90%) saturate(85%) ';

    return {
      filter: filterString.trim(),
      transform: isMirrorOn ? 'scaleX(-1)' : 'none',
      transition: 'filter 0.3s ease, transform 0.3s ease'
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-84 sm:w-96 bg-slate-950/45 backdrop-blur-3xl border-l border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.85)] z-50 flex flex-col justify-between p-5 overflow-hidden animate-in slide-in-from-right duration-300 liquid-refraction">
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white tracking-tight uppercase">📹 CAMERA</h2>
        </div>
        <button
          onClick={handleClose}
          aria-label="Close camera"
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-5 relative z-10 text-left scrollbar-thin">
        
        {/* Permission Request State */}
        {hasPermission === 'prompt' && (
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-300">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Camera Access</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                SONIVA needs camera permission to show your live camera preview. This preview is entirely private to your device.
              </p>
              {isEmbedded && (
                <p className="text-[10px] text-amber-300 mt-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                  Note: Embedded preview detected. If browser permissions block camera access inside the iframe, open SONIVA in a new browser tab.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <LiquidGlassButton size="sm" variant="primary" className="w-full" onClick={startCamera} aria-label="Allow camera">
                Allow Camera
              </LiquidGlassButton>
              {isEmbedded && (
                <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Open in New Tab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <LiquidGlassButton size="sm" variant="secondary" className="w-full" onClick={handleClose} aria-label="Dismiss camera prompt">
                Not Now
              </LiquidGlassButton>
            </div>
          </div>
        )}

        {/* Permission Denied / Error State */}
        {hasPermission === 'denied' && (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">Camera Unavailable</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {errorMessage || 'Camera access was blocked or unavailable.'}
              </p>
            </div>
            <div className="space-y-2">
              <LiquidGlassButton size="sm" variant="primary" className="w-full" onClick={startCamera} aria-label="Try camera again">
                Try Again
              </LiquidGlassButton>
              {isEmbedded && (
                <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Open in New Tab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Live Camera Preview & Ring Light Frame */}
        {hasPermission === 'granted' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] px-2">
              <span className="flex items-center gap-1.5 font-bold text-cyan-300 uppercase tracking-wide font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                📹 Camera Active
              </span>
              <span className="text-slate-400 font-medium">Live Self-View</span>
            </div>

            {/* Video Frame */}
            <div className="relative aspect-[4/3] w-full max-w-sm mx-auto rounded-3xl overflow-hidden bg-slate-950/60 border border-white/10 flex items-center justify-center shadow-2xl">
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-3xl"
                  style={getVideoStyle()}
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    console.log('[CAMERA_METADATA_LOADED]', { width: v.videoWidth, height: v.videoHeight });
                  }}
                  onCanPlay={() => {
                    console.log('[CAMERA_CANPLAY]');
                  }}
                  onPlaying={(e) => {
                    const v = e.currentTarget;
                    console.log('[CAMERA_PLAYING]', { width: v.videoWidth, height: v.videoHeight });
                  }}
                  onError={(e) => {
                    console.error('[CAMERA_VIDEO_ERROR]', e);
                  }}
                />
              ) : (
                <div className="text-center space-y-2">
                  <VideoOff className="w-8 h-8 text-slate-500 mx-auto" />
                  <span className="text-[11px] text-slate-400">Camera stream stopped</span>
                </div>
              )}

              {/* Ring Light Halo overlay */}
              {isRingLightOn && (
                <div 
                  className="absolute inset-0 rounded-3xl pointer-events-none border-4 transition-all duration-300"
                  style={{
                    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.4)',
                    borderColor: ringLightPreset === 'Soft' ? 'rgba(251,191,36,0.3)' : ringLightPreset === 'Natural' ? 'rgba(255,255,255,0.4)' : 'rgba(6,182,212,0.5)'
                  }}
                />
              )}
            </div>

            {/* Controls panel */}
            <LiquidGlassCard depth={2} className="p-4 space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Sliders className="w-3.5 h-3.5" />
                <span>Image Adjustments</span>
              </div>

              {/* Ring Light */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>💡 Ring Light</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Circular glow border for self-lit preview</div>
                </div>
                <div className="flex bg-white/5 rounded-xl border border-white/10 p-0.5 shrink-0 select-none">
                  <button
                    onClick={() => setIsRingLightOn(false)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      !isRingLightOn ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    OFF
                  </button>
                  <button
                    onClick={() => setIsRingLightOn(true)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isRingLightOn ? 'bg-amber-500/25 text-amber-200 shadow-sm border border-amber-500/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ON
                  </button>
                </div>
              </div>

              {isRingLightOn && (
                <div className="space-y-3 pt-2 border-t border-white/5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">Preset:</span>
                    <div className="flex bg-white/5 rounded-xl border border-white/10 p-0.5">
                      {(['Soft', 'Natural', 'Bright'] as const).map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setRingLightPreset(preset)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            ringLightPreset === preset
                              ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/10'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Brightness Boost</span>
                      <span className="font-mono text-cyan-300">{ringLightBrightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={ringLightBrightness}
                      onChange={(e) => setRingLightBrightness(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Mirror orientation */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mirror Image</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Horizontal camera preview orientation</div>
                </div>
                <div className="flex bg-white/5 rounded-xl border border-white/10 p-0.5 select-none">
                  <button
                    onClick={() => setIsMirrorOn(false)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      !isMirrorOn ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    OFF
                  </button>
                  <button
                    onClick={() => setIsMirrorOn(true)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      isMirrorOn ? 'bg-cyan-500/25 text-cyan-200 shadow-sm border border-cyan-500/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ON
                  </button>
                </div>
              </div>

              {/* Camera filters */}
              <div className="space-y-1.5 border-t border-white/5 pt-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Filter Preset
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['None', 'Natural', 'Warm', 'Cool', 'Soft', 'Bright', 'Vintage'] as const).map((filterOpt) => (
                    <button
                      key={filterOpt}
                      onClick={() => setFilter(filterOpt)}
                      className={`text-[10px] py-1 rounded-lg border capitalize transition-colors cursor-pointer text-center truncate ${
                        filter === filterOpt
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
                      }`}
                    >
                      {filterOpt}
                    </button>
                  ))}
                </div>
              </div>
            </LiquidGlassCard>
          </div>
        )}
      </div>

      {/* Close Camera button at bottom */}
      <div className="pt-3 border-t border-white/10 relative z-10 shrink-0">
        <LiquidGlassButton
          variant="secondary"
          size="md"
          className="w-full text-xs font-semibold py-2.5"
          onClick={handleClose}
        >
          Close Camera
        </LiquidGlassButton>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { socketService } from '../../services/socket';
import { resourceTracker } from '../../services/resourceTracker';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, ShieldCheck, AlertCircle } from 'lucide-react';

export type VoiceCallState = 
  | 'IDLE'
  | 'OUTGOING'
  | 'RINGING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ENDING'
  | 'ENDED'
  | 'FAILED';

interface VoiceCallModalProps {
  partner: User;
  roomId: string;
  isIncoming?: boolean;
  onClose: () => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  partner,
  roomId,
  isIncoming = false,
  onClose
}) => {
  const [callState, setCallState] = useState<VoiceCallState>(
    isIncoming ? 'RINGING' : 'OUTGOING'
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<any>(null);
  const timeoutTimerRef = useRef<any>(null);
  const isCleanedUpRef = useRef(false);

  // Helper to transition state cleanly with diagnostic logging
  const transitionState = (next: VoiceCallState, reason?: string) => {
    setCallState((prev) => {
      if (prev === next) return prev;
      resourceTracker.logTransition('VoiceCall', {
        sessionId: roomId,
        safeIdentifier: partner.id,
        previousState: prev,
        nextState: next,
        event: reason || 'state_change'
      });
      return next;
    });
  };

  // Comprehensive Resource Teardown
  const cleanupCallResources = () => {
    if (isCleanedUpRef.current) return;
    isCleanedUpRef.current = true;

    console.log('[VOICE_CALL_CLEANUP] Tearing down audio tracks, peer connection, and timers');

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }

    // Stop all local microphone audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      localStreamRef.current = null;
      resourceTracker.trackMediaStream(-1);
    }

    // Close and release RTCPeerConnection
    if (peerConnRef.current) {
      try {
        peerConnRef.current.ontrack = null;
        peerConnRef.current.onicecandidate = null;
        peerConnRef.current.onconnectionstatechange = null;
        peerConnRef.current.close();
      } catch (e) {}
      peerConnRef.current = null;
      resourceTracker.trackPeerConnection(-1);
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
  };

  // Component unmount guarantee
  useEffect(() => {
    return () => {
      cleanupCallResources();
    };
  }, []);

  // Duration Timer
  useEffect(() => {
    if (callState === 'CONNECTED') {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [callState]);

  // Outgoing call timeout (no answer within 30s)
  useEffect(() => {
    if (callState === 'OUTGOING' || callState === 'RINGING') {
      timeoutTimerRef.current = setTimeout(() => {
        console.log('[VOICE_CALL_TIMEOUT] Call timed out without answer');
        setErrorMessage('No answer.');
        transitionState('ENDED', 'timeout');
        setTimeout(onClose, 1500);
      }, 30000);
    }
    return () => {
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
    };
  }, [callState, onClose]);

  // WebRTC Audio-Only Setup
  const setupMediaAndPeerConnection = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is unavailable on this device.');
      }

      // STRICT AUDIO-ONLY REQUEST
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      localStreamRef.current = stream;
      resourceTracker.trackMediaStream(1);

      // WebRTC PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      peerConnRef.current = pc;
      resourceTracker.trackPeerConnection(1);

      // Add local audio tracks to peer connection
      stream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        console.log('[VOICE_CALL_REMOTE_TRACK] Received remote audio track');
        if (!remoteAudioRef.current) {
          const audioEl = new Audio();
          audioEl.autoplay = true;
          audioEl.srcObject = event.streams[0];
          remoteAudioRef.current = audioEl;
        } else {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[VOICE_CALL_PEER_STATE]', pc.connectionState);
        if (pc.connectionState === 'connected') {
          transitionState('CONNECTED', 'peer_connected');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          console.warn('[VOICE_CALL_PEER_DISCONNECTED]');
          setErrorMessage('Call disconnected.');
          transitionState('ENDED', 'peer_failed');
          setTimeout(onClose, 1500);
        }
      };

      return pc;
    } catch (err: any) {
      console.error('[VOICE_CALL_MEDIA_ERROR]', err);
      setErrorMessage(err.message || 'Microphone access was denied.');
      transitionState('FAILED', 'media_permission_error');
      setTimeout(onClose, 2000);
      return null;
    }
  };

  // Socket signaling listener
  useEffect(() => {
    const unsub = socketService.on('webrtc:signal', async (data: any) => {
      if (data.roomId !== roomId) return;

      if (data.signalType === 'accept') {
        transitionState('CONNECTING', 'partner_accepted');
        await setupMediaAndPeerConnection();
        transitionState('CONNECTED', 'call_active');
      } else if (data.signalType === 'decline') {
        setErrorMessage('Call declined.');
        transitionState('ENDED', 'partner_declined');
        setTimeout(onClose, 1200);
      } else if (data.signalType === 'end') {
        setErrorMessage('Call ended.');
        transitionState('ENDED', 'partner_hung_up');
        setTimeout(onClose, 1000);
      }
    });

    if (!isIncoming) {
      socketService.send({
        type: 'webrtc:signal',
        roomId,
        signalType: 'call_request'
      });
    }

    return () => unsub();
  }, [roomId, isIncoming, onClose]);

  const handleAccept = async () => {
    transitionState('CONNECTING', 'user_accepting');
    socketService.send({
      type: 'webrtc:signal',
      roomId,
      signalType: 'accept'
    });
    await setupMediaAndPeerConnection();
    transitionState('CONNECTED', 'call_active');
  };

  const handleDecline = () => {
    socketService.send({
      type: 'webrtc:signal',
      roomId,
      signalType: 'decline'
    });
    transitionState('ENDED', 'user_declined');
    cleanupCallResources();
    onClose();
  };

  const handleEnd = () => {
    socketService.send({
      type: 'webrtc:signal',
      roomId,
      signalType: 'end'
    });
    transitionState('ENDING', 'user_hang_up');
    cleanupCallResources();
    transitionState('ENDED', 'call_terminated');
    setTimeout(onClose, 400);
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const nextMute = !isMuted;
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMute;
      });
      setIsMuted(nextMute);
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      const nextSpeakerMute = !isSpeakerMuted;
      remoteAudioRef.current.muted = nextSpeakerMute;
      setIsSpeakerMuted(nextSpeakerMute);
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-sm p-8 flex flex-col items-center text-center space-y-6">
        {/* Partner Initial Avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500/30 to-violet-600/30 border-2 border-white/20 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
            {partner.displayName[0]?.toUpperCase() || 'P'}
          </div>
          {(callState === 'OUTGOING' || callState === 'RINGING' || callState === 'CONNECTING') && (
            <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping pointer-events-none" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">{partner.displayName}</h3>
          <div className="text-xs text-slate-400 mt-0.5">@{partner.username}</div>
          <div className="text-xs text-cyan-400 font-mono mt-2">
            {callState === 'OUTGOING' && 'Calling (Audio only)...'}
            {callState === 'RINGING' && 'Incoming Audio Call...'}
            {callState === 'CONNECTING' && 'Connecting audio stream...'}
            {callState === 'CONNECTED' && `Call in progress · ${formatDuration(callDuration)}`}
            {callState === 'ENDING' && 'Ending call...'}
            {callState === 'ENDED' && (errorMessage || 'Call Ended')}
            {callState === 'FAILED' && (errorMessage || 'Call Failed')}
          </div>
        </div>

        {errorMessage && (
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Peer-to-Peer Encrypted Audio</span>
        </div>

        {/* Controls */}
        {callState === 'RINGING' ? (
          <div className="flex items-center gap-6 pt-4">
            <button
              onClick={handleDecline}
              className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
              title="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={handleAccept}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
              title="Accept"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 pt-4">
            {callState === 'CONNECTED' && (
              <>
                <button
                  onClick={toggleMic}
                  className={`p-3.5 rounded-full border transition-colors cursor-pointer ${
                    isMuted
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleSpeaker}
                  className={`p-3.5 rounded-full border transition-colors cursor-pointer ${
                    isSpeakerMuted
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                  }`}
                  title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
                >
                  {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </>
            )}

            <button
              onClick={handleEnd}
              disabled={callState === 'ENDED' || callState === 'ENDING'}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-950/40 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
};

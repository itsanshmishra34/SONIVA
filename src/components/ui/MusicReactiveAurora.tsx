import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { useTheme } from '../../context/ThemeContext';

export const MusicReactiveAurora: React.FC = () => {
  // Only subscribe to isPlaying state from MusicContext to prevent unnecessary performance overhead during track updates.
  const { isPlaying } = useMusic();
  const { theme } = useTheme();

  // Internal state reference linked to the MusicContext's 'isPlaying' property
  const [localIsPlaying, setLocalIsPlaying] = React.useState(isPlaying);

  React.useEffect(() => {
    setLocalIsPlaying(isPlaying);
  }, [isPlaying]);

  const isSunset = theme === 'sunset-lounge';
  const isPureBlack = theme === 'pure-black';

  if (isPureBlack) {
    return <div className="fixed inset-0 -z-50 bg-black pointer-events-none" />;
  }

  return (
    <div
      className="fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none transition-colors duration-1000"
      style={{
        '--aurora-speed': localIsPlaying ? 1.0 : 0.2,
        '--aurora-opacity-factor': localIsPlaying ? 1.0 : 0.52,
        '--aurora-scale-factor': localIsPlaying ? 1.0 : 0.9,
        transition: '--aurora-speed 500ms ease-in-out, --aurora-opacity-factor 500ms ease-in-out, --aurora-scale-factor 500ms ease-in-out, background-color 500ms ease-in-out',
      } as any}
    >
      {/* Deep midnight base canvas */}
      <div className={`absolute inset-0 ${isSunset ? 'bg-[#0e0813]' : 'bg-[#05040a]'}`} />

      {/* Atmospheric Aurora generated artwork background layer with balanced transparency */}
      <div className="absolute inset-0 bg-cover bg-center mix-blend-screen transition-all duration-1000 scale-105 aurora-bg-artwork" />

      {/* Live Moving Aurora Gradient Blobs with zero inline styles */}
      {/* Blob 1: Deep Violet / Indigo Glow (Top Left Drifting) */}
      <div
        className={`absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full blur-[130px] animate-aurora-1 transition-all duration-1000 ${
          isSunset
            ? 'bg-gradient-to-br from-amber-600/40 via-rose-600/30 to-purple-800/25'
            : 'bg-gradient-to-br from-violet-600/50 via-purple-700/40 to-indigo-800/30'
        }`}
      />

      {/* Blob 2: Vibrant Electric Cyan / Teal (Top Right Drifting) */}
      <div
        className={`absolute top-1/6 -right-32 w-[680px] h-[680px] rounded-full blur-[140px] animate-aurora-2 transition-all duration-1000 ${
          isSunset
            ? 'bg-gradient-to-bl from-rose-500/35 via-pink-600/25 to-amber-700/20'
            : 'bg-gradient-to-bl from-cyan-400/45 via-teal-500/35 to-blue-700/25'
        }`}
      />

      {/* Blob 3: Subtle Magenta / Pink Heartbeat (Bottom Center Drifting) */}
      <div
        className={`absolute -bottom-48 left-1/4 w-[750px] h-[750px] rounded-full blur-[150px] animate-aurora-3 transition-all duration-1000 ${
          isSunset
            ? 'bg-gradient-to-tr from-amber-700/35 via-red-600/25 to-purple-900/25'
            : 'bg-gradient-to-tr from-fuchsia-600/35 via-pink-600/25 to-indigo-800/30'
        }`}
      />

      {/* Blob 4: Deep Royal Blue Atmosphere (Center Screen Ambient) */}
      <div
        className={`absolute top-1/3 left-1/3 w-[550px] h-[550px] rounded-full blur-[140px] opacity-45 transition-all duration-1000 ${
          isSunset ? 'bg-indigo-900/20' : 'bg-blue-600/25'
        }`}
      />

      {/* Music Reactive Pulse Overlay when track is playing */}
      {localIsPlaying && (
        <div
          className="absolute inset-0 bg-radial from-cyan-500/10 via-violet-600/5 to-transparent animate-pulse pointer-events-none"
          style={{ animationDuration: '4.5s' }}
        />
      )}

      {/* Organic Grain & Soft Vignette (never muddy, just cinematic texture) */}
      <div className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent via-transparent to-black/50 pointer-events-none" />
    </div>
  );
};

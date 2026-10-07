import React from 'react';
import { motion } from 'motion/react';

export const AbstractVisualPanel: React.FC = () => {
  const words = ['LISTEN.', 'CHAT.', 'CONNECT.', 'SING.'];

  return (
    <div className="hidden lg:flex flex-1 relative h-full items-center justify-center overflow-hidden border-l border-white/5 bg-slate-950/20 backdrop-blur-sm">
      {/* Background Waveform */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <svg width="100%" height="200" viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-auto">
          <motion.path
            d="M0 100 Q 250 50, 500 100 T 1000 100"
            fill="none"
            stroke="url(#gradient-aurora)"
            strokeWidth="2"
            animate={{
              d: [
                "M0 100 Q 250 50, 500 100 T 1000 100",
                "M0 100 Q 250 150, 500 100 T 1000 100",
                "M0 100 Q 250 50, 500 100 T 1000 100"
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="gradient-aurora" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Glass Orbs */}
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-gradient-to-tr from-white/10 to-transparent border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center text-3xl"
      >
        🎵
      </motion.div>
      <motion.div
        animate={{ y: [0, 40, 0], x: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/3 left-1/4 w-24 h-24 rounded-full bg-gradient-to-tr from-white/10 to-transparent border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center text-2xl"
      >
        🎧
      </motion.div>

      {/* Central Glowing S Logo */}
      <div className="relative z-10 flex flex-col items-center gap-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="w-48 h-48 rounded-[48px] bg-gradient-to-tr from-cyan-500/20 via-violet-600/30 to-pink-500/20 border border-white/20 flex items-center justify-center text-white font-extrabold text-8xl shadow-[0_0_80px_rgba(34,211,238,0.15)] backdrop-blur-3xl"
        >
          S
        </motion.div>

        <div className="flex flex-col gap-4 text-center">
          {words.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.2, duration: 0.8, ease: "easeOut" }}
              className="text-4xl xl:text-5xl font-black tracking-tighter text-white/40 hover:text-white transition-colors cursor-default select-none"
            >
              {word}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
};

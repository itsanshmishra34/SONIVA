import React from 'react';
import { motion } from 'motion/react';

export const CinematicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#020617] overflow-hidden pointer-events-none">
      {/* Primary Aurora Layer */}
      <motion.div
        animate={{
          x: ['-10%', '10%', '-10%'],
          y: ['-5%', '5%', '-5%'],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -inset-[20%] opacity-40 mix-blend-screen"
      >
        <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[40%] rounded-full bg-blue-500/10 blur-[140px]" />
      </motion.div>

      {/* Secondary Aurora Layer (Slow magenta/blue) */}
      <motion.div
        animate={{
          x: ['10%', '-10%', '10%'],
          y: ['5%', '-5%', '5%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -inset-[30%] opacity-30 mix-blend-overlay"
      >
        <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-magenta-500/10 blur-[110px]" />
        <div className="absolute top-[10%] right-[20%] w-[45%] h-[45%] rounded-full bg-blue-600/15 blur-[130px]" />
      </motion.div>

      {/* Cinematic Lighting: Cyan lower-left */}
      <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-cyan-400/10 blur-[160px] opacity-60" />

      {/* Cinematic Lighting: Violet upper-right */}
      <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-violet-500/10 blur-[140px] opacity-50" />

      {/* Subtle Blue Glow behind center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-600/[0.03] blur-[180px]" />
    </div>
  );
};

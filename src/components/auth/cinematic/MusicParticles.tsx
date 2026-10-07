import React from 'react';
import { motion } from 'motion/react';
import { Music, Headphones, Disc, Sparkles, Mic2, Music2 } from 'lucide-react';

const particles = [
  { Icon: Headphones, initialX: '15%', initialY: '25%', color: 'text-cyan-400', duration: 12, delay: 0, size: 24 },
  { Icon: Music, initialX: '75%', initialY: '15%', color: 'text-violet-400', duration: 10, delay: 2, size: 20 },
  { Icon: Disc, initialX: '10%', initialY: '70%', color: 'text-pink-400', duration: 14, delay: 1, size: 18 },
  { Icon: Sparkles, initialX: '85%', initialY: '80%', color: 'text-cyan-300', duration: 9, delay: 3, size: 22 },
  { Icon: Music2, initialX: '20%', initialY: '85%', color: 'text-blue-400', duration: 11, delay: 4, size: 20 },
  { Icon: Mic2, initialX: '50%', initialY: '10%', color: 'text-violet-300', duration: 8, delay: 5, size: 16 },
];

export const MusicParticles: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0, 
            left: p.initialX, 
            top: p.initialY,
            scale: 0.8,
            filter: 'blur(4px)'
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, 20, 0],
            rotate: [0, 15, -15, 0],
            opacity: [0, 0.4, 0.4, 0],
            scale: [0.8, 1.1, 0.8],
            filter: ['blur(4px)', 'blur(0px)', 'blur(4px)']
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
          className={`absolute ${p.color} select-none`}
        >
          <p.Icon size={p.size} strokeWidth={1.5} />
        </motion.div>
      ))}
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { Star, X, CheckCircle2 } from 'lucide-react';

interface RateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RateFeedbackModal: React.FC<RateFeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { triggerFloatingEmoji } = useTheme();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('Chat');
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const categories = [
    'Chat',
    'Music',
    'Sing Together',
    'Voice',
    'Matching',
    'UI/UX',
    'Privacy',
    'Performance',
    'Feature Request',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          rating,
          category,
          comment
        })
      });
      setIsSubmitted(true);
      triggerFloatingEmoji('✨');
      triggerFloatingEmoji('❤️');
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xl">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-md p-6 space-y-5 animate-modal-enter">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">RATE SONIVA</h2>
            <p className="text-xs text-slate-400">How was your social music experience?</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-3 animate-page-enter">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-reaction-pop" />
            <div className="text-sm font-semibold text-white">Thank you for shaping SONIVA!</div>
            <div className="text-xs text-slate-400">Your feedback has been received.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 5-Star Rating */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 text-2xl transition-transform hover:scale-125 active:scale-95 focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 transition-colors duration-150 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                What should we improve?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      category === cat
                        ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 shadow-sm'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your thoughts (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you enjoy most? What should we add next?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <LiquidGlassButton type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </LiquidGlassButton>
              <LiquidGlassButton
                type="submit"
                variant="primary"
                size="md"
                glow={true}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Send Feedback'}
              </LiquidGlassButton>
            </div>
          </form>
        )}
      </LiquidGlassCard>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { Lightbulb, X, CheckCircle2 } from 'lucide-react';

interface SuggestFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuggestFeatureModal: React.FC<SuggestFeatureModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { triggerFloatingEmoji } = useTheme();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Music Player');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const categories = [
    'Music Player',
    'Chat Experience',
    'Listen Together',
    'Sing Together',
    'Vibe Matching',
    'Security / E2EE',
    'UI / Liquid Glass'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setIsSubmitting(true);

    try {
      await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          title,
          category,
          description
        })
      });
      setIsSubmitted(true);
      triggerFloatingEmoji('✨');
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xl">
      <LiquidGlassCard depth={4} glow={true} className="w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">SUGGEST A FEATURE</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div className="text-sm font-semibold text-white">Idea Captured!</div>
            <div className="text-xs text-slate-400">Our engineering roadmap reviews community ideas continuously.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Feature Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Collaborative Queue Voting"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                How would this work?
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your idea or user experience improvement..."
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <LiquidGlassButton variant="ghost" size="md" type="button" onClick={onClose}>
                Cancel
              </LiquidGlassButton>
              <LiquidGlassButton variant="primary" size="md" glow={true} disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
              </LiquidGlassButton>
            </div>
          </form>
        )}
      </LiquidGlassCard>
    </div>
  );
};

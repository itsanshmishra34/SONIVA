import React from 'react';
import { CHAT_THEMES, ChatThemeId, ChatTheme } from './chatThemes';
import { LiquidGlassModal } from '../ui/LiquidGlassModal';
import { LiquidGlassButton } from '../ui/LiquidGlassButton';
import { Check, Palette, Sparkles, CheckCheck } from 'lucide-react';

interface ChatThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: ChatThemeId;
  onSelectTheme: (themeId: ChatThemeId, applyGlobally?: boolean) => void;
  partnerName: string;
}

export const ChatThemeSelectorModal: React.FC<ChatThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
  partnerName
}) => {
  const [selectedThemeId, setSelectedThemeId] = React.useState<ChatThemeId>(currentThemeId);
  const [applyGlobally, setApplyGlobally] = React.useState(false);

  React.useEffect(() => {
    setSelectedThemeId(currentThemeId);
  }, [currentThemeId, isOpen]);

  const handleApply = () => {
    onSelectTheme(selectedThemeId, applyGlobally);
    onClose();
  };

  const themesList = Object.values(CHAT_THEMES);

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Conversation Appearance"
      subtitle={`Personalize the liquid glass palette for chatting with ${partnerName}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Header icon badge */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>Select a liquid glass theme to customize bubbles, glass tint & accents.</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            {themesList.length} Themes
          </span>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {themesList.map((theme: ChatTheme) => {
            const isSelected = selectedThemeId === theme.id;
            const isCurrent = currentThemeId === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => setSelectedThemeId(theme.id)}
                className={`group relative rounded-2xl p-4 cursor-pointer transition-all border duration-200 overflow-hidden ${
                  isSelected
                    ? 'border-cyan-400/80 bg-white/[0.12] shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400/50 scale-[1.02]'
                    : 'border-white/10 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.08]'
                }`}
              >
                {/* Theme Color Ambient Glow */}
                <div
                  className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"
                  style={{ background: theme.previewColors[1] }}
                />

                {/* Top header row */}
                <div className="flex items-center justify-between mb-2.5 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{theme.icon}</span>
                    <span className="text-xs font-bold text-white tracking-wide">
                      {theme.name}
                    </span>
                  </div>

                  {/* Active / Current indicator */}
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/20">
                      Active
                    </span>
                  ) : null}
                </div>

                {/* Tagline */}
                <p className="text-[11px] text-slate-300 line-clamp-2 mb-3 leading-relaxed relative z-10">
                  {theme.tagline}
                </p>

                {/* Color Swatch Dots */}
                <div className="flex items-center gap-1.5 mb-3.5 relative z-10">
                  {theme.previewColors.map((color, i) => (
                    <span
                      key={i}
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                      style={{ background: color }}
                    />
                  ))}
                  <span className="ml-auto text-[10px] text-slate-400 font-mono">
                    {theme.id}
                  </span>
                </div>

                {/* Mini Message Preview Cards */}
                <div className="rounded-xl p-2.5 bg-black/40 border border-white/10 space-y-2 text-[10px] relative z-10">
                  {/* Partner message preview */}
                  <div className="flex justify-start">
                    <div className={`rounded-xl px-2.5 py-1.5 max-w-[85%] border text-[10px] ${theme.partnerBubble}`}>
                      <span>Hey, love this vibe! 🎧</span>
                    </div>
                  </div>

                  {/* Self message preview with read receipt double check */}
                  <div className="flex justify-end">
                    <div className={`rounded-xl px-2.5 py-1.5 max-w-[85%] border text-white text-[10px] ${theme.myBubble}`}>
                      <div className="flex items-center gap-1.5">
                        <span>Song is amazing ✨</span>
                        <CheckCheck className={`w-3 h-3 ${theme.readCheckColor}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Default Checkbox & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
          <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyGlobally}
              onChange={(e) => setApplyGlobally(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400/50 cursor-pointer"
            />
            <span>Set as default theme for all chat conversations</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <LiquidGlassButton
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </LiquidGlassButton>

            <LiquidGlassButton
              variant="primary"
              size="sm"
              glow={true}
              onClick={handleApply}
              className="flex-1 sm:flex-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>Apply Theme</span>
            </LiquidGlassButton>
          </div>
        </div>
      </div>
    </LiquidGlassModal>
  );
};

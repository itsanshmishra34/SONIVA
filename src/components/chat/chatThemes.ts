export type ChatThemeId =
  | 'frosted-obsidian'
  | 'cyberpunk-neon'
  | 'midnight-amethyst'
  | 'emerald-velvet'
  | 'sunset-horizon'
  | 'ocean-abyss'
  | 'rose-quartz';

export interface ChatTheme {
  id: ChatThemeId;
  name: string;
  tagline: string;
  icon: string;
  previewColors: [string, string, string];
  containerBg: string;
  headerBg: string;
  footerBg: string;
  myBubble: string;
  partnerBubble: string;
  accentText: string;
  accentBorder: string;
  inputBorder: string;
  readCheckColor: string;
  typingDotColor: string;
  glowColor: string;
}

export const CHAT_THEMES: Record<ChatThemeId, ChatTheme> = {
  'frosted-obsidian': {
    id: 'frosted-obsidian',
    name: 'Frosted Obsidian',
    tagline: 'Deep slate glass with subtle crystal violet-cyan reflections',
    icon: '🌌',
    previewColors: ['#0f172a', '#7c3aed', '#06b6d4'],
    containerBg: 'bg-slate-950/25 backdrop-blur-3xl border-white/[0.10]',
    headerBg: 'bg-slate-900/40 backdrop-blur-2xl border-white/[0.12]',
    footerBg: 'bg-slate-950/45 backdrop-blur-3xl border-white/[0.12]',
    myBubble: 'bg-gradient-to-br from-violet-600/40 via-indigo-600/35 to-cyan-600/30 border-white/25 text-white shadow-[0_8px_24px_rgba(124,58,237,0.25)] hover:border-white/35',
    partnerBubble: 'bg-white/[0.08] hover:bg-white/[0.12] border-white/[0.16] text-slate-100 shadow-lg shadow-black/30 hover:border-white/25',
    accentText: 'text-cyan-300',
    accentBorder: 'border-cyan-500/40',
    inputBorder: 'focus:border-cyan-400',
    readCheckColor: 'text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]',
    typingDotColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]',
    glowColor: 'rgba(6, 182, 212, 0.25)'
  },
  'cyberpunk-neon': {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    tagline: 'High-contrast electric cyan and blazing hot magenta glow',
    icon: '⚡',
    previewColors: ['#06b6d4', '#ec4899', '#020617'],
    containerBg: 'bg-slate-950/50 backdrop-blur-3xl border-cyan-500/25',
    headerBg: 'bg-slate-950/70 backdrop-blur-2xl border-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.15)]',
    footerBg: 'bg-slate-950/70 backdrop-blur-3xl border-pink-500/30',
    myBubble: 'bg-gradient-to-br from-cyan-600/50 via-fuchsia-600/40 to-pink-600/50 border-cyan-400/40 text-white shadow-[0_8px_28px_rgba(6,182,212,0.35)] hover:border-cyan-300/60',
    partnerBubble: 'bg-slate-900/80 hover:bg-slate-900/90 border-pink-500/30 text-pink-50 shadow-lg shadow-fuchsia-950/40',
    accentText: 'text-cyan-300',
    accentBorder: 'border-pink-500/40',
    inputBorder: 'focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    readCheckColor: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,1)]',
    typingDotColor: 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.9)]',
    glowColor: 'rgba(236, 72, 153, 0.3)'
  },
  'midnight-amethyst': {
    id: 'midnight-amethyst',
    name: 'Midnight Amethyst',
    tagline: 'Royal purple crystal, lavender sheen, and velvety indigo',
    icon: '🔮',
    previewColors: ['#8b5cf6', '#6366f1', '#1e1b4b'],
    containerBg: 'bg-purple-950/25 backdrop-blur-3xl border-purple-500/20',
    headerBg: 'bg-purple-950/45 backdrop-blur-2xl border-purple-500/30 shadow-[0_4px_20px_rgba(147,51,234,0.15)]',
    footerBg: 'bg-purple-950/55 backdrop-blur-3xl border-purple-500/30',
    myBubble: 'bg-gradient-to-br from-purple-600/50 via-indigo-600/45 to-violet-600/45 border-purple-400/40 text-white shadow-[0_8px_28px_rgba(147,51,234,0.30)] hover:border-purple-300/50',
    partnerBubble: 'bg-purple-950/50 hover:bg-purple-950/65 border-purple-400/25 text-purple-100 shadow-lg shadow-purple-950/60',
    accentText: 'text-purple-300',
    accentBorder: 'border-purple-500/40',
    inputBorder: 'focus:border-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    readCheckColor: 'text-purple-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.9)]',
    typingDotColor: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]',
    glowColor: 'rgba(168, 85, 247, 0.3)'
  },
  'emerald-velvet': {
    id: 'emerald-velvet',
    name: 'Emerald Velvet',
    tagline: 'Deep botanical jade with radiant mint luminescence',
    icon: '🌿',
    previewColors: ['#10b981', '#059669', '#022c22'],
    containerBg: 'bg-emerald-950/25 backdrop-blur-3xl border-emerald-500/20',
    headerBg: 'bg-emerald-950/45 backdrop-blur-2xl border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.15)]',
    footerBg: 'bg-emerald-950/55 backdrop-blur-3xl border-emerald-500/30',
    myBubble: 'bg-gradient-to-br from-emerald-600/50 via-teal-600/45 to-cyan-600/40 border-emerald-400/40 text-white shadow-[0_8px_28px_rgba(16,185,129,0.30)] hover:border-emerald-300/50',
    partnerBubble: 'bg-emerald-950/50 hover:bg-emerald-950/65 border-emerald-400/25 text-emerald-100 shadow-lg shadow-emerald-950/60',
    accentText: 'text-emerald-300',
    accentBorder: 'border-emerald-500/40',
    inputBorder: 'focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    readCheckColor: 'text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.9)]',
    typingDotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
    glowColor: 'rgba(16, 185, 129, 0.3)'
  },
  'sunset-horizon': {
    id: 'sunset-horizon',
    name: 'Sunset Horizon',
    tagline: 'Warm amber dusk, golden rose, and twilight embers',
    icon: '🌅',
    previewColors: ['#f97316', '#f43f5e', '#451a03'],
    containerBg: 'bg-amber-950/25 backdrop-blur-3xl border-amber-500/20',
    headerBg: 'bg-amber-950/45 backdrop-blur-2xl border-amber-500/30 shadow-[0_4px_20px_rgba(249,115,22,0.15)]',
    footerBg: 'bg-amber-950/55 backdrop-blur-3xl border-amber-500/30',
    myBubble: 'bg-gradient-to-br from-amber-600/50 via-rose-600/45 to-orange-600/45 border-amber-400/40 text-white shadow-[0_8px_28px_rgba(249,115,22,0.30)] hover:border-amber-300/50',
    partnerBubble: 'bg-amber-950/50 hover:bg-amber-950/65 border-rose-400/25 text-amber-100 shadow-lg shadow-amber-950/60',
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-500/40',
    inputBorder: 'focus:border-amber-400 focus:shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    readCheckColor: 'text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.9)]',
    typingDotColor: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]',
    glowColor: 'rgba(249, 115, 22, 0.3)'
  },
  'ocean-abyss': {
    id: 'ocean-abyss',
    name: 'Ocean Abyss',
    tagline: 'Deep sapphire depths with aqua marine luminescence',
    icon: '🌊',
    previewColors: ['#0284c7', '#06b6d4', '#082f49'],
    containerBg: 'bg-sky-950/30 backdrop-blur-3xl border-sky-500/25',
    headerBg: 'bg-sky-950/50 backdrop-blur-2xl border-sky-500/30 shadow-[0_4px_20px_rgba(2,132,199,0.15)]',
    footerBg: 'bg-sky-950/60 backdrop-blur-3xl border-sky-500/30',
    myBubble: 'bg-gradient-to-br from-sky-600/50 via-blue-600/45 to-cyan-600/45 border-sky-400/40 text-white shadow-[0_8px_28px_rgba(2,132,199,0.30)] hover:border-sky-300/50',
    partnerBubble: 'bg-sky-950/50 hover:bg-sky-950/65 border-sky-400/25 text-sky-100 shadow-lg shadow-sky-950/60',
    accentText: 'text-sky-300',
    accentBorder: 'border-sky-500/40',
    inputBorder: 'focus:border-sky-400 focus:shadow-[0_0_15px_rgba(56,189,248,0.3)]',
    readCheckColor: 'text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]',
    typingDotColor: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]',
    glowColor: 'rgba(56, 189, 248, 0.3)'
  },
  'rose-quartz': {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    tagline: 'Soft blush pink, champagne glass, and dusty rose reflections',
    icon: '🌸',
    previewColors: ['#f472b6', '#fb7185', '#4c0519'],
    containerBg: 'bg-pink-950/25 backdrop-blur-3xl border-pink-500/20',
    headerBg: 'bg-pink-950/45 backdrop-blur-2xl border-pink-500/30 shadow-[0_4px_20px_rgba(244,114,182,0.15)]',
    footerBg: 'bg-pink-950/55 backdrop-blur-3xl border-pink-500/30',
    myBubble: 'bg-gradient-to-br from-pink-600/50 via-rose-600/45 to-fuchsia-600/40 border-pink-400/40 text-white shadow-[0_8px_28px_rgba(244,114,182,0.30)] hover:border-pink-300/50',
    partnerBubble: 'bg-pink-950/50 hover:bg-pink-950/65 border-pink-400/25 text-pink-100 shadow-lg shadow-pink-950/60',
    accentText: 'text-pink-300',
    accentBorder: 'border-pink-500/40',
    inputBorder: 'focus:border-pink-400 focus:shadow-[0_0_15px_rgba(244,114,182,0.3)]',
    readCheckColor: 'text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.9)]',
    typingDotColor: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)]',
    glowColor: 'rgba(244, 114, 182, 0.3)'
  }
};

export const DEFAULT_CHAT_THEME_ID: ChatThemeId = 'frosted-obsidian';

export function getChatTheme(themeId?: string | null): ChatTheme {
  if (themeId && themeId in CHAT_THEMES) {
    return CHAT_THEMES[themeId as ChatThemeId];
  }
  return CHAT_THEMES[DEFAULT_CHAT_THEME_ID];
}

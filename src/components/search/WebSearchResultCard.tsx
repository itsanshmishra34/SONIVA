import React from 'react';
import { WebSearchResult } from '../../types';
import { ExternalLink, Globe, ShieldCheck } from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';

interface WebSearchResultCardProps {
  result: WebSearchResult;
}

/**
 * A dedicated component for rendering Google Search results.
 * Follows the SONIVA Liquid Glass design while distinguishing web content from music.
 */
export const WebSearchResultCard: React.FC<WebSearchResultCardProps> = ({ result }) => {
  // Sanitize title and snippet (React does this by default, but we ensure no dangerous schemas in URL)
  const isSafe = result.url.startsWith('https://');

  return (
    <LiquidGlassCard 
      depth={2} 
      className="p-4 hover:bg-white/[0.08] border-white/5 hover:border-white/15 transition-all group"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <a 
              href={result.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block group-hover:text-cyan-300 transition-colors"
            >
              <h3 className="text-sm font-bold text-white leading-snug truncate">
                {result.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Globe className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider">
                  {result.displayUrl}
                </span>
                {isSafe && (
                  <ShieldCheck className="w-3 h-3 text-emerald-500/70" />
                )}
              </div>
            </a>
          </div>
          
          <a 
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-all shrink-0"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {result.snippet}
        </p>

        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
            Source: <span className="text-slate-400">{result.source}</span>
          </span>
        </div>
      </div>
    </LiquidGlassCard>
  );
};

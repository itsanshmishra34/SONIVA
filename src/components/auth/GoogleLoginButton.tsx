import React from 'react';

interface GoogleLoginButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onClick,
  isLoading = false,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label="Continue with Google"
      className={`group relative flex items-center justify-center gap-3.5 w-full max-w-sm px-6 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.06] border border-white/20 hover:border-white/35 active:border-white/15 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.25)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] overflow-hidden cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none select-none ${className}`}
    >
      {/* Specular Edge Highlight */}
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

      {/* Subtle Refraction Glow on Hover */}
      <span className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-violet-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
      ) : (
        /* Official Google 4-Color 'G' Icon */
        <div className="w-5 h-5 shrink-0 flex items-center justify-center filter drop-shadow-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.98 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        </div>
      )}

      <span className="text-sm font-semibold tracking-wide text-white group-hover:text-cyan-100 transition-colors">
        {isLoading ? 'Connecting with Google...' : 'Continue with Google'}
      </span>
    </button>
  );
};

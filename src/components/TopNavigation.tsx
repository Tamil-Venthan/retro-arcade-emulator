import React from 'react';

interface TopNavigationProps {
  onNavClick: (target: 'games' | 'multiplayer' | 'leaderboard' | 'save' | 'controllers') => void;
  onOpenDeployGuide: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  onNavClick,
  onOpenDeployGuide
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-16">
        {/* Zone 1: Brand wordmark (single text element) */}
        <a
          href="/"
          className="text-lg font-black tracking-wider text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 font-pixel"
        >
          RETROARCADE
        </a>

        {/* Zone 2: 4-5 single-line clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => onNavClick('games')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Games Library
          </button>
          <button
            type="button"
            onClick={() => onNavClick('multiplayer')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Multiplayer Hub
          </button>
          <button
            type="button"
            onClick={() => onNavClick('leaderboard')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Leaderboard
          </button>
          <button
            type="button"
            onClick={() => onNavClick('save')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Save States
          </button>
          <button
            type="button"
            onClick={() => onNavClick('controllers')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Controllers
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenDeployGuide}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>▲</span> Deploy Vercel
          </button>
        </div>
      </div>
    </header>
  );
};

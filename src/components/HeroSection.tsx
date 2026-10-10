import React from 'react';
import { GAMES_CATALOG } from '../games/catalog';

interface HeroSectionProps {
  genreFilter: string;
  onSelectFilter: (filter: string) => void;
  onQuickStart: () => void;
  connectedGamepadCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  genreFilter,
  onSelectFilter,
  onQuickStart,
  connectedGamepadCount
}) => {
  const genres = ['All', 'Retro Console', 'Platformer', 'Shoot \'Em Up', 'Fighting', 'Arcade Racing', 'Action Puzzle', 'Retro VM'];

  return (
    <div className="w-full space-y-6 pt-4 pb-2">
      {/* Editorial Headline & Context */}
      <div className="max-w-3xl space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Browser-Based Retro Gaming Console with Multiplayer & Controller Support
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Enjoy authentic 16-bit arcade classics and homebrew ROMs with zero installations. Plug in any USB or Bluetooth gamepad, play 2-player couch co-op or versus with friends, save and restore progress anytime with save states, and compete on the global high score leaderboards.
        </p>

        {/* Feature Highlights unboxed metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono pt-1">
          <span>60 FPS Canvas</span>
          <span aria-hidden="true">·</span>
          <span>Gamepad API (Xbox & PlayStation)</span>
          <span aria-hidden="true">·</span>
          <span>Save Slots & .sav Export</span>
          <span aria-hidden="true">·</span>
          <span>Mobile Haptic Touch Controls</span>
        </div>
      </div>

      {/* Interactive Genre Filter Segmented Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
        {genres.map((g) => {
          const isActive = genreFilter === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => onSelectFilter(g)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {g === 'All' ? 'All Games (7)' : g}
            </button>
          );
        })}
      </div>
    </div>
  );
};

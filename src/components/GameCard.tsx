import React from 'react';
import { GameMetadata } from '../types';

interface GameCardProps {
  game: GameMetadata;
  isActive: boolean;
  onSelect: (game: GameMetadata) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, isActive, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(game)}
      className={`group cursor-pointer rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        isActive
          ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
      }`}
    >
      {/* Top Banner / Graphic representation */}
      <div className="p-5 pb-3">
        {/* Unboxed metadata line with typographic separators (anti-slop rule) */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-mono">
          <span>{game.genre}</span>
          <span aria-hidden="true">·</span>
          <span>{game.year}</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-400/90">{game.players}</span>
        </div>

        <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors tracking-tight">
          {game.title}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{game.subtitle}</p>

        <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
          {game.description}
        </p>
      </div>

      {/* Controls Hint & Launch Action */}
      <div className="p-4 pt-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400 font-mono truncate">
          <span className="text-rose-400 font-semibold">[A]</span> {game.controlsHelp.actionA.split(' ')[0]}
          <span className="mx-1.5 text-slate-600">/</span>
          <span className="text-emerald-400 font-semibold">[B]</span> {game.controlsHelp.actionB.split(' ')[0]}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(game);
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            isActive
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          {isActive ? 'Playing' : 'Play Game'}
        </button>
      </div>
    </div>
  );
};

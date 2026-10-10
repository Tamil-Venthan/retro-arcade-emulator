import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { StorageService } from '../utils/storage';
import { GAMES_CATALOG } from '../games/catalog';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGameId?: string;
  defaultScoreToSubmit?: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  activeGameId = 'plumber',
  defaultScoreToSubmit
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>(activeGameId);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [scoreInput, setScoreInput] = useState(defaultScoreToSubmit || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
      if (defaultScoreToSubmit) {
        setScoreInput(defaultScoreToSubmit);
        setIsSubmitting(true);
      }
    }
  }, [isOpen, defaultScoreToSubmit]);

  const loadLeaderboard = () => {
    setEntries(StorageService.getLeaderboard());
  };

  if (!isOpen) return null;

  const filteredEntries = selectedGameFilter === 'all'
    ? entries
    : entries.filter(e => e.gameId === selectedGameFilter);

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerNameInput.trim()) return;

    StorageService.addLeaderboardEntry(
      selectedGameFilter === 'all' ? activeGameId : selectedGameFilter,
      playerNameInput,
      scoreInput,
      'High Score Record',
      '1P Solo'
    );

    loadLeaderboard();
    setIsSubmitting(false);
    setPlayerNameInput('');
  };

  const getGameTitle = (id: string) => {
    return GAMES_CATALOG.find(g => g.id === id)?.title || id.toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏆</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Arcade Hall of Fame</h2>
              <p className="text-xs text-slate-400">High scores, co-op records & global rankings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter Game:</span>
              <select
                value={selectedGameFilter}
                onChange={(e) => setSelectedGameFilter(e.target.value)}
                className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Games</option>
                {GAMES_CATALOG.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsSubmitting(!isSubmitting)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              + Submit High Score
            </button>
          </div>

          {/* Submission Form */}
          {isSubmitting && (
            <form onSubmit={handleSubmitScore} className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Submit Score for Hall of Fame</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Player Tag (3-12 Chars)</label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="PLAYER_1"
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-mono uppercase focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Score</label>
                  <input
                    type="number"
                    value={scoreInput}
                    onChange={(e) => setScoreInput(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSubmitting(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400"
                >
                  Save Score
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/50">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <div className="col-span-2">Rank</div>
              <div className="col-span-4">Player</div>
              <div className="col-span-3">Game / Stage</div>
              <div className="col-span-3 text-right">Score</div>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
              {filteredEntries.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No high scores recorded yet. Play a game to set the first record!
                </div>
              ) : (
                filteredEntries.map((item, idx) => {
                  const rank = idx + 1;
                  return (
                    <div
                      key={item.id}
                      className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-xs ${
                        item.isLocalUser ? 'bg-amber-950/20' : 'hover:bg-slate-900/30'
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-2 font-bold flex items-center gap-1.5">
                        {rank === 1 && <span className="text-amber-400">🥇 1st</span>}
                        {rank === 2 && <span className="text-slate-300">🥈 2nd</span>}
                        {rank === 3 && <span className="text-amber-600">🥉 3rd</span>}
                        {rank > 3 && <span className="text-slate-500 font-mono">#{rank}</span>}
                      </div>

                      {/* Player */}
                      <div className="col-span-4 font-mono font-bold text-slate-200 truncate flex items-center gap-1.5">
                        {item.playerName}
                        {item.isLocalUser && (
                          <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded">YOU</span>
                        )}
                      </div>

                      {/* Game & Stage */}
                      <div className="col-span-3 min-w-0">
                        <div className="text-slate-300 truncate text-[11px]">{getGameTitle(item.gameId)}</div>
                        <div className="text-[10px] text-slate-500 truncate">{item.levelOrStage}</div>
                      </div>

                      {/* Score */}
                      <div className="col-span-3 text-right font-mono font-bold text-amber-400 text-sm tabular-nums">
                        {item.score.toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

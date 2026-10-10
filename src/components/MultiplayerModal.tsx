import React from 'react';
import { GamepadInfo } from '../types';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  twoPlayerMode: boolean;
  onToggleTwoPlayer: (enabled: boolean) => void;
  gamepads: GamepadInfo[];
  activeGameTitle: string;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  twoPlayerMode,
  onToggleTwoPlayer,
  gamepads,
  activeGameTitle
}) => {
  if (!isOpen) return null;

  const p1Gamepad = gamepads.find(g => g.assignedPlayer === 'p1');
  const p2Gamepad = gamepads.find(g => g.assignedPlayer === 'p2');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="text-xl">👥</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Multiplayer Setup</h2>
              <p className="text-xs text-slate-400">Configure 2-Player Co-Op and Local Versus battle</p>
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Mode Switch Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white">
                {twoPlayerMode ? '2-Player Active Mode' : 'Single Player Mode'}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {twoPlayerMode
                  ? `Simultaneous 2-Player enabled for ${activeGameTitle}`
                  : `Currently playing solo with Player 1 controls`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggleTwoPlayer(!twoPlayerMode)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow ${
                twoPlayerMode
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {twoPlayerMode ? 'Switch to 1P Solo' : 'Enable 2P Mode'}
            </button>
          </div>

          {/* Assigned Devices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Player 1 Slot */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-rose-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400">Player 1</span>
                <span className="text-[10px] px-2 py-0.5 bg-rose-950/60 text-rose-300 rounded border border-rose-800/60">
                  Ready
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="text-[11px] text-slate-400">Input Source:</div>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  {p1Gamepad ? '🎮 ' + p1Gamepad.id : '⌨️ Keyboard (WASD + J/K/U/I)'}
                </div>
              </div>
            </div>

            {/* Player 2 Slot */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-sky-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400">Player 2</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  twoPlayerMode
                    ? 'bg-sky-950/60 text-sky-300 border-sky-800/60'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}>
                  {twoPlayerMode ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="text-[11px] text-slate-400">Input Source:</div>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  {p2Gamepad ? '🎮 ' + p2Gamepad.id : '⌨️ Keyboard (Numpad / IJKL)'}
                </div>
              </div>
            </div>
          </div>

          {/* Couch Multiplayer Tips */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Multiplayer Features:</h4>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
              <li>Connect two USB or Bluetooth gamepads for authentic couch arcade play.</li>
              <li>Or play together on one keyboard using split WASD (P1) and Numpad / IJKL (P2).</li>
              <li>Scores and victory in 2P mode are saved to the Hall of Fame with the &quot;2P Co-Op&quot; or &quot;2P Versus&quot; badge!</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

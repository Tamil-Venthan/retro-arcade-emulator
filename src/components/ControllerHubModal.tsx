import React, { useEffect, useState } from 'react';
import { inputManager, DEFAULT_KEY_BINDINGS } from '../utils/input';
import { GamepadInfo, KeyBindings, PlayerId } from '../types';

interface ControllerHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControllerHubModal: React.FC<ControllerHubModalProps> = ({ isOpen, onClose }) => {
  const [gamepads, setGamepads] = useState<GamepadInfo[]>([]);
  const [activeTesterButtons, setActiveTesterButtons] = useState<number[]>([]);
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(inputManager.getKeyBindings());

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = inputManager.subscribeGamepadChange((gps) => {
      setGamepads([...gps]);
    });

    // Real-time button poll loop for gamepad visualizer
    let animId: number;
    const pollLoop = () => {
      const rawGps = navigator.getGamepads ? navigator.getGamepads() : [];
      const pressed: number[] = [];

      for (let i = 0; i < rawGps.length; i++) {
        const gp = rawGps[i];
        if (gp && gp.connected) {
          gp.buttons.forEach((btn, idx) => {
            if (btn && btn.pressed) {
              pressed.push(idx);
            }
          });
        }
      }

      setActiveTesterButtons(pressed);
      animId = requestAnimationFrame(pollLoop);
    };

    animId = requestAnimationFrame(pollLoop);

    return () => {
      unsubscribe();
      cancelAnimationFrame(animId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAssignPlayer = (gpIndex: number, player: PlayerId | 'none') => {
    inputManager.assignGamepadToPlayer(gpIndex, player);
    setGamepads([...inputManager.getConnectedGamepads()]);
  };

  const handleResetKeys = () => {
    inputManager.setKeyBindings(DEFAULT_KEY_BINDINGS);
    setKeyBindings(DEFAULT_KEY_BINDINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎮</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Controller & Gamepad Hub</h2>
              <p className="text-xs text-slate-400">Gamepad API detector, button tester & keyboard mapping</p>
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
          {/* Section 1: Connected Gamepads */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Connected Physical Gamepads ({gamepads.length})
            </h3>

            {gamepads.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                <p className="text-sm text-slate-300 font-medium">No Gamepad Detected Yet</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Plug in an Xbox, PlayStation, Switch Pro, or generic Bluetooth/USB controller and press any button to wake it up in your browser.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {gamepads.map((gp) => (
                  <div
                    key={gp.index}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-semibold text-white truncate">{gp.id}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Port #{gp.index} · Standard Gamepad Protocol
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400">Assigned To:</span>
                      <select
                        value={gp.assignedPlayer}
                        onChange={(e) => handleAssignPlayer(gp.index, e.target.value as any)}
                        className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                      >
                        <option value="p1">Player 1</option>
                        <option value="p2">Player 2</option>
                        <option value="none">Disabled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Real-time Live Button Visualizer */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Live Gamepad Button Tester
            </h3>
            <p className="text-xs text-slate-400">
              Press buttons on your controller to test response:
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
              {[
                { id: 0, label: 'A / Cross' },
                { id: 1, label: 'B / Circle' },
                { id: 2, label: 'X / Square' },
                { id: 3, label: 'Y / Triangle' },
                { id: 12, label: 'D-Up' },
                { id: 13, label: 'D-Down' },
                { id: 14, label: 'D-Left' },
                { id: 15, label: 'D-Right' }
              ].map((btn) => {
                const isPressed = activeTesterButtons.includes(btn.id);
                return (
                  <div
                    key={btn.id}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-mono transition-colors border ${
                      isPressed
                        ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {btn.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Keyboard Controls Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Keyboard Layout (2-Player Split)
              </h3>
              <button
                type="button"
                onClick={handleResetKeys}
                className="text-xs text-amber-400 hover:text-amber-300 hover:underline"
              >
                Reset Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Player 1 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-400 pb-1 border-b border-slate-800">
                  <span>Player 1 (Primary)</span>
                  <span className="text-[10px] text-slate-400">WASD / Arrows</span>
                </div>
                <div className="text-xs space-y-1.5 text-slate-300 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Movement:</span>
                    <span>W, A, S, D / Arrows</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Action A (Jump/Fire):</span>
                    <span>J / Z / Space</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Action B (Run/Bomb):</span>
                    <span>K / X</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Special (X / Y):</span>
                    <span>U / I</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Start / Pause:</span>
                    <span>Enter</span>
                  </div>
                </div>
              </div>

              {/* Player 2 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-sky-400 pb-1 border-b border-slate-800">
                  <span>Player 2 (Co-Op / VS)</span>
                  <span className="text-[10px] text-slate-400">Numpad / IJKL</span>
                </div>
                <div className="text-xs space-y-1.5 text-slate-300 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Movement:</span>
                    <span>Num 8,4,5,6 / I,J,K,L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Action A (Jump/Fire):</span>
                    <span>Num 1 / B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Action B (Run/Bomb):</span>
                    <span>Num 2 / N</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Special (X / Y):</span>
                    <span>Num 3 / M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Start / Pause:</span>
                    <span>Num Enter / P</span>
                  </div>
                </div>
              </div>
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
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};

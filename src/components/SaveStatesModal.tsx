import React, { useState, useEffect, useRef } from 'react';
import { SaveState, ActiveGameEngine } from '../types';
import { StorageService } from '../utils/storage';

interface SaveStatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameEngine: ActiveGameEngine | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onStateLoaded: () => void;
}

export const SaveStatesModal: React.FC<SaveStatesModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameEngine,
  canvasRef,
  onStateLoaded
}) => {
  const [saveStates, setSaveStates] = useState<SaveState[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadStates();
    }
  }, [isOpen, gameId]);

  const loadStates = () => {
    const states = StorageService.getSaveStatesForGame(gameId);
    setSaveStates(states);
  };

  if (!isOpen) return null;

  const captureThumbnail = (): string => {
    if (!canvasRef.current) return '';
    try {
      return canvasRef.current.toDataURL('image/jpeg', 0.6);
    } catch {
      return '';
    }
  };

  const handleSaveSlot = (slotIndex: number) => {
    if (!gameEngine) return;
    const thumbnail = captureThumbnail();
    const score = gameEngine.getScore();
    const level = gameEngine.getLevel();
    const serializedData = gameEngine.serialize();

    StorageService.saveState(
      gameId,
      slotIndex,
      slotIndex === 0 ? 'Quick Save' : `Manual Slot #${slotIndex}`,
      thumbnail,
      score,
      level,
      serializedData
    );

    setStatusMessage(`Saved to Slot #${slotIndex} successfully!`);
    loadStates();
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleLoadSlot = (state: SaveState) => {
    if (!gameEngine) return;
    gameEngine.deserialize(state.gameStateData);
    setStatusMessage(`Restored state from ${state.label}!`);
    onStateLoaded();
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 1000);
  };

  const handleDeleteSlot = (slotIndex: number) => {
    StorageService.deleteSaveState(gameId, slotIndex);
    loadStates();
  };

  const handleExportState = (state: SaveState) => {
    StorageService.exportSaveStateToFile(state);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await StorageService.importSaveStateFromFile(file);
      loadStates();
      setStatusMessage('Save state imported successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(`Import failed: ${err.message}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Define 6 slots: 0 (Quick Save), 1, 2, 3, 4, 5
  const slots = [0, 1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="text-xl">💾</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Save States & Snapshots</h2>
              <p className="text-xs text-slate-400">Save progress anytime, load states, export & import</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mx-6 mt-4 p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <span>✓</span> {statusMessage}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <span className="text-xs text-slate-400">
              Slots are stored locally in your browser and can be exported as portable files.
            </span>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".sav,.json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Import State (.sav)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {slots.map((slotIdx) => {
              const state = saveStates.find(s => s.slotIndex === slotIdx);
              const isQuickSave = slotIdx === 0;

              return (
                <div
                  key={slotIdx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between gap-3 relative"
                >
                  <div className="flex gap-3">
                    {/* Thumbnail Screenshot */}
                    <div className="w-20 h-16 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                      {state?.screenshotUrl ? (
                        <img
                          src={state.screenshotUrl}
                          alt={state.label}
                          className="w-full h-full object-cover pixelated"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">EMPTY</span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isQuickSave ? 'text-amber-400' : 'text-slate-200'}`}>
                          {isQuickSave ? 'Quick Save Slot' : `Slot #${slotIdx}`}
                        </span>
                      </div>

                      {state ? (
                        <div className="mt-1 space-y-0.5 text-[11px] text-slate-400 font-mono">
                          <div>Score: <span className="text-slate-200 font-bold">{state.score}</span></div>
                          <div>Stage: <span className="text-slate-200">{state.level}</span></div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(state.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-slate-400">No snapshot saved</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleSaveSlot(slotIdx)}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors whitespace-nowrap"
                    >
                      Save Here
                    </button>

                    {state && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadSlot(state)}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors whitespace-nowrap"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportState(state)}
                          title="Export to file"
                          className="p-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slotIdx)}
                          title="Delete slot"
                          className="p-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

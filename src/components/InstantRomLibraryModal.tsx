import React, { useState } from 'react';
import { INSTANT_ROMS, InstantRom, downloadAndParseRom } from '../games/instantRoms';

interface InstantRomLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRom: (bytes: Uint8Array, name: string) => void;
}

export const InstantRomLibraryModal: React.FC<InstantRomLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectRom
}) => {
  const [loadingRomId, setLoadingRomId] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handle1ClickPlay = async (rom: InstantRom) => {
    setLoadingRomId(rom.id);
    setStatusError(null);
    try {
      const { bytes, name } = await downloadAndParseRom(rom.url);
      onSelectRom(bytes, name || rom.title.toUpperCase());
      onClose();
    } catch (err: any) {
      console.error(err);
      setStatusError(`Failed to load ${rom.title}: ${err.message}`);
    } finally {
      setLoadingRomId(null);
    }
  };

  const handlePlayFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    setUrlLoading(true);
    setStatusError(null);
    try {
      const { bytes, name } = await downloadAndParseRom(customUrl.trim());
      onSelectRom(bytes, name);
      onClose();
    } catch (err: any) {
      console.error(err);
      setStatusError(`Could not load from URL. Ensure the URL is CORS-accessible and links to a .nes or .zip file.`);
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">1-Click Instant ROM Library</h2>
              <p className="text-xs text-slate-400">Play real retro NES games automatically without manual file downloads</p>
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
          {statusError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              ⚠️ {statusError}
            </div>
          )}

          {/* Section 1: 1-Click Ready to Play NES Games */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Instant-Play Classics (No Download Required)
              </h3>
              <span className="text-[11px] text-amber-400 font-mono">1-Tap & Play</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INSTANT_ROMS.map((rom) => {
                const isLoading = loadingRomId === rom.id;
                return (
                  <div
                    key={rom.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/60 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {rom.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 font-semibold rounded border border-amber-500/20">
                          {rom.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{rom.subtitle}</p>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {rom.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-mono">{rom.genre} · {rom.players}</span>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handle1ClickPlay(rom)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-transform active:scale-95 shadow-sm whitespace-nowrap flex items-center gap-1.5"
                      >
                        {isLoading ? (
                          <span>Loading...</span>
                        ) : (
                          <>
                            <span>▶</span> Play Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Direct URL Download & Play */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>🌐</span> Play from Any Direct ROM URL
              </h4>
              <p className="text-xs text-slate-400">
                Paste any direct link to a <code className="text-amber-300">.nes</code> or <code className="text-amber-300">.zip</code> ROM, and RetroArcade will download and boot it in memory:
              </p>
            </div>

            <form onSubmit={handlePlayFromUrl} className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/game.nes or .zip"
                className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={urlLoading || !customUrl.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {urlLoading ? 'Downloading...' : 'Fetch & Play'}
              </button>
            </form>
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

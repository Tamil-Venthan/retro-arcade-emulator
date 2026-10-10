import React, { useRef, useState } from 'react';
import JSZip from 'jszip';

interface RomLoaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCustomRom: (bytes: Uint8Array, name: string, emulatorType: 'nes' | 'chip8') => void;
}

export const RomLoaderModal: React.FC<RomLoaderModalProps> = ({
  isOpen,
  onClose,
  onLoadCustomRom
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    setLoadingStatus('Reading ROM file...');
    setErrorMessage(null);

    try {
      const fileNameLower = file.name.toLowerCase();

      // Case 1: ZIP Archive from romsgames.net or similar
      if (fileNameLower.endsWith('.zip')) {
        setLoadingStatus('Unpacking ZIP archive...');
        const zip = await JSZip.loadAsync(file);

        // Find .nes or .ch8 file inside the zip
        const nesEntry = Object.values(zip.files).find(
          f => !f.dir && f.name.toLowerCase().endsWith('.nes')
        );

        if (nesEntry) {
          setLoadingStatus(`Extracting ${nesEntry.name}...`);
          const bytes = await nesEntry.async('uint8array');
          const cleanName = nesEntry.name.replace(/\.[^/.]+$/, '').toUpperCase();
          onLoadCustomRom(bytes, cleanName, 'nes');
          onClose();
          return;
        }

        const ch8Entry = Object.values(zip.files).find(
          f => !f.dir && (f.name.toLowerCase().endsWith('.ch8') || f.name.toLowerCase().endsWith('.bin'))
        );

        if (ch8Entry) {
          setLoadingStatus(`Extracting ${ch8Entry.name}...`);
          const bytes = await ch8Entry.async('uint8array');
          const cleanName = ch8Entry.name.replace(/\.[^/.]+$/, '').toUpperCase();
          onLoadCustomRom(bytes, cleanName, 'chip8');
          onClose();
          return;
        }

        throw new Error('No .nes or .ch8 ROM found inside this ZIP archive.');
      }

      // Case 2: Direct .nes ROM
      if (fileNameLower.endsWith('.nes')) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const cleanName = file.name.replace(/\.nes$/i, '').toUpperCase();
        onLoadCustomRom(bytes, cleanName, 'nes');
        onClose();
        return;
      }

      // Case 3: CHIP-8 ROM (.ch8 / .bin)
      if (fileNameLower.endsWith('.ch8') || fileNameLower.endsWith('.bin')) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const cleanName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
        onLoadCustomRom(bytes, cleanName, 'chip8');
        onClose();
        return;
      }

      // If unrecognized extension, inspect first 4 bytes for "NES\x1a"
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      if (bytes.length >= 4 && bytes[0] === 0x4e && bytes[1] === 0x45 && bytes[2] === 0x53 && bytes[3] === 0x1a) {
        onLoadCustomRom(bytes, file.name.toUpperCase(), 'nes');
        onClose();
        return;
      }

      throw new Error('Unsupported format. Please supply a .nes file, a .zip from romsgames.net, or a .ch8 binary.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to parse ROM file.');
      setLoadingStatus(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎮</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Play Real Retro ROMs</h2>
              <p className="text-xs text-slate-400">Load .nes, .zip (romsgames.net) or .ch8 game files</p>
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
          {/* File Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-amber-500/50 hover:border-amber-400 bg-slate-950/70 rounded-2xl text-center cursor-pointer transition-colors space-y-3 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".nes,.zip,.ch8,.bin"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="text-4xl group-hover:scale-110 transition-transform">💾</div>
            <div>
              <p className="text-sm font-bold text-white">
                Drag & drop your ROM file here, or click to browse
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports <span className="text-amber-300 font-mono">.zip</span>, <span className="text-amber-300 font-mono">.nes</span>, and <span className="text-amber-300 font-mono">.ch8</span> files
              </p>
            </div>

            {loadingStatus && (
              <div className="text-xs font-mono text-amber-400 animate-pulse pt-2">
                ⏳ {loadingStatus}
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Guide for romsgames.net */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>🌐</span> How to play ROMs from romsgames.net:
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-400 leading-relaxed">
              <li>
                Visit <span className="text-white font-medium">romsgames.net/roms/</span> and select any classic game (NES category has titles like <span className="text-slate-300">Super Mario Bros</span>, <span className="text-slate-300">Contra</span>, <span className="text-slate-300">The Legend of Zelda</span>, <span className="text-slate-300">Mega Man</span>, <span className="text-slate-300">Tetris</span>).
              </li>
              <li>
                Click <span className="text-white font-medium">&quot;Save Game / Download ROM&quot;</span> on their page. It downloads as a <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded font-mono">.zip</code> file.
              </li>
              <li>
                <span className="text-white font-medium">No need to extract!</span> Drag that downloaded <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded font-mono">.zip</code> directly into this box.
              </li>
              <li>
                The emulator extracts the ROM in memory and boots the game immediately with full audio, controllers, and save state capability.
              </li>
            </ol>
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

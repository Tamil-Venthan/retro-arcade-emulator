import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ActiveGameEngine, GameMetadata, DisplaySettings, GamepadInfo } from '../types';
import { inputManager } from '../utils/input';
import { soundEngine } from '../utils/audio';
import { StorageService } from '../utils/storage';
import { VirtualTouchControls } from './VirtualTouchControls';
import { SuperPlumberGame } from '../games/SuperPlumberGame';
import { GalacticVanguardGame } from '../games/GalacticVanguardGame';
import { StreetDuelGame } from '../games/StreetDuelGame';
import { CyberRacerGame } from '../games/CyberRacerGame';
import { BrickBreakerGame } from '../games/BrickBreakerGame';
import { Chip8Emulator } from '../games/Chip8Emulator';
import { NesEmulator } from '../games/NesEmulator';
import { INSTANT_ROMS, downloadAndParseRom } from '../games/instantRoms';

interface GameScreenProps {
  game: GameMetadata;
  settings: DisplaySettings;
  onUpdateSettings: (settings: DisplaySettings) => void;
  twoPlayerMode: boolean;
  onOpenSaveModal: () => void;
  onOpenMultiplayerModal: () => void;
  onOpenControllerModal: () => void;
  onOpenLeaderboardModal: (finalScore?: number) => void;
  onOpenRomModal: () => void;
  onOpenInstantLibrary: () => void;
  onDirectBootRom: (bytes: Uint8Array, name: string) => void;
  customRomBytes?: Uint8Array | null;
  customRomName?: string;
  gameEngineRef: React.MutableRefObject<ActiveGameEngine | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  game,
  settings,
  onUpdateSettings,
  twoPlayerMode,
  onOpenSaveModal,
  onOpenMultiplayerModal,
  onOpenControllerModal,
  onOpenLeaderboardModal,
  onOpenRomModal,
  onOpenInstantLibrary,
  onDirectBootRom,
  customRomBytes,
  customRomName,
  gameEngineRef,
  canvasRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [fps, setFps] = useState(60);
  const [connectedGamepads, setConnectedGamepads] = useState<GamepadInfo[]>([]);
  const [quickSaveNotice, setQuickSaveNotice] = useState<string | null>(null);
  const [hasPromptedScore, setHasPromptedScore] = useState(false);

  // Initialize and switch active game engine
  useEffect(() => {
    let engine: ActiveGameEngine;

    switch (game.id) {
      case 'plumber':
        engine = new SuperPlumberGame(twoPlayerMode);
        break;
      case 'vanguard':
        engine = new GalacticVanguardGame(twoPlayerMode);
        break;
      case 'brawler':
        engine = new StreetDuelGame(twoPlayerMode);
        break;
      case 'racer':
        engine = new CyberRacerGame(twoPlayerMode);
        break;
      case 'bricks':
        engine = new BrickBreakerGame(twoPlayerMode);
        break;
      case 'nes': {
        const nes = new NesEmulator();
        if (customRomBytes) {
          try {
            nes.loadRom(customRomBytes, customRomName || 'NES GAME');
          } catch (e) {
            console.error('NES load error:', e);
          }
        }
        engine = nes;
        break;
      }
      case 'chip8':
      default:
        const c8 = new Chip8Emulator();
        c8.setTwoPlayer(twoPlayerMode);
        if (customRomBytes) {
          c8.loadRomBytes(customRomBytes, customRomName || 'CUSTOM');
        }
        engine = c8;
        break;
    }

    gameEngineRef.current = engine;
    setHasPromptedScore(false);

    if (canvasRef.current) {
      engine.init(canvasRef.current);
    }

    return () => {
      engine.destroy();
    };
  }, [game.id, twoPlayerMode, customRomBytes, customRomName]);

  // Gamepad subscription
  useEffect(() => {
    const unsub = inputManager.subscribeGamepadChange((gps) => {
      setConnectedGamepads([...gps]);
    });
    return unsub;
  }, []);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsCalcTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // FPS calculation
      frameCount++;
      if (currentTime - lastFpsCalcTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastFpsCalcTime)));
        frameCount = 0;
        lastFpsCalcTime = currentTime;
      }

      const engine = gameEngineRef.current;
      const canvas = canvasRef.current;

      if (engine && canvas && !isPaused) {
        // Sample inputs
        const p1Input = inputManager.getInput('p1');
        const p2Input = inputManager.getInput('p2');

        // Check Pause trigger (Start button)
        if (p1Input.start) {
          // debounce start button toggle
        }

        // Update state
        engine.update(p1Input, p2Input, dt);

        // Render to canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          engine.render(ctx);
        }

        // Check Game Over or Victory for high score prompt
        if ((engine.isGameOver() || engine.isVictory?.()) && !hasPromptedScore) {
          const finalScore = engine.getScore();
          if (finalScore > 0) {
            setHasPromptedScore(true);
            setTimeout(() => {
              onOpenLeaderboardModal(finalScore);
            }, 1200);
          }
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused, hasPromptedScore]);

  // Quick Save Handler
  const handleQuickSave = useCallback(() => {
    const engine = gameEngineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    soundEngine.ensureAudio();
    const thumbnail = canvas.toDataURL('image/jpeg', 0.6);
    StorageService.saveState(
      game.id,
      0, // Slot 0 = Quick Save
      'Quick Save State',
      thumbnail,
      engine.getScore(),
      engine.getLevel(),
      engine.serialize()
    );

    setQuickSaveNotice('Quick Saved!');
    setTimeout(() => setQuickSaveNotice(null), 2000);
  }, [game.id]);

  // Quick Load Handler
  const handleQuickLoad = useCallback(() => {
    const engine = gameEngineRef.current;
    if (!engine) return;

    soundEngine.ensureAudio();
    const states = StorageService.getSaveStatesForGame(game.id);
    const quickSlot = states.find(s => s.slotIndex === 0);

    if (quickSlot) {
      engine.deserialize(quickSlot.gameStateData);
      setQuickSaveNotice('Quick Loaded!');
    } else {
      setQuickSaveNotice('No Quick Save Found');
    }
    setTimeout(() => setQuickSaveNotice(null), 2000);
  }, [game.id]);

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard shortcut listener for F1/F3 quick save/load
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F1') {
        e.preventDefault();
        handleQuickSave();
      } else if (e.code === 'F3') {
        e.preventDefault();
        handleQuickLoad();
      } else if (e.code === 'KeyP') {
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuickSave, handleQuickLoad]);

  // Calculate aspect ratio styling
  const getAspectClass = () => {
    switch (settings.aspectRatio) {
      case '16:9':
        return 'aspect-video max-w-4xl';
      case 'stretch':
        return 'w-full h-full';
      case 'fit':
        return 'max-h-[70vh] aspect-auto';
      case '4:3':
      default:
        return 'aspect-[4/3] max-w-3xl';
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto space-y-4">
      {/* Top Arcade Screen Bezel */}
      <div
        ref={containerRef}
        className="relative w-full bg-slate-950 p-2 sm:p-4 rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center"
      >
        {/* Arcade Bezel Header Strip */}
        <div className="w-full flex items-center justify-between px-2 pb-2 text-xs font-mono text-slate-400 border-b border-slate-800/80 mb-2">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold tracking-wider">{game.title}</span>
            <span className="text-slate-500">·</span>
            <span className="text-amber-400">{twoPlayerMode ? '2-PLAYER CO-OP' : '1P SOLO'}</span>
          </div>

          <div className="flex items-center gap-4">
            {connectedGamepads.length > 0 && (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                🎮 {connectedGamepads.length} Gamepad{connectedGamepads.length > 1 ? 's' : ''} Active
              </span>
            )}
            {settings.showFps && (
              <span className="text-slate-400 text-[11px] font-mono tabular-nums">
                {fps} FPS
              </span>
            )}
          </div>
        </div>

        {/* Game Canvas Container */}
        <div
          className={`relative w-full ${getAspectClass()} flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-inner ${
            settings.crtScanlines ? 'crt-scanlines' : ''
          }`}
        >
          <canvas
            ref={canvasRef as any}
            className="w-full h-full object-contain pixelated cursor-crosshair"
          />

          {/* Quick Save / Status Notification Toast */}
          {quickSaveNotice && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-amber-500 text-slate-950 font-pixel text-xs rounded-full shadow-lg font-bold animate-in fade-in zoom-in duration-100">
              {quickSaveNotice}
            </div>
          )}

          {/* Paused Overlay */}
          {isPaused && (
            <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
              <span className="text-2xl font-pixel text-amber-400">PAUSED</span>
              <p className="text-xs text-slate-300 font-mono">Press Resume or Key P to continue</p>
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow"
              >
                Resume Game
              </button>
            </div>
          )}

          {/* 1-Click Game Launcher Overlay when NES has no custom ROM loaded */}
          {game.id === 'nes' && !customRomBytes && (
            <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center space-y-2.5 overflow-y-auto">
              <span className="text-xs sm:text-sm font-bold font-pixel text-amber-400">⚡ 1-CLICK INSTANT NES GAMES</span>
              <p className="text-[11px] text-slate-300 max-w-sm">
                Tap any game below to play immediately without downloading files:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-md pt-1">
                {INSTANT_ROMS.slice(0, 4).map((rom) => (
                  <button
                    key={rom.id}
                    type="button"
                    onClick={async () => {
                      try {
                        const { bytes, name } = await downloadAndParseRom(rom.url);
                        onDirectBootRom(bytes, name);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 active:scale-95 transition-all text-left flex flex-col justify-between group shadow"
                  >
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 block truncate">{rom.title}</span>
                      <span className="text-[9px] text-slate-400 block truncate">{rom.genre}</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold mt-1">▶ Play Now</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onOpenInstantLibrary}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow"
                >
                  ⚡ All Instant Games ({INSTANT_ROMS.length})
                </button>
                <button
                  type="button"
                  onClick={onOpenRomModal}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors"
                >
                  + Upload .zip / .nes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Arcade Console Toolbar (Responsive for Mobile) */}
        <div className="w-full mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-xs">
          {/* Left: Quick Actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isPaused
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>

            <button
              type="button"
              onClick={handleQuickSave}
              title="Quick Save (F1)"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              💾 Save
            </button>

            <button
              type="button"
              onClick={handleQuickLoad}
              title="Quick Load (F3)"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              🔄 Load
            </button>

            <button
              type="button"
              onClick={onOpenSaveModal}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Slots
            </button>

            <button
              type="button"
              onClick={onOpenInstantLibrary}
              className="px-2.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              ⚡ 1-Click ROMs
            </button>
          </div>

          {/* Right: Screen & Audio Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* CRT Shader Toggle */}
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, crtScanlines: !settings.crtScanlines })}
              className={`px-2 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                settings.crtScanlines
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              CRT: {settings.crtScanlines ? 'ON' : 'OFF'}
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                soundEngine.ensureAudio();
                const newMute = !settings.sfxMuted;
                soundEngine.setSfxMuted(newMute);
                onUpdateSettings({ ...settings, sfxMuted: newMute });
              }}
              title="Toggle Audio"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              {settings.sfxMuted ? '🔇' : '🔊'}
            </button>

            {/* Background Music Toggle */}
            <button
              type="button"
              onClick={() => {
                soundEngine.ensureAudio();
                const playing = soundEngine.toggleMusic();
                onUpdateSettings({ ...settings, musicMuted: !playing });
              }}
              title="Toggle Chiptune Music"
              className={`p-1.5 rounded-lg transition-colors ${
                !settings.musicMuted ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
              }`}
            >
              🎵
            </button>

            {/* Aspect Ratio Switch */}
            <select
              value={settings.aspectRatio}
              onChange={(e) => onUpdateSettings({ ...settings, aspectRatio: e.target.value as any })}
              className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-1.5 py-1.5 focus:outline-none"
            >
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
              <option value="stretch">Fill</option>
            </select>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              ⛶
            </button>
          </div>
        </div>
      </div>

      {/* Control Quick Links Strip */}
      <div className="w-full flex items-center justify-between text-xs text-slate-400 px-2 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenControllerModal}
            className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
          >
            🎮 Controller Hub & Tester
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={onOpenMultiplayerModal}
            className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
          >
            👥 2-Player Co-Op Setup
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onOpenLeaderboardModal()}
            className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
          >
            🏆 View Hall of Fame
          </button>
        </div>

        <button
          type="button"
          onClick={() => onUpdateSettings({ ...settings, touchControlsVisible: !settings.touchControlsVisible })}
          className="text-xs text-slate-300 hover:text-white bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
        >
          {settings.touchControlsVisible ? 'Hide Touch Pad' : 'Show Touch Pad'}
        </button>
      </div>

      {/* Virtual On-Screen Touch Controls */}
      <VirtualTouchControls
        player="p1"
        visible={settings.touchControlsVisible}
        onQuickSave={handleQuickSave}
        onQuickLoad={handleQuickLoad}
      />
    </div>
  );
};

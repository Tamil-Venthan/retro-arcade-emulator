/**
 * RetroArcade - Browser-Based Retro Emulator & Multiplayer Hub
 */

import React, { useState, useRef, useEffect } from 'react';
import { GAMES_CATALOG } from './games/catalog';
import { GameMetadata, DisplaySettings, ActiveGameEngine, GamepadInfo } from './types';
import { StorageService } from './utils/storage';
import { inputManager } from './utils/input';
import { TopNavigation } from './components/TopNavigation';
import { HeroSection } from './components/HeroSection';
import { GameScreen } from './components/GameScreen';
import { GameCard } from './components/GameCard';
import { ControllerHubModal } from './components/ControllerHubModal';
import { SaveStatesModal } from './components/SaveStatesModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { RomLoaderModal } from './components/RomLoaderModal';
import { VercelDeployGuideModal } from './components/VercelDeployGuideModal';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameMetadata>(GAMES_CATALOG[0]);
  const [genreFilter, setGenreFilter] = useState('All');
  const [twoPlayerMode, setTwoPlayerMode] = useState(false);
  const [settings, setSettings] = useState<DisplaySettings>(StorageService.getSettings());
  const [connectedGamepads, setConnectedGamepads] = useState<GamepadInfo[]>([]);

  // Modals state
  const [isControllerModalOpen, setIsControllerModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [leaderboardScoreToSubmit, setLeaderboardScoreToSubmit] = useState<number | undefined>(undefined);
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState(false);
  const [isRomModalOpen, setIsRomModalOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);

  // Custom ROM upload
  const [customRomBytes, setCustomRomBytes] = useState<Uint8Array | null>(null);
  const [customRomName, setCustomRomName] = useState<string>('');

  const gameEngineRef = useRef<ActiveGameEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subscribe to Gamepad connect/disconnect
  useEffect(() => {
    const unsub = inputManager.subscribeGamepadChange((gps) => {
      setConnectedGamepads([...gps]);
    });
    return unsub;
  }, []);

  const handleUpdateSettings = (newSettings: DisplaySettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleSelectGame = (game: GameMetadata) => {
    setActiveGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (target: 'games' | 'multiplayer' | 'leaderboard' | 'save' | 'controllers') => {
    switch (target) {
      case 'games':
        document.getElementById('games-library')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'multiplayer':
        setIsMultiplayerModalOpen(true);
        break;
      case 'leaderboard':
        setLeaderboardScoreToSubmit(undefined);
        setIsLeaderboardModalOpen(true);
        break;
      case 'save':
        setIsSaveModalOpen(true);
        break;
      case 'controllers':
        setIsControllerModalOpen(true);
        break;
    }
  };

  const handleLoadCustomRom = (bytes: Uint8Array, name: string, emulatorType: 'nes' | 'chip8') => {
    setCustomRomBytes(bytes);
    setCustomRomName(name);
    const targetGame = GAMES_CATALOG.find(g => g.id === emulatorType) || GAMES_CATALOG[0];
    if (targetGame) {
      setActiveGame({
        ...targetGame,
        subtitle: `Running: ${name} (${emulatorType.toUpperCase()})`
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filteredGames = genreFilter === 'All'
    ? GAMES_CATALOG
    : GAMES_CATALOG.filter(g => g.genre === genreFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans-retro">
      {/* Strict Top Navigation Bar */}
      <TopNavigation
        onNavClick={handleNavClick}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Active Arcade Screen & Emulator Viewport */}
        <section aria-label="Game Screen">
          <GameScreen
            game={activeGame}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            twoPlayerMode={twoPlayerMode}
            onOpenSaveModal={() => setIsSaveModalOpen(true)}
            onOpenMultiplayerModal={() => setIsMultiplayerModalOpen(true)}
            onOpenControllerModal={() => setIsControllerModalOpen(true)}
            onOpenLeaderboardModal={(score) => {
              setLeaderboardScoreToSubmit(score);
              setIsLeaderboardModalOpen(true);
            }}
            onOpenRomModal={() => setIsRomModalOpen(true)}
            customRomBytes={customRomBytes}
            customRomName={customRomName}
            gameEngineRef={gameEngineRef}
            canvasRef={canvasRef}
          />
        </section>

        {/* Editorial Introduction & Filter Section */}
        <HeroSection
          genreFilter={genreFilter}
          onSelectFilter={setGenreFilter}
          onQuickStart={() => {
            document.querySelector('canvas')?.scrollIntoView({ behavior: 'smooth' });
          }}
          connectedGamepadCount={connectedGamepads.length}
        />

        {/* Games Library Catalog */}
        <section id="games-library" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Featured Retro Games & Emulators
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredGames.length} of {GAMES_CATALOG.length} Titles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isActive={activeGame.id === game.id}
                onSelect={handleSelectGame}
              />
            ))}
          </div>
        </section>

        {/* System Capabilities & Controller Compatibility Guide */}
        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            Comprehensive Compatibility & Hardware Support
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-1.5">
              <span className="font-semibold text-amber-400 block text-sm">Gamepad & Controller API</span>
              <p className="text-slate-400">
                Native HTML5 Gamepad API polling supports Microsoft Xbox Wireless, Sony PlayStation DualShock / DualSense, Nintendo Switch Pro, and standard USB arcade sticks with zero driver setup.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-semibold text-emerald-400 block text-sm">Save State Memory Engine</span>
              <p className="text-slate-400">
                Capture memory snapshots instantaneously into 5 distinct manual save slots plus 1 quick save slot. Export your game saves to portable <code className="text-slate-200">.sav</code> files and resume on any device.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-semibold text-sky-400 block text-sm">Touch Controls & Haptics</span>
              <p className="text-slate-400">
                Responsive 8-way directional virtual D-Pad with multi-touch action buttons and haptic rumble vibration support for mobile browsers on iOS Safari and Android Chrome.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-slate-300">RETROARCADE</span>
            <span>·</span>
            <span>Browser-Based Retro Gaming & Emulation Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => setIsDeployGuideOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Vercel Deployment Ready
            </button>
            <span>·</span>
            <span>Web Audio 8-Bit Chiptune Synth</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ControllerHubModal
        isOpen={isControllerModalOpen}
        onClose={() => setIsControllerModalOpen(false)}
      />

      <SaveStatesModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        gameId={activeGame.id}
        gameEngine={gameEngineRef.current}
        canvasRef={canvasRef}
        onStateLoaded={() => {}}
      />

      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        activeGameId={activeGame.id}
        defaultScoreToSubmit={leaderboardScoreToSubmit}
      />

      <MultiplayerModal
        isOpen={isMultiplayerModalOpen}
        onClose={() => setIsMultiplayerModalOpen(false)}
        twoPlayerMode={twoPlayerMode}
        onToggleTwoPlayer={setTwoPlayerMode}
        gamepads={connectedGamepads}
        activeGameTitle={activeGame.title}
      />

      <RomLoaderModal
        isOpen={isRomModalOpen}
        onClose={() => setIsRomModalOpen(false)}
        onLoadCustomRom={handleLoadCustomRom}
      />

      <VercelDeployGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />
    </div>
  );
}

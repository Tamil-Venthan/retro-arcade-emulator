/**
 * Persistent Storage Utilities
 * Handles Save States (Slots, Thumbnails, JSON export/import) and Leaderboards.
 */

import { SaveState, LeaderboardEntry, DisplaySettings } from '../types';

const SAVE_STATES_KEY_PREFIX = 'retro_arcade_save_';
const LEADERBOARD_KEY = 'retro_arcade_leaderboard_v1';
const SETTINGS_KEY = 'retro_arcade_settings_v1';

// Seed initial arcade high scores
const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'lb_1', gameId: 'plumber', playerName: 'MARIO_SPEED', score: 124500, levelOrStage: 'World 4-2', date: '2026-03-01', mode: '1P Solo' },
  { id: 'lb_2', gameId: 'plumber', playerName: 'LUIGI_BRO', score: 98200, levelOrStage: 'World 3-1', date: '2026-03-02', mode: '2P Co-Op' },
  { id: 'lb_3', gameId: 'plumber', playerName: 'RETRO_RUNNER', score: 76000, levelOrStage: 'World 2-3', date: '2026-03-03', mode: '1P Solo' },
  
  { id: 'lb_4', gameId: 'vanguard', playerName: 'STAR_PILOT_X', score: 342000, levelOrStage: 'Sector 5 Boss', date: '2026-03-04', mode: '1P Solo' },
  { id: 'lb_5', gameId: 'vanguard', playerName: 'TWIN_FORCE', score: 289500, levelOrStage: 'Sector 4', date: '2026-03-05', mode: '2P Co-Op' },
  { id: 'lb_6', gameId: 'vanguard', playerName: 'COSMIC_ACE', score: 215000, levelOrStage: 'Sector 3', date: '2026-03-06', mode: '1P Solo' },

  { id: 'lb_7', gameId: 'brawler', playerName: 'DRAGON_KAI', score: 54000, levelOrStage: 'Round 5 (Final)', date: '2026-03-07', mode: '1P Solo' },
  { id: 'lb_8', gameId: 'brawler', playerName: 'SHADOW_NINJA', score: 48900, levelOrStage: 'Round 4', date: '2026-03-08', mode: '2P Versus' },

  { id: 'lb_9', gameId: 'racer', playerName: 'TURBO_MAX', score: 88750, levelOrStage: 'Lap 3 (01:14.2)', date: '2026-03-09', mode: '1P Solo' },
  { id: 'lb_10', gameId: 'racer', playerName: 'SPEED_DEMON', score: 76400, levelOrStage: 'Lap 3 (01:18.5)', date: '2026-03-10', mode: '2P Versus' },

  { id: 'lb_11', gameId: 'bricks', playerName: 'PADDLE_MASTER', score: 182000, levelOrStage: 'Stage 8', date: '2026-03-11', mode: '1P Solo' },
  { id: 'lb_12', gameId: 'chip8', playerName: 'BYTE_HACKER', score: 64000, levelOrStage: 'Homebrew Champ', date: '2026-03-12', mode: '1P Solo' }
];

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  crtScanlines: true,
  crtCurvature: false,
  aspectRatio: '4:3',
  soundVolume: 0.65,
  sfxMuted: false,
  musicMuted: false,
  showFps: true,
  touchControlsVisible: true
};

export class StorageService {
  // Save State operations
  public static getSaveStatesForGame(gameId: string): SaveState[] {
    try {
      const data = localStorage.getItem(`${SAVE_STATES_KEY_PREFIX}${gameId}`);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public static saveState(
    gameId: string,
    slotIndex: number,
    label: string,
    screenshotUrl: string,
    score: number,
    level: number,
    gameStateData: any
  ): SaveState {
    const states = this.getSaveStatesForGame(gameId);
    const existingIndex = states.findIndex(s => s.slotIndex === slotIndex);

    const newState: SaveState = {
      id: `save_${gameId}_slot_${slotIndex}_${Date.now()}`,
      gameId,
      slotIndex,
      timestamp: Date.now(),
      label: label || (slotIndex === 0 ? 'Quick Save' : `Slot #${slotIndex}`),
      screenshotUrl,
      score,
      level,
      gameStateData
    };

    if (existingIndex >= 0) {
      states[existingIndex] = newState;
    } else {
      states.push(newState);
    }

    // Sort: slot 0 (Quick Save) first, then slots 1..5
    states.sort((a, b) => a.slotIndex - b.slotIndex);

    try {
      localStorage.setItem(`${SAVE_STATES_KEY_PREFIX}${gameId}`, JSON.stringify(states));
    } catch (e) {
      console.warn('LocalStorage save quota exceeded; trimming screenshot quality or old slots', e);
    }

    return newState;
  }

  public static deleteSaveState(gameId: string, slotIndex: number): void {
    const states = this.getSaveStatesForGame(gameId).filter(s => s.slotIndex !== slotIndex);
    try {
      localStorage.setItem(`${SAVE_STATES_KEY_PREFIX}${gameId}`, JSON.stringify(states));
    } catch (e) {
      console.error(e);
    }
  }

  public static exportSaveStateToFile(saveState: SaveState): void {
    const jsonStr = JSON.stringify(saveState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${saveState.gameId}_slot${saveState.slotIndex}_state.sav`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public static async importSaveStateFromFile(file: File): Promise<SaveState> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (!parsed.gameId || !parsed.gameStateData) {
            throw new Error('Invalid retro save file format');
          }
          this.saveState(
            parsed.gameId,
            parsed.slotIndex || 1,
            parsed.label ? `${parsed.label} (Imported)` : 'Imported State',
            parsed.screenshotUrl || '',
            parsed.score || 0,
            parsed.level || 1,
            parsed.gameStateData
          );
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Leaderboard operations
  public static getLeaderboard(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(LEADERBOARD_KEY);
      if (!data) {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
        return DEFAULT_LEADERBOARD;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_LEADERBOARD;
    }
  }

  public static addLeaderboardEntry(
    gameId: string,
    playerName: string,
    score: number,
    levelOrStage: string,
    mode: '1P Solo' | '2P Co-Op' | '2P Versus'
  ): LeaderboardEntry {
    const current = this.getLeaderboard();
    const entry: LeaderboardEntry = {
      id: `score_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      gameId,
      playerName: playerName.trim().toUpperCase().slice(0, 14) || 'PLAYER 1',
      score,
      levelOrStage,
      date: new Date().toISOString().split('T')[0],
      mode,
      isLocalUser: true
    };

    current.push(entry);
    current.sort((a, b) => b.score - a.score);

    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('Leaderboard save failed', e);
    }

    return entry;
  }

  // Settings
  public static getSettings(): DisplaySettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return DEFAULT_DISPLAY_SETTINGS;
      return { ...DEFAULT_DISPLAY_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_DISPLAY_SETTINGS;
    }
  }

  public static saveSettings(settings: DisplaySettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Settings save failed', e);
    }
  }
}

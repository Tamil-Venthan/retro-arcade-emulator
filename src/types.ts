/**
 * RetroArcade Emulator & Multiplayer Hub - Type Definitions
 */

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  a: boolean; // Primary action: Jump / Fire / Punch / Gas
  b: boolean; // Secondary action: Run / Bomb / Kick / Brake
  x: boolean; // Special / Fireball / Power
  y: boolean; // Heavy attack / Boost
  start: boolean; // Pause / Start
  select: boolean; // Mode / Coin
}

export type PlayerId = 'p1' | 'p2';

export interface GameMetadata {
  id: string;
  title: string;
  subtitle: string;
  year: number;
  genre: 'Platformer' | 'Shoot \'Em Up' | 'Fighting' | 'Arcade Racing' | 'Action Puzzle' | 'Retro VM' | 'Retro Console';
  players: '1 - 2 Players' | 'Single Player';
  difficulty: 'Casual' | 'Arcade' | 'Hardcore';
  description: string;
  controlsHelp: {
    actionA: string;
    actionB: string;
    actionX?: string;
    actionY?: string;
  };
  accentColor: string;
  badge: string;
}

export interface SaveState {
  id: string;
  gameId: string;
  slotIndex: number; // 0 for quicksave, 1-5 for manual
  timestamp: number;
  label: string;
  screenshotUrl: string;
  score: number;
  level: number;
  gameStateData: any;
}

export interface LeaderboardEntry {
  id: string;
  gameId: string;
  playerName: string;
  score: number;
  levelOrStage: string;
  date: string;
  mode: '1P Solo' | '2P Co-Op' | '2P Versus';
  isLocalUser?: boolean;
}

export interface GamepadInfo {
  index: number;
  id: string;
  connected: boolean;
  assignedPlayer: PlayerId | 'none';
  mapping: 'standard' | 'custom';
}

export interface DisplaySettings {
  crtScanlines: boolean;
  crtCurvature: boolean;
  aspectRatio: '4:3' | '16:9' | 'stretch' | 'fit';
  soundVolume: number; // 0 to 1
  sfxMuted: boolean;
  musicMuted: boolean;
  showFps: boolean;
  touchControlsVisible: boolean;
}

export interface KeyBindings {
  p1: {
    up: string[];
    down: string[];
    left: string[];
    right: string[];
    a: string[];
    b: string[];
    x: string[];
    y: string[];
    start: string[];
    select: string[];
  };
  p2: {
    up: string[];
    down: string[];
    left: string[];
    right: string[];
    a: string[];
    b: string[];
    x: string[];
    y: string[];
    start: string[];
    select: string[];
  };
}

export interface ActiveGameEngine {
  init(canvas: HTMLCanvasElement): void;
  update(p1Input: InputState, p2Input: InputState, deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  serialize(): any;
  deserialize(data: any): void;
  reset(): void;
  getScore(playerId?: PlayerId): number;
  getLevel(): number;
  isGameOver(): boolean;
  isVictory?(): boolean;
  destroy(): void;
}

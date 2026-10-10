import { GameMetadata } from '../types';

export const GAMES_CATALOG: GameMetadata[] = [
  {
    id: 'nes',
    title: 'Nintendo Entertainment System (NES)',
    subtitle: 'Play any .nes or .zip ROM from romsgames.net',
    year: 1985,
    genre: 'Retro Console',
    players: '1 - 2 Players',
    difficulty: 'Arcade',
    description: 'Hardware-accurate NES console emulator. Play real ROMs from romsgames.net (Super Mario Bros, Contra, Zelda, Metroid, etc.) with 2P multiplayer, gamepad support, and instant save states!',
    controlsHelp: {
      actionA: 'A Button (Jump / Fire)',
      actionB: 'B Button (Run / Attack)',
      actionX: 'Turbo B',
      actionY: 'Turbo A'
    },
    accentColor: '#DC2626',
    badge: 'Real ROMs'
  },
  {
    id: 'plumber',
    title: 'Super Pixel Plumber',
    subtitle: 'Mushroom Kingdom World 1-1 to Flagpole',
    year: 1989,
    genre: 'Platformer',
    players: '1 - 2 Players',
    difficulty: 'Casual',
    description: 'Classic side-scrolling platformer with Goomba stomping, mystery block bonuses, Super Mushrooms, fireballs, and 2-player simultaneous co-op (Mario & Luigi)!',
    controlsHelp: {
      actionA: 'Jump (Hold for higher)',
      actionB: 'Run / Dash',
      actionX: 'Fireball (When powered)',
      actionY: 'Power Spin'
    },
    accentColor: '#E11D48',
    badge: 'Popular'
  },
  {
    id: 'vanguard',
    title: 'Galactic Vanguard',
    subtitle: 'Sector Armada & Mothership Assault',
    year: 1991,
    genre: 'Shoot \'Em Up',
    players: '1 - 2 Players',
    difficulty: 'Arcade',
    description: 'Vertical arcade SHMUP with deep starfield parallax, spread cannon powerups, energy shields, smart bombs, and co-op twin ship fleet battles.',
    controlsHelp: {
      actionA: 'Rapid Laser Cannon',
      actionB: 'Smart Bomb / EMP',
      actionX: 'Spread Weapon',
      actionY: 'Shield Burst'
    },
    accentColor: '#0284C7',
    badge: 'Co-Op'
  },
  {
    id: 'brawler',
    title: 'Hyper Street Duel',
    subtitle: 'Championship 16-Bit Brawler',
    year: 1993,
    genre: 'Fighting',
    players: '1 - 2 Players',
    difficulty: 'Hardcore',
    description: 'Authentic 1v1 fighting combat featuring Dragon Karate master Kai vs Cyber Ninja Shadow. Best 2 of 3 rounds, Hadouken fireballs, and local 2P versus!',
    controlsHelp: {
      actionA: 'Light Punch',
      actionB: 'Heavy Kick',
      actionX: 'Hadouken Fireball',
      actionY: 'Dragon Uppercut'
    },
    accentColor: '#E11D48',
    badge: 'Versus'
  },
  {
    id: 'racer',
    title: 'Cyber Velocity GP',
    subtitle: 'Arcade Grand Prix & Time Attack',
    year: 1992,
    genre: 'Arcade Racing',
    players: '1 - 2 Players',
    difficulty: 'Arcade',
    description: 'High-speed top-down retro formula racing with drift handling, nitro turbo boosts, checkpoint time extensions, and competitive 2P split racing.',
    controlsHelp: {
      actionA: 'Accelerate / Gas',
      actionB: 'Brake / Reverse',
      actionX: 'Nitro Boost',
      actionY: 'Drift Lock'
    },
    accentColor: '#059669',
    badge: 'Fast'
  },
  {
    id: 'bricks',
    title: 'Neon Brick Breaker DX',
    subtitle: 'Cyber Pulse Arcade Destruction',
    year: 1990,
    genre: 'Action Puzzle',
    players: '1 - 2 Players',
    difficulty: 'Casual',
    description: 'Futuristic brick breaker action featuring laser cannons, multi-ball cascades, widening paddles, and 2-player cooperative dual paddle defense.',
    controlsHelp: {
      actionA: 'Laser Fire',
      actionB: 'Ball Launch',
      actionX: 'Magnetic Catch',
      actionY: 'Speed Burst'
    },
    accentColor: '#D97706',
    badge: 'Co-Op'
  },
  {
    id: 'chip8',
    title: 'CHIP-8 Virtual Machine',
    subtitle: 'Hardware Emulator & ROM Player',
    year: 1977,
    genre: 'Retro VM',
    players: '1 - 2 Players',
    difficulty: 'Casual',
    description: 'Fully cycle-accurate CHIP-8 CPU interpreter. Play built-in public domain classics (Pong, Brix, Invaders) or drag-and-drop your own custom .ch8 ROM files!',
    controlsHelp: {
      actionA: 'Action / Key 5',
      actionB: 'Secondary / Key 6',
      actionX: 'Key 7',
      actionY: 'Key 8'
    },
    accentColor: '#10B981',
    badge: 'ROMs'
  }
];

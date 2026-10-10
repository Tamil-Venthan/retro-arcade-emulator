/**
 * Curated 1-Click Instant Play ROMs
 * Bundled directly in /public/roms/ for zero-install, zero-download, instant in-browser play!
 */

import JSZip from 'jszip';

export interface InstantRom {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  players: string;
  year: number;
  url: string;
  tag: string;
  description: string;
}

export const INSTANT_ROMS: InstantRom[] = [
  {
    id: 'driar',
    title: 'Driar',
    subtitle: 'Acclaimed NES Action Platformer',
    genre: 'Platformer',
    players: '1 - 2 Players',
    year: 2012,
    url: '/roms/driar.nes',
    tag: 'Top Pick',
    description: 'Beautiful 60 FPS European platformer where you explore intricate stages, collect energy spheres, and navigate challenging obstacles.'
  },
  {
    id: 'invaders',
    title: 'Space Invaders NES',
    subtitle: 'Classic Alien Invasion Arcade',
    genre: 'Shoot \'Em Up',
    players: '1 - 2 Players',
    year: 1985,
    url: '/roms/invaders.nes',
    tag: 'Classic',
    description: 'Defend Earth against marching alien fleets! Features authentic NES sound synthesis, shields, and high score tracking.'
  },
  {
    id: 'flappybird',
    title: 'Flappy Bird NES',
    subtitle: 'Authentic 60 FPS NES Port',
    genre: 'Arcade',
    players: '1 Player',
    year: 2014,
    url: '/roms/flappybird.nes',
    tag: 'Addictive',
    description: 'Tap A to flap! Faithful hardware recreation of the viral mobile hit running natively on the NES PPU and 6502 CPU.'
  },
  {
    id: '3in12ppak',
    title: '3-in-1 2P Action Pak',
    subtitle: 'Simultaneous 2-Player Co-Op & Versus',
    genre: 'Multiplayer',
    players: '1 - 2 Players',
    year: 2018,
    url: '/roms/3in12ppak.nes',
    tag: '2-Player',
    description: 'Designed specifically for couch co-op with 2 gamepads! Multiple mini-games to challenge friends in local versus.'
  },
  {
    id: 'babelblox',
    title: 'Babel Blox',
    subtitle: 'Falling Block Puzzle Championship',
    genre: 'Action Puzzle',
    players: '1 - 2 Players',
    year: 2015,
    url: '/roms/babelblox.nes',
    tag: 'Puzzle',
    description: 'Fast-paced puzzle game with line clears, cascading combos, and cooperative split multiplayer.'
  },
  {
    id: 'cheril',
    title: 'Cheril the Goddess',
    subtitle: 'Epic 8-Bit Fantasy Quest',
    genre: 'Action Adventure',
    players: '1 Player',
    year: 2016,
    url: '/roms/cheril-the-goddess.nes',
    tag: 'Adventure',
    description: 'Explore ancient ruins, battle mythological bosses, and discover secret treasures across a sprawling kingdom.'
  },
  {
    id: 'blaster',
    title: 'Blaster Force NES',
    subtitle: 'Vertical Space Fleet Combat',
    genre: 'Shoot \'Em Up',
    players: '1 - 2 Players',
    year: 2017,
    url: '/roms/blaster.nes',
    tag: 'Shooter',
    description: 'High-speed vertical SHMUP featuring multi-directional lasers, weapon pickups, and intense enemy barrages.'
  },
  {
    id: 'bombarray',
    title: 'Bomb Array',
    subtitle: 'Tactical Retro Demolition',
    genre: 'Arcade Strategy',
    players: '1 - 2 Players',
    year: 2019,
    url: '/roms/bombarray.nes',
    tag: 'Tactical',
    description: 'Disarm bomb arrays under strict time limits before chain reactions trigger. Requires quick reflexes and memory!'
  }
];

/**
 * Downloads a ROM from any URL (local or remote), unzips if needed,
 * and returns the raw Uint8Array binary.
 */
export async function downloadAndParseRom(url: string): Promise<{ bytes: Uint8Array; name: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ROM: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const lowerUrl = url.toLowerCase();

  // If ZIP archive, extract the .nes file
  if (lowerUrl.endsWith('.zip') || isZipSignature(new Uint8Array(arrayBuffer, 0, 4))) {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const nesFile = Object.values(zip.files).find(
      f => !f.dir && f.name.toLowerCase().endsWith('.nes')
    );
    if (nesFile) {
      const bytes = await nesFile.async('uint8array');
      return {
        bytes,
        name: nesFile.name.replace(/\.[^/.]+$/, '').toUpperCase()
      };
    }
  }

  // Direct .nes or binary
  const bytes = new Uint8Array(arrayBuffer);
  const guessedName = url.split('/').pop()?.replace(/\.[^/.]+$/, '').toUpperCase() || 'ROM';
  return { bytes, name: guessedName };
}

function isZipSignature(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4B && (bytes[2] === 0x03 || bytes[2] === 0x05);
}

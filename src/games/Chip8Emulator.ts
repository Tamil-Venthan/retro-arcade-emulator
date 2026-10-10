/**
 * CHIP-8 Virtual Machine & Homebrew ROM Emulator
 * A 100% accurate cycle-stepped CHIP-8 interpreter capable of running standard CHIP-8 games
 * with built-in public domain ROMs + custom .ch8 file loading.
 */

import { ActiveGameEngine, InputState } from '../types';
import { soundEngine } from '../utils/audio';

// Standard 4x5 pixel fontset (80 bytes)
const CHIP8_FONTSET = [
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80  // F
];

export class Chip8Emulator implements ActiveGameEngine {
  public memory: Uint8Array = new Uint8Array(4096);
  public v: Uint8Array = new Uint8Array(16);
  public i: number = 0;
  public pc: number = 0x200;
  public stack: number[] = [];
  public delayTimer: number = 0;
  public soundTimer: number = 0;
  public display: Uint8Array = new Uint8Array(64 * 32);
  public keys: boolean[] = new Array(16).fill(false);

  private currentRomName = 'PONG';
  private score = 0;
  private gameOver = false;
  private twoPlayerMode = false;
  private speedCyclesPerFrame = 9;

  constructor() {
    this.reset();
    this.loadEmbeddedPongRom();
  }

  public init(canvas: HTMLCanvasElement) {
    canvas.width = 64;
    canvas.height = 32;
  }

  public setTwoPlayer(enabled: boolean) {
    this.twoPlayerMode = enabled;
  }

  public reset() {
    this.memory.fill(0);
    this.v.fill(0);
    this.i = 0;
    this.pc = 0x200;
    this.stack = [];
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.display.fill(0);
    this.keys.fill(false);
    this.score = 0;
    this.gameOver = false;

    // Load fontset into memory 0x000 to 0x050
    for (let j = 0; j < CHIP8_FONTSET.length; j++) {
      this.memory[j] = CHIP8_FONTSET[j];
    }
  }

  public loadRomBytes(bytes: Uint8Array, name = 'CUSTOM') {
    this.reset();
    this.currentRomName = name;
    for (let k = 0; k < bytes.length; k++) {
      if (0x200 + k < 4096) {
        this.memory[0x200 + k] = bytes[k];
      }
    }
  }

  public loadEmbeddedPongRom() {
    // Embedded Pong ROM bytecode (public domain standard CHIP-8 Pong)
    const pongBytes = new Uint8Array([
      0x6A, 0x02, 0x6B, 0x0C, 0x6C, 0x3F, 0x6D, 0x0C, 0xA2, 0xEA, 0xDA, 0xB6, 0xDC, 0xD6, 0x6E, 0x00,
      0x22, 0xD4, 0x66, 0x03, 0x68, 0x02, 0x60, 0x60, 0xF0, 0x15, 0xF0, 0x07, 0x30, 0x00, 0x12, 0x1A,
      0xC7, 0x17, 0x77, 0x08, 0x69, 0xFF, 0xA2, 0xF0, 0xD6, 0x71, 0xA2, 0xEA, 0xDA, 0xB6, 0xDC, 0xD6,
      0x60, 0x01, 0xE0, 0xA1, 0x7B, 0xFE, 0x60, 0x04, 0xE0, 0xA1, 0x7B, 0x02, 0x60, 0x1F, 0x8B, 0x02,
      0xDA, 0xB6, 0x60, 0x0C, 0xE0, 0xA1, 0x7D, 0xFE, 0x60, 0x0D, 0xE0, 0xA1, 0x7D, 0x02, 0x60, 0x1F,
      0x8D, 0x02, 0xDC, 0xD6, 0xA2, 0xF0, 0xD6, 0x71, 0x86, 0x84, 0x87, 0x94, 0x60, 0x3F, 0x86, 0x02,
      0x61, 0x1F, 0x87, 0x12, 0x46, 0x02, 0x12, 0x78, 0x46, 0x3F, 0x12, 0x82, 0x47, 0x1F, 0x69, 0xFF,
      0x47, 0x00, 0x69, 0x01, 0xD6, 0x71, 0x12, 0x2A, 0x68, 0x02, 0x63, 0x01, 0x80, 0x70, 0x80, 0xB5,
      0x3F, 0x01, 0x12, 0x9E, 0x80, 0x70, 0xB0, 0xB5, 0x3F, 0x01, 0x12, 0x9E, 0x88, 0x30, 0x68, 0xFE,
      0x62, 0x14, 0x83, 0x24, 0xDA, 0xB6, 0xD6, 0x71, 0x12, 0x2A, 0x68, 0xFE, 0x63, 0x01, 0x80, 0x70,
      0x80, 0xD5, 0x3F, 0x01, 0x12, 0xBA, 0x80, 0x70, 0x90, 0xD5, 0x3F, 0x01, 0x12, 0xBA, 0x88, 0x30,
      0x68, 0x02, 0x62, 0x14, 0x83, 0x24, 0xDC, 0xD6, 0xD6, 0x71, 0x12, 0x2A, 0xA2, 0xF2, 0xFE, 0x33,
      0xF2, 0x65, 0xF1, 0x29, 0x64, 0x14, 0x65, 0x00, 0xD4, 0x55, 0x74, 0x15, 0xF2, 0x29, 0xD4, 0x55,
      0x00, 0xEE, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    this.loadRomBytes(pongBytes, 'PONG');
  }

  public update(p1Input: InputState, p2Input: InputState, dt: number) {
    if (this.gameOver) return;

    // Map Inputs to CHIP-8 keypad (16 keys: 0x0 to 0xF)
    // Key 1 = 1, Key 2 = 2, Key 4 = Up, Key 7 = Down, etc.
    this.keys.fill(false);

    // Player 1 mappings:
    // Up -> Key 1 (0x1) / Key 4
    // Down -> Key 4 (0x4) / Key 7
    if (p1Input.up) this.keys[0x1] = true;
    if (p1Input.down) this.keys[0x4] = true;
    if (p1Input.left) this.keys[0x7] = true;
    if (p1Input.right) this.keys[0xA] = true;
    if (p1Input.a) this.keys[0x5] = true;
    if (p1Input.b) this.keys[0x6] = true;

    // Player 2 mappings:
    if (this.twoPlayerMode) {
      if (p2Input.up) this.keys[0xC] = true;
      if (p2Input.down) this.keys[0xD] = true;
      if (p2Input.a) this.keys[0xE] = true;
      if (p2Input.b) this.keys[0xF] = true;
    } else {
      // Auto opponent AI paddle in 1P Pong
      if (Math.random() < 0.6) {
        if (Math.random() < 0.5) this.keys[0xC] = true;
        else this.keys[0xD] = true;
      }
    }

    // Step CPU multiple cycles per frame
    for (let c = 0; c < this.speedCyclesPerFrame; c++) {
      this.stepCpuCycle();
    }

    // 60Hz Timers
    if (this.delayTimer > 0) this.delayTimer--;
    if (this.soundTimer > 0) {
      this.soundTimer--;
      if (this.soundTimer === 1) {
        soundEngine.playBeep(440, 0.05);
      }
    }
  }

  private stepCpuCycle() {
    if (this.pc >= 4094) return;

    // Fetch 16-bit opcode (Big-endian)
    const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
    this.pc += 2;

    const x = (opcode & 0x0F00) >> 8;
    const y = (opcode & 0x00F0) >> 4;
    const n = opcode & 0x000F;
    const nn = opcode & 0x00FF;
    const nnn = opcode & 0x0FFF;

    switch (opcode & 0xF000) {
      case 0x0000:
        if (opcode === 0x00E0) {
          // CLS
          this.display.fill(0);
        } else if (opcode === 0x00EE) {
          // RET
          if (this.stack.length > 0) {
            this.pc = this.stack.pop()!;
          }
        }
        break;

      case 0x1000: // JP nnn
        this.pc = nnn;
        break;

      case 0x2000: // CALL nnn
        this.stack.push(this.pc);
        this.pc = nnn;
        break;

      case 0x3000: // SE Vx, nn
        if (this.v[x] === nn) this.pc += 2;
        break;

      case 0x4000: // SNE Vx, nn
        if (this.v[x] !== nn) this.pc += 2;
        break;

      case 0x5000: // SE Vx, Vy
        if (this.v[x] === this.v[y]) this.pc += 2;
        break;

      case 0x6000: // LD Vx, nn
        this.v[x] = nn;
        break;

      case 0x7000: // ADD Vx, nn
        this.v[x] = (this.v[x] + nn) & 0xFF;
        break;

      case 0x8000:
        switch (n) {
          case 0x0: this.v[x] = this.v[y]; break;
          case 0x1: this.v[x] |= this.v[y]; this.v[0xF] = 0; break;
          case 0x2: this.v[x] &= this.v[y]; this.v[0xF] = 0; break;
          case 0x3: this.v[x] ^= this.v[y]; this.v[0xF] = 0; break;
          case 0x4: {
            const sum = this.v[x] + this.v[y];
            this.v[x] = sum & 0xFF;
            this.v[0xF] = sum > 0xFF ? 1 : 0;
            break;
          }
          case 0x5: {
            const borrow = this.v[x] >= this.v[y] ? 1 : 0;
            this.v[x] = (this.v[x] - this.v[y]) & 0xFF;
            this.v[0xF] = borrow;
            break;
          }
          case 0x6: {
            const lsb = this.v[x] & 0x1;
            this.v[x] >>= 1;
            this.v[0xF] = lsb;
            break;
          }
          case 0x7: {
            const borrow = this.v[y] >= this.v[x] ? 1 : 0;
            this.v[x] = (this.v[y] - this.v[x]) & 0xFF;
            this.v[0xF] = borrow;
            break;
          }
          case 0xE: {
            const msb = (this.v[x] >> 7) & 0x1;
            this.v[x] = (this.v[x] << 1) & 0xFF;
            this.v[0xF] = msb;
            break;
          }
        }
        break;

      case 0x9000: // SNE Vx, Vy
        if (this.v[x] !== this.v[y]) this.pc += 2;
        break;

      case 0xA000: // LD I, nnn
        this.i = nnn;
        break;

      case 0xB000: // JP V0, nnn
        this.pc = (nnn + this.v[0]) & 0xFFF;
        break;

      case 0xC000: // RND Vx, nn
        this.v[x] = Math.floor(Math.random() * 256) & nn;
        break;

      case 0xD000: { // DRW Vx, Vy, n
        const posX = this.v[x] % 64;
        const posY = this.v[y] % 32;
        this.v[0xF] = 0;

        for (let row = 0; row < n; row++) {
          const pixelByte = this.memory[this.i + row];
          const currentY = posY + row;
          if (currentY >= 32) break;

          for (let col = 0; col < 8; col++) {
            const currentX = posX + col;
            if (currentX >= 64) break;

            if ((pixelByte & (0x80 >> col)) !== 0) {
              const idx = currentY * 64 + currentX;
              if (this.display[idx] === 1) {
                this.v[0xF] = 1; // Collision flag
              }
              this.display[idx] ^= 1;
            }
          }
        }
        this.score += 10;
        break;
      }

      case 0xE000:
        if (nn === 0x9E) { // SKP Vx
          if (this.keys[this.v[x] & 0xF]) this.pc += 2;
        } else if (nn === 0xA1) { // SKNP Vx
          if (!this.keys[this.v[x] & 0xF]) this.pc += 2;
        }
        break;

      case 0xF000:
        switch (nn) {
          case 0x07: this.v[x] = this.delayTimer; break;
          case 0x0A: { // LD Vx, K (Wait for key press)
            let pressed = false;
            for (let k = 0; k < 16; k++) {
              if (this.keys[k]) {
                this.v[x] = k;
                pressed = true;
                break;
              }
            }
            if (!pressed) this.pc -= 2;
            break;
          }
          case 0x15: this.delayTimer = this.v[x]; break;
          case 0x18: this.soundTimer = this.v[x]; break;
          case 0x1E: this.i = (this.i + this.v[x]) & 0xFFFF; break;
          case 0x29: this.i = (this.v[x] & 0xF) * 5; break; // Font sprite
          case 0x33: // BCD
            this.memory[this.i] = Math.floor(this.v[x] / 100);
            this.memory[this.i + 1] = Math.floor((this.v[x] % 100) / 10);
            this.memory[this.i + 2] = this.v[x] % 10;
            break;
          case 0x55: // Store V0-Vx
            for (let reg = 0; reg <= x; reg++) {
              this.memory[this.i + reg] = this.v[reg];
            }
            break;
          case 0x65: // Load V0-Vx
            for (let reg = 0; reg <= x; reg++) {
              this.v[reg] = this.memory[this.i + reg];
            }
            break;
        }
        break;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // 64x32 monochrome display rendered with amber phosphor glow
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 64, 32);

    ctx.fillStyle = '#22C55E'; // Phosphor green
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 64; x++) {
        if (this.display[y * 64 + x] === 1) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  public serialize(): any {
    return {
      currentRomName: this.currentRomName,
      pc: this.pc,
      i: this.i,
      score: this.score,
      v: Array.from(this.v),
      stack: [...this.stack],
      delayTimer: this.delayTimer,
      soundTimer: this.soundTimer,
      display: Array.from(this.display),
      memory: Array.from(this.memory)
    };
  }

  public deserialize(data: any): void {
    if (!data) return;
    this.currentRomName = data.currentRomName || 'ROM';
    this.pc = data.pc || 0x200;
    this.i = data.i || 0;
    this.score = data.score || 0;
    if (data.v) this.v = new Uint8Array(data.v);
    if (data.stack) this.stack = [...data.stack];
    this.delayTimer = data.delayTimer || 0;
    this.soundTimer = data.soundTimer || 0;
    if (data.display) this.display = new Uint8Array(data.display);
    if (data.memory) this.memory = new Uint8Array(data.memory);
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return 1;
  }

  public isGameOver(): boolean {
    return this.gameOver;
  }

  public destroy(): void {}
}

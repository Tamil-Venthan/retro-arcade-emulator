/**
 * NES (Nintendo Entertainment System) Emulator Engine
 * Powered by JSNES with 2-Player input, APU sound, PPU 256x240 rendering, and Save State serialization.
 */

import { NES, Controller, ButtonKey } from 'jsnes';
import { ActiveGameEngine, InputState } from '../types';

export class NesEmulator implements ActiveGameEngine {
  private nes: NES | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private buf32: Uint32Array | null = null;
  private buf8: Uint8ClampedArray | null = null;

  // Audio Context & Buffer Queue
  private audioCtx: AudioContext | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private audioBufferLeft: number[] = [];
  private audioBufferRight: number[] = [];
  private maxAudioBufferSize = 8192;

  // ROM state
  private romLoaded = false;
  private currentRomName = 'No ROM Loaded';
  private score = 0;
  private frameCount = 0;
  private isCrashed = false;
  private rawRomBytes: Uint8Array | null = null;

  // Input states tracking to send buttonDown / buttonUp only on changes
  private p1PrevInput: Record<string, boolean> = {};
  private p2PrevInput: Record<string, boolean> = {};

  constructor() {
    this.initNes();
  }

  private initNes() {
    this.nes = new NES({
      onFrame: (frameBuffer: Uint32Array) => {
        if (!this.buf32 || !this.imageData) return;
        for (let i = 0; i < 256 * 240; i++) {
          // JSNES outputs 0x00BBGGRR or similar; ensure full alpha 0xFF000000
          this.buf32[i] = 0xFF000000 | frameBuffer[i];
        }
        if (this.buf8 && this.offscreenCtx) {
          this.imageData.data.set(this.buf8);
          this.offscreenCtx.putImageData(this.imageData, 0, 0);
        }
      },
      onAudioSample: (left: number, right: number) => {
        if (this.audioBufferLeft.length < this.maxAudioBufferSize) {
          this.audioBufferLeft.push(left);
          this.audioBufferRight.push(right);
        }
      },
      sampleRate: 44100
    });
  }

  public init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = 256;
    canvas.height = 240;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 256;
    this.offscreenCanvas.height = 240;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');

    if (this.offscreenCtx) {
      this.imageData = this.offscreenCtx.createImageData(256, 240);
      const buffer = new ArrayBuffer(this.imageData.data.length);
      this.buf8 = new Uint8ClampedArray(buffer);
      this.buf32 = new Uint32Array(buffer);
    }

    this.initAudio();
  }

  private initAudio() {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.audioCtx) {
      this.audioCtx = new AudioCtx({ sampleRate: 44100 });
      // Use ScriptProcessorNode to output NES APU samples
      this.scriptNode = this.audioCtx.createScriptProcessor(2048, 0, 2);
      this.scriptNode.onaudioprocess = (e) => {
        const outLeft = e.outputBuffer.getChannelData(0);
        const outRight = e.outputBuffer.getChannelData(1);
        const count = outLeft.length;

        for (let i = 0; i < count; i++) {
          if (this.audioBufferLeft.length > 0) {
            outLeft[i] = this.audioBufferLeft.shift() || 0;
            outRight[i] = this.audioBufferRight.shift() || 0;
          } else {
            outLeft[i] = 0;
            outRight[i] = 0;
          }
        }
      };
      this.scriptNode.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public loadRom(romData: Uint8Array, title: string) {
    if (!this.nes) {
      this.initNes();
    }
    try {
      this.rawRomBytes = romData;
      this.nes!.loadROM(romData);
      this.romLoaded = true;
      this.currentRomName = title;
      this.isCrashed = false;
      this.frameCount = 0;
      this.score = 0;
      this.initAudio();
    } catch (e) {
      console.error('Failed to load NES ROM:', e);
      this.isCrashed = true;
      throw e;
    }
  }

  public update(p1Input: InputState, p2Input: InputState, dt: number) {
    if (!this.nes || !this.romLoaded || this.isCrashed) return;

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    // Map Player 1 buttons
    this.syncButton(1, Controller.BUTTON_A, p1Input.a, 'a', this.p1PrevInput);
    this.syncButton(1, Controller.BUTTON_B, p1Input.b, 'b', this.p1PrevInput);
    this.syncButton(1, Controller.BUTTON_SELECT, p1Input.select, 'select', this.p1PrevInput);
    this.syncButton(1, Controller.BUTTON_START, p1Input.start, 'start', this.p1PrevInput);
    this.syncButton(1, Controller.BUTTON_UP, p1Input.up, 'up', this.p1PrevInput);
    this.syncButton(1, Controller.BUTTON_DOWN, p1Input.down, 'down', this.p1PrevInput);
    this.syncButton(1, Controller.BUTTON_LEFT, p1Input.left, 'left', this.p1PrevInput);
    this.syncButton(1, Controller.BUTTON_RIGHT, p1Input.right, 'right', this.p1PrevInput);

    // Map Player 2 buttons
    this.syncButton(2, Controller.BUTTON_A, p2Input.a, 'a', this.p2PrevInput);
    this.syncButton(2, Controller.BUTTON_B, p2Input.b, 'b', this.p2PrevInput);
    this.syncButton(2, Controller.BUTTON_SELECT, p2Input.select, 'select', this.p2PrevInput);
    this.syncButton(2, Controller.BUTTON_START, p2Input.start, 'start', this.p2PrevInput);
    this.syncButton(2, Controller.BUTTON_UP, p2Input.up, 'up', this.p2PrevInput);
    this.syncButton(2, Controller.BUTTON_DOWN, p2Input.down, 'down', this.p2PrevInput);
    this.syncButton(2, Controller.BUTTON_LEFT, p2Input.left, 'left', this.p2PrevInput);
    this.syncButton(2, Controller.BUTTON_RIGHT, p2Input.right, 'right', this.p2PrevInput);

    // Emulate 1 frame
    try {
      this.nes.frame();
      this.frameCount++;
      this.score = this.frameCount * 10;
    } catch (err) {
      console.warn('NES frame error:', err);
      this.isCrashed = true;
    }
  }

  private syncButton(
    playerNum: 1 | 2,
    nesButton: ButtonKey,
    isPressed: boolean,
    btnKey: string,
    prevMap: Record<string, boolean>
  ) {
    if (!this.nes) return;
    const wasPressed = Boolean(prevMap[btnKey]);

    if (isPressed && !wasPressed) {
      this.nes.buttonDown(playerNum, nesButton);
      prevMap[btnKey] = true;
    } else if (!isPressed && wasPressed) {
      this.nes.buttonUp(playerNum, nesButton);
      prevMap[btnKey] = false;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.romLoaded && this.offscreenCanvas && !this.isCrashed) {
      ctx.drawImage(this.offscreenCanvas, 0, 0, 256, 240);
    } else {
      // Standby / No ROM loaded screen
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, 256, 240);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NES EMULATOR READY', 128, 90);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '8px monospace';
      ctx.fillText('Drag & Drop any .nes or .zip ROM', 128, 115);
      ctx.fillText('or click "Load ROM" to begin', 128, 130);

      ctx.fillStyle = '#F59E0B';
      ctx.fillText('Supports 2-Player, Gamepads & Save States', 128, 160);
      ctx.textAlign = 'left';
    }
  }

  public serialize(): any {
    if (!this.nes || !this.romLoaded) return null;
    try {
      return {
        romName: this.currentRomName,
        rawRomBytes: this.rawRomBytes ? Array.from(this.rawRomBytes) : null,
        nesState: this.nes.toJSON(),
        score: this.score,
        frameCount: this.frameCount
      };
    } catch (e) {
      console.warn('NES serialization failed:', e);
      return null;
    }
  }

  public deserialize(data: any): void {
    if (!data || !this.nes) return;
    try {
      if (data.rawRomBytes && (!this.romLoaded || this.currentRomName !== data.romName)) {
        const bytes = new Uint8Array(data.rawRomBytes);
        this.loadRom(bytes, data.romName || 'SAVED_ROM');
      }
      if (data.nesState) {
        this.nes.fromJSON(data.nesState);
      }
      this.score = data.score || 0;
      this.frameCount = data.frameCount || 0;
      this.isCrashed = false;
    } catch (e) {
      console.error('NES deserialize failed:', e);
    }
  }

  public reset(): void {
    if (this.nes) {
      this.nes.reset();
      this.isCrashed = false;
    }
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return Math.floor(this.frameCount / 3600) + 1;
  }

  public isGameOver(): boolean {
    return this.isCrashed;
  }

  public isVictory(): boolean {
    return false;
  }

  public destroy(): void {
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

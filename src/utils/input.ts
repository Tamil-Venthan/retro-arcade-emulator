/**
 * Unified Input Manager
 * Integrates Keyboard, Gamepad API, and Virtual Mobile Touch Controls.
 */

import { InputState, KeyBindings, PlayerId, GamepadInfo } from '../types';

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  p1: {
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    a: ['KeyJ', 'KeyZ', 'Space'], // Jump / Fire / Punch
    b: ['KeyK', 'KeyX'],          // Run / Bomb / Kick
    x: ['KeyU', 'KeyC'],          // Special / Weapon
    y: ['KeyI', 'KeyV'],          // Heavy / Secondary
    start: ['Enter'],             // Pause / Start
    select: ['ShiftRight', 'Tab'] // Select / Coin
  },
  p2: {
    up: ['Numpad8', 'KeyI'],
    down: ['Numpad5', 'KeyK'],
    left: ['Numpad4', 'KeyJ'],
    right: ['Numpad6', 'KeyL'],
    a: ['Numpad1', 'KeyB'],       // Jump / Fire / Punch
    b: ['Numpad2', 'KeyN'],       // Run / Bomb / Kick
    x: ['Numpad3', 'KeyM'],       // Special
    y: ['Numpad0', 'Comma'],      // Heavy
    start: ['NumpadEnter', 'KeyP'],
    select: ['NumpadDecimal', 'KeyO']
  }
};

class InputManager {
  private keyBindings: KeyBindings = JSON.parse(JSON.stringify(DEFAULT_KEY_BINDINGS));
  private activeKeys = new Set<string>();

  // Virtual touch button states
  private virtualInputs: Record<PlayerId, InputState> = {
    p1: { up: false, down: false, left: false, right: false, a: false, b: false, x: false, y: false, start: false, select: false },
    p2: { up: false, down: false, left: false, right: false, a: false, b: false, x: false, y: false, start: false, select: false }
  };

  // Connected gamepads
  private gamepadMap: Map<number, GamepadInfo> = new Map();
  private onGamepadChangeCallbacks: Array<(gamepads: GamepadInfo[]) => void> = [];

  constructor() {
    this.setupKeyboardListeners();
    this.setupGamepadListeners();
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling when pressing game controls
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this.activeKeys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.activeKeys.delete(e.code);
    });

    // Reset when tab loses focus
    window.addEventListener('blur', () => {
      this.activeKeys.clear();
      this.resetVirtualInputs();
    });
  }

  private setupGamepadListeners() {
    window.addEventListener('gamepadconnected', (e: any) => {
      const gp = e.gamepad;
      if (!gp) return;

      const assignedPlayer: PlayerId | 'none' = this.gamepadMap.size === 0 ? 'p1' : (this.gamepadMap.size === 1 ? 'p2' : 'none');
      this.gamepadMap.set(gp.index, {
        index: gp.index,
        id: gp.id,
        connected: true,
        assignedPlayer,
        mapping: gp.mapping || 'standard'
      });

      this.notifyGamepadChange();
    });

    window.addEventListener('gamepaddisconnected', (e: any) => {
      if (e.gamepad) {
        this.gamepadMap.delete(e.gamepad.index);
        this.notifyGamepadChange();
      }
    });
  }

  public subscribeGamepadChange(cb: (gamepads: GamepadInfo[]) => void) {
    this.onGamepadChangeCallbacks.push(cb);
    cb(this.getConnectedGamepads());
    return () => {
      this.onGamepadChangeCallbacks = this.onGamepadChangeCallbacks.filter(c => c !== cb);
    };
  }

  private notifyGamepadChange() {
    const list = this.getConnectedGamepads();
    this.onGamepadChangeCallbacks.forEach(cb => cb(list));
  }

  public getConnectedGamepads(): GamepadInfo[] {
    const rawGamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const result: GamepadInfo[] = [];

    for (let i = 0; i < rawGamepads.length; i++) {
      const gp = rawGamepads[i];
      if (gp && gp.connected) {
        let existing = this.gamepadMap.get(gp.index);
        if (!existing) {
          existing = {
            index: gp.index,
            id: gp.id,
            connected: true,
            assignedPlayer: result.length === 0 ? 'p1' : (result.length === 1 ? 'p2' : 'none'),
            mapping: (gp.mapping as any) || 'standard'
          };
          this.gamepadMap.set(gp.index, existing);
        }
        result.push(existing);
      }
    }
    return result;
  }

  public assignGamepadToPlayer(gamepadIndex: number, player: PlayerId | 'none') {
    const gp = this.gamepadMap.get(gamepadIndex);
    if (gp) {
      gp.assignedPlayer = player;
      this.notifyGamepadChange();
    }
  }

  public setVirtualButton(player: PlayerId, button: keyof InputState, pressed: boolean) {
    this.virtualInputs[player][button] = pressed;
    if (pressed && navigator.vibrate) {
      navigator.vibrate(15);
    }
  }

  public resetVirtualInputs() {
    (['p1', 'p2'] as PlayerId[]).forEach(p => {
      Object.keys(this.virtualInputs[p]).forEach(k => {
        (this.virtualInputs[p] as any)[k] = false;
      });
    });
  }

  public setKeyBindings(bindings: KeyBindings) {
    this.keyBindings = JSON.parse(JSON.stringify(bindings));
  }

  public getKeyBindings(): KeyBindings {
    return this.keyBindings;
  }

  /**
   * Samples physical gamepad inputs for assigned player
   */
  private sampleGamepad(player: PlayerId): InputState {
    const emptyState: InputState = {
      up: false, down: false, left: false, right: false,
      a: false, b: false, x: false, y: false,
      start: false, select: false
    };

    if (!navigator.getGamepads) return emptyState;

    const gamepads = navigator.getGamepads();
    let assignedIndex = -1;

    for (const [idx, info] of this.gamepadMap.entries()) {
      if (info.assignedPlayer === player && info.connected) {
        assignedIndex = idx;
        break;
      }
    }

    if (assignedIndex === -1 || !gamepads[assignedIndex]) {
      return emptyState;
    }

    const gp = gamepads[assignedIndex]!;
    const deadzone = 0.35;

    // Standard Gamepad mapping:
    // Buttons:
    // 0: A / Cross
    // 1: B / Circle
    // 2: X / Square
    // 3: Y / Triangle
    // 8: Select / Back / Share
    // 9: Start / Options / Menu
    // 12: D-Pad Up
    // 13: D-Pad Down
    // 14: D-Pad Left
    // 15: D-Pad Right
    const buttons = gp.buttons;
    const axes = gp.axes;

    const isBtnPressed = (idx: number) => Boolean(buttons[idx] && buttons[idx].pressed);

    const stickLeft = axes[0] !== undefined && axes[0] < -deadzone;
    const stickRight = axes[0] !== undefined && axes[0] > deadzone;
    const stickUp = axes[1] !== undefined && axes[1] < -deadzone;
    const stickDown = axes[1] !== undefined && axes[1] > deadzone;

    return {
      up: isBtnPressed(12) || stickUp,
      down: isBtnPressed(13) || stickDown,
      left: isBtnPressed(14) || stickLeft,
      right: isBtnPressed(15) || stickRight,
      a: isBtnPressed(0),
      b: isBtnPressed(1),
      x: isBtnPressed(2),
      y: isBtnPressed(3),
      start: isBtnPressed(9),
      select: isBtnPressed(8)
    };
  }

  /**
   * Consolidated Input calculation combining Keyboard + Gamepad + Virtual Touch
   */
  public getInput(player: PlayerId): InputState {
    const binds = this.keyBindings[player];
    const virt = this.virtualInputs[player];
    const pad = this.sampleGamepad(player);

    const checkKey = (keys: string[]) => keys.some(k => this.activeKeys.has(k));

    return {
      up: checkKey(binds.up) || virt.up || pad.up,
      down: checkKey(binds.down) || virt.down || pad.down,
      left: checkKey(binds.left) || virt.left || pad.left,
      right: checkKey(binds.right) || virt.right || pad.right,
      a: checkKey(binds.a) || virt.a || pad.a,
      b: checkKey(binds.b) || virt.b || pad.b,
      x: checkKey(binds.x) || virt.x || pad.x,
      y: checkKey(binds.y) || virt.y || pad.y,
      start: checkKey(binds.start) || virt.start || pad.start,
      select: checkKey(binds.select) || virt.select || pad.select
    };
  }
}

export const inputManager = new InputManager();

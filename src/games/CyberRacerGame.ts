/**
 * Cyber Velocity GP (Retro Arcade Racer)
 * High-octane arcade racing with 1P and 2P multiplayer, turbo boost & checkpoints.
 */

import { ActiveGameEngine, InputState } from '../types';
import { soundEngine } from '../utils/audio';

interface Car {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  maxSpeed: number;
  lap: number;
  progress: number;
  color: string;
  name: string;
  active: boolean;
}

export class CyberRacerGame implements ActiveGameEngine {
  private width = 320;
  private height = 240;
  private twoPlayerMode = false;
  private gameOver = false;
  private victory = false;
  private timeLeft = 60;
  private timeTick = 0;
  private score = 0;
  private bestLap = 0;

  private p1: Car = this.createCar(160, 200, '#EF4444', 'P1', true);
  private p2: Car = this.createCar(180, 200, '#3B82F6', 'P2', false);

  // Track waypoints / checkpoints in oval-circuit
  private trackWaypoints = [
    { x: 160, y: 200 },
    { x: 260, y: 190 },
    { x: 270, y: 120 },
    { x: 250, y: 50 },
    { x: 160, y: 40 },
    { x: 60, y: 50 },
    { x: 45, y: 120 },
    { x: 60, y: 190 }
  ];

  constructor(twoPlayer = false) {
    this.twoPlayerMode = twoPlayer;
    this.p2.active = twoPlayer;
  }

  private createCar(x: number, y: number, color: string, name: string, active: boolean): Car {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2, // Facing North
      speed: 0,
      maxSpeed: 4.2,
      lap: 1,
      progress: 0,
      color,
      name,
      active
    };
  }

  public init(canvas: HTMLCanvasElement) {
    canvas.width = this.width;
    canvas.height = this.height;
  }

  public setTwoPlayer(enabled: boolean) {
    this.twoPlayerMode = enabled;
    this.p2.active = enabled;
  }

  public update(p1Input: InputState, p2Input: InputState, dt: number) {
    if (this.gameOver || this.victory) return;

    // Countdown timer
    this.timeTick++;
    if (this.timeTick >= 60) {
      this.timeTick = 0;
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      if (this.timeLeft <= 0) {
        this.gameOver = true;
        soundEngine.playGameOver();
      }
    }

    this.updateCar(this.p1, p1Input);
    if (this.twoPlayerMode && this.p2.active) {
      this.updateCar(this.p2, p2Input);
    }
  }

  private updateCar(car: Car, input: InputState) {
    if (!car.active) return;

    // Steering
    const turnSpeed = 0.055;
    if (input.left) car.angle -= turnSpeed;
    if (input.right) car.angle += turnSpeed;

    // Acceleration (Gas = Button A or Up)
    const accel = 0.12;
    const brake = 0.18;
    const friction = 0.97;

    if (input.a || input.up) {
      car.speed = Math.min(car.maxSpeed, car.speed + accel);
    } else if (input.b || input.down) {
      car.speed = Math.max(-1.5, car.speed - brake);
    } else {
      car.speed *= friction;
    }

    // Boost with button X or Y
    if (input.x && car.speed > 2) {
      car.speed = Math.min(6.0, car.speed + 0.2);
    }

    // Velocity update
    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    // Keep on screen
    car.x = Math.max(10, Math.min(this.width - 10, car.x));
    car.y = Math.max(10, Math.min(this.height - 10, car.y));

    // Waypoint tracking
    const targetWp = this.trackWaypoints[car.progress % this.trackWaypoints.length];
    const distToWp = Math.hypot(car.x - targetWp.x, car.y - targetWp.y);

    if (distToWp < 38) {
      car.progress++;
      if (car.progress % this.trackWaypoints.length === 0) {
        // Completed Lap!
        car.lap++;
        this.timeLeft += 25; // Checkpoint bonus
        this.score += 2500;
        soundEngine.playVictory();

        if (car.lap > 3) {
          this.victory = true;
          this.score += this.timeLeft * 200;
          soundEngine.playVictory();
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Outer grass / cyber neon borders
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(0, 0, this.width, this.height);

    // Track asphalt
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 50;
    ctx.beginPath();
    ctx.ellipse(this.width / 2, this.height / 2, 110, 75, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner infield
    ctx.fillStyle = '#064E3B';
    ctx.beginPath();
    ctx.ellipse(this.width / 2, this.height / 2, 85, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Track curbs (Red/White curb markings)
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(this.width / 2, this.height / 2, 136, 101, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(this.width / 2, this.height / 2, 84, 49, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Finish line
    ctx.fillStyle = '#FFFFFF';
    for (let c = 0; c < 6; c++) {
      ctx.fillRect(150 + (c % 2) * 5, 175 + c * 5, 5, 5);
    }

    // Render Cars
    const drawCar = (car: Car) => {
      if (!car.active) return;
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Car chassis
      ctx.fillStyle = car.color;
      ctx.fillRect(-10, -5, 20, 10);

      // Spoiler & tires
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-12, -6, 3, 12);
      ctx.fillRect(6, -6, 4, 2);
      ctx.fillRect(6, 4, 4, 2);
      ctx.fillRect(-8, -6, 4, 2);
      ctx.fillRect(-8, 4, 4, 2);

      // Cockpit
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-2, -3, 8, 6);

      ctx.restore();
    };

    drawCar(this.p1);
    if (this.twoPlayerMode && this.p2.active) {
      drawCar(this.p2);
    }

    // Top HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, this.width, 22);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '8px monospace';
    ctx.fillText(`TIME: ${this.timeLeft}s`, 10, 14);
    ctx.fillText(`LAP: ${Math.min(3, this.p1.lap)}/3`, 95, 14);
    ctx.fillText(`SPEED: ${Math.round(this.p1.speed * 28)} MPH`, 175, 14);
    ctx.fillText(`SCORE: ${this.score}`, 250, 14);

    if (this.victory) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CHECKERED FLAG!', this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.fillText(`Grand Prix Winner! Score: ${this.score}`, this.width / 2, this.height / 2 + 15);
      ctx.textAlign = 'left';
    } else if (this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TIME UP', this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 15);
      ctx.textAlign = 'left';
    }
  }

  public serialize(): any {
    return {
      timeLeft: this.timeLeft,
      score: this.score,
      twoPlayerMode: this.twoPlayerMode,
      p1: { ...this.p1 },
      p2: { ...this.p2 }
    };
  }

  public deserialize(data: any): void {
    if (!data) return;
    this.timeLeft = data.timeLeft || 60;
    this.score = data.score || 0;
    this.twoPlayerMode = Boolean(data.twoPlayerMode);
    if (data.p1) this.p1 = { ...data.p1 };
    if (data.p2) this.p2 = { ...data.p2 };
    this.gameOver = false;
    this.victory = false;
  }

  public reset(): void {
    this.timeLeft = 60;
    this.score = 0;
    this.gameOver = false;
    this.victory = false;
    this.p1 = this.createCar(160, 200, '#EF4444', 'P1', true);
    this.p2 = this.createCar(180, 200, '#3B82F6', 'P2', this.twoPlayerMode);
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.p1.lap;
  }

  public isGameOver(): boolean {
    return this.gameOver;
  }

  public isVictory(): boolean {
    return this.victory;
  }

  public destroy(): void {}
}

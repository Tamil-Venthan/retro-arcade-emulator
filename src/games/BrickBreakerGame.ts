/**
 * Neon Brick Breaker DX
 * Classic arcade breakout action with multi-ball, powerup capsules and 2P co-op.
 */

import { ActiveGameEngine, InputState } from '../types';
import { soundEngine } from '../utils/audio';

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hasLaser: boolean;
  color: string;
  name: string;
  active: boolean;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hp: number;
  points: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'multiball' | 'laser' | 'expand';
  color: string;
}

interface LaserShot {
  x: number;
  y: number;
  vy: number;
}

export class BrickBreakerGame implements ActiveGameEngine {
  private width = 320;
  private height = 240;
  private score = 0;
  private lives = 3;
  private level = 1;
  private gameOver = false;
  private victory = false;
  private twoPlayerMode = false;

  private p1: Paddle = { x: 120, y: 220, width: 44, height: 8, speed: 4, hasLaser: false, color: '#38BDF8', name: 'P1', active: true };
  private p2: Paddle = { x: 170, y: 220, width: 44, height: 8, speed: 4, hasLaser: false, color: '#F472B6', name: 'P2', active: false };

  private balls: Ball[] = [];
  private bricks: Brick[] = [];
  private powerups: PowerUp[] = [];
  private lasers: LaserShot[] = [];

  constructor(twoPlayer = false) {
    this.twoPlayerMode = twoPlayer;
    this.p2.active = twoPlayer;
    this.resetStage();
  }

  public init(canvas: HTMLCanvasElement) {
    canvas.width = this.width;
    canvas.height = this.height;
  }

  public setTwoPlayer(enabled: boolean) {
    this.twoPlayerMode = enabled;
    this.p2.active = enabled;
  }

  private resetStage() {
    this.balls = [{ x: 160, y: 200, vx: 2, vy: -2.5, radius: 4, color: '#FFFFFF' }];
    this.bricks = [];
    this.powerups = [];
    this.lasers = [];

    const colors = ['#EF4444', '#F97316', '#EAB308', '#10B981', '#3B82F6', '#8B5CF6'];
    const rows = 5;
    const cols = 8;
    const brickW = 34;
    const brickH = 12;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.bricks.push({
          x: 24 + c * (brickW + 3),
          y: 35 + r * (brickH + 3),
          width: brickW,
          height: brickH,
          color: colors[r % colors.length],
          hp: r === 0 ? 2 : 1,
          points: (rows - r) * 100
        });
      }
    }
  }

  public update(p1Input: InputState, p2Input: InputState, dt: number) {
    if (this.gameOver || this.victory) return;

    // Paddle 1 movement
    if (p1Input.left) this.p1.x -= this.p1.speed;
    if (p1Input.right) this.p1.x += this.p1.speed;
    this.p1.x = Math.max(10, Math.min(this.width - this.p1.width - 10, this.p1.x));

    if (p1Input.a && this.p1.hasLaser && Math.random() < 0.2) {
      this.lasers.push({ x: this.p1.x + 4, y: this.p1.y, vy: -5 });
      this.lasers.push({ x: this.p1.x + this.p1.width - 4, y: this.p1.y, vy: -5 });
      soundEngine.playLaser();
    }

    // Paddle 2 movement
    if (this.twoPlayerMode && this.p2.active) {
      if (p2Input.left) this.p2.x -= this.p2.speed;
      if (p2Input.right) this.p2.x += this.p2.speed;
      this.p2.x = Math.max(10, Math.min(this.width - this.p2.width - 10, this.p2.x));

      if (p2Input.a && this.p2.hasLaser && Math.random() < 0.2) {
        this.lasers.push({ x: this.p2.x + 4, y: this.p2.y, vy: -5 });
        this.lasers.push({ x: this.p2.x + this.p2.width - 4, y: this.p2.y, vy: -5 });
        soundEngine.playLaser();
      }
    }

    // Update Balls
    for (let bIdx = this.balls.length - 1; bIdx >= 0; bIdx--) {
      const b = this.balls[bIdx];
      b.x += b.vx;
      b.y += b.vy;

      // Wall bounce
      if (b.x - b.radius < 5) {
        b.x = 5 + b.radius;
        b.vx = -b.vx;
        soundEngine.playHit();
      } else if (b.x + b.radius > this.width - 5) {
        b.x = this.width - 5 - b.radius;
        b.vx = -b.vx;
        soundEngine.playHit();
      }

      if (b.y - b.radius < 24) {
        b.y = 24 + b.radius;
        b.vy = -b.vy;
        soundEngine.playHit();
      }

      // Paddle bounce
      const paddles = [this.p1];
      if (this.twoPlayerMode && this.p2.active) paddles.push(this.p2);

      paddles.forEach(pad => {
        if (
          b.y + b.radius >= pad.y &&
          b.y - b.radius <= pad.y + pad.height &&
          b.x >= pad.x &&
          b.x <= pad.x + pad.width &&
          b.vy > 0
        ) {
          b.vy = -Math.abs(b.vy);
          // Angle based on hit location
          const offset = (b.x - (pad.x + pad.width / 2)) / (pad.width / 2);
          b.vx = offset * 3.5;
          soundEngine.playJump();
        }
      });

      // Brick collision
      for (let brIdx = this.bricks.length - 1; brIdx >= 0; brIdx--) {
        const br = this.bricks[brIdx];
        if (
          b.x + b.radius >= br.x &&
          b.x - b.radius <= br.x + br.width &&
          b.y + b.radius >= br.y &&
          b.y - b.radius <= br.y + br.height
        ) {
          b.vy = -b.vy;
          br.hp--;
          soundEngine.playCoin();

          if (br.hp <= 0) {
            this.score += br.points;
            if (Math.random() < 0.25) {
              const types: ('multiball' | 'laser' | 'expand')[] = ['multiball', 'laser', 'expand'];
              this.powerups.push({
                x: br.x + br.width / 2,
                y: br.y,
                type: types[Math.floor(Math.random() * types.length)],
                color: '#FBBF24'
              });
            }
            this.bricks.splice(brIdx, 1);
          }
          break;
        }
      }

      // Bottom pitfall
      if (b.y > this.height + 10) {
        this.balls.splice(bIdx, 1);
      }
    }

    // If all balls lost
    if (this.balls.length === 0) {
      this.lives--;
      soundEngine.playHit();
      if (this.lives <= 0) {
        this.gameOver = true;
        soundEngine.playGameOver();
      } else {
        this.balls = [{ x: this.p1.x + 20, y: this.p1.y - 12, vx: 2, vy: -2.5, radius: 4, color: '#FFFFFF' }];
      }
    }

    // Powerups falling
    for (let pIdx = this.powerups.length - 1; pIdx >= 0; pIdx--) {
      const p = this.powerups[pIdx];
      p.y += 1.6;

      const pads = [this.p1];
      if (this.twoPlayerMode && this.p2.active) pads.push(this.p2);

      pads.forEach(pad => {
        if (p.y >= pad.y && p.y <= pad.y + pad.height && p.x >= pad.x && p.x <= pad.x + pad.width) {
          if (p.type === 'multiball' && this.balls.length > 0) {
            const base = this.balls[0];
            this.balls.push({ ...base, vx: -2.2, vy: -2 });
            this.balls.push({ ...base, vx: 2.2, vy: -2.5 });
          } else if (p.type === 'laser') {
            pad.hasLaser = true;
          } else if (p.type === 'expand') {
            pad.width = Math.min(68, pad.width + 16);
          }
          soundEngine.playPowerup();
          this.powerups.splice(pIdx, 1);
        }
      });

      if (p.y > this.height) {
        this.powerups.splice(pIdx, 1);
      }
    }

    // Lasers
    for (let lIdx = this.lasers.length - 1; lIdx >= 0; lIdx--) {
      const l = this.lasers[lIdx];
      l.y += l.vy;
      for (let brIdx = this.bricks.length - 1; brIdx >= 0; brIdx--) {
        const br = this.bricks[brIdx];
        if (l.x >= br.x && l.x <= br.x + br.width && l.y >= br.y && l.y <= br.y + br.height) {
          br.hp--;
          this.score += 50;
          this.lasers.splice(lIdx, 1);
          if (br.hp <= 0) this.bricks.splice(brIdx, 1);
          break;
        }
      }
      if (l.y < 20) this.lasers.splice(lIdx, 1);
    }

    // Stage cleared
    if (this.bricks.length === 0) {
      this.victory = true;
      this.score += 5000 * this.level;
      soundEngine.playVictory();
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, this.width, this.height);

    // Side Borders
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 20, 5, this.height - 20);
    ctx.fillRect(this.width - 5, 20, 5, this.height - 20);

    // Bricks
    this.bricks.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.width - 1, b.height - 1);
    });

    // Powerups
    this.powerups.forEach(p => {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Lasers
    ctx.fillStyle = '#EF4444';
    this.lasers.forEach(l => {
      ctx.fillRect(l.x - 1, l.y, 2, 6);
    });

    // Balls
    this.balls.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Paddles
    const drawPaddle = (pad: Paddle) => {
      if (!pad.active) return;
      ctx.fillStyle = pad.color;
      ctx.fillRect(pad.x, pad.y, pad.width, pad.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '6px monospace';
      ctx.fillText(pad.name, pad.x + 4, pad.y + 6);
    };

    drawPaddle(this.p1);
    if (this.twoPlayerMode && this.p2.active) drawPaddle(this.p2);

    // HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, this.width, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '8px monospace';
    ctx.fillText(`SCORE: ${this.score.toString().padStart(6, '0')}`, 10, 13);
    ctx.fillText(`LIVES: ${this.lives}`, 160, 13);
    ctx.fillText(`BRICKS: ${this.bricks.length}`, 240, 13);

    if (this.victory) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ALL BRICKS CLEARED!', this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 15);
      ctx.textAlign = 'left';
    } else if (this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 15);
      ctx.textAlign = 'left';
    }
  }

  public serialize(): any {
    return {
      score: this.score,
      lives: this.lives,
      level: this.level,
      twoPlayerMode: this.twoPlayerMode,
      p1: { ...this.p1 },
      p2: { ...this.p2 },
      bricks: this.bricks.map(b => ({ ...b }))
    };
  }

  public deserialize(data: any): void {
    if (!data) return;
    this.score = data.score || 0;
    this.lives = data.lives || 3;
    this.level = data.level || 1;
    this.twoPlayerMode = Boolean(data.twoPlayerMode);
    if (data.p1) this.p1 = { ...data.p1 };
    if (data.p2) this.p2 = { ...data.p2 };
    if (data.bricks) this.bricks = data.bricks.map((b: any) => ({ ...b }));
    this.gameOver = false;
    this.victory = false;
  }

  public reset(): void {
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.victory = false;
    this.p1.hasLaser = false;
    this.p1.width = 44;
    this.p2.hasLaser = false;
    this.p2.width = 44;
    this.resetStage();
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.level;
  }

  public isGameOver(): boolean {
    return this.gameOver;
  }

  public isVictory(): boolean {
    return this.victory;
  }

  public destroy(): void {}
}

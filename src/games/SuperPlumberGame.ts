/**
 * Super Pixel Plumber (Platformer)
 * Authentic 16-bit platformer supporting 1P and 2P Co-op (Mario & Luigi style).
 */

import { ActiveGameEngine, InputState, PlayerId } from '../types';
import { soundEngine } from '../utils/audio';

interface Plumber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  isBig: boolean;
  hasFire: boolean;
  facingRight: boolean;
  lives: number;
  invulnerableTime: number;
  isDead: boolean;
  active: boolean; // P2 can be inactive in 1P mode
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: 'goomba' | 'koopa';
  isStomped: boolean;
  stompTimer: number;
  dead: boolean;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'brick' | 'question' | 'pipe' | 'empty';
  hasCoin?: boolean;
  hasMushroom?: boolean;
  bounceOffset?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  text?: string;
}

interface Fireball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: PlayerId;
}

export class SuperPlumberGame implements ActiveGameEngine {
  private width = 384;
  private height = 224;
  private cameraX = 0;
  private score = 0;
  private coins = 0;
  private level = 1;
  private timeLeft = 300;
  private timerTick = 0;
  private gameOver = false;
  private victory = false;
  private flagReached = false;
  private twoPlayerMode = false;

  private p1: Plumber = this.createPlayer(40, 160, true);
  private p2: Plumber = this.createPlayer(20, 160, false);

  private enemies: Enemy[] = [];
  private blocks: Block[] = [];
  private particles: Particle[] = [];
  private fireballs: Fireball[] = [];

  constructor(twoPlayer = false) {
    this.twoPlayerMode = twoPlayer;
    this.p2.active = twoPlayer;
    this.buildLevel();
  }

  private createPlayer(x: number, y: number, active: boolean): Plumber {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      width: 14,
      height: 16,
      isGrounded: true,
      isBig: false,
      hasFire: false,
      facingRight: true,
      lives: 3,
      invulnerableTime: 0,
      isDead: false,
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

  private buildLevel() {
    this.blocks = [];
    this.enemies = [];
    this.particles = [];
    this.fireballs = [];
    this.cameraX = 0;
    this.timeLeft = 300;
    this.flagReached = false;
    this.victory = false;
    this.gameOver = false;

    // Build Ground with gaps
    for (let x = 0; x < 2600; x += 16) {
      // Pitfalls
      if ((x >= 400 && x <= 448) || (x >= 960 && x <= 1024) || (x >= 1600 && x <= 1648)) {
        continue;
      }
      this.blocks.push({ x, y: 192, width: 16, height: 16, type: 'ground' });
      this.blocks.push({ x, y: 208, width: 16, height: 16, type: 'ground' });
    }

    // Question & Brick blocks
    const addBlock = (x: number, y: number, type: 'brick' | 'question', hasCoin = false, hasMushroom = false) => {
      this.blocks.push({ x, y, width: 16, height: 16, type, hasCoin, hasMushroom, bounceOffset: 0 });
    };

    // Stage elements
    addBlock(160, 136, 'question', true);
    addBlock(200, 136, 'brick');
    addBlock(216, 136, 'question', false, true); // Mushroom
    addBlock(232, 136, 'brick');
    addBlock(248, 136, 'question', true);

    // Pipes
    const addPipe = (x: number, heightBlocks: number) => {
      const topY = 192 - heightBlocks * 16;
      for (let h = 0; h < heightBlocks; h++) {
        this.blocks.push({ x, y: topY + h * 16, width: 24, height: 16, type: 'pipe' });
      }
    };

    addPipe(300, 2);
    addPipe(520, 3);
    addPipe(720, 4);
    addPipe(1120, 2);
    addPipe(1420, 3);

    // Mid-level platforms
    for (let i = 0; i < 4; i++) {
      addBlock(580 + i * 16, 100, 'brick');
    }
    addBlock(612, 100, 'question', true);

    // Pyramid steps near end
    for (let step = 0; step < 7; step++) {
      for (let h = 0; h <= step; h++) {
        this.blocks.push({ x: 2100 + step * 16, y: 192 - (h + 1) * 16, width: 16, height: 16, type: 'brick' });
      }
    }

    // Flagpole block
    this.blocks.push({ x: 2360, y: 48, width: 6, height: 144, type: 'empty' });

    // Enemies
    const enemySpawns = [
      { x: 220, type: 'goomba' },
      { x: 380, type: 'goomba' },
      { x: 500, type: 'koopa' },
      { x: 650, type: 'goomba' },
      { x: 680, type: 'goomba' },
      { x: 860, type: 'koopa' },
      { x: 1200, type: 'goomba' },
      { x: 1350, type: 'koopa' },
      { x: 1750, type: 'goomba' },
      { x: 1900, type: 'koopa' }
    ];

    enemySpawns.forEach(e => {
      this.enemies.push({
        x: e.x,
        y: 176,
        vx: -0.6,
        vy: 0,
        width: 14,
        height: 14,
        type: e.type as any,
        isStomped: false,
        stompTimer: 0,
        dead: false
      });
    });
  }

  public update(p1Input: InputState, p2Input: InputState, dt: number) {
    if (this.gameOver || this.victory) return;

    // Time ticker
    this.timerTick++;
    if (this.timerTick >= 60) {
      this.timerTick = 0;
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      if (this.timeLeft <= 0) {
        this.triggerGameOver();
      }
    }

    // Update players
    this.updatePlayer(this.p1, p1Input, 'p1');
    if (this.twoPlayerMode && this.p2.active) {
      this.updatePlayer(this.p2, p2Input, 'p2');
    }

    // Camera tracks furthest leading player
    let leadX = this.p1.x;
    if (this.twoPlayerMode && this.p2.active && !this.p2.isDead) {
      leadX = Math.max(this.p1.x, this.p2.x);
    }
    const targetCamX = Math.max(0, leadX - this.width * 0.4);
    if (targetCamX > this.cameraX) {
      this.cameraX += (targetCamX - this.cameraX) * 0.1;
    }

    // Keep players inside left screen bound
    if (this.p1.x < this.cameraX) this.p1.x = this.cameraX;
    if (this.p2.active && this.p2.x < this.cameraX) this.p2.x = this.cameraX;

    // Update enemies
    this.enemies.forEach(enemy => {
      if (enemy.dead) return;
      if (enemy.isStomped) {
        enemy.stompTimer++;
        if (enemy.stompTimer > 30) enemy.dead = true;
        return;
      }

      // Wake up when close to camera
      if (enemy.x > this.cameraX + this.width + 40 || enemy.x < this.cameraX - 60) {
        return;
      }

      enemy.vy += 0.35; // Gravity
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      // Enemy horizontal collision with blocks
      this.blocks.forEach(b => {
        if (b.type === 'empty') return;
        if (this.checkCollision(enemy, b)) {
          // Bottom collision
          if (enemy.vy > 0 && enemy.y + enemy.height - enemy.vy <= b.y) {
            enemy.y = b.y - enemy.height;
            enemy.vy = 0;
          } else {
            // Rebound direction
            enemy.vx = -enemy.vx;
          }
        }
      });

      // Check player stomping enemy
      [this.p1, this.p2].forEach((pl, idx) => {
        if (!pl.active || pl.isDead) return;
        if (this.checkCollision(pl, enemy)) {
          // Stomp if falling on top
          if (pl.vy > 0 && pl.y + pl.height - pl.vy <= enemy.y + 6) {
            pl.vy = -5.5; // Bounce up
            enemy.isStomped = true;
            this.score += 200;
            soundEngine.playHit();
            this.addParticle(enemy.x, enemy.y, 0, -1, '#FBBF24', 30, '+200');
          } else if (pl.invulnerableTime <= 0) {
            // Player hit by enemy
            this.hitPlayer(pl, idx === 0 ? 'p1' : 'p2');
          }
        }
      });
    });

    // Fireballs
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.x += fb.vx;
      fb.y += fb.vy;
      fb.vy += 0.25;

      // Bounce on ground
      this.blocks.forEach(b => {
        if (this.checkCollision({ x: fb.x, y: fb.y, width: 8, height: 8 }, b)) {
          fb.vy = -3;
        }
      });

      // Hit enemies
      let hit = false;
      this.enemies.forEach(e => {
        if (!e.dead && !e.isStomped && this.checkCollision({ x: fb.x, y: fb.y, width: 8, height: 8 }, e)) {
          e.dead = true;
          hit = true;
          this.score += 300;
          soundEngine.playExplosion();
          this.addParticle(e.x, e.y, 0, -1, '#EF4444', 30, '+300');
        }
      });

      if (hit || fb.x > this.cameraX + this.width + 20 || fb.y > 240) {
        this.fireballs.splice(i, 1);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Block bounce restoration
    this.blocks.forEach(b => {
      if (b.bounceOffset && b.bounceOffset > 0) {
        b.bounceOffset = Math.max(0, b.bounceOffset - 1);
      }
    });

    // Check Flagpole reaching
    if (!this.flagReached) {
      if (this.p1.x >= 2355 || (this.p2.active && this.p2.x >= 2355)) {
        this.flagReached = true;
        this.victory = true;
        this.score += 5000 + this.timeLeft * 50;
        soundEngine.playVictory();
      }
    }
  }

  private updatePlayer(plumber: Plumber, input: InputState, pId: PlayerId) {
    if (plumber.isDead) return;

    if (plumber.invulnerableTime > 0) {
      plumber.invulnerableTime--;
    }

    // Horizontal Movement
    const maxSpeed = input.b ? 2.8 : 1.8;
    const accel = 0.2;
    const friction = 0.85;

    if (input.left) {
      plumber.vx = Math.max(-maxSpeed, plumber.vx - accel);
      plumber.facingRight = false;
    } else if (input.right) {
      plumber.vx = Math.min(maxSpeed, plumber.vx + accel);
      plumber.facingRight = true;
    } else {
      plumber.vx *= friction;
      if (Math.abs(plumber.vx) < 0.05) plumber.vx = 0;
    }

    // Jumping
    if (input.a && plumber.isGrounded) {
      plumber.vy = -6.8;
      plumber.isGrounded = false;
      soundEngine.playJump();
    }

    // Fireball shooting
    if ((input.x || (input.b && plumber.hasFire)) && plumber.hasFire) {
      if (this.fireballs.filter(f => f.owner === pId).length < 2) {
        this.fireballs.push({
          x: plumber.facingRight ? plumber.x + plumber.width : plumber.x - 6,
          y: plumber.y + 6,
          vx: plumber.facingRight ? 4 : -4,
          vy: 0,
          owner: pId
        });
        soundEngine.playLaser();
      }
    }

    // Gravity
    plumber.vy += 0.32;
    if (plumber.vy > 8) plumber.vy = 8;

    // Movement integration
    plumber.x += plumber.vx;
    plumber.y += plumber.vy;

    // Collision with blocks
    plumber.isGrounded = false;
    this.blocks.forEach(b => {
      if (b.type === 'empty') return;
      if (this.checkCollision(plumber, b)) {
        // Falling onto top
        if (plumber.vy > 0 && plumber.y + plumber.height - plumber.vy <= b.y + 4) {
          plumber.y = b.y - plumber.height;
          plumber.vy = 0;
          plumber.isGrounded = true;
        }
        // Hitting head from below
        else if (plumber.vy < 0 && plumber.y - plumber.vy >= b.y + b.height - 4) {
          plumber.y = b.y + b.height;
          plumber.vy = 0;
          b.bounceOffset = 4;
          // Trigger block reward
          if (b.hasCoin) {
            b.hasCoin = false;
            b.type = 'brick';
            this.coins++;
            this.score += 100;
            soundEngine.playCoin();
            this.addParticle(b.x + 4, b.y - 12, 0, -2, '#FBBF24', 25, '+100');
          } else if (b.hasMushroom) {
            b.hasMushroom = false;
            b.type = 'brick';
            plumber.isBig = true;
            plumber.height = 24;
            plumber.y -= 8;
            plumber.hasFire = true;
            soundEngine.playPowerup();
            this.addParticle(b.x + 4, b.y - 16, 0, -1, '#34D399', 40, 'POWER UP!');
          } else {
            soundEngine.playHit();
          }
        }
        // Lateral collisions
        else if (plumber.vx > 0) {
          plumber.x = b.x - plumber.width;
          plumber.vx = 0;
        } else if (plumber.vx < 0) {
          plumber.x = b.x + b.width;
          plumber.vx = 0;
        }
      }
    });

    // Pitfall check
    if (plumber.y > 240) {
      this.killPlayer(plumber);
    }
  }

  private hitPlayer(plumber: Plumber, pId: PlayerId) {
    if (plumber.isBig) {
      plumber.isBig = false;
      plumber.hasFire = false;
      plumber.height = 16;
      plumber.invulnerableTime = 60; // 1 second invulnerability
      soundEngine.playHit();
    } else {
      this.killPlayer(plumber);
    }
  }

  private killPlayer(plumber: Plumber) {
    plumber.lives--;
    soundEngine.playHit();

    if (plumber.lives <= 0) {
      plumber.isDead = true;
      if (!this.twoPlayerMode || (this.p1.isDead && this.p2.isDead)) {
        this.triggerGameOver();
      }
    } else {
      // Respawn at camera position
      plumber.x = this.cameraX + 40;
      plumber.y = 100;
      plumber.vx = 0;
      plumber.vy = 0;
      plumber.invulnerableTime = 90;
    }
  }

  private triggerGameOver() {
    this.gameOver = true;
    soundEngine.playGameOver();
  }

  private checkCollision(r1: { x: number; y: number; width: number; height: number }, r2: { x: number; y: number; width: number; height: number }) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  private addParticle(x: number, y: number, vx: number, vy: number, color: string, life: number, text?: string) {
    this.particles.push({ x, y, vx, vy, color, life, text });
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, '#5C94FC');
    sky.addColorStop(1, '#92B9FC');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, this.height);

    // Distant hills / clouds with parallax
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const cloudOffset = (this.cameraX * 0.2) % 400;
    for (let c = 0; c < 3; c++) {
      const cx = c * 180 - cloudOffset;
      ctx.beginPath();
      ctx.arc(cx + 40, 50, 16, 0, Math.PI * 2);
      ctx.arc(cx + 60, 44, 20, 0, Math.PI * 2);
      ctx.arc(cx + 80, 50, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // World render with camera translation
    ctx.translate(-Math.floor(this.cameraX), 0);

    // Draw Blocks
    this.blocks.forEach(b => {
      if (b.x + b.width < this.cameraX - 20 || b.x > this.cameraX + this.width + 20) return;
      const yOffset = b.bounceOffset ? -b.bounceOffset : 0;

      if (b.type === 'ground') {
        ctx.fillStyle = '#C84C0C';
        ctx.fillRect(b.x, b.y + yOffset, b.width, b.height);
        // Grass top
        ctx.fillStyle = '#00A800';
        ctx.fillRect(b.x, b.y + yOffset, b.width, 3);
      } else if (b.type === 'brick') {
        ctx.fillStyle = '#B84418';
        ctx.fillRect(b.x, b.y + yOffset, b.width, b.height);
        ctx.strokeStyle = '#581800';
        ctx.strokeRect(b.x + 0.5, b.y + yOffset + 0.5, b.width - 1, b.height - 1);
      } else if (b.type === 'question') {
        ctx.fillStyle = '#FC9838';
        ctx.fillRect(b.x, b.y + yOffset, b.width, b.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px monospace';
        ctx.fillText('?', b.x + 4, b.y + yOffset + 12);
        ctx.strokeStyle = '#802800';
        ctx.strokeRect(b.x + 0.5, b.y + yOffset + 0.5, b.width - 1, b.height - 1);
      } else if (b.type === 'pipe') {
        ctx.fillStyle = '#00A800';
        ctx.fillRect(b.x, b.y + yOffset, b.width, b.height);
        ctx.fillStyle = '#80D010';
        ctx.fillRect(b.x + 2, b.y + yOffset, 4, b.height);
      }
    });

    // Draw Flagpole
    ctx.fillStyle = '#FCBCB0';
    ctx.fillRect(2360, 48, 4, 144);
    ctx.fillStyle = '#00A800';
    ctx.fillRect(2350, 52, 14, 10); // Flag

    // Draw Enemies
    this.enemies.forEach(e => {
      if (e.dead) return;
      if (e.type === 'goomba') {
        ctx.fillStyle = '#B84418';
        const h = e.isStomped ? 6 : e.height;
        const y = e.isStomped ? e.y + 8 : e.y;
        ctx.fillRect(e.x, y, e.width, h);
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(e.x + 2, y + 2, 2, 4);
        ctx.fillRect(e.x + 10, y + 2, 2, 4);
      } else {
        // Koopa
        ctx.fillStyle = '#00A800';
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#FCBCB0';
        ctx.fillRect(e.x + (e.vx > 0 ? 8 : 1), e.y - 3, 6, 6);
      }
    });

    // Draw Fireballs
    this.fireballs.forEach(fb => {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(fb.x + 4, fb.y + 4, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Players
    const drawPlumber = (pl: Plumber, hatColor: string, overallsColor: string, label: string) => {
      if (!pl.active || pl.isDead) return;
      if (pl.invulnerableTime % 4 > 2) return; // Flash effect

      ctx.save();
      // Hat / Shirt
      ctx.fillStyle = pl.hasFire ? '#FFFFFF' : hatColor;
      ctx.fillRect(pl.x, pl.y, pl.width, pl.height * 0.45);
      // Face
      ctx.fillStyle = '#FCBCB0';
      ctx.fillRect(pl.facingRight ? pl.x + 4 : pl.x, pl.y + 3, 8, 5);
      // Overalls
      ctx.fillStyle = overallsColor;
      ctx.fillRect(pl.x + 1, pl.y + pl.height * 0.45, pl.width - 2, pl.height * 0.55);

      // Player Label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px monospace';
      ctx.fillText(label, pl.x + 1, pl.y - 3);
      ctx.restore();
    };

    drawPlumber(this.p1, '#E11D48', '#2563EB', 'P1');
    if (this.twoPlayerMode && this.p2.active) {
      drawPlumber(this.p2, '#16A34A', '#2563EB', 'P2');
    }

    // Draw Particles
    this.particles.forEach(p => {
      if (p.text) {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 9px monospace';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
    });

    ctx.restore();

    // HUD Display (Screen Space)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, 0, this.width, 22);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '8px monospace';
    ctx.fillText(`SCORE: ${this.score.toString().padStart(6, '0')}`, 8, 14);
    ctx.fillText(`COINS: x${this.coins.toString().padStart(2, '0')}`, 130, 14);
    ctx.fillText(`TIME: ${this.timeLeft}`, 230, 14);
    ctx.fillText(`P1 LIVES: ${this.p1.lives}`, 310, 14);

    // Overlays
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 15);
      ctx.fillText('Press START or Click Play Again', this.width / 2, this.height / 2 + 35);
      ctx.textAlign = 'left';
    } else if (this.victory) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('COURSE CLEAR!', this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.fillText(`Total Score: ${this.score}`, this.width / 2, this.height / 2 + 15);
      ctx.textAlign = 'left';
    }
  }

  // Serialization for Save States
  public serialize(): any {
    return {
      score: this.score,
      coins: this.coins,
      level: this.level,
      timeLeft: this.timeLeft,
      cameraX: this.cameraX,
      twoPlayerMode: this.twoPlayerMode,
      p1: { ...this.p1 },
      p2: { ...this.p2 },
      enemies: this.enemies.map(e => ({ ...e })),
      blocks: this.blocks.map(b => ({ ...b }))
    };
  }

  public deserialize(data: any): void {
    if (!data) return;
    this.score = data.score || 0;
    this.coins = data.coins || 0;
    this.level = data.level || 1;
    this.timeLeft = data.timeLeft || 300;
    this.cameraX = data.cameraX || 0;
    this.twoPlayerMode = Boolean(data.twoPlayerMode);
    if (data.p1) this.p1 = { ...data.p1 };
    if (data.p2) this.p2 = { ...data.p2 };
    if (data.enemies) this.enemies = data.enemies.map((e: any) => ({ ...e }));
    if (data.blocks) this.blocks = data.blocks.map((b: any) => ({ ...b }));
    this.gameOver = false;
    this.victory = false;
  }

  public reset(): void {
    this.score = 0;
    this.coins = 0;
    this.level = 1;
    this.p1 = this.createPlayer(40, 160, true);
    this.p2 = this.createPlayer(20, 160, this.twoPlayerMode);
    this.buildLevel();
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

  public destroy(): void {
    // cleanup
  }
}

/**
 * Galactic Vanguard (Vertical Arcade Shoot 'Em Up)
 * 16-bit arcade SHMUP with 1P and 2P Co-Op, weapon upgrades, shields & boss battle.
 */

import { ActiveGameEngine, InputState, PlayerId } from '../types';
import { soundEngine } from '../utils/audio';

interface Ship {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  lives: number;
  shield: number;
  weaponLevel: number;
  bombs: number;
  invulnerableTime: number;
  active: boolean;
  score: number;
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy: boolean;
  damage: number;
  color: string;
}

interface EnemyShip {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  type: 'scout' | 'interceptor' | 'cruiser' | 'boss';
  shootCooldown: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: 'weapon' | 'shield' | 'bomb';
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
}

export class GalacticVanguardGame implements ActiveGameEngine {
  private width = 320;
  private height = 240;
  private score = 0;
  private wave = 1;
  private gameOver = false;
  private victory = false;
  private twoPlayerMode = false;
  private spawnTimer = 0;
  private bossActive = false;

  private p1: Ship = this.createShip(120, 200, '#38BDF8', true);
  private p2: Ship = this.createShip(180, 200, '#FB923C', false);

  private stars: Star[] = [];
  private bullets: Bullet[] = [];
  private enemies: EnemyShip[] = [];
  private powerups: PowerUp[] = [];
  private explosions: Explosion[] = [];

  constructor(twoPlayer = false) {
    this.twoPlayerMode = twoPlayer;
    this.p2.active = twoPlayer;
    this.initStars();
  }

  private createShip(x: number, y: number, color: string, active: boolean): Ship {
    return {
      x,
      y,
      width: 16,
      height: 18,
      speed: 2.8,
      lives: 3,
      shield: 100,
      weaponLevel: 1,
      bombs: 2,
      invulnerableTime: 60,
      active,
      score: 0,
      color
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

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 0.5 + Math.random() * 2,
        size: Math.random() > 0.8 ? 2 : 1,
        color: Math.random() > 0.5 ? '#E0F2FE' : '#93C5FD'
      });
    }
  }

  public update(p1Input: InputState, p2Input: InputState, dt: number) {
    if (this.gameOver || this.victory) return;

    // Stars scrolling
    this.stars.forEach(s => {
      s.y += s.speed;
      if (s.y > this.height) {
        s.y = 0;
        s.x = Math.random() * this.width;
      }
    });

    // Update Player 1
    this.updateShip(this.p1, p1Input);
    if (this.twoPlayerMode && this.p2.active) {
      this.updateShip(this.p2, p2Input);
    }

    // Spawn Enemy Waves
    this.spawnTimer++;
    if (!this.bossActive && this.spawnTimer > 75) {
      this.spawnTimer = 0;
      this.spawnEnemyWave();
    }

    // Boss spawn condition at wave 5
    if (this.score > 25000 && !this.bossActive && this.enemies.filter(e => e.type === 'boss').length === 0) {
      this.bossActive = true;
      this.enemies.push({
        x: this.width / 2 - 36,
        y: -50,
        vx: 1.2,
        vy: 0.4,
        width: 72,
        height: 36,
        hp: 1500,
        maxHp: 1500,
        type: 'boss',
        shootCooldown: 30
      });
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x += e.vx;
      e.y += e.vy;

      if (e.type === 'boss') {
        if (e.y < 30) {
          e.y += e.vy;
        } else {
          e.vy = 0;
          if (e.x < 20 || e.x > this.width - e.width - 20) {
            e.vx = -e.vx;
          }
        }
      } else {
        if (e.type === 'interceptor') {
          e.vx = Math.sin(e.y * 0.05) * 2;
        }
      }

      // Enemy shooting
      e.shootCooldown--;
      if (e.shootCooldown <= 0 && e.y > 0 && e.y < this.height - 40) {
        if (e.type === 'boss') {
          e.shootCooldown = 40;
          this.bullets.push({ x: e.x + 16, y: e.y + e.height, vx: -1.2, vy: 2.4, isEnemy: true, damage: 20, color: '#F43F5E' });
          this.bullets.push({ x: e.x + e.width / 2, y: e.y + e.height, vx: 0, vy: 2.8, isEnemy: true, damage: 20, color: '#F43F5E' });
          this.bullets.push({ x: e.x + e.width - 16, y: e.y + e.height, vx: 1.2, vy: 2.4, isEnemy: true, damage: 20, color: '#F43F5E' });
        } else if (e.type === 'cruiser') {
          e.shootCooldown = 65;
          this.bullets.push({ x: e.x + e.width / 2, y: e.y + e.height, vx: 0, vy: 2.2, isEnemy: true, damage: 15, color: '#FB923C' });
        } else if (e.type === 'scout') {
          e.shootCooldown = 90;
          this.bullets.push({ x: e.x + e.width / 2, y: e.y + e.height, vx: 0, vy: 2.0, isEnemy: true, damage: 10, color: '#FACC15' });
        }
      }

      // Despawn off-screen non-bosses
      if (e.y > this.height + 40 && e.type !== 'boss') {
        this.enemies.splice(i, 1);
      }
    }

    // Bullets update & collision
    for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
      const b = this.bullets[bIdx];
      b.x += b.vx;
      b.y += b.vy;

      if (b.y < -10 || b.y > this.height + 10 || b.x < -10 || b.x > this.width + 10) {
        this.bullets.splice(bIdx, 1);
        continue;
      }

      if (!b.isEnemy) {
        // Player bullet hitting enemy
        let hit = false;
        for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
          const e = this.enemies[eIdx];
          if (this.checkCollision({ x: b.x - 2, y: b.y - 4, width: 4, height: 8 }, e)) {
            e.hp -= b.damage;
            hit = true;
            this.createExplosion(b.x, b.y, 6, '#38BDF8');

            if (e.hp <= 0) {
              const points = e.type === 'boss' ? 20000 : (e.type === 'cruiser' ? 1200 : (e.type === 'interceptor' ? 600 : 300));
              this.score += points;
              this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.type === 'boss' ? 36 : 18, '#F59E0B');
              soundEngine.playExplosion();

              // Chance of powerup drop
              if (Math.random() < 0.3 || e.type === 'boss') {
                const types: ('weapon' | 'shield' | 'bomb')[] = ['weapon', 'shield', 'bomb'];
                this.powerups.push({
                  x: e.x + e.width / 2,
                  y: e.y + e.height / 2,
                  vy: 1.2,
                  type: types[Math.floor(Math.random() * types.length)]
                });
              }

              if (e.type === 'boss') {
                this.victory = true;
                soundEngine.playVictory();
              }

              this.enemies.splice(eIdx, 1);
            }
            break;
          }
        }
        if (hit) {
          this.bullets.splice(bIdx, 1);
        }
      } else {
        // Enemy bullet hitting players
        [this.p1, this.p2].forEach(p => {
          if (!p.active || p.lives <= 0 || p.invulnerableTime > 0) return;
          if (this.checkCollision({ x: b.x - 2, y: b.y - 2, width: 4, height: 4 }, p)) {
            p.shield -= b.damage;
            this.bullets.splice(bIdx, 1);
            this.createExplosion(b.x, b.y, 8, '#EF4444');
            soundEngine.playHit();

            if (p.shield <= 0) {
              p.lives--;
              p.shield = 100;
              p.invulnerableTime = 90;
              p.weaponLevel = Math.max(1, p.weaponLevel - 1);
              if (p.lives <= 0 && (!this.twoPlayerMode || (this.p1.lives <= 0 && this.p2.lives <= 0))) {
                this.gameOver = true;
                soundEngine.playGameOver();
              }
            }
          }
        });
      }
    }

    // Powerups collection
    for (let pIdx = this.powerups.length - 1; pIdx >= 0; pIdx--) {
      const p = this.powerups[pIdx];
      p.y += p.vy;

      [this.p1, this.p2].forEach(ship => {
        if (!ship.active || ship.lives <= 0) return;
        if (this.checkCollision({ x: p.x - 6, y: p.y - 6, width: 12, height: 12 }, ship)) {
          if (p.type === 'weapon') ship.weaponLevel = Math.min(3, ship.weaponLevel + 1);
          if (p.type === 'shield') ship.shield = Math.min(100, ship.shield + 40);
          if (p.type === 'bomb') ship.bombs = Math.min(4, ship.bombs + 1);

          this.score += 500;
          soundEngine.playPowerup();
          this.powerups.splice(pIdx, 1);
        }
      });

      if (p.y > this.height + 20) {
        this.powerups.splice(pIdx, 1);
      }
    }

    // Explosions animation
    for (let eIdx = this.explosions.length - 1; eIdx >= 0; eIdx--) {
      const ex = this.explosions[eIdx];
      ex.radius += 1.8;
      if (ex.radius >= ex.maxRadius) {
        this.explosions.splice(eIdx, 1);
      }
    }
  }

  private updateShip(ship: Ship, input: InputState) {
    if (ship.lives <= 0) return;
    if (ship.invulnerableTime > 0) ship.invulnerableTime--;

    if (input.left) ship.x -= ship.speed;
    if (input.right) ship.x += ship.speed;
    if (input.up) ship.y -= ship.speed;
    if (input.down) ship.y += ship.speed;

    // Boundaries
    ship.x = Math.max(8, Math.min(this.width - ship.width - 8, ship.x));
    ship.y = Math.max(20, Math.min(this.height - ship.height - 8, ship.y));

    // Fire laser
    if (input.a && Math.random() < 0.35) {
      this.fireWeapon(ship);
    }

    // Fire smart bomb
    if (input.b && ship.bombs > 0) {
      ship.bombs--;
      this.triggerBomb();
    }
  }

  private fireWeapon(ship: Ship) {
    soundEngine.playLaser();
    const cx = ship.x + ship.width / 2;
    const cy = ship.y;

    if (ship.weaponLevel === 1) {
      this.bullets.push({ x: cx, y: cy, vx: 0, vy: -5, isEnemy: false, damage: 25, color: '#38BDF8' });
    } else if (ship.weaponLevel === 2) {
      this.bullets.push({ x: cx - 4, y: cy, vx: 0, vy: -5, isEnemy: false, damage: 25, color: '#38BDF8' });
      this.bullets.push({ x: cx + 4, y: cy, vx: 0, vy: -5, isEnemy: false, damage: 25, color: '#38BDF8' });
    } else {
      // 3-way spread
      this.bullets.push({ x: cx, y: cy, vx: 0, vy: -5.5, isEnemy: false, damage: 30, color: '#F472B6' });
      this.bullets.push({ x: cx - 4, y: cy, vx: -1.2, vy: -5, isEnemy: false, damage: 25, color: '#F472B6' });
      this.bullets.push({ x: cx + 4, y: cy, vx: 1.2, vy: -5, isEnemy: false, damage: 25, color: '#F472B6' });
    }
  }

  private triggerBomb() {
    soundEngine.playExplosion();
    this.createExplosion(this.width / 2, this.height / 2, 80, '#F59E0B');
    // Clear all enemy bullets & damage enemies
    this.bullets = this.bullets.filter(b => !b.isEnemy);
    this.enemies.forEach(e => {
      e.hp -= 250;
      if (e.hp <= 0) {
        this.score += 500;
      }
    });
    this.enemies = this.enemies.filter(e => e.hp > 0);
  }

  private spawnEnemyWave() {
    const types: ('scout' | 'interceptor' | 'cruiser')[] = ['scout', 'interceptor', 'cruiser'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const count = chosenType === 'scout' ? 3 : (chosenType === 'interceptor' ? 2 : 1);

    for (let i = 0; i < count; i++) {
      const x = 30 + (i * (this.width - 60)) / (count > 1 ? count - 1 : 1);
      this.enemies.push({
        x,
        y: -20,
        vx: (Math.random() - 0.5) * 1.2,
        vy: chosenType === 'cruiser' ? 0.9 : 1.6,
        width: chosenType === 'cruiser' ? 26 : 14,
        height: chosenType === 'cruiser' ? 24 : 14,
        hp: chosenType === 'cruiser' ? 80 : 30,
        maxHp: chosenType === 'cruiser' ? 80 : 30,
        type: chosenType,
        shootCooldown: 40 + Math.floor(Math.random() * 40)
      });
    }
  }

  private createExplosion(x: number, y: number, maxRadius: number, color: string) {
    this.explosions.push({ x, y, radius: 2, maxRadius, color });
  }

  private checkCollision(r1: { x: number; y: number; width: number; height: number }, r2: { x: number; y: number; width: number; height: number }) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, this.width, this.height);

    // Stars
    this.stars.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Powerups
    this.powerups.forEach(p => {
      ctx.fillStyle = p.type === 'weapon' ? '#EC4899' : (p.type === 'shield' ? '#3B82F6' : '#EAB308');
      ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '7px monospace';
      ctx.fillText(p.type[0].toUpperCase(), p.x - 2, p.y + 2);
    });

    // Bullets
    this.bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x - 1.5, b.y - 3, 3, 6);
    });

    // Enemies
    this.enemies.forEach(e => {
      if (e.type === 'boss') {
        ctx.fillStyle = '#831843';
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#BE123C';
        ctx.fillRect(e.x + 8, e.y + 6, e.width - 16, e.height - 12);
        // Boss HP Bar
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(e.x, e.y - 6, e.width, 3);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(e.x, e.y - 6, (e.hp / e.maxHp) * e.width, 3);
      } else if (e.type === 'cruiser') {
        ctx.fillStyle = '#7C2D12';
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#F97316';
        ctx.fillRect(e.x + 4, e.y + 4, e.width - 8, e.height - 8);
      } else {
        ctx.fillStyle = '#713F12';
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#EAB308';
        ctx.fillRect(e.x + 2, e.y + 2, e.width - 4, e.height - 4);
      }
    });

    // Players
    const drawShip = (ship: Ship, label: string) => {
      if (!ship.active || ship.lives <= 0) return;
      if (ship.invulnerableTime % 4 > 2) return;

      ctx.save();
      // Triangle fighter body
      ctx.fillStyle = ship.color;
      ctx.beginPath();
      ctx.moveTo(ship.x + ship.width / 2, ship.y);
      ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
      ctx.lineTo(ship.x, ship.y + ship.height);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ship.x + ship.width / 2 - 1.5, ship.y + 5, 3, 5);

      // Shield ring
      if (ship.shield > 20) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${ship.shield / 150})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ship.x - 2, ship.y - 2, ship.width + 4, ship.height + 4);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '7px monospace';
      ctx.fillText(label, ship.x + 2, ship.y + ship.height + 8);
      ctx.restore();
    };

    drawShip(this.p1, 'P1');
    if (this.twoPlayerMode && this.p2.active) {
      drawShip(this.p2, 'P2');
    }

    // Explosions
    this.explosions.forEach(ex => {
      ctx.strokeStyle = ex.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Top HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, this.width, 20);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '8px monospace';
    ctx.fillText(`SCORE: ${this.score.toString().padStart(6, '0')}`, 6, 13);
    ctx.fillText(`P1 SHIELD: ${Math.max(0, Math.round(this.p1.shield))}%`, 110, 13);
    ctx.fillText(`BOMBS: ${this.p1.bombs}`, 215, 13);
    ctx.fillText(`LIVES: ${this.p1.lives}`, 275, 13);

    // Overlays
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION FAILED', this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '9px monospace';
      ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 12);
      ctx.textAlign = 'left';
    } else if (this.victory) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MOTHERSHIP DESTROYED!', this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '9px monospace';
      ctx.fillText(`Victory Score: ${this.score}`, this.width / 2, this.height / 2 + 12);
      ctx.textAlign = 'left';
    }
  }

  public serialize(): any {
    return {
      score: this.score,
      wave: this.wave,
      twoPlayerMode: this.twoPlayerMode,
      bossActive: this.bossActive,
      p1: { ...this.p1 },
      p2: { ...this.p2 },
      enemies: this.enemies.map(e => ({ ...e })),
      powerups: this.powerups.map(p => ({ ...p }))
    };
  }

  public deserialize(data: any): void {
    if (!data) return;
    this.score = data.score || 0;
    this.wave = data.wave || 1;
    this.twoPlayerMode = Boolean(data.twoPlayerMode);
    this.bossActive = Boolean(data.bossActive);
    if (data.p1) this.p1 = { ...data.p1 };
    if (data.p2) this.p2 = { ...data.p2 };
    if (data.enemies) this.enemies = data.enemies.map((e: any) => ({ ...e }));
    if (data.powerups) this.powerups = data.powerups.map((p: any) => ({ ...p }));
    this.gameOver = false;
    this.victory = false;
  }

  public reset(): void {
    this.score = 0;
    this.wave = 1;
    this.gameOver = false;
    this.victory = false;
    this.bossActive = false;
    this.enemies = [];
    this.bullets = [];
    this.powerups = [];
    this.p1 = this.createShip(120, 200, '#38BDF8', true);
    this.p2 = this.createShip(180, 200, '#FB923C', this.twoPlayerMode);
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.wave;
  }

  public isGameOver(): boolean {
    return this.gameOver;
  }

  public isVictory(): boolean {
    return this.victory;
  }

  public destroy(): void {}
}

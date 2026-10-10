/**
 * Hyper Street Duel (16-Bit Fighting Game)
 * 1v1 fighting game with 1P vs CPU and 2P Local Versus, combos, special attacks & rounds.
 */

import { ActiveGameEngine, InputState } from '../types';
import { soundEngine } from '../utils/audio';

interface Fighter {
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  isGrounded: boolean;
  facingRight: boolean;
  state: 'idle' | 'walk' | 'jump' | 'punch' | 'kick' | 'special' | 'hit' | 'ko';
  stateTimer: number;
  color: string;
  pantsColor: string;
  roundsWon: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  owner: 'p1' | 'p2';
  color: string;
}

interface Spark {
  x: number;
  y: number;
  timer: number;
  color: string;
}

export class StreetDuelGame implements ActiveGameEngine {
  private width = 320;
  private height = 240;
  private groundY = 195;
  private round = 1;
  private roundTimer = 99;
  private roundTimerTick = 0;
  private roundAnnouncement = 'ROUND 1 - FIGHT!';
  private announcementTimer = 90;
  private gameOver = false;
  private victory = false;
  private twoPlayerMode = false;
  private score = 0;

  private p1: Fighter = this.createFighter('KAI', 70, '#F43F5E', '#FFFFFF', true);
  private p2: Fighter = this.createFighter('SHADOW', 230, '#3B82F6', '#1E293B', false);

  private projectiles: Projectile[] = [];
  private sparks: Spark[] = [];

  constructor(twoPlayer = false) {
    this.twoPlayerMode = twoPlayer;
  }

  private createFighter(name: string, x: number, color: string, pantsColor: string, facingRight: boolean): Fighter {
    return {
      name,
      x,
      y: 195,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      isGrounded: true,
      facingRight,
      state: 'idle',
      stateTimer: 0,
      color,
      pantsColor,
      roundsWon: 0
    };
  }

  public init(canvas: HTMLCanvasElement) {
    canvas.width = this.width;
    canvas.height = this.height;
  }

  public setTwoPlayer(enabled: boolean) {
    this.twoPlayerMode = enabled;
  }

  public update(p1Input: InputState, p2Input: InputState, dt: number) {
    if (this.gameOver) return;

    if (this.announcementTimer > 0) {
      this.announcementTimer--;
    }

    // Round Timer countdown
    this.roundTimerTick++;
    if (this.roundTimerTick >= 60) {
      this.roundTimerTick = 0;
      this.roundTimer = Math.max(0, this.roundTimer - 1);
      if (this.roundTimer <= 0) {
        this.resolveTimeOut();
      }
    }

    // Process inputs
    this.updateFighter(this.p1, p1Input, this.p2, 'p1');

    if (this.twoPlayerMode) {
      this.updateFighter(this.p2, p2Input, this.p1, 'p2');
    } else {
      this.updateCpuFighter(this.p2, this.p1);
    }

    // Keep fighters facing each other
    if (this.p1.state !== 'punch' && this.p1.state !== 'kick' && this.p1.state !== 'special') {
      this.p1.facingRight = this.p1.x < this.p2.x;
    }
    if (this.p2.state !== 'punch' && this.p2.state !== 'kick' && this.p2.state !== 'special') {
      this.p2.facingRight = this.p2.x < this.p1.x;
    }

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;

      const target = proj.owner === 'p1' ? this.p2 : this.p1;
      if (Math.abs(proj.x - target.x) < 20 && Math.abs(proj.y - (target.y - 25)) < 30) {
        // Hit target!
        target.hp = Math.max(0, target.hp - 18);
        target.state = 'hit';
        target.stateTimer = 18;
        this.addSpark(proj.x, proj.y, '#38BDF8');
        soundEngine.playHit();
        this.projectiles.splice(i, 1);
        this.checkRoundEnd();
        continue;
      }

      if (proj.x < 0 || proj.x > this.width) {
        this.projectiles.splice(i, 1);
      }
    }

    // Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      this.sparks[i].timer--;
      if (this.sparks[i].timer <= 0) this.sparks.splice(i, 1);
    }
  }

  private updateFighter(f: Fighter, input: InputState, opponent: Fighter, playerId: 'p1' | 'p2') {
    if (f.state === 'ko') return;

    // State duration
    if (f.stateTimer > 0) {
      f.stateTimer--;
      if (f.stateTimer <= 0) {
        f.state = 'idle';
      }
    }

    // Gravity & Grounding
    f.vy += 0.45;
    f.y += f.vy;
    if (f.y >= this.groundY) {
      f.y = this.groundY;
      f.vy = 0;
      f.isGrounded = true;
    }

    // Movement when idle or walking
    if (['idle', 'walk'].includes(f.state)) {
      if (input.left) {
        f.vx = -1.6;
        f.state = 'walk';
      } else if (input.right) {
        f.vx = 1.6;
        f.state = 'walk';
      } else {
        f.vx = 0;
        f.state = 'idle';
      }

      // Jump
      if (input.up && f.isGrounded) {
        f.vy = -7.5;
        f.isGrounded = false;
        f.state = 'jump';
        soundEngine.playJump();
      }

      // Attacks
      if (input.a) {
        // Punch
        f.state = 'punch';
        f.stateTimer = 16;
        f.vx = 0;
        soundEngine.playHit();
        this.checkMeleeHit(f, opponent, 12, 34);
      } else if (input.b) {
        // Heavy Kick
        f.state = 'kick';
        f.stateTimer = 22;
        f.vx = 0;
        soundEngine.playHit();
        this.checkMeleeHit(f, opponent, 18, 42);
      } else if (input.x || input.y) {
        // Hadouken projectile
        f.state = 'special';
        f.stateTimer = 26;
        f.vx = 0;
        soundEngine.playLaser();
        this.projectiles.push({
          x: f.facingRight ? f.x + 22 : f.x - 22,
          y: f.y - 24,
          vx: f.facingRight ? 3.8 : -3.8,
          owner: playerId,
          color: f.color
        });
      }
    }

    f.x += f.vx;
    // Boundary restrictions
    f.x = Math.max(30, Math.min(this.width - 30, f.x));
  }

  private updateCpuFighter(cpu: Fighter, player: Fighter) {
    if (cpu.state === 'ko') return;

    if (cpu.stateTimer > 0) {
      cpu.stateTimer--;
      if (cpu.stateTimer <= 0) cpu.state = 'idle';
    }

    cpu.vy += 0.45;
    cpu.y += cpu.vy;
    if (cpu.y >= this.groundY) {
      cpu.y = this.groundY;
      cpu.vy = 0;
      cpu.isGrounded = true;
    }

    if (['idle', 'walk'].includes(cpu.state)) {
      const dist = Math.abs(cpu.x - player.x);

      // AI decision loop
      if (dist > 75) {
        // Walk towards player
        cpu.vx = cpu.x > player.x ? -1.2 : 1.2;
        cpu.state = 'walk';
        if (Math.random() < 0.015) {
          // Fire projectile
          cpu.state = 'special';
          cpu.stateTimer = 26;
          cpu.vx = 0;
          soundEngine.playLaser();
          this.projectiles.push({
            x: cpu.facingRight ? cpu.x + 22 : cpu.x - 22,
            y: cpu.y - 24,
            vx: cpu.facingRight ? 3.8 : -3.8,
            owner: 'p2',
            color: cpu.color
          });
        }
      } else {
        // In melee range
        cpu.vx = 0;
        if (Math.random() < 0.05) {
          const isKick = Math.random() > 0.5;
          cpu.state = isKick ? 'kick' : 'punch';
          cpu.stateTimer = isKick ? 22 : 16;
          soundEngine.playHit();
          this.checkMeleeHit(cpu, player, isKick ? 18 : 12, isKick ? 42 : 34);
        }
      }
    }

    cpu.x += cpu.vx;
    cpu.x = Math.max(30, Math.min(this.width - 30, cpu.x));
  }

  private checkMeleeHit(attacker: Fighter, defender: Fighter, damage: number, reach: number) {
    const dist = Math.abs(attacker.x - defender.x);
    const facingCorrect = (attacker.facingRight && defender.x > attacker.x) || (!attacker.facingRight && defender.x < attacker.x);

    if (dist <= reach && facingCorrect) {
      defender.hp = Math.max(0, defender.hp - damage);
      defender.state = 'hit';
      defender.stateTimer = 16;
      defender.vx = attacker.facingRight ? 2.5 : -2.5;

      this.addSpark(defender.x, defender.y - 28, '#F59E0B');
      soundEngine.playHit();

      if (attacker === this.p1) {
        this.score += damage * 50;
      }

      this.checkRoundEnd();
    }
  }

  private checkRoundEnd() {
    if (this.p1.hp <= 0 || this.p2.hp <= 0) {
      const winner = this.p1.hp > 0 ? this.p1 : this.p2;
      winner.roundsWon++;
      soundEngine.playExplosion();

      if (winner.roundsWon >= 2) {
        this.gameOver = true;
        this.victory = winner === this.p1;
        this.roundAnnouncement = `${winner.name} WINS!`;
        this.announcementTimer = 180;
        if (this.victory) soundEngine.playVictory();
        else soundEngine.playGameOver();
      } else {
        // Next Round
        this.round++;
        this.roundAnnouncement = `ROUND ${this.round}`;
        this.announcementTimer = 90;
        this.p1.hp = 100;
        this.p2.hp = 100;
        this.p1.x = 70;
        this.p2.x = 230;
        this.roundTimer = 99;
      }
    }
  }

  private resolveTimeOut() {
    const winner = this.p1.hp >= this.p2.hp ? this.p1 : this.p2;
    winner.roundsWon++;
    this.checkRoundEnd();
  }

  private addSpark(x: number, y: number, color: string) {
    this.sparks.push({ x, y, timer: 12, color });
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Stage background (Dojo / City rooftop sunset)
    const sky = ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, '#1E1B4B');
    sky.addColorStop(0.6, '#701A75');
    sky.addColorStop(1, '#BE185D');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, this.height);

    // City skyline backdrop
    ctx.fillStyle = '#0F172A';
    for (let i = 0; i < 10; i++) {
      const bx = i * 36;
      const bh = 50 + (i % 3) * 30;
      ctx.fillRect(bx, 195 - bh, 32, bh);
    }

    // Arena Floor
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, this.groundY, this.width, 2);

    // Render Sparks
    this.sparks.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render Projectiles
    this.projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    });

    // Render Fighters
    const drawFighter = (f: Fighter) => {
      ctx.save();
      const x = f.x;
      const y = f.y;

      // Shadow on floor
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gi / Torso
      ctx.fillStyle = f.color;
      ctx.fillRect(x - 9, y - 44, 18, 22);

      // Pants / Legs
      ctx.fillStyle = f.pantsColor;
      ctx.fillRect(x - 8, y - 22, 6, 22);
      ctx.fillRect(x + 2, y - 22, 6, 22);

      // Head / Face
      ctx.fillStyle = '#FDE047'; // Headband / hair
      ctx.fillRect(x - 6, y - 56, 12, 12);
      ctx.fillStyle = '#FECDD3'; // Face skin
      ctx.fillRect(x - 5, y - 52, 10, 8);

      // Punch / Kick animation arm/leg extensions
      if (f.state === 'punch') {
        ctx.fillStyle = f.color;
        const armX = f.facingRight ? x + 9 : x - 22;
        ctx.fillRect(armX, y - 40, 13, 6);
        ctx.fillStyle = '#FECDD3';
        ctx.fillRect(f.facingRight ? armX + 13 : armX - 3, y - 41, 5, 8);
      } else if (f.state === 'kick') {
        ctx.fillStyle = f.pantsColor;
        const legX = f.facingRight ? x + 8 : x - 24;
        ctx.fillRect(legX, y - 28, 16, 7);
      }

      ctx.restore();
    };

    drawFighter(this.p1);
    drawFighter(this.p2);

    // Top Fighting HUD
    // P1 Health Bar
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(16, 14, 110, 12);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(16, 14, (this.p1.hp / this.p1.maxHp) * 110, 12);

    // P2 Health Bar
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(194, 14, 110, 12);
    ctx.fillStyle = '#3B82F6';
    const p2BarWidth = (this.p2.hp / this.p2.maxHp) * 110;
    ctx.fillRect(194 + (110 - p2BarWidth), 14, p2BarWidth, 12);

    // Timer in Center
    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.roundTimer}`, 160, 24);

    // Fighter Names & Rounds Won
    ctx.font = '8px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.p1.name} (R:${this.p1.roundsWon})`, 16, 36);
    ctx.textAlign = 'right';
    ctx.fillText(`(R:${this.p2.roundsWon}) ${this.p2.name}`, 304, 36);
    ctx.textAlign = 'left';

    // Announcements
    if (this.announcementTimer > 0 || this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, this.height / 2 - 22, this.width, 44);
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.roundAnnouncement, this.width / 2, this.height / 2 + 5);
      ctx.textAlign = 'left';
    }
  }

  public serialize(): any {
    return {
      round: this.round,
      roundTimer: this.roundTimer,
      score: this.score,
      twoPlayerMode: this.twoPlayerMode,
      p1: { ...this.p1 },
      p2: { ...this.p2 }
    };
  }

  public deserialize(data: any): void {
    if (!data) return;
    this.round = data.round || 1;
    this.roundTimer = data.roundTimer || 99;
    this.score = data.score || 0;
    this.twoPlayerMode = Boolean(data.twoPlayerMode);
    if (data.p1) this.p1 = { ...data.p1 };
    if (data.p2) this.p2 = { ...data.p2 };
    this.gameOver = false;
    this.victory = false;
  }

  public reset(): void {
    this.round = 1;
    this.roundTimer = 99;
    this.score = 0;
    this.gameOver = false;
    this.victory = false;
    this.p1 = this.createFighter('KAI', 70, '#F43F5E', '#FFFFFF', true);
    this.p2 = this.createFighter('SHADOW', 230, '#3B82F6', '#1E293B', false);
    this.roundAnnouncement = 'ROUND 1 - FIGHT!';
    this.announcementTimer = 90;
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.round;
  }

  public isGameOver(): boolean {
    return this.gameOver;
  }

  public isVictory(): boolean {
    return this.victory;
  }

  public destroy(): void {}
}

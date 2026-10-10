# RetroArcade - Browser-Based Retro Emulator & Multiplayer Hub

A modern web-based retro gaming emulator with support for commercial & homebrew ROMs (NES, CHIP-8), 2-player simultaneous multiplayer, physical Gamepad API support, save states, global leaderboards, mobile touch controls, and Vercel edge deployment.

![RetroArcade Preview](https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

- **🎮 Real ROM Support (romsgames.net & homebrew)**:
  - Powered by **JSNES** (Nintendo Entertainment System) and **CHIP-8** virtual machine.
  - Drag-and-drop `.zip` or `.nes` ROM files downloaded directly from [romsgames.net](https://www.romsgames.net/roms/) with automatic in-memory archive extraction.
  - Cycle-accurate CPU/PPU/APU emulation running at 60 FPS.
- **👾 6 Built-In Classic Retro Games**:
  - **Super Pixel Plumber**: 16-bit side-scrolling platformer with Mario & Luigi 2P co-op.
  - **Galactic Vanguard**: Vertical arcade space shoot 'em up with shields, powerups & mothership boss.
  - **Hyper Street Duel**: 16-bit 1v1 fighting game with combos, special Hadouken attacks & rounds.
  - **Cyber Velocity GP**: Pseudo-3D/top-down arcade racer with drift physics & checkpoints.
  - **Neon Brick Breaker DX**: Classic arcade breakout with laser cannons & multi-ball cascades.
  - **CHIP-8 Interpreter**: Cycle-accurate virtual machine with embedded Pong and ROM loader.
- **👥 2-Player Simultaneous Multiplayer**:
  - Couch co-op and versus across games.
  - Assign Gamepad 1 / Gamepad 2 or split keyboard (`WASD` for P1, `Numpad / IJKL` for P2).
- **🕹️ Controller & Gamepad API Compatibility**:
  - Plug-and-play support for Xbox Wireless, PlayStation DualShock/DualSense, Nintendo Switch Pro, and standard USB arcade sticks.
  - Integrated Controller Hub with live button press visualizer.
- **💾 Save State System**:
  - 5 manual save slots + 1 Quick Save slot (`F1`).
  - Capture visual screenshot thumbnails and instant memory dumps.
  - Export and import `.sav` files to transfer progress across computers and phones.
- **📱 Mobile Touch Controls**:
  - Ergonomic 8-way directional virtual D-Pad and retro arcade diamond buttons (A, B, X, Y, Start, Select).
  - Multi-touch handling with haptic rumble feedback (`navigator.vibrate`).
- **🏆 Arcade Hall of Fame Leaderboard**:
  - High score tracking per game with gold/silver/bronze rank badges.
- **⚡ Vercel Global Edge Deployment**:
  - Preconfigured `vercel.json` with SPA routing and asset caching.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/retro-arcade-emulator.git
cd retro-arcade-emulator

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ▲ Deploying to Vercel

### Option 1: Vercel Dashboard (Recommended)
1. Push this repository to your GitHub account.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your GitHub repository.
4. Framework Preset will automatically detect **Vite**.
5. Click **"Deploy"**. The app is live worldwide on Vercel's global CDN in ~30 seconds!

### Option 2: Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

---

## 🕹️ Controls

### Player 1 (Default)
| Button | Keyboard | Gamepad |
| :--- | :--- | :--- |
| **D-Pad / Move** | `W`, `A`, `S`, `D` or Arrow Keys | D-Pad / Left Stick |
| **Button A** | `J` / `Z` / `Space` | `A` / Cross (Button 0) |
| **Button B** | `K` / `X` | `B` / Circle (Button 1) |
| **Button X** | `U` / `C` | `X` / Square (Button 2) |
| **Button Y** | `I` / `V` | `Y` / Triangle (Button 3) |
| **Start** | `Enter` | `Start` / Menu (Button 9) |
| **Select** | `Tab` / `Right Shift` | `Select` / Back (Button 8) |

### Player 2 (Multiplayer)
| Button | Keyboard | Gamepad |
| :--- | :--- | :--- |
| **D-Pad / Move** | `Num 8, 4, 5, 6` or `I, J, K, L` | Gamepad #2 D-Pad |
| **Button A** | `Num 1` / `B` | Gamepad #2 Button 0 |
| **Button B** | `Num 2` / `N` | Gamepad #2 Button 1 |
| **Start** | `Num Enter` / `P` | Gamepad #2 Button 9 |

---

## 📄 License
MIT License. Free for personal and educational use.

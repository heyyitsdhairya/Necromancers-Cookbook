# Necromancer's Cookbook

An interactive dark fantasy alchemy, creature synthesis, and battle strategy game built with React, Vite, and Web Audio API, featuring AI generation capabilities powered by the DreamLayer Engine.

---

## 🎮 Game Features

- **The Laboratory**:
  - Combine 6 elemental dark reagents (*Bone, Ash, Iron, Crystal, Shadow, Cursed Herb*) in your bubbling cauldron.
  - Discover 10 unique undead creatures with distinctive attributes and abilities.
  - Sacrifice discovered creatures to harvest valuable dark reagents.
  - Synthesize advanced **Living Fusions** by merging two compatible monsters.

- **The Grimoire**:
  - A tactile, 3D animated necromantic tome styled after digital archives.
  - **Chapter I & II (Story & Rules)**: Learn the lore of your exile and the alchemical laws of necromancy.
  - **Cookbook**: 18 alchemical formulas (10 basic reagents + 8 hybrid fusions) with riddles, tips, and stat multipliers.
  - **The Living Bestiary**: Interactive dossier inspecting creature combat stats, lore, and abilities.
  - **The Inquisitor Dossier**: Detailed tactical dossiers on the Holy Order foes hunting you.
  - Smooth page-flip animations, bookmark ribbons with glowing indicators, and persistent reading continuity.

- **Graveyard Arena**:
  - Deploy a squad of up to 3 minions against waves of Inquisitors.
  - Dynamic combat simulation with turn-based attacks, speed calculations, and combat logs.
  - Defeat the Holy Order and challenge the Abyss Bosses.

- **Spoils of War & Black Market**:
  - Claim spoils earned from arena conquests.
  - Purchase essential crafting reagents with gold.

- **Atmospheric Audio**:
  - Fully procedural synthesizers generating ambient dark dungeon background music, cauldrons bubbling, page flips, and battle effects without external audio files.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS (Custom dark fantasy theme, glassmorphism, responsive parchment textures)
- **Audio**: Web Audio API (Synthesizers & procedural sound effects)
- **External Integration**: DreamLayer API (`https://api.dreamlayer.io/v1`) for custom AI monster generation

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
VITE_DREAMLAYER_API_KEY=your_dreamlayer_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

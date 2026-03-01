/**
 * Placeholder Sprite Generator
 *
 * Generates simple 32x32 pixel-art placeholder PNGs for all game elements.
 * Run with: node scripts/generate-sprites.js
 *
 * These are temporary placeholders — replace with real pixel art later.
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const TILE = 32;
const SPRITES_DIR = path.join(__dirname, '..', 'assets', 'sprites');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function save(canvas, ...pathParts) {
  const filePath = path.join(SPRITES_DIR, ...pathParts);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
  console.log(`  ✓ ${pathParts.join('/')}`);
}

// --- Drawing helpers ---

function fillTile(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, TILE, TILE);
}

function drawPixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawPixelCircle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        ctx.fillRect(cx + dx, cy + dy, 1, 1);
      }
    }
  }
}

function drawTriangle(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

function newCanvas() {
  return createCanvas(TILE, TILE);
}

function adjustBrightness(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ============================================================
// TILES (per season)
// ============================================================

function generateTiles() {
  console.log('\n🟩 Tiles');

  const grassColors = {
    spring: '#7EC850',
    summer: '#5DAE3B',
    autumn: '#C4A243',
    winter: '#D4DFE6',
  };

  // Seed random for reproducible texture
  let seed = 42;
  function seededRandom() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (const [season, color] of Object.entries(grassColors)) {
    const c = newCanvas();
    const ctx = c.getContext('2d');
    fillTile(ctx, color);
    ctx.fillStyle = adjustBrightness(color, -15);
    seed = 42; // reset seed per season for consistent texture
    for (let i = 0; i < 8; i++) {
      const px = Math.floor(seededRandom() * TILE);
      const py = Math.floor(seededRandom() * TILE);
      ctx.fillRect(px, py, 1, 1);
    }
    save(c, 'tiles', `grass_${season}.png`);
  }

  // Path
  const pathCanvas = newCanvas();
  const pathCtx = pathCanvas.getContext('2d');
  fillTile(pathCtx, '#C8B88A');
  drawPixelRect(pathCtx, 2, 2, 28, 28, '#B5A678');
  save(pathCanvas, 'tiles', 'path.png');

  // Water
  const waterCanvas = newCanvas();
  const waterCtx = waterCanvas.getContext('2d');
  fillTile(waterCtx, '#4A90D9');
  for (let y = 8; y < TILE; y += 10) {
    drawPixelRect(waterCtx, 4, y, 10, 1, '#6BB3F0');
    drawPixelRect(waterCtx, 18, y + 5, 10, 1, '#6BB3F0');
  }
  save(waterCanvas, 'tiles', 'water.png');

  // Dirt
  const dirtCanvas = newCanvas();
  const dirtCtx = dirtCanvas.getContext('2d');
  fillTile(dirtCtx, '#8B7355');
  dirtCtx.fillStyle = '#7A6348';
  seed = 99;
  for (let i = 0; i < 6; i++) {
    dirtCtx.fillRect(
      Math.floor(seededRandom() * 28) + 2,
      Math.floor(seededRandom() * 28) + 2,
      2, 2
    );
  }
  save(dirtCanvas, 'tiles', 'dirt.png');
}

// ============================================================
// TREES (per season)
// ============================================================

function generateTrees() {
  console.log('\n🌳 Trees');

  const leafColors = {
    spring: ['#5DAE3B', '#7EC850'],
    summer: ['#3D8B28', '#4FA83A'],
    autumn: ['#D4843A', '#E8A64C'],
    winter: ['#9AAFB8', '#C8D8E0'],
  };

  for (const [season, [dark, light]] of Object.entries(leafColors)) {
    // Sapling
    let c = newCanvas();
    let ctx = c.getContext('2d');
    drawPixelRect(ctx, 15, 20, 2, 10, '#6B4E3D');
    drawPixelCircle(ctx, 16, 17, 4, dark);
    drawPixelCircle(ctx, 16, 15, 3, light);
    save(c, 'trees', `sapling_${season}.png`);

    // Young
    c = newCanvas();
    ctx = c.getContext('2d');
    drawPixelRect(ctx, 14, 18, 4, 12, '#6B4E3D');
    drawTriangle(ctx, 6, 6, 20, 14, dark);
    drawTriangle(ctx, 8, 2, 16, 12, light);
    save(c, 'trees', `young_${season}.png`);

    // Mature
    c = newCanvas();
    ctx = c.getContext('2d');
    drawPixelRect(ctx, 13, 18, 6, 14, '#5C3D2E');
    drawPixelCircle(ctx, 16, 12, 10, dark);
    drawPixelCircle(ctx, 14, 10, 7, light);
    drawPixelCircle(ctx, 19, 9, 5, adjustBrightness(light, 10));
    save(c, 'trees', `mature_${season}.png`);
  }
}

// ============================================================
// FLOWERS
// ============================================================

function generateFlowers() {
  console.log('\n🌸 Flowers');

  const offsets = [[-3, -3], [3, -3], [-3, 3], [3, 3]];

  // Basic
  let c = newCanvas();
  let ctx = c.getContext('2d');
  drawPixelRect(ctx, 15, 18, 2, 10, '#4A8B3D');
  const petalColors = ['#E86B8A', '#F0A0B0', '#E86B8A', '#F0A0B0'];
  offsets.forEach(([dx, dy], i) => {
    drawPixelCircle(ctx, 16 + dx, 14 + dy, 3, petalColors[i]);
  });
  drawPixelCircle(ctx, 16, 14, 2, '#FFD700');
  save(c, 'flowers', 'basic.png');

  // Enhanced (Qur'an-boosted)
  c = newCanvas();
  ctx = c.getContext('2d');
  drawPixelRect(ctx, 15, 18, 2, 10, '#5DAE3B');
  const enhancedPetals = ['#FF8CB0', '#FFB8D0', '#FF8CB0', '#FFB8D0'];
  offsets.forEach(([dx, dy], i) => {
    drawPixelCircle(ctx, 16 + dx, 14 + dy, 4, enhancedPetals[i]);
  });
  drawPixelCircle(ctx, 16, 14, 3, '#FFEA00');
  drawPixelCircle(ctx, 16, 14, 6, 'rgba(255, 234, 0, 0.15)');
  save(c, 'flowers', 'enhanced.png');
}

// ============================================================
// BUILDINGS
// ============================================================

function generateBuildings() {
  console.log('\n🏠 Buildings');

  // Home
  let c = newCanvas();
  let ctx = c.getContext('2d');
  drawPixelRect(ctx, 6, 16, 20, 14, '#D4A574');
  drawTriangle(ctx, 4, 16, 24, 10, '#A0522D');
  drawPixelRect(ctx, 13, 22, 6, 8, '#6B4E3D');
  drawPixelRect(ctx, 8, 19, 4, 4, '#87CEEB');
  save(c, 'buildings', 'home.png');

  // Mansion
  c = newCanvas();
  ctx = c.getContext('2d');
  drawPixelRect(ctx, 3, 14, 26, 16, '#E8D5B7');
  drawTriangle(ctx, 1, 14, 30, 10, '#8B4513');
  drawPixelRect(ctx, 12, 22, 8, 8, '#5C3D2E');
  drawPixelRect(ctx, 5, 17, 5, 5, '#87CEEB');
  drawPixelRect(ctx, 22, 17, 5, 5, '#87CEEB');
  drawPixelRect(ctx, 10, 14, 2, 16, '#C8B88A');
  drawPixelRect(ctx, 20, 14, 2, 16, '#C8B88A');
  save(c, 'buildings', 'mansion.png');

  // Palace
  c = newCanvas();
  ctx = c.getContext('2d');
  drawPixelRect(ctx, 2, 12, 28, 18, '#FFF8DC');
  drawPixelCircle(ctx, 16, 10, 8, '#DAA520');
  drawPixelCircle(ctx, 16, 10, 6, '#FFD700');
  drawPixelRect(ctx, 2, 8, 6, 22, '#E8D5B7');
  drawPixelRect(ctx, 24, 8, 6, 22, '#E8D5B7');
  drawTriangle(ctx, 2, 4, 6, 6, '#DAA520');
  drawTriangle(ctx, 24, 4, 6, 6, '#DAA520');
  drawPixelRect(ctx, 12, 22, 8, 8, '#8B4513');
  save(c, 'buildings', 'palace.png');
}

// ============================================================
// ANIMALS
// ============================================================

function generateAnimals() {
  console.log('\n🐦 Animals');

  // Bird
  let c = newCanvas();
  let ctx = c.getContext('2d');
  drawPixelCircle(ctx, 16, 16, 4, '#4A90D9');
  drawPixelCircle(ctx, 20, 14, 3, '#4A90D9');
  drawPixelRect(ctx, 23, 14, 3, 1, '#E8A64C');
  drawPixelRect(ctx, 10, 12, 5, 2, '#3A7BC8');
  drawPixelRect(ctx, 21, 14, 1, 1, '#1A1A1A');
  save(c, 'animals', 'bird.png');

  // Rabbit
  c = newCanvas();
  ctx = c.getContext('2d');
  drawPixelCircle(ctx, 16, 20, 5, '#E0D5C0');
  drawPixelCircle(ctx, 16, 14, 4, '#E0D5C0');
  drawPixelRect(ctx, 13, 6, 2, 8, '#E0D5C0');
  drawPixelRect(ctx, 17, 6, 2, 8, '#E0D5C0');
  drawPixelRect(ctx, 14, 7, 1, 6, '#F0B0B0');
  drawPixelRect(ctx, 18, 7, 1, 6, '#F0B0B0');
  drawPixelRect(ctx, 14, 13, 1, 1, '#1A1A1A');
  drawPixelRect(ctx, 18, 13, 1, 1, '#1A1A1A');
  save(c, 'animals', 'rabbit.png');

  // Deer
  c = newCanvas();
  ctx = c.getContext('2d');
  drawPixelRect(ctx, 8, 16, 16, 10, '#C4873B');
  drawPixelRect(ctx, 10, 26, 2, 4, '#A06B2F');
  drawPixelRect(ctx, 20, 26, 2, 4, '#A06B2F');
  drawPixelCircle(ctx, 22, 14, 4, '#C4873B');
  drawPixelRect(ctx, 20, 6, 2, 8, '#8B6B3D');
  drawPixelRect(ctx, 18, 8, 2, 2, '#8B6B3D');
  drawPixelRect(ctx, 24, 6, 2, 8, '#8B6B3D');
  drawPixelRect(ctx, 26, 8, 2, 2, '#8B6B3D');
  drawPixelRect(ctx, 24, 13, 1, 1, '#1A1A1A');
  save(c, 'animals', 'deer.png');

  // Squirrel
  c = newCanvas();
  ctx = c.getContext('2d');
  drawPixelCircle(ctx, 16, 20, 5, '#B5651D');
  drawPixelCircle(ctx, 16, 14, 3, '#B5651D');
  drawPixelCircle(ctx, 10, 16, 4, '#C4873B');
  drawPixelCircle(ctx, 8, 14, 3, '#C4873B');
  drawPixelRect(ctx, 15, 13, 1, 1, '#1A1A1A');
  drawPixelRect(ctx, 18, 13, 1, 1, '#1A1A1A');
  save(c, 'animals', 'squirrel.png');
}

// ============================================================
// ILLUSTRIOUS ITEMS
// ============================================================

function generateIllustriousItems() {
  console.log('\n✨ Illustrious Items');

  // Radiant Fountain
  let c = newCanvas();
  let ctx = c.getContext('2d');
  drawPixelCircle(ctx, 16, 22, 8, '#B0C4DE');
  drawPixelCircle(ctx, 16, 22, 6, '#6BB3F0');
  drawPixelRect(ctx, 15, 10, 2, 12, '#B0C4DE');
  drawPixelCircle(ctx, 16, 8, 3, 'rgba(107, 179, 240, 0.7)');
  drawPixelRect(ctx, 12, 6, 1, 4, 'rgba(107, 179, 240, 0.5)');
  drawPixelRect(ctx, 19, 6, 1, 4, 'rgba(107, 179, 240, 0.5)');
  save(c, 'illustrious', 'radiant_fountain.png');

  // Glowing Tree
  c = newCanvas();
  ctx = c.getContext('2d');
  drawPixelCircle(ctx, 16, 14, 14, 'rgba(255, 215, 0, 0.12)');
  drawPixelCircle(ctx, 16, 14, 11, 'rgba(255, 215, 0, 0.15)');
  drawPixelRect(ctx, 14, 20, 4, 10, '#6B4E3D');
  drawPixelCircle(ctx, 16, 14, 9, '#DAA520');
  drawPixelCircle(ctx, 16, 12, 7, '#FFD700');
  save(c, 'illustrious', 'glowing_tree.png');

  // Floating Lantern
  c = newCanvas();
  ctx = c.getContext('2d');
  drawPixelCircle(ctx, 16, 16, 10, 'rgba(255, 165, 0, 0.1)');
  drawPixelRect(ctx, 12, 12, 8, 10, '#E88B3A');
  drawPixelRect(ctx, 13, 13, 6, 8, '#FFD700');
  drawTriangle(ctx, 12, 8, 8, 6, '#C0392B');
  drawPixelRect(ctx, 15, 4, 2, 4, '#8B7355');
  save(c, 'illustrious', 'floating_lantern.png');

  // Light Arch
  c = newCanvas();
  ctx = c.getContext('2d');
  drawPixelCircle(ctx, 16, 16, 14, 'rgba(255, 255, 200, 0.1)');
  drawPixelRect(ctx, 4, 14, 4, 16, '#DAA520');
  drawPixelRect(ctx, 24, 14, 4, 16, '#DAA520');
  for (let angle = 0; angle <= Math.PI; angle += 0.15) {
    const ax = Math.round(16 + Math.cos(angle) * 12);
    const ay = Math.round(14 - Math.sin(angle) * 10);
    drawPixelRect(ctx, ax, ay, 2, 2, '#FFD700');
  }
  save(c, 'illustrious', 'light_arch.png');
}

// ============================================================
// MAIN
// ============================================================

console.log('🎨 Generating placeholder sprites...');
generateTiles();
generateTrees();
generateFlowers();
generateBuildings();
generateAnimals();
generateIllustriousItems();
console.log('\n✅ All sprites generated!');

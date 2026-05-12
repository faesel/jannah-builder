/**
 * JannahCanvas
 *
 * Renders the world as a static grid that always fills the viewport.
 * Tile size is computed dynamically: screenSize / gridSize.
 * As the world grows, tiles shrink to fit more content.
 * No panning or zooming needed.
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';
import { WorldState, Tree, Flower, Building, Animal, IllustriousItem, Position } from '../types/models';
import { GAME_CONFIG } from '../config/game.config';
import type { TreeStage, IllustriousItemType } from '../config/game.config';
import { COLORS } from '../config/colors';
import { TILE_SPRITES, TREE_SPRITES, FLOWER_SPRITES, BUILDING_SPRITES, ANIMAL_SPRITES, ILLUSTRIOUS_SPRITES, LANDMARK_SPRITES } from './sprites';

// Debug flag moved to GAME_CONFIG.debug.showAllSprites

interface JannahCanvasProps {
  worldState: WorldState;
  screenWidth: number;
  screenHeight: number;
  quranLogged?: boolean;
  dhikrLogged?: boolean;
}

export const JannahCanvas = React.memo(function JannahCanvas({ worldState, screenWidth, screenHeight, quranLogged, dhikrLogged }: JannahCanvasProps) {
  if (GAME_CONFIG.debug.showAllSprites) {
    return <SpriteDebugOnMap screenWidth={screenWidth} screenHeight={screenHeight} />;
  }

  const activeWorld = GAME_CONFIG.debug.simulateProgress
    ? buildSimulatedWorld(GAME_CONFIG.debug.simulateProgress)
    : worldState;

  const gridSize = activeWorld.gridSize ?? GAME_CONFIG.map.initialGridSize;

  // Tile size: fit gridSize tiles along the shorter screen axis
  const tileSize = Math.max(
    GAME_CONFIG.map.minTileSize,
    Math.floor(Math.min(screenWidth, screenHeight) / gridSize),
  );

  const cols = Math.ceil(screenWidth / tileSize);
  const rows = Math.ceil(screenHeight / tileSize);

  // Center of the grid in tile coordinates
  const centerCol = Math.floor(cols / 2);
  const centerRow = Math.floor(rows / 2);

  // Grass tiles — rendered using variant sprites for natural look
  const grassVariants = TILE_SPRITES.grass;
  const grassTiles = useMemo(() => {
    const tiles: React.ReactElement[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Deterministic variant per tile using simple hash
        const variant = ((row * 7) + (col * 13) + (row * col * 3)) % grassVariants.length;
        tiles.push(
          <Image
            key={`g${row}_${col}`}
            source={grassVariants[variant]}
            style={{
              position: 'absolute',
              left: col * tileSize,
              top: row * tileSize,
              width: tileSize,
              height: tileSize,
            }}
          />,
        );
      }
    }
    return tiles;
  }, [rows, cols, tileSize, grassVariants]);

  // Debug gridlines
  const gridLines = useMemo(() => {
    if (!GAME_CONFIG.debug.showGridLines) return null;
    const lines: React.ReactElement[] = [];
    const lineColor = 'rgba(0,0,0,0.12)';
    const totalW = cols * tileSize;
    const totalH = rows * tileSize;
    for (let col = 0; col <= cols; col++) {
      lines.push(
        <View key={`v${col}`} style={{
          position: 'absolute', left: col * tileSize, top: 0,
          width: 1, height: totalH, backgroundColor: lineColor,
        }} />,
      );
    }
    for (let row = 0; row <= rows; row++) {
      lines.push(
        <View key={`h${row}`} style={{
          position: 'absolute', left: 0, top: row * tileSize,
          width: totalW, height: 1, backgroundColor: lineColor,
        }} />,
      );
    }
    return lines;
  }, [cols, rows, tileSize]);

  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: COLORS.grass }}>
      {/* Grass tile Views for checkerboard texture */}
      {grassTiles}

      {gridLines}

      {/* Signboard at center */}
      <View style={[styles.signboardContainer, {
        left: centerCol * tileSize,
        top: centerRow * tileSize,
        width: tileSize,
      }]}>
        <Image
          source={LANDMARK_SPRITES.signboard}
          style={{ width: tileSize, height: tileSize }}
        />
      </View>

      {/* Flowers */}
      {activeWorld.flowers.map((f) => (
        <FlowerSprite key={f.id} flower={f} center={centerCol} centerRow={centerRow} tileSize={tileSize} />
      ))}

      {/* Buildings */}
      {activeWorld.buildings.map((b) => (
        <BuildingSprite key={b.id} building={b} center={centerCol} centerRow={centerRow} tileSize={tileSize} />
      ))}

      {/* Trees */}
      {activeWorld.trees.map((t) => (
        <TreeSprite key={t.id} tree={t} center={centerCol} centerRow={centerRow} tileSize={tileSize} />
      ))}

      {/* Animals */}
      {activeWorld.animals.map((a) => (
        <AnimalSprite key={a.id} animal={a} center={centerCol} centerRow={centerRow} tileSize={tileSize} />
      ))}

      {/* Illustrious items */}
      {activeWorld.illustriousItems.map((i) => (
        <IllustriousSprite key={i.id} item={i} center={centerCol} centerRow={centerRow} tileSize={tileSize} />
      ))}

      {/* Qur'an glowing flowers */}
      {quranLogged && (
        <QuranFlowers cols={cols} rows={rows} tileSize={tileSize} />
      )}

      {/* Dhikr floating particles */}
      {dhikrLogged && (
        <DhikrParticles screenWidth={cols * tileSize} screenHeight={rows * tileSize} />
      )}
    </View>
  );
});

// ============================================================
// Trees
// ============================================================

function TreeSprite({ tree, center, centerRow, tileSize }: {
  tree: Tree; center: number; centerRow: number; tileSize: number;
}) {
  return (
    <Image
      source={TREE_SPRITES[tree.stage]}
      style={{
        position: 'absolute',
        left: (tree.position.x + center) * tileSize,
        top: (tree.position.y + centerRow) * tileSize,
        width: tileSize,
        height: tileSize,
      }}
    />
  );
}

// ============================================================
// Flowers
// ============================================================

function FlowerSprite({ flower, center, centerRow, tileSize }: {
  flower: Flower; center: number; centerRow: number; tileSize: number;
}) {
  return (
    <Image
      source={flower.type === 'enhanced' ? FLOWER_SPRITES.enhanced : FLOWER_SPRITES.basic}
      style={{
        position: 'absolute',
        left: (flower.position.x + center) * tileSize,
        top: (flower.position.y + centerRow) * tileSize,
        width: tileSize,
        height: tileSize,
      }}
    />
  );
}

// ============================================================
// Buildings
// ============================================================

function BuildingSprite({ building, center, centerRow, tileSize }: {
  building: Building; center: number; centerRow: number; tileSize: number;
}) {
  return (
    <Image
      source={BUILDING_SPRITES[building.type]}
      style={{
        position: 'absolute',
        left: (building.position.x + center) * tileSize,
        top: (building.position.y + centerRow) * tileSize,
        width: tileSize,
        height: tileSize,
      }}
    />
  );
}

// ============================================================
// Animals
// ============================================================

function AnimalSprite({ animal, center, centerRow, tileSize }: {
  animal: Animal; center: number; centerRow: number; tileSize: number;
}) {
  return (
    <Image
      source={ANIMAL_SPRITES[animal.type]}
      style={{
        position: 'absolute',
        left: (animal.position.x + center) * tileSize,
        top: (animal.position.y + centerRow) * tileSize,
        width: tileSize,
        height: tileSize,
      }}
    />
  );
}

// ============================================================
// Illustrious Items
// ============================================================

function IllustriousSprite({ item, center, centerRow, tileSize }: {
  item: IllustriousItem; center: number; centerRow: number; tileSize: number;
}) {
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[styles.illustriousGlow, {
        left: (item.position.x + center) * tileSize,
        top: (item.position.y + centerRow) * tileSize,
        width: tileSize,
        height: tileSize,
        opacity: pulseAnim,
      }]}
      importantForAccessibility="no"
    >
      <Image source={ILLUSTRIOUS_SPRITES[item.type]} style={{ width: tileSize, height: tileSize }} />
    </Animated.View>
  );
}

// ============================================================
// Qur'an Glowing Flowers
// ============================================================

const QURAN_FLOWER_COUNT = 3;

function QuranFlowers({ cols, rows, tileSize }: { cols: number; rows: number; tileSize: number }) {
  // Place flowers at fixed, visible positions spread across the map
  const flowers = useMemo(() => {
    const positions = [
      { col: Math.floor(cols * 0.25), row: Math.floor(rows * 0.25) },
      { col: Math.floor(cols * 0.75), row: Math.floor(rows * 0.35) },
      { col: Math.floor(cols * 0.5), row: Math.floor(rows * 0.65) },
    ];
    return positions.map((p, i) => ({ id: i, ...p }));
  }, [cols, rows]);

  return (
    <>
      {flowers.map((f) => (
        <GlowingFlower key={f.id} col={f.col} row={f.row} tileSize={tileSize} />
      ))}
    </>
  );
}

function GlowingFlower({ col, row, tileSize }: { col: number; row: number; tileSize: number }) {
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 1500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  const size = tileSize * 2;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: col * tileSize - tileSize * 0.5,
        top: row * tileSize - tileSize * 0.5,
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pulseAnim,
      }}
      importantForAccessibility="no"
    >
      <View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: tileSize,
        backgroundColor: 'rgba(255, 215, 0, 0.35)',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 10,
      }} />
      <Image
        source={FLOWER_SPRITES.enhanced}
        style={{ width: tileSize * 1.5, height: tileSize * 1.5 }}
      />
    </Animated.View>
  );
}

// ============================================================
// Dhikr Floating Particles
// ============================================================

const PARTICLE_COUNT = 10;

function DhikrParticles({ screenWidth, screenHeight }: { screenWidth: number; screenHeight: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * screenWidth,
      startY: screenHeight * (0.3 + Math.random() * 0.6),
      size: 4 + Math.random() * 4,
      duration: 4000 + Math.random() * 3000,
      delay: Math.random() * 2000,
    }));
  }, [screenWidth, screenHeight]);

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: screenWidth, height: screenHeight }} pointerEvents="none">
      {particles.map((p) => (
        <FloatingDot key={p.id} {...p} screenHeight={screenHeight} />
      ))}
    </View>
  );
}

function FloatingDot({ x, startY, size, duration, delay, screenHeight }: {
  x: number; startY: number; size: number; duration: number; delay: number; screenHeight: number;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = screenHeight * 0.3;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -drift, duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.7, duration: duration * 0.2, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.7, duration: duration * 0.5, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: duration * 0.3, useNativeDriver: true }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [translateY, opacity, duration, delay, screenHeight]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: startY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFFDE0',
        opacity,
        transform: [{ translateY }],
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 3,
      }}
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  illustriousGlow: {
    position: 'absolute',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  signboardContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
});

// ============================================================
// Simulated Progress — debug mode world generator
// ============================================================

function spiralPosition(index: number): Position {
  if (index === 0) return { x: 0, y: 0 };
  let x = 0, y = 0, dx = 1, dy = 0, maxSteps = 1, steps = 0, changes = 0;
  for (let i = 0; i < index; i++) {
    x += dx; y += dy; steps++;
    if (steps === maxSteps) {
      steps = 0; changes++;
      [dx, dy] = [-dy, dx]; // rotate 90°
      if (changes % 2 === 0) maxSteps++;
    }
  }
  return { x, y };
}

function buildSimulatedWorld(level: 'days' | 'months' | 'years'): WorldState {
  const now = Date.now();
  const presets = {
    //                trees  flowers  buildings           animals                    illustrious                streak
    days:   { trees: 3,  flowers: 0,  buildings: [] as string[],  animals: ['bird'] as string[],                  illustrious: [] as string[],                 quran: true,  dhikr: false },
    months: { trees: 20, flowers: 5,  buildings: ['home'],        animals: ['bird','rabbit','squirrel'],           illustrious: ['radiant_fountain'],           quran: true,  dhikr: true  },
    years:  { trees: 60, flowers: 12, buildings: ['home','mansion','palace'], animals: ['bird','rabbit','squirrel','deer'], illustrious: ['radiant_fountain','glowing_tree','floating_lantern','light_arch'], quran: true, dhikr: true },
  };
  const p = presets[level];

  const stages: TreeStage[] = ['sapling', 'young', 'mature'];
  const trees: Tree[] = Array.from({ length: p.trees }, (_, i) => ({
    id: `sim_tree_${i}`,
    stage: stages[Math.min(Math.floor(i / Math.max(1, Math.ceil(p.trees / 3))), 2)],
    position: spiralPosition(i),
    createdAt: now,
    lastUpdated: now,
  }));

  // Place flowers in gaps between trees
  const occupied = new Set(trees.map(t => `${t.position.x},${t.position.y}`));
  const flowers: Flower[] = [];
  let flowerIdx = 0;
  for (let ring = 1; flowers.length < p.flowers && ring < 15; ring++) {
    for (let angle = 0; angle < 8 && flowers.length < p.flowers; angle++) {
      const x = Math.round(Math.cos(angle * Math.PI / 4) * ring);
      const y = Math.round(Math.sin(angle * Math.PI / 4) * ring);
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        occupied.add(key);
        flowers.push({ id: `sim_flower_${flowerIdx++}`, position: { x, y }, type: 'basic' });
      }
    }
  }

  // Buildings placed outside the tree cluster
  const buildingTypes = ['home', 'mansion', 'palace'] as const;
  const buildings: Building[] = p.buildings.map((type, i) => {
    const offset = (i + 1) * 3;
    const pos = { x: -offset, y: offset };
    occupied.add(`${pos.x},${pos.y}`);
    return { id: `sim_bld_${i}`, type: type as typeof buildingTypes[number], position: pos, createdAt: now };
  });

  // Animals scattered around
  const animalTypes = ['bird', 'rabbit', 'deer', 'squirrel'] as const;
  const animals: Animal[] = p.animals.map((type, i) => {
    const angle = (i * 2.3);
    const radius = 4 + i * 2;
    const pos = { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
    return { id: `sim_animal_${i}`, type: type as typeof animalTypes[number], position: pos, createdAt: now };
  });

  // Illustrious items at prominent positions
  const illustriousItems: IllustriousItem[] = p.illustrious.map((type, i) => {
    const offset = (i + 1) * 4;
    const pos = { x: offset, y: -offset + 2 };
    return { id: `sim_illus_${i}`, type: type as IllustriousItemType, position: pos, createdAt: now, streakDays: (i + 1) * 30 };
  });

  return {
    trees, flowers, buildings, animals, illustriousItems,
    mapSize: { width: 20, height: 20 },
    gridSize: 20,
    lastUpdated: now,
  };
}

// ============================================================
// Sprite Debug Grid — toggle with showAllSprites
// ============================================================

const ALL_SPRITES: { label: string; source: number }[] = [
  // Tiles
  { label: 'grass_1', source: TILE_SPRITES.grass[0] },
  { label: 'grass_2', source: TILE_SPRITES.grass[1] },
  { label: 'grass_3', source: TILE_SPRITES.grass[2] },
  { label: 'grass_4', source: TILE_SPRITES.grass[3] },
  { label: 'grass_5', source: TILE_SPRITES.grass[4] },
  { label: 'grass_6', source: TILE_SPRITES.grass[5] },
  { label: 'path', source: TILE_SPRITES.path },
  { label: 'water', source: TILE_SPRITES.water },
  { label: 'dirt', source: TILE_SPRITES.dirt },
  { label: 'fence_v', source: TILE_SPRITES.fence_vertical },
  { label: 'fence_h', source: TILE_SPRITES.fence_horizontal },
  { label: 'fence_c', source: TILE_SPRITES.fence_corner },
  // Trees
  { label: 'sapling', source: TREE_SPRITES.sapling },
  { label: 'young', source: TREE_SPRITES.young },
  { label: 'mature', source: TREE_SPRITES.mature },
  // Flowers
  { label: 'basic', source: FLOWER_SPRITES.basic },
  { label: 'enhanced', source: FLOWER_SPRITES.enhanced },
  // Buildings
  { label: 'home', source: BUILDING_SPRITES.home },
  { label: 'mansion', source: BUILDING_SPRITES.mansion },
  { label: 'palace', source: BUILDING_SPRITES.palace },
  // Animals
  { label: 'bird', source: ANIMAL_SPRITES.bird },
  { label: 'rabbit', source: ANIMAL_SPRITES.rabbit },
  { label: 'deer', source: ANIMAL_SPRITES.deer },
  { label: 'squirrel', source: ANIMAL_SPRITES.squirrel },
  // Illustrious
  { label: 'fountain', source: ILLUSTRIOUS_SPRITES.radiant_fountain },
  { label: 'glow_tree', source: ILLUSTRIOUS_SPRITES.glowing_tree },
  { label: 'lantern', source: ILLUSTRIOUS_SPRITES.floating_lantern },
  { label: 'arch', source: ILLUSTRIOUS_SPRITES.light_arch },
  // Landmarks
  { label: 'signboard', source: LANDMARK_SPRITES.signboard },
];

function SpriteDebugOnMap({ screenWidth, screenHeight }: { screenWidth: number; screenHeight: number }) {
  const gridSize = GAME_CONFIG.map.initialGridSize;
  const tileSize = Math.max(
    GAME_CONFIG.map.minTileSize,
    Math.floor(Math.min(screenWidth, screenHeight) / gridSize),
  );
  const cols = Math.ceil(screenWidth / tileSize);
  const rows = Math.ceil(screenHeight / tileSize);

  // Grass background
  const grassVariants = TILE_SPRITES.grass;
  const grassTiles: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const variant = ((r * 7) + (c * 13) + (r * c * 3)) % grassVariants.length;
      grassTiles.push(
        <Image
          key={`g${r}_${c}`}
          source={grassVariants[variant]}
          style={{ position: 'absolute', left: c * tileSize, top: r * tileSize, width: tileSize, height: tileSize }}
        />
      );
    }
  }

  // Place sprites sequentially, leaving a 1-tile gap between each, wrapping rows
  // Start at row 1, col 1 to give a margin
  const spriteElements: React.ReactElement[] = [];
  let col = 1;
  let row = 1;
  for (const sprite of ALL_SPRITES) {
    if (col >= cols - 1) {
      col = 1;
      row += 2; // leave a row gap for the label
    }
    if (row >= rows - 1) break;

    spriteElements.push(
      <View key={sprite.label} style={{ position: 'absolute', left: col * tileSize, top: row * tileSize, alignItems: 'center' }}>
        <Image source={sprite.source} style={{ width: tileSize, height: tileSize }} resizeMode="contain" />
        <Text style={{ color: '#FFF', fontSize: 8, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 2, borderRadius: 2 }}>
          {sprite.label}
        </Text>
      </View>
    );
    col += 2; // leave a tile gap
  }

  return (
    <View style={{ width: cols * tileSize, height: rows * tileSize }}>
      {grassTiles}
      {spriteElements}
    </View>
  );
}

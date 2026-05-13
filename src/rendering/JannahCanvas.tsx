/**
 * JannahCanvas
 *
 * Renders the world as a static grid that always fills the viewport.
 * Tile size is computed dynamically: screenSize / gridSize.
 * As the world grows, tiles shrink to fit more content.
 * No panning or zooming needed.
 */

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';
import { WorldState, Tree, Flower, Building, Animal, River, IllustriousItem, Position } from '../types/models';
import { GAME_CONFIG } from '../config/game.config';
import type { TreeStage, IllustriousItemType } from '../config/game.config';
import { COLORS } from '../config/colors';
import { TILE_SPRITES, TREE_SPRITES, FLOWER_SPRITES, BUILDING_SPRITES, ANIMAL_SPRITES, ANIMAL_FEED_SPRITES, ANIMAL_MOVE_SPRITES, ILLUSTRIOUS_SPRITES, LANDMARK_SPRITES } from './sprites';
import type { AnimalDirection } from './sprites';

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

  const gridSize = (GAME_CONFIG.debug.simulateProgress ? GAME_CONFIG.map.initialGridSize : worldState.gridSize) ?? GAME_CONFIG.map.initialGridSize;

  // Tile size: fit gridSize tiles along the shorter screen axis
  const tileSize = Math.max(
    GAME_CONFIG.map.minTileSize,
    Math.floor(Math.min(screenWidth, screenHeight) / gridSize),
  );

  const cols = Math.ceil(screenWidth / tileSize);
  const rows = Math.ceil(screenHeight / tileSize);

  const activeWorld = useMemo(() =>
    GAME_CONFIG.debug.simulateProgress
      ? buildSimulatedWorld(GAME_CONFIG.debug.simulateProgress, cols, rows)
      : worldState,
    [GAME_CONFIG.debug.simulateProgress, cols, rows, worldState],
  );

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

  // Build occupied position set for animal collision avoidance
  const occupiedPositions = useMemo(() => {
    const set = new Set<string>();
    activeWorld.buildings.forEach(b => set.add(`b:${b.position.x},${b.position.y}`));
    activeWorld.trees.forEach(t => set.add(`t:${t.position.x},${t.position.y}`));
    activeWorld.rivers.forEach(r => r.tiles.forEach(t => set.add(`w:${t.x},${t.y}`)));
    return set;
  }, [activeWorld.buildings, activeWorld.trees, activeWorld.rivers]);

  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: COLORS.grass }}>
      {/* Grass tile Views for checkerboard texture */}
      {grassTiles}

      {gridLines}

      {/* River tiles */}
      {activeWorld.rivers.map((r) =>
        r.tiles.map((tile, idx) => (
          <Image
            key={`${r.id}_${idx}`}
            source={TILE_SPRITES.water}
            style={{
              position: 'absolute',
              left: (tile.x + centerCol) * tileSize,
              top: (tile.y + centerRow) * tileSize,
              width: tileSize,
              height: tileSize,
            }}
          />
        ))
      )}

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
        <AnimalSprite
          key={a.id}
          animal={a}
          center={centerCol}
          centerRow={centerRow}
          tileSize={tileSize}
          cols={cols}
          rows={rows}
          occupiedPositions={occupiedPositions}
        />
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
// Animals (animated)
// ============================================================

type AnimalState = 'idle' | 'feeding' | 'moving';

const ANIMAL_SPEED: Record<string, number> = {
  bird: 600,     // ms per tile — fastest
  rabbit: 900,
  squirrel: 1000,
  deer: 1100,    // slowest
};

const FEED_FRAME_MS = 500; // time per feeding frame

function AnimalSprite({ animal, center, centerRow, tileSize, cols, rows, occupiedPositions }: {
  animal: Animal; center: number; centerRow: number; tileSize: number;
  cols: number; rows: number; occupiedPositions: Set<string>;
}) {
  const [, setPosX] = useState(animal.position.x);
  const [, setPosY] = useState(animal.position.y);
  const [state, setState] = useState<AnimalState>('idle');
  const [direction, setDirection] = useState<AnimalDirection>('down');
  const [feedFrame, setFeedFrame] = useState(0);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const posRef = useRef({ x: animal.position.x, y: animal.position.y });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const halfX = Math.floor(cols / 2) - 1;
  const halfY = Math.floor(rows / 2) - 1;
  const isBird = animal.type === 'bird';
  const moveSpeed = ANIMAL_SPEED[animal.type] ?? 900;

  const canMoveTo = useCallback((x: number, y: number) => {
    if (x < -halfX || x > halfX || y < -halfY || y > halfY) return false;
    // Buildings block everyone
    if (occupiedPositions.has(`b:${x},${y}`)) return false;
    // Trees block ground animals, birds can overlap trees
    if (!isBird && occupiedPositions.has(`t:${x},${y}`)) return false;
    // Water blocks ground animals entirely
    if (!isBird && occupiedPositions.has(`w:${x},${y}`)) return false;
    return true;
  }, [halfX, halfY, isBird, occupiedPositions]);

  // Birds can fly over water but cannot land (idle/feed) on it
  const canStopAt = useCallback((x: number, y: number) => {
    if (!canMoveTo(x, y)) return false;
    if (isBird && occupiedPositions.has(`w:${x},${y}`)) return false;
    return true;
  }, [canMoveTo, isBird, occupiedPositions]);

  useEffect(() => {
    let cancelled = false;

    const scheduleNext = () => {
      if (cancelled) return;
      const roll = Math.random();

      if (roll < 0.3) {
        // Stand still for 1-4 seconds
        setState('idle');
        timerRef.current = setTimeout(scheduleNext, 1000 + Math.random() * 3000);
      } else if (roll < 0.6) {
        // Feed for 2-5 seconds
        setState('feeding');
        let frame = 0;
        const feedInterval = setInterval(() => {
          if (cancelled) { clearInterval(feedInterval); return; }
          frame = (frame + 1) % 3;
          setFeedFrame(frame);
        }, FEED_FRAME_MS);
        timerRef.current = setTimeout(() => {
          clearInterval(feedInterval);
          if (!cancelled) scheduleNext();
        }, 2000 + Math.random() * 3000);
      } else {
        // Move 1-4 tiles in a random direction
        const steps = 1 + Math.floor(Math.random() * 4);
        const dirs: AnimalDirection[] = ['up', 'down', 'left', 'right'];
        const dir = dirs[Math.floor(Math.random() * 4)];
        setDirection(dir);
        setState('moving');

        let stepsDone = 0;
        const moveStep = () => {
          if (cancelled || stepsDone >= steps) {
            if (!cancelled) scheduleNext();
            return;
          }
          const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
          const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
          const newX = posRef.current.x + dx;
          const newY = posRef.current.y + dy;

          if (!canMoveTo(newX, newY)) {
            if (!cancelled) scheduleNext();
            return;
          }

          // If this is the last step, ensure the animal can stop here
          // (birds can fly over water but cannot idle/feed on it)
          if (stepsDone + 1 >= steps && !canStopAt(newX, newY)) {
            if (!cancelled) scheduleNext();
            return;
          }

          posRef.current = { x: newX, y: newY };
          Animated.parallel([
            Animated.timing(translateX, { toValue: (newX - animal.position.x) * tileSize, duration: moveSpeed, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: (newY - animal.position.y) * tileSize, duration: moveSpeed, useNativeDriver: true }),
          ]).start(() => {
            stepsDone++;
            setPosX(newX);
            setPosY(newY);
            if (!cancelled) moveStep();
          });
        };
        moveStep();
      }
    };

    // Initial random delay so animals don't all start together
    timerRef.current = setTimeout(scheduleNext, Math.random() * 2000);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [animal.position.x, animal.position.y, animal.type, canMoveTo, moveSpeed, tileSize, translateX, translateY]);

  // Pick the right sprite
  let spriteSource: number;
  if (state === 'feeding') {
    spriteSource = ANIMAL_FEED_SPRITES[animal.type][feedFrame];
  } else if (state === 'moving') {
    spriteSource = ANIMAL_MOVE_SPRITES[animal.type][direction];
  } else {
    spriteSource = ANIMAL_SPRITES[animal.type];
  }

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: (animal.position.x + center) * tileSize,
        top: (animal.position.y + centerRow) * tileSize,
        width: tileSize,
        height: tileSize,
        transform: [{ translateX }, { translateY }],
      }}
    >
      <Image source={spriteSource} style={{ width: tileSize, height: tileSize }} />
    </Animated.View>
  );
}

// ============================================================
// Illustrious Items
// ============================================================

function IllustriousSprite({ item, center, centerRow, tileSize }: {
  item: IllustriousItem; center: number; centerRow: number; tileSize: number;
}) {
  const pulseAnim = useRef(new Animated.Value(0.7)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    switch (item.type) {
      case 'floating_lantern':
        animations.push(
          Animated.loop(Animated.sequence([
            Animated.timing(floatAnim, { toValue: -6, duration: 2000, useNativeDriver: true }),
            Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ])),
          Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 0.75, duration: 1200, useNativeDriver: true }),
          ]))
        );
        break;

      case 'glowing_tree':
        animations.push(
          Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
          ])),
          Animated.loop(Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.08, duration: 2500, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1.0, duration: 2500, useNativeDriver: true }),
          ]))
        );
        break;

      case 'radiant_fountain':
        // Gentle base glow — water spout handled by FountainDroplets overlay
        animations.push(
          Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
          ]))
        );
        break;

      case 'light_arch':
        animations.push(
          Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 0.65, duration: 3000, useNativeDriver: true }),
          ])),
          Animated.loop(Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.05, duration: 3500, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1.0, duration: 3500, useNativeDriver: true }),
          ]))
        );
        break;
    }

    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, [pulseAnim, floatAnim, scaleAnim, item.type]);

  const left = (item.position.x + center) * tileSize;
  const top = (item.position.y + centerRow) * tileSize;

  return (
    <>
      <Animated.View
        style={[styles.illustriousGlow, {
          left, top,
          width: tileSize,
          height: tileSize,
          opacity: pulseAnim,
          transform: [
            { translateY: floatAnim },
            { scale: scaleAnim },
          ],
        }]}
        importantForAccessibility="no"
      >
        <Image source={ILLUSTRIOUS_SPRITES[item.type]} style={{ width: tileSize, height: tileSize }} />
      </Animated.View>
      {item.type === 'radiant_fountain' && (
        <FountainDroplets left={left} top={top} tileSize={tileSize} />
      )}
    </>
  );
}

/**
 * Animated water droplets that spout upward from the fountain centre
 * and arc outward, creating the illusion of flowing water.
 */
const DROPLET_COUNT = 6;

function FountainDroplets({ left, top, tileSize }: {
  left: number; top: number; tileSize: number;
}) {
  const droplets = useRef(
    Array.from({ length: DROPLET_COUNT }, () => ({
      progress: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animations = droplets.map((d, i) => {
      // Stagger each droplet so they don't all fire together
      const delay = i * (1200 / DROPLET_COUNT);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d.progress, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(d.progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, [droplets]);

  const dropletSize = Math.max(2, Math.round(tileSize * 0.08));
  const centreX = tileSize / 2 - dropletSize / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left, top,
        width: tileSize,
        height: tileSize,
      }}
      pointerEvents="none"
    >
      {droplets.map((d, i) => {
        // Each droplet arcs in a slightly different direction
        const spreadAngle = ((i / DROPLET_COUNT) * Math.PI * 0.8) + Math.PI * 0.1;
        const arcX = Math.cos(spreadAngle) * tileSize * 0.35;
        const peakY = -tileSize * 0.45;

        // Parabolic arc: translateX goes 0 → arcX, translateY goes 0 → peakY → 0
        const translateX = d.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, arcX * 0.6, arcX],
        });
        const translateY = d.progress.interpolate({
          inputRange: [0, 0.35, 0.7, 1],
          outputRange: [0, peakY, peakY * 0.3, tileSize * 0.05],
        });
        const opacity = d.progress.interpolate({
          inputRange: [0, 0.15, 0.7, 1],
          outputRange: [0, 0.9, 0.7, 0],
        });

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: centreX,
              top: tileSize * 0.35,
              width: dropletSize,
              height: dropletSize,
              borderRadius: dropletSize / 2,
              backgroundColor: '#7BC0F5',
              opacity,
              transform: [{ translateX }, { translateY }],
            }}
          />
        );
      })}
    </View>
  );
}

// ============================================================
// Qur'an Glowing Flowers
// ============================================================

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

// Seeded PRNG for deterministic but random-looking placement
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function randomPosition(rng: () => number, occupied: Set<string>, cols: number, rows: number): Position {
  const halfX = Math.floor(cols / 2) - 1;
  const halfY = Math.floor(rows / 2) - 1;
  for (let attempt = 0; attempt < 300; attempt++) {
    const x = Math.floor(rng() * (halfX * 2 + 1)) - halfX;
    const y = Math.floor(rng() * (halfY * 2 + 1)) - halfY;
    const key = `${x},${y}`;
    if (!occupied.has(key)) {
      occupied.add(key);
      return { x, y };
    }
  }
  // Fallback: linear scan
  for (let x = -halfX; x <= halfX; x++) {
    for (let y = -halfY; y <= halfY; y++) {
      if (!occupied.has(`${x},${y}`)) {
        occupied.add(`${x},${y}`);
        return { x, y };
      }
    }
  }
  return { x: 0, y: 0 };
}

/**
 * Find a position adjacent to existing cluster members (street pattern).
 * Tries cardinal neighbours at increasing distance, then falls back to random.
 */
function findClusteredPosition(
  clusterPositions: Position[],
  occupied: Set<string>,
  cols: number,
  rows: number
): Position {
  const directions = [
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
  ];
  const halfX = Math.floor(cols / 2) - 1;
  const halfY = Math.floor(rows / 2) - 1;

  for (let dist = 1; dist <= 3; dist++) {
    for (const pos of clusterPositions) {
      for (const dir of directions) {
        const x = pos.x + dir.dx * dist;
        const y = pos.y + dir.dy * dist;
        const key = `${x},${y}`;
        if (!occupied.has(key) && Math.abs(x) <= halfX && Math.abs(y) <= halfY) {
          occupied.add(key);
          return { x, y };
        }
      }
    }
  }

  // Fallback: ring around cluster centroid
  const cx = Math.round(clusterPositions.reduce((s, p) => s + p.x, 0) / clusterPositions.length);
  const cy = Math.round(clusterPositions.reduce((s, p) => s + p.y, 0) / clusterPositions.length);
  for (let r = 2; r < 10; r++) {
    for (let angle = 0; angle < 8; angle++) {
      const x = cx + Math.round(r * Math.cos((angle * Math.PI) / 4));
      const y = cy + Math.round(r * Math.sin((angle * Math.PI) / 4));
      const key = `${x},${y}`;
      if (!occupied.has(key) && Math.abs(x) <= halfX && Math.abs(y) <= halfY) {
        occupied.add(key);
        return { x, y };
      }
    }
  }

  return { x: cx + 1, y: cy };
}

/**
 * Group positions into clusters based on Manhattan distance proximity (≤ 4).
 */
function groupPositionsIntoClusters(positions: Position[]): Position[][] {
  const clusters: Position[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < positions.length; i++) {
    if (assigned.has(i)) continue;
    const cluster: Position[] = [positions[i]];
    assigned.add(i);

    const queue = [positions[i]];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (let j = 0; j < positions.length; j++) {
        if (assigned.has(j)) continue;
        const dist = Math.abs(positions[j].x - current.x) + Math.abs(positions[j].y - current.y);
        if (dist <= 4) {
          cluster.push(positions[j]);
          assigned.add(j);
          queue.push(positions[j]);
        }
      }
    }
    clusters.push(cluster);
  }

  return clusters;
}

function buildSimulatedWorld(level: 'days' | 'months' | 'years', cols: number, rows: number): WorldState {
  const now = Date.now();
  const rng = seededRng(12345);
  const gridSize = GAME_CONFIG.map.initialGridSize;
  const occupied = new Set<string>();
  occupied.add('0,0');

  const treeCounts = { days: 3, months: 20, years: 120 };
  const treeCount = treeCounts[level];

  // Helper: compute target count from config thresholds
  const countFor = (threshold: number, repeatEvery: number) =>
    treeCount < threshold ? 0 : 1 + Math.floor((treeCount - threshold) / repeatEvery);

  const stages: TreeStage[] = ['sapling', 'young', 'mature'];
  const trees: Tree[] = Array.from({ length: treeCount }, (_, i) => ({
    id: `sim_tree_${i}`,
    stage: stages[Math.min(Math.floor(i / Math.max(1, Math.ceil(treeCount / 3))), 2)],
    position: randomPosition(rng, occupied, cols, rows),
    createdAt: now,
    lastUpdated: now,
  }));

  const flowerCounts = { days: 0, months: 5, years: 12 };
  const flowers: Flower[] = Array.from({ length: flowerCounts[level] }, (_, i) => ({
    id: `sim_flower_${i}`,
    position: randomPosition(rng, occupied, cols, rows),
    type: 'basic' as const,
  }));

  const bc = GAME_CONFIG.world.buildings;
  const buildingList: { type: Building['type']; count: number }[] = [
    { type: 'home', count: countFor(bc.home.threshold, bc.home.repeatEvery) },
    { type: 'mansion', count: countFor(bc.mansion.threshold, bc.mansion.repeatEvery) },
    { type: 'palace', count: countFor(bc.palace.threshold, bc.palace.repeatEvery) },
  ];
  // Place buildings with same-type clustering and cluster size limits
  const buildings: Building[] = [];
  const clusterLimits: Record<string, number> = {}; // track current cluster limit per type
  for (const { type, count } of buildingList) {
    const cfg = bc[type as keyof typeof bc];
    // Set initial cluster limit
    if (!clusterLimits[type]) {
      clusterLimits[type] = cfg.clusterSize.min +
        Math.floor(rng() * (cfg.clusterSize.max - cfg.clusterSize.min + 1));
    }
    for (let i = 0; i < count; i++) {
      const sameType = buildings.filter((b) => b.type === type);
      let position: Position;
      if (sameType.length > 0) {
        // Group into clusters by proximity
        const clusters = groupPositionsIntoClusters(sameType.map((b) => b.position));
        const latestCluster = clusters[clusters.length - 1];
        if (latestCluster.length >= clusterLimits[type]) {
          // Start a new cluster elsewhere
          position = randomPosition(rng, occupied, cols, rows);
          // Roll a new random limit for the next cluster
          clusterLimits[type] = cfg.clusterSize.min +
            Math.floor(rng() * (cfg.clusterSize.max - cfg.clusterSize.min + 1));
        } else {
          position = findClusteredPosition(latestCluster, occupied, cols, rows);
        }
      } else {
        position = randomPosition(rng, occupied, cols, rows);
      }
      buildings.push({ id: `sim_bld_${type}_${i}`, type, position, createdAt: now });
    }
  }

  const ac = GAME_CONFIG.world.animals;
  const animalList: { type: Animal['type']; count: number }[] = [
    { type: 'bird', count: countFor(ac.birds.threshold, ac.birds.repeatEvery) },
    { type: 'rabbit', count: countFor(ac.rabbits.threshold, ac.rabbits.repeatEvery) },
    { type: 'squirrel', count: countFor(ac.squirrels.threshold, ac.squirrels.repeatEvery) },
    { type: 'deer', count: countFor(ac.deer.threshold, ac.deer.repeatEvery) },
  ];
  const animals: Animal[] = animalList.flatMap(({ type, count }) =>
    Array.from({ length: count }, (_, i) => ({
      id: `sim_animal_${type}_${i}`,
      type,
      position: randomPosition(rng, occupied, cols, rows),
      createdAt: now,
    }))
  );

  // Generate rivers using seeded random walk
  const rc = GAME_CONFIG.world.rivers;
  const riverCount = countFor(rc.threshold, rc.repeatEvery);
  const rivers: River[] = [];
  const halfGrid = Math.floor(cols / 2) - 1;
  const directions = [
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
  ];

  for (let ri = 0; ri < riverCount; ri++) {
    const extraLen = Math.floor(Math.max(0, treeCount - rc.threshold) * rc.lengthGrowth);
    const targetLen = Math.min(
      rc.length.min + Math.floor(rng() * (rc.length.max - rc.length.min + 1)) + extraLen,
      rc.maxLength
    );

    // Find a start on the edge
    let start: Position | null = null;
    for (let attempt = 0; attempt < 50; attempt++) {
      const edge = Math.floor(rng() * 4);
      const pos = Math.floor(rng() * (halfGrid * 2 + 1)) - halfGrid;
      const candidate: Position = edge === 0 ? { x: pos, y: -halfGrid }
        : edge === 1 ? { x: pos, y: halfGrid }
        : edge === 2 ? { x: -halfGrid, y: pos }
        : { x: halfGrid, y: pos };
      if (!occupied.has(`${candidate.x},${candidate.y}`)) {
        start = candidate;
        break;
      }
    }
    if (!start) continue;

    // Walk the path with snake constraint
    const path: Position[] = [start];
    const pathSet = new Set<string>([`${start.x},${start.y}`]);

    for (let step = 1; step < targetLen; step++) {
      const current = path[path.length - 1];
      const shuffled = [...directions].sort(() => rng() - 0.5);
      let moved = false;
      for (const dir of shuffled) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const key = `${nx},${ny}`;
        if (Math.abs(nx) > halfGrid || Math.abs(ny) > halfGrid) continue;
        if (occupied.has(key) || pathSet.has(key)) continue;
        // Snake constraint: check no cardinal adjacency to non-consecutive path tiles
        let violation = false;
        for (const d of directions) {
          const ax = nx + d.dx;
          const ay = ny + d.dy;
          for (let pi = 0; pi < path.length - 1; pi++) {
            if (path[pi].x === ax && path[pi].y === ay) {
              violation = true;
              break;
            }
          }
          if (violation) break;
        }
        if (violation) continue;
        path.push({ x: nx, y: ny });
        pathSet.add(key);
        moved = true;
        break;
      }
      if (!moved) break;
    }

    if (path.length >= 3) {
      path.forEach(p => occupied.add(`${p.x},${p.y}`));
      rivers.push({ id: `sim_river_${ri}`, tiles: path, createdAt: now });
    }
  }

  const illustriousPresets = {
    days: [] as string[],
    months: ['radiant_fountain'],
    years: ['radiant_fountain', 'glowing_tree', 'floating_lantern', 'light_arch'],
  };
  const illustriousItems: IllustriousItem[] = illustriousPresets[level].map((type, i) => ({
    id: `sim_illus_${i}`,
    type: type as IllustriousItemType,
    position: randomPosition(rng, occupied, cols, rows),
    createdAt: now,
    streakDays: (i + 1) * 30,
  }));

  return {
    trees, flowers, buildings, animals, rivers, illustriousItems,
    mapSize: { width: gridSize, height: gridSize },
    gridSize,
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

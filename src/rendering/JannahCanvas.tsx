/**
 * JannahCanvas
 *
 * Renders the world as a static grid that always fills the viewport.
 * Tile size is computed dynamically: screenSize / gridSize.
 * As the world grows, tiles shrink to fit more content.
 * No panning or zooming needed.
 */

import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { WorldState, Tree, Flower, Building, Animal, IllustriousItem } from '../types/models';
import { Season, GAME_CONFIG } from '../config/game.config';
import { COLORS } from '../config/colors';
import { TREE_SPRITES, FLOWER_SPRITES, BUILDING_SPRITES, ANIMAL_SPRITES, ILLUSTRIOUS_SPRITES, LANDMARK_SPRITES } from './sprites';

interface JannahCanvasProps {
  worldState: WorldState;
  screenWidth: number;
  screenHeight: number;
}

export function JannahCanvas({ worldState, screenWidth, screenHeight }: JannahCanvasProps) {
  const season = worldState.season;
  const gridSize = worldState.gridSize ?? GAME_CONFIG.map.initialGridSize;

  // Tile size: fit gridSize tiles along the shorter screen axis
  const tileSize = Math.max(
    GAME_CONFIG.map.minTileSize,
    Math.floor(Math.min(screenWidth, screenHeight) / gridSize),
  );

  // Columns and rows fill the entire screen (rectangular grid)
  const cols = Math.ceil(screenWidth / tileSize);
  const rows = Math.ceil(screenHeight / tileSize);

  // Center of the grid in tile coordinates
  const centerCol = Math.floor(cols / 2);
  const centerRow = Math.floor(rows / 2);

  console.log('[JannahCanvas] Rendering:', {
    season, gridSize, tileSize, cols, rows,
    grassLight: COLORS.grassBySeason[season],
    grassDark: COLORS.grassDarkBySeason[season],
    totalTiles: cols * rows,
    screenWidth, screenHeight,
  });

  // Grass tiles — colored Views with subtle checkerboard for texture
  const grassTiles = useMemo(() => {
    const tiles: React.ReactElement[] = [];
    const light = COLORS.grassBySeason[season];
    const dark = COLORS.grassDarkBySeason[season];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        tiles.push(
          <View
            key={`g${row}_${col}`}
            style={{
              position: 'absolute',
              left: col * tileSize,
              top: row * tileSize,
              width: tileSize,
              height: tileSize,
              backgroundColor: (row + col) % 2 === 0 ? light : dark,
            }}
          />,
        );
      }
    }
    return tiles;
  }, [season, rows, cols, tileSize]);

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
    <View style={{ flex: 1, backgroundColor: COLORS.grassBySeason[season] }}>
      {/* Grass tile Views for checkerboard texture */}
      {grassTiles}

      {gridLines}

      {/* Signboard at center */}
      <View style={[styles.signboardContainer, {
        left: centerCol * tileSize - tileSize * 0.25,
        top: centerRow * tileSize - tileSize * 0.5,
        width: tileSize * 1.5,
      }]}>
        <Image
          source={LANDMARK_SPRITES.signboard}
          style={{ width: tileSize * 1.5, height: tileSize * 1.5 }}
        />
        <Text style={[styles.signboardText, { fontSize: Math.max(6, tileSize * 0.3) }]}>
          Your Garden
        </Text>
      </View>

      {/* Flowers */}
      {worldState.flowers.map((f) => (
        <FlowerSprite key={f.id} flower={f} center={centerCol} centerRow={centerRow} tileSize={tileSize} />
      ))}

      {/* Buildings */}
      {worldState.buildings.map((b) => (
        <BuildingSprite key={b.id} building={b} center={centerCol} centerRow={centerRow} tileSize={tileSize} />
      ))}

      {/* Trees */}
      {worldState.trees.map((t) => (
        <TreeSprite key={t.id} tree={t} season={season} center={centerCol} centerRow={centerRow} tileSize={tileSize} />
      ))}

      {/* Animals */}
      {worldState.animals.map((a) => (
        <AnimalSprite key={a.id} animal={a} center={centerCol} centerRow={centerRow} tileSize={tileSize} />
      ))}

      {/* Illustrious items */}
      {worldState.illustriousItems.map((i) => (
        <IllustriousSprite key={i.id} item={i} center={centerCol} centerRow={centerRow} tileSize={tileSize} />
      ))}
    </View>
  );
}

// ============================================================
// Trees
// ============================================================

function TreeSprite({ tree, season, center, centerRow, tileSize }: {
  tree: Tree; season: Season; center: number; centerRow: number; tileSize: number;
}) {
  return (
    <Image
      source={TREE_SPRITES[tree.stage][season]}
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
  const size = tileSize * 0.5;
  return (
    <Image
      source={flower.type === 'enhanced' ? FLOWER_SPRITES.enhanced : FLOWER_SPRITES.basic}
      style={{
        position: 'absolute',
        left: (flower.position.x + center) * tileSize + tileSize * 0.25,
        top: (flower.position.y + centerRow) * tileSize + tileSize * 0.25,
        width: size,
        height: size,
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
  const size = tileSize * 2;
  return (
    <Image
      source={BUILDING_SPRITES[building.type]}
      style={{
        position: 'absolute',
        left: (building.position.x + center) * tileSize - tileSize * 0.5,
        top: (building.position.y + centerRow) * tileSize - tileSize,
        width: size,
        height: size,
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
  const size = tileSize * 0.75;
  return (
    <Image
      source={ANIMAL_SPRITES[animal.type]}
      style={{
        position: 'absolute',
        left: (animal.position.x + center) * tileSize + tileSize * 0.125,
        top: (animal.position.y + centerRow) * tileSize + tileSize * 0.125,
        width: size,
        height: size,
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
  const size = tileSize * 1.5;
  return (
    <View style={[styles.illustriousGlow, {
      left: (item.position.x + center) * tileSize - tileSize * 0.25,
      top: (item.position.y + centerRow) * tileSize - tileSize * 0.25,
      width: size,
      height: size,
    }]}>
      <Image source={ILLUSTRIOUS_SPRITES[item.type]} style={{ width: size, height: size }} />
    </View>
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
  signboardText: {
    color: '#5C3D0E',
    fontWeight: '600',
    marginTop: 2,
  },
});

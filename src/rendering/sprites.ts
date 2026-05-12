/**
 * Sprite Manifest
 *
 * Central registry of all sprite assets.
 * Uses require() for React Native static asset resolution.
 *
 * Replace placeholder PNGs with real pixel art — no code changes needed.
 */

import { TreeStage } from '../config/game.config';

// --- Tiles ---

export const TILE_SPRITES = {
  grass: [
    require('../../assets/sprites/tiles/grass_summer.png'),
    require('../../assets/sprites/tiles/grass_v2.png'),
    require('../../assets/sprites/tiles/grass_v3.png'),
    require('../../assets/sprites/tiles/grass_v4.png'),
    require('../../assets/sprites/tiles/grass_v5.png'),
    require('../../assets/sprites/tiles/grass_v6.png'),
  ],
  path: require('../../assets/sprites/tiles/path.png'),
  water: require('../../assets/sprites/tiles/water.png'),
  dirt: require('../../assets/sprites/tiles/dirt.png'),
  fence_vertical: require('../../assets/sprites/tiles/fence_vertical.png'),
  fence_horizontal: require('../../assets/sprites/tiles/fence_horizontal.png'),
  fence_corner: require('../../assets/sprites/tiles/fence_corner.png'),
};

// --- Trees ---

export const TREE_SPRITES: Record<TreeStage, number> = {
  sapling: require('../../assets/sprites/trees/sapling_summer.png'),
  young: require('../../assets/sprites/trees/young_summer.png'),
  mature: require('../../assets/sprites/trees/mature_summer.png'),
};

// --- Flowers ---

export const FLOWER_SPRITES = {
  basic: require('../../assets/sprites/flowers/basic.png'),
  enhanced: require('../../assets/sprites/flowers/enhanced.png'),
};

// --- Buildings ---

export const BUILDING_SPRITES = {
  home: require('../../assets/sprites/buildings/home.png'),
  mansion: require('../../assets/sprites/buildings/mansion.png'),
  palace: require('../../assets/sprites/buildings/palace.png'),
};

// --- Animals ---

export const ANIMAL_SPRITES = {
  bird: require('../../assets/sprites/animals/bird.png'),
  rabbit: require('../../assets/sprites/animals/rabbit.png'),
  deer: require('../../assets/sprites/animals/deer.png'),
  squirrel: require('../../assets/sprites/animals/squirrel.png'),
};

// --- Illustrious Items ---

export const ILLUSTRIOUS_SPRITES = {
  radiant_fountain: require('../../assets/sprites/illustrious/radiant_fountain.png'),
  glowing_tree: require('../../assets/sprites/illustrious/glowing_tree.png'),
  floating_lantern: require('../../assets/sprites/illustrious/floating_lantern.png'),
  light_arch: require('../../assets/sprites/illustrious/light_arch.png'),
};

// --- Landmarks ---

export const LANDMARK_SPRITES = {
  signboard: require('../../assets/sprites/landmarks/signboard.png'),
};

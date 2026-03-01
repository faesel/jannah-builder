/**
 * Sprite Manifest
 *
 * Central registry of all sprite assets, organised by category and season.
 * Uses require() for React Native static asset resolution.
 *
 * Replace placeholder PNGs with real pixel art — no code changes needed.
 */

import { Season, TreeStage } from '../config/game.config';

// --- Tiles ---

export const TILE_SPRITES = {
  grass: {
    spring: require('../../assets/sprites/tiles/grass_spring.png'),
    summer: require('../../assets/sprites/tiles/grass_summer.png'),
    autumn: require('../../assets/sprites/tiles/grass_autumn.png'),
    winter: require('../../assets/sprites/tiles/grass_winter.png'),
  } as Record<Season, number>,
  path: require('../../assets/sprites/tiles/path.png'),
  water: require('../../assets/sprites/tiles/water.png'),
  dirt: require('../../assets/sprites/tiles/dirt.png'),
};

// --- Trees ---

export const TREE_SPRITES: Record<TreeStage, Record<Season, number>> = {
  sapling: {
    spring: require('../../assets/sprites/trees/sapling_spring.png'),
    summer: require('../../assets/sprites/trees/sapling_summer.png'),
    autumn: require('../../assets/sprites/trees/sapling_autumn.png'),
    winter: require('../../assets/sprites/trees/sapling_winter.png'),
  },
  young: {
    spring: require('../../assets/sprites/trees/young_spring.png'),
    summer: require('../../assets/sprites/trees/young_summer.png'),
    autumn: require('../../assets/sprites/trees/young_autumn.png'),
    winter: require('../../assets/sprites/trees/young_winter.png'),
  },
  mature: {
    spring: require('../../assets/sprites/trees/mature_spring.png'),
    summer: require('../../assets/sprites/trees/mature_summer.png'),
    autumn: require('../../assets/sprites/trees/mature_autumn.png'),
    winter: require('../../assets/sprites/trees/mature_winter.png'),
  },
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

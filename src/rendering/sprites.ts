/**
 * Sprite Manifest
 *
 * Central registry of all sprite assets.
 * Uses require() for React Native static asset resolution.
 *
 * Replace placeholder PNGs with real pixel art — no code changes needed.
 */

import { TreeStage, FlowerVariety } from '../config/game.config';

// --- Tiles ---

export const TILE_SPRITES = {
  grass: [
    require('../../assets/sprites/tiles/grass_v1.png'),
    require('../../assets/sprites/tiles/grass_v2.png'),
    require('../../assets/sprites/tiles/grass_v3.png'),
    require('../../assets/sprites/tiles/grass_v4.png'),
    require('../../assets/sprites/tiles/grass_v5.png'),
    require('../../assets/sprites/tiles/grass_v6.png'),
    require('../../assets/sprites/tiles/grass_clear.png'),
  ],
  path: require('../../assets/sprites/tiles/path.png'),
  water: [
    require('../../assets/sprites/tiles/water_v1.png'),
    require('../../assets/sprites/tiles/water_v2.png'),
    require('../../assets/sprites/tiles/water_v3.png'),
    require('../../assets/sprites/tiles/water_v4.png'),
  ],
  dirt: require('../../assets/sprites/tiles/dirt.png'),
  sand: require('../../assets/sprites/tiles/sand.png'),
  sandCorners: {
    topLeft: require('../../assets/sprites/tiles/sand_corner_top_left.png'),
    topRight: require('../../assets/sprites/tiles/sand_corner_top_right.png'),
    bottomLeft: require('../../assets/sprites/tiles/sand_corner_bottom_left.png'),
    bottomRight: require('../../assets/sprites/tiles/sand_corner_bottom_right.png'),
  },
};

// --- Rocks & Stones (decorative, scattered randomly on map) ---

export const ROCK_SPRITES = [
  require('../../assets/sprites/rocks/stone_grey_1.png'),
  require('../../assets/sprites/rocks/stone_grey_2.png'),
  require('../../assets/sprites/rocks/stone_grey_3.png'),
  require('../../assets/sprites/rocks/stone_grey_4.png'),
  require('../../assets/sprites/rocks/stone_grey_5.png'),
  require('../../assets/sprites/rocks/stone_grey_6.png'),
];

export const STUMP_SPRITES = [
  require('../../assets/sprites/bushes/stump_1.png'),
  require('../../assets/sprites/bushes/stump_2.png'),
  require('../../assets/sprites/bushes/stump_3.png'),
  require('../../assets/sprites/bushes/stump_4.png'),
  require('../../assets/sprites/bushes/stump_5.png'),
];

// --- Mushrooms (scattered on a new world, cleared by logging Qur'an) ---

export const MUSHROOM_SPRITES: Record<'red' | 'blue', number[]> = {
  red: [
    require('../../assets/sprites/mushrooms/mushroom_red_stage_1.png'),
    require('../../assets/sprites/mushrooms/mushroom_red_stage_2.png'),
    require('../../assets/sprites/mushrooms/mushroom_red_stage_3.png'),
  ],
  blue: [
    require('../../assets/sprites/mushrooms/mushroom_blue_stage_1.png'),
    require('../../assets/sprites/mushrooms/mushroom_blue_stage_2.png'),
    require('../../assets/sprites/mushrooms/mushroom_blue_stage_3.png'),
  ],
};

// --- Water decorations (reeds & rocks on top of river tiles) ---

export const WATER_REED_SPRITES = [
  require('../../assets/sprites/water/reed_1.png'),
  require('../../assets/sprites/water/reed_2.png'),
  require('../../assets/sprites/water/water_plant_1.png'),
  require('../../assets/sprites/water/water_plant_2.png'),
  require('../../assets/sprites/water/water_plant_3.png'),
  require('../../assets/sprites/water/water_plant_4.png'),
];

export const WATER_ROCK_SPRITES = [
  require('../../assets/sprites/water/rocks/rock_3.png'),
  require('../../assets/sprites/water/rocks/rock_4.png'),
  require('../../assets/sprites/water/rocks/rock_5.png'),
  require('../../assets/sprites/water/rocks/rock_6.png'),
  require('../../assets/sprites/water/rocks/rock_7.png'),
  require('../../assets/sprites/water/rocks/rock_9.png'),
  require('../../assets/sprites/water/rocks/rock_10.png'),
];

// --- Trees ---

export const TREE_SPRITES: Record<TreeStage, number> = {
  sapling: require('../../assets/sprites/trees/sapling.png'),
  young: require('../../assets/sprites/trees/young.png'),
  mature: require('../../assets/sprites/trees/mature.png'),
};

// --- Flowers ---

export const FLOWER_SPRITES = {
  basic: require('../../assets/sprites/flowers/basic.png'),
  enhanced: require('../../assets/sprites/flowers/enhanced.png'),
  bush: require('../../assets/sprites/flowers/bush.png'),
};

/**
 * Multi-stage flower sprites, keyed by variety.
 * Each array is ordered by growth stage: index 0 = stage 1, index 1 = stage 2, …
 * Stage counts mirror GAME_CONFIG.world.flowers.stages.
 */
export const FLOWER_VARIETY_SPRITES: Record<FlowerVariety, number[]> = {
  pink: [
    require('../../assets/sprites/flowers/flower_pink_stage_1.png'),
    require('../../assets/sprites/flowers/flower_pink_stage_2.png'),
    require('../../assets/sprites/flowers/flower_pink_stage_3.png'),
    require('../../assets/sprites/flowers/flower_pink_stage_4.png'),
  ],
  leaf: [
    require('../../assets/sprites/flowers/flower_leaf_stage_1.png'),
    require('../../assets/sprites/flowers/flower_leaf_stage_2.png'),
    require('../../assets/sprites/flowers/flower_leaf_stage_3.png'),
    require('../../assets/sprites/flowers/flower_leaf_stage_4.png'),
  ],
  purple: [
    require('../../assets/sprites/flowers/flower_purple_stage_1.png'),
    require('../../assets/sprites/flowers/flower_purple_stage_2.png'),
    require('../../assets/sprites/flowers/flower_purple_stage_3.png'),
  ],
  red: [
    require('../../assets/sprites/flowers/flower_red_stage_1.png'),
    require('../../assets/sprites/flowers/flower_red_stage_2.png'),
    require('../../assets/sprites/flowers/flower_red_stage_3.png'),
  ],
  teal: [
    require('../../assets/sprites/flowers/flower_teal_stage_1.png'),
    require('../../assets/sprites/flowers/flower_teal_stage_2.png'),
    require('../../assets/sprites/flowers/flower_teal_stage_3.png'),
    require('../../assets/sprites/flowers/flower_teal_stage_4.png'),
  ],
  dark: [
    require('../../assets/sprites/flowers/flower_dark_stage_1.png'),
    require('../../assets/sprites/flowers/flower_dark_stage_2.png'),
    require('../../assets/sprites/flowers/flower_dark_stage_3.png'),
    require('../../assets/sprites/flowers/flower_dark_stage_4.png'),
  ],
  wild: [
    require('../../assets/sprites/flowers/flower_wild_stage_1.png'),
    require('../../assets/sprites/flowers/flower_wild_stage_2.png'),
    require('../../assets/sprites/flowers/flower_wild_stage_3.png'),
    require('../../assets/sprites/flowers/flower_wild_stage_4.png'),
  ],
};

/**
 * Resolve the correct sprite for a flower's variety and stage.
 * Stage is 1-indexed; clamps to the available range and falls back to the
 * basic flower sprite if a variety has no dedicated art.
 */
export function getFlowerSprite(variety: FlowerVariety, stage: number): number {
  const stages = FLOWER_VARIETY_SPRITES[variety];
  if (!stages || stages.length === 0) return FLOWER_SPRITES.basic;
  const index = Math.min(Math.max(stage, 1), stages.length) - 1;
  return stages[index];
}

// --- Buildings ---

export const BUILDING_SPRITES = {
  home: require('../../assets/sprites/buildings/home.png'),
  mansion: require('../../assets/sprites/buildings/mansion.png'),
  palace: require('../../assets/sprites/buildings/palace.png'),
};

export const BUILDING_SIZES: Record<string, { tilesWide: number; tilesTall: number }> = {
  home: { tilesWide: 2, tilesTall: 3 },
  mansion: { tilesWide: 3, tilesTall: 3 },
  palace: { tilesWide: 4, tilesTall: 5 },
};

// --- Animals ---

export const ANIMAL_SPRITES = {
  bird: require('../../assets/sprites/animals/bird.png'),
  rabbit: require('../../assets/sprites/animals/rabbit.png'),
  deer: require('../../assets/sprites/animals/deer.png'),
  squirrel: require('../../assets/sprites/animals/squirrel.png'),
  black_cat: require('../../assets/sprites/animals/black_cat.png'),
};

export type AnimalDirection = 'up' | 'down' | 'left' | 'right';

export const ANIMAL_FEED_SPRITES: Record<string, [number, number, number]> = {
  bird: [
    require('../../assets/sprites/animals/bird_feed1.png'),
    require('../../assets/sprites/animals/bird_feed2.png'),
    require('../../assets/sprites/animals/bird_feed3.png'),
  ],
  rabbit: [
    require('../../assets/sprites/animals/rabbit_feed1.png'),
    require('../../assets/sprites/animals/rabbit_feed2.png'),
    require('../../assets/sprites/animals/rabbit_feed3.png'),
  ],
  deer: [
    require('../../assets/sprites/animals/deer_feed1.png'),
    require('../../assets/sprites/animals/deer_feed2.png'),
    require('../../assets/sprites/animals/deer_feed3.png'),
  ],
  squirrel: [
    require('../../assets/sprites/animals/squirrel_feed1.png'),
    require('../../assets/sprites/animals/squirrel_feed2.png'),
    require('../../assets/sprites/animals/squirrel_feed3.png'),
  ],
  black_cat: [
    require('../../assets/sprites/animals/black_cat_feed1.png'),
    require('../../assets/sprites/animals/black_cat_feed2.png'),
    require('../../assets/sprites/animals/black_cat_feed3.png'),
  ],
};

export const ANIMAL_MOVE_SPRITES: Record<string, Record<AnimalDirection, number>> = {
  bird: {
    up: require('../../assets/sprites/animals/bird_up.png'),
    down: require('../../assets/sprites/animals/bird_down.png'),
    left: require('../../assets/sprites/animals/bird_left.png'),
    right: require('../../assets/sprites/animals/bird_right.png'),
  },
  rabbit: {
    up: require('../../assets/sprites/animals/rabbit_up.png'),
    down: require('../../assets/sprites/animals/rabbit_down.png'),
    left: require('../../assets/sprites/animals/rabbit_left.png'),
    right: require('../../assets/sprites/animals/rabbit_right.png'),
  },
  deer: {
    up: require('../../assets/sprites/animals/deer_up.png'),
    down: require('../../assets/sprites/animals/deer_down.png'),
    left: require('../../assets/sprites/animals/deer_left.png'),
    right: require('../../assets/sprites/animals/deer_right.png'),
  },
  squirrel: {
    up: require('../../assets/sprites/animals/squirrel_up.png'),
    down: require('../../assets/sprites/animals/squirrel_down.png'),
    left: require('../../assets/sprites/animals/squirrel_left.png'),
    right: require('../../assets/sprites/animals/squirrel_right.png'),
  },
  black_cat: {
    up: require('../../assets/sprites/animals/black_cat_up.png'),
    down: require('../../assets/sprites/animals/black_cat_down.png'),
    left: require('../../assets/sprites/animals/black_cat_left.png'),
    right: require('../../assets/sprites/animals/black_cat_right.png'),
  },
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

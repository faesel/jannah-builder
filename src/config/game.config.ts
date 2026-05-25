/**
 * Game Configuration
 * 
 * All game mechanics rules and thresholds are defined here.
 * This ensures all values are configuration-driven and easily testable.
 */

const DEBUG_LOW_ILLUSTRIOUS = false;

export const GAME_CONFIG = {
  // Prayer mechanics
  prayers: {
    dailyPrayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const,
    totalDailyPrayers: 5,
  },

  // Tree growth mechanics
  trees: {
    daysForNewTree: 3, // Consecutive full days needed to generate one tree
    growthStages: ['sapling', 'young', 'mature'] as const,
    firstDaySeedling: true, // Plant a sapling on the user's very first complete day
  },

  // Decay mechanics
  decay: {
    buildings: {
      enabled: true,
    },
    animals: {
      enabled: true,
    },
  },

  // Illustrious items (streak-based)
  illustriousItems: {
    enabled: true,
    types: [
      'radiant_fountain',
      'glowing_tree',
      'floating_lantern',
      'light_arch',
    ] as const,
    streakThresholds: {
      radiant_fountain: DEBUG_LOW_ILLUSTRIOUS ? 1 : 30,
      glowing_tree: DEBUG_LOW_ILLUSTRIOUS ? 2 : 60,
      floating_lantern: DEBUG_LOW_ILLUSTRIOUS ? 3 : 90,
      light_arch: DEBUG_LOW_ILLUSTRIOUS ? 4 : 120,
    },
  },

  // World elements
  world: {
    flowers: {
      baseThreshold: 4, // Trees needed before flowers appear
      repeatEvery: 2, // One additional flower per 2 trees beyond threshold
      varieties: ['pink', 'leaf', 'purple', 'red', 'teal', 'dark', 'wild'] as const,
      stages: {
        pink: 4,
        leaf: 4,
        purple: 3,
        red: 3,
        teal: 4,
        dark: 4,
        wild: 4,
      },
    },
    dhikrFlowers: {
      spawnChance: 0.05, // 5% chance per dhikr log
      durationDays: 2, // Temporary flowers/bushes last 2 days
      types: ['basic', 'bush'] as const,
    },
    obstacles: {
      initialCount: 40, // Stumps/rocks placed at game start
      types: ['stump', 'rock'] as const,
      stumpVariants: 5,
      rockVariants: 7,
    },
    buildings: {
      home: { threshold: 12, repeatEvery: 10, clusterSize: { min: 3, max: 6 } },
      mansion: { threshold: 35, repeatEvery: 40, clusterSize: { min: 2, max: 4 } },
      palace: { threshold: 70, repeatEvery: 80, clusterSize: { min: 1, max: 2 } },
    },
    animals: {
      birds: { threshold: 5, repeatEvery: 8 },
      rabbits: { threshold: 15, repeatEvery: 15 },
      deer: { threshold: 40, repeatEvery: 30 },
      squirrels: { threshold: 25, repeatEvery: 20 },
      black_cat: { spawnChance: 0.05, durationDays: 2 },
    },
    rivers: {
      threshold: 18, // Trees needed before first river appears
      repeatEvery: 30, // Additional river per N trees beyond threshold
      length: { min: 6, max: 10 }, // Base river length in tiles
      lengthGrowth: 0.1, // Extra tiles per tree above threshold
      maxLength: 25, // Cap on river length
    },
  },

  // Map settings
  map: {
    initialGridSize: 20, // Fixed grid size (no dynamic expansion)
    maxGridSize: 20, // Same as initial — map does not grow
    minTileSize: 16, // Smallest a tile can be (px) — must stay recognisable
    tileSize: 32, // Base reference tile size (used by sprite generation)
    growthInterval: 0, // Disabled — map is fixed size
  },

  // Profile settings
  profiles: {
    maxProfiles: 3,
  },

  // Debug / testing
  debug: {
    showGridLines: false, // Toggle to show tile grid lines on the map
    showAllSprites: false, // Render all sprites in a labelled grid for inspection
    // Populate the map as if you've been using the app for a while.
    // false = off, 'days' = ~1 week, 'months' = ~3 months, 'years' = ~2 years
    simulateProgress: false as false | 'days' | 'months' | 'years',
  },
  effects: {
    quran: {
      ambientLightBoost: 1.3,
      flowerDensity: 1.5,
      treeGlow: true,
      flowerDurationDays: 2, // Glowing flowers persist for this many days
    },
    dhikr: {
      particleCount: 20,
      fireflyDensity: 10,
      windEffect: true,
    },
  },
} as const;

// Type exports for use throughout the app
export type Prayer = (typeof GAME_CONFIG.prayers.dailyPrayers)[number];
export type TreeStage = (typeof GAME_CONFIG.trees.growthStages)[number];
export type IllustriousItemType = (typeof GAME_CONFIG.illustriousItems.types)[number];
export type FlowerVariety = (typeof GAME_CONFIG.world.flowers.varieties)[number];
export type ObstacleType = (typeof GAME_CONFIG.world.obstacles.types)[number];

/**
 * Game Configuration
 * 
 * All game mechanics rules and thresholds are defined here.
 * This ensures all values are configuration-driven and easily testable.
 */

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
    maxTrees: 100, // Reasonable upper limit for performance
  },

  // Decay mechanics
  decay: {
    treesAffectedPerMissedDay: 1, // Only one tree affected at a time
    degradationOrder: ['mature', 'young', 'sapling', 'removed'] as const,
    cascadeDecay: false, // Never cascade across multiple trees
  },

  // Qur'an & Dhikr mechanics
  spiritualPractices: {
    affectTreeGrowth: false, // Never generate trees
    affectDecay: false, // Never cause decay
    visualEffectsOnly: true, // Only enhance visuals
  },

  // Season system
  seasons: {
    types: ['spring', 'summer', 'autumn', 'winter'] as const,
    springDefault: true,
    summerThreshold: 14, // Days of sustained consistency
    autumnThreshold: 3, // Missed days to trigger autumn
    winterThreshold: 7, // Days of long pause
    returnToSpring: true, // Always move back toward spring when praying
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
      radiant_fountain: 30, // 30 consecutive full days
      glowing_tree: 60,
      floating_lantern: 90,
      light_arch: 120,
    },
    fadeOutDuration: 3000, // 3 seconds gentle fade
    showCounters: false, // Never show streak numbers prominently
  },

  // World elements
  world: {
    flowers: {
      baseThreshold: 10, // Trees needed before flowers appear
      quranBoost: 1.5, // Multiplier when logging Qur'an
    },
    buildings: {
      home: { threshold: 30 }, // Trees needed
      mansion: { threshold: 60 },
      palace: { threshold: 100 },
    },
    animals: {
      birds: { threshold: 5 },
      rabbits: { threshold: 15 },
      deer: { threshold: 40 },
      squirrels: { threshold: 25 },
    },
  },

  // Map settings
  map: {
    initialSize: { width: 20, height: 20 }, // Tiles
    expansionRate: 5, // Tiles per expansion
    expansionThreshold: 20, // Trees needed for expansion
    tileSize: 32, // Pixels
  },

  // Profile settings
  profiles: {
    maxProfiles: 3,
    defaultName: 'Profile',
  },

  // Visual effects
  effects: {
    quran: {
      ambientLightBoost: 1.3,
      flowerDensity: 1.5,
      treeGlow: true,
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
export type Season = (typeof GAME_CONFIG.seasons.types)[number];
export type IllustriousItemType = (typeof GAME_CONFIG.illustriousItems.types)[number];

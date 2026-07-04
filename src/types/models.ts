/**
 * Core data model type definitions for Jannah Builder
 */

import { TreeStage, IllustriousItemType, FlowerVariety, ObstacleType } from '../config/game.config';

// ===== Prayer Logging =====

export interface PrayerLog {
  id: string;
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  prayers: {
    Fajr: boolean;
    Dhuhr: boolean;
    Asr: boolean;
    Maghrib: boolean;
    Isha: boolean;
  };
  isComplete: boolean; // All 5 prayers logged
  quranLogged: boolean; // Simple boolean - no tracking
  dhikrLogged: boolean; // Simple boolean - no tracking
  timestamp: number; // Unix timestamp when created
}

// ===== Tree System =====

export interface Tree {
  id: string;
  stage: TreeStage;
  position: Position;
  createdAt: number; // Unix timestamp
  lastUpdated: number; // Unix timestamp
}

export interface Position {
  x: number;
  y: number;
}

// ===== World State =====

/**
 * The half-extent (in tiles, from the centre) within which world elements may
 * be placed. Derived from the device screen so assets spread across the whole
 * visible map rather than clustering in the centre. `halfX`/`halfY` allow the
 * region to be taller than it is wide on portrait screens.
 */
export interface PlacementBounds {
  halfX: number;
  halfY: number;
}

export interface WorldState {
  trees: Tree[];
  flowers: Flower[];
  dhikrFlowers: DhikrFlower[];
  obstacles: Obstacle[];
  mushrooms: Mushroom[];
  buildings: Building[];
  animals: Animal[];
  rivers: River[];
  illustriousItems: IllustriousItem[];
  mapSize: {
    width: number;
    height: number;
  };
  /** Number of tile columns/rows in the grid (square grid) */
  gridSize: number;
  lastUpdated: number;
  /** The last date (YYYY-MM-DD) for which processDay was applied */
  lastProcessedDate?: string;
  /**
   * Screen-derived bounds within which new elements spawn. Persisted so that
   * background day-processing (which has no screen access) spreads spawns
   * across the full map. Absent on older saves — placement falls back to a
   * square default until the Jannah screen records the real screen size.
   */
  placementBounds?: PlacementBounds;
}

export interface Flower {
  id: string;
  position: Position;
  variety: FlowerVariety; // Which flower sprite set (pink, leaf, purple, etc.)
  stage: number; // Current growth stage (1-based, max depends on variety)
  createdAt: number;
}

export interface DhikrFlower {
  id: string;
  position: Position;
  type: 'basic' | 'bush';
  createdAt: number;
}

export interface Obstacle {
  id: string;
  type: ObstacleType; // 'stump' or 'rock'
  variant: number; // Which sprite variant (1-based)
  position: Position;
  createdAt: number;
}

/**
 * Decorative mushrooms scattered across a new world. They are cleared gently,
 * one at a time, as the user logs Qur'an — mirroring how prayers clear rocks —
 * until none remain. They never decay, spread, or return once cleared.
 */
export interface Mushroom {
  id: string;
  color: 'red' | 'blue';
  stage: number; // Which sprite stage (1-based)
  position: Position;
  createdAt: number;
}

export interface Building {
  id: string;
  type: 'home' | 'mansion' | 'palace';
  position: Position;
  createdAt: number;
  condition: 'good' | 'dilapidated';
}

export interface Animal {
  id: string;
  type: 'bird' | 'rabbit' | 'deer' | 'squirrel' | 'black_cat';
  position: Position;
  createdAt: number;
}

export interface River {
  id: string;
  tiles: Position[]; // Ordered sequence of cardinally-connected water tiles
  createdAt: number;
  /** Optional reeds / rocks sitting on top of individual water tiles. */
  decorations?: WaterDecoration[];
}

/** A reed or rock rendered on top of a single river water tile. */
export interface WaterDecoration {
  position: Position;
  type: 'reed' | 'rock';
  variant: number; // Which sprite variant (1-based)
}

export interface IllustriousItem {
  id: string;
  type: IllustriousItemType;
  position: Position;
  createdAt: number;
  streakDays: number; // Days that earned this item
}

// ===== User Profile =====

export interface UserProfile {
  id: string;
  name: string;
  createdAt: number;
  lastActive: number;
  worldState: WorldState;
  prayerLogs: PrayerLog[];
  statistics: Statistics;
  streaks: StreakData;
  /** Per-profile preferences. Optional on older saves — defaults applied on load. */
  settings?: ProfileSettings;
}

/**
 * Per-profile user preferences.
 */
export interface ProfileSettings {
  /**
   * "Rest days" mode. When enabled, missed days no longer cause any decay —
   * trees, buildings, flowers and rivers are left untouched and no obstacles
   * return. Growth simply pauses until worship resumes. A gentle, private way
   * to step back for a while (illness, travel, or any period of rest) without
   * losing progress. No reason is ever asked for or recorded.
   */
  restMode: boolean;
}

export interface Statistics {
  totalPrayersLogged: number;
  totalDaysComplete: number;
  totalTreesGrown: number;
  totalTreesDecayed: number;
  totalBuildingsCreated: number;
  totalBuildingsReturned: number;
  totalAnimalsAppeared: number;
  totalAnimalsReturned: number;
  mapAge: number; // Days since first prayer
  currentStreak: number;
  longestStreak: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastPrayerDate: string; // ISO 8601 date
  consecutiveFullDays: number; // For tree generation (needs 3)
}

// ===== App State =====

export interface AppState {
  profiles: UserProfile[];
  activeProfileId: string | null;
  settings: AppSettings;
  lastSyncedAt: number;
}

export interface AppSettings {
  notifications: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// ===== Game Logic Result Types =====

export interface DayProcessingResult {
  treesAdded: Tree[];
  treesUpgraded: Tree[]; // Trees upgraded to next growth stage
  treesDecayed: Tree[];
  treesRemoved: string[];
  flowersAdded: Flower[];
  flowersUpgraded: Flower[]; // Flowers upgraded to next stage
  flowersRemoved: string[];
  dhikrFlowersAdded: DhikrFlower[];
  dhikrFlowersRemoved: string[];
  obstaclesAdded: Obstacle[];
  obstaclesRemoved: string[];
  mushroomsRemoved: string[];
  buildingsAdded: Building[];
  buildingsDecayed: Building[]; // Buildings degraded to dilapidated state
  buildingsRemoved: string[];
  animalsAdded: Animal[];
  animalsRemoved: string[];
  riversAdded: River[];
  riversRemoved: string[];
  illustriousItemsAdded: IllustriousItem[];
  illustriousItemsRemoved: string[];
}

// ===== Helper Types =====

export type DayStatus = 'complete' | 'incomplete' | 'missed';

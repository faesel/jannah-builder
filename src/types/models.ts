/**
 * Core data model type definitions for Jannah Builder
 */

import { TreeStage, IllustriousItemType } from '../config/game.config';

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

export interface WorldState {
  trees: Tree[];
  flowers: Flower[];
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
}

export interface Flower {
  id: string;
  position: Position;
  type: 'basic' | 'enhanced'; // Enhanced when Qur'an is logged
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
  buildingsAdded: Building[];
  buildingsDecayed: Building[]; // Buildings degraded to dilapidated state
  buildingsRemoved: string[];
  animalsAdded: Animal[];
  animalsRemoved: string[];
  riversAdded: River[];
  illustriousItemsAdded: IllustriousItem[];
  illustriousItemsRemoved: string[];
}

// ===== Helper Types =====

export type DayStatus = 'complete' | 'incomplete' | 'missed';

export interface DateRange {
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
}

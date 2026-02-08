/**
 * Core data model type definitions for Jannah Builder
 */

import { TreeStage, Season, IllustriousItemType } from '../config/game.config';

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
  illustriousItems: IllustriousItem[];
  season: Season;
  mapSize: {
    width: number;
    height: number;
  };
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
}

export interface Animal {
  id: string;
  type: 'bird' | 'rabbit' | 'deer' | 'squirrel';
  position: Position;
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
  totalAnimalsAppeared: number;
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
  treesDecayed: Tree[];
  treesRemoved: string[]; // Tree IDs
  buildingsAdded: Building[];
  animalsAdded: Animal[];
  illustriousItemsAdded: IllustriousItem[];
  illustriousItemsRemoved: string[]; // Item IDs
  seasonChanged: boolean;
  newSeason?: Season;
}

// ===== Helper Types =====

export type DayStatus = 'complete' | 'incomplete' | 'missed';

export interface DateRange {
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
}

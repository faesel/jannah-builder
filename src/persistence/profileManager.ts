/**
 * Profile Manager
 * Handles creating, loading, and managing user profiles (up to 3)
 */

import { UserProfile, WorldState, Statistics, StreakData, AppState } from '../types/models';
import { GAME_CONFIG, Season } from '../config/game.config';
import { Storage, STORAGE_KEYS } from './storage';

export class ProfileManager {
  /**
   * Initialize a new user profile
   */
  static createProfile(name: string): UserProfile {
    const now = Date.now();
    const profileId = `profile_${now}_${Math.random().toString(36).substr(2, 9)}`;

    const worldState: WorldState = {
      trees: [],
      flowers: [],
      buildings: [],
      animals: [],
      illustriousItems: [],
      season: 'spring' as Season,
      mapSize: GAME_CONFIG.map.initialSize,
      lastUpdated: now,
    };

    const statistics: Statistics = {
      totalPrayersLogged: 0,
      totalDaysComplete: 0,
      totalTreesGrown: 0,
      totalTreesDecayed: 0,
      totalBuildingsCreated: 0,
      totalAnimalsAppeared: 0,
      mapAge: 0,
      currentStreak: 0,
      longestStreak: 0,
    };

    const streaks: StreakData = {
      current: 0,
      longest: 0,
      lastPrayerDate: '',
      consecutiveFullDays: 0,
    };

    return {
      id: profileId,
      name,
      createdAt: now,
      lastActive: now,
      worldState,
      prayerLogs: [],
      statistics,
      streaks,
    };
  }

  /**
   * Load all profiles from storage
   */
  static async loadProfiles(): Promise<UserProfile[]> {
    const profiles = await Storage.get<UserProfile[]>(STORAGE_KEYS.PROFILES);
    return profiles || [];
  }

  /**
   * Save all profiles to storage
   */
  static async saveProfiles(profiles: UserProfile[]): Promise<void> {
    await Storage.set(STORAGE_KEYS.PROFILES, profiles);
  }

  /**
   * Get active profile ID
   */
  static async getActiveProfileId(): Promise<string | null> {
    return await Storage.get<string>(STORAGE_KEYS.ACTIVE_PROFILE_ID);
  }

  /**
   * Set active profile ID
   */
  static async setActiveProfileId(profileId: string): Promise<void> {
    await Storage.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, profileId);
  }

  /**
   * Create a new profile and add it to the list
   */
  static async addProfile(name: string): Promise<UserProfile> {
    const profiles = await this.loadProfiles();

    // Enforce max profiles limit
    if (profiles.length >= GAME_CONFIG.profiles.maxProfiles) {
      throw new Error(
        `Maximum number of profiles (${GAME_CONFIG.profiles.maxProfiles}) reached`
      );
    }

    const newProfile = this.createProfile(name);
    profiles.push(newProfile);
    await this.saveProfiles(profiles);

    // Set as active if it's the first profile
    if (profiles.length === 1) {
      await this.setActiveProfileId(newProfile.id);
    }

    return newProfile;
  }

  /**
   * Get active profile
   */
  static async getActiveProfile(): Promise<UserProfile | null> {
    const profileId = await this.getActiveProfileId();
    if (!profileId) return null;

    const profiles = await this.loadProfiles();
    return profiles.find((p) => p.id === profileId) || null;
  }

  /**
   * Update a profile
   */
  static async updateProfile(updatedProfile: UserProfile): Promise<void> {
    const profiles = await this.loadProfiles();
    const index = profiles.findIndex((p) => p.id === updatedProfile.id);

    if (index === -1) {
      throw new Error(`Profile not found: ${updatedProfile.id}`);
    }

    profiles[index] = {
      ...updatedProfile,
      lastActive: Date.now(),
    };

    await this.saveProfiles(profiles);
  }

  /**
   * Delete a profile
   */
  static async deleteProfile(profileId: string): Promise<void> {
    const profiles = await this.loadProfiles();
    const filteredProfiles = profiles.filter((p) => p.id !== profileId);

    await this.saveProfiles(filteredProfiles);

    // If deleted profile was active, clear active profile
    const activeId = await this.getActiveProfileId();
    if (activeId === profileId) {
      await Storage.remove(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    }
  }

  /**
   * Load complete app state
   */
  static async loadAppState(): Promise<AppState> {
    const [profiles, activeProfileId, settings] = await Promise.all([
      this.loadProfiles(),
      this.getActiveProfileId(),
      Storage.get(STORAGE_KEYS.SETTINGS),
    ]);

    return {
      profiles: profiles || [],
      activeProfileId,
      settings: settings || {
        notifications: true,
        soundEnabled: true,
        theme: 'auto',
      },
      lastSyncedAt: Date.now(),
    };
  }

  /**
   * Save app state
   */
  static async saveAppState(appState: AppState): Promise<void> {
    await Promise.all([
      this.saveProfiles(appState.profiles),
      appState.activeProfileId
        ? this.setActiveProfileId(appState.activeProfileId)
        : Storage.remove(STORAGE_KEYS.ACTIVE_PROFILE_ID),
      Storage.set(STORAGE_KEYS.SETTINGS, appState.settings),
    ]);
  }
}

/**
 * Profile Manager
 * Handles creating, loading, and managing user profiles (up to 3)
 */

import { UserProfile, WorldState, Statistics, StreakData, AppState, AppSettings } from '../types/models';
import { GAME_CONFIG } from '../config/game.config';
import { Storage, STORAGE_KEYS } from './storage';
import { WorldElementLogic } from '../logic/worldElementLogic';

export class ProfileManager {
  /**
   * Initialize a new user profile
   */
  static createProfile(name: string): UserProfile {
    const now = Date.now();
    const profileId = `profile_${now}_${Math.random().toString(36).substring(2, 11)}`;

    const initialObstacles = WorldElementLogic.generateInitialObstacles();
    const worldState: WorldState = {
      trees: [],
      flowers: [],
      dhikrFlowers: [],
      obstacles: initialObstacles,
      mushrooms: WorldElementLogic.generateInitialMushrooms(
        undefined,
        initialObstacles.map((o) => o.position)
      ),
      buildings: [],
      animals: [],
      rivers: [],
      illustriousItems: [],
      mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
      gridSize: GAME_CONFIG.map.initialGridSize,
      lastUpdated: now,
    };

    const statistics: Statistics = {
      totalPrayersLogged: 0,
      totalDaysComplete: 0,
      totalTreesGrown: 0,
      totalTreesDecayed: 0,
      totalBuildingsCreated: 0,
      totalBuildingsReturned: 0,
      totalAnimalsAppeared: 0,
      totalAnimalsReturned: 0,
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
      settings: { restMode: false },
    };
  }

  /**
   * Load all profiles from storage
   */
  static async loadProfiles(): Promise<UserProfile[]> {
    const profiles = await Storage.get<UserProfile[]>(STORAGE_KEYS.PROFILES);
    // Migrate older profiles that may lack newer fields.
    // Only seed obstacles for legacy profiles that predate the obstacles
    // feature (field entirely absent). A profile that already has the field —
    // even an empty array — has legitimately cleared its obstacles through
    // worship, so it must never be topped back up.
    return (profiles || []).map(p => {
      const hasObstaclesField = p.worldState.obstacles !== undefined;
      const hasMushroomsField = p.worldState.mushrooms !== undefined;

      return {
        ...p,
        settings: p.settings ?? { restMode: false },
        worldState: {
          ...p.worldState,
          rivers: p.worldState.rivers ?? [],
          dhikrFlowers: p.worldState.dhikrFlowers ?? [],
          obstacles: hasObstaclesField
            ? p.worldState.obstacles
            : WorldElementLogic.generateInitialObstacles(),
          // Seed mushrooms only for profiles predating the feature (field
          // absent). A profile with the field — even an empty array — has
          // legitimately cleared them through Qur'an, so never top back up.
          mushrooms: hasMushroomsField
            ? p.worldState.mushrooms
            : WorldElementLogic.generateInitialMushrooms(
                undefined,
                (p.worldState.obstacles ?? []).map((o) => o.position)
              ),
        },
      };
    });
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
   * Restore a profile from an imported state file and make it active.
   *
   * If a profile with the same id already exists it is replaced in place.
   * Otherwise the profile is added; when there is no room (the 3-profile cap),
   * the currently active profile is replaced so an import always succeeds
   * without silently discarding the restored garden.
   */
  static async importProfile(profile: UserProfile): Promise<UserProfile> {
    const profiles = await this.loadProfiles();
    const restored: UserProfile = { ...profile, lastActive: Date.now() };

    const existingIndex = profiles.findIndex((p) => p.id === restored.id);
    if (existingIndex !== -1) {
      profiles[existingIndex] = restored;
    } else if (profiles.length < GAME_CONFIG.profiles.maxProfiles) {
      profiles.push(restored);
    } else {
      const activeId = await this.getActiveProfileId();
      const replaceIndex = profiles.findIndex((p) => p.id === activeId);
      if (replaceIndex === -1) {
        throw new Error(
          `Maximum number of profiles (${GAME_CONFIG.profiles.maxProfiles}) reached. Delete a profile before importing.`
        );
      }
      profiles[replaceIndex] = restored;
    }

    await this.saveProfiles(profiles);
    await this.setActiveProfileId(restored.id);

    return restored;
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
   * Update the active profile's rest-mode preference. Returns the updated
   * profile, or null when there is no active profile.
   */
  static async setRestMode(enabled: boolean): Promise<UserProfile | null> {
    const profile = await this.getActiveProfile();
    if (!profile) return null;

    const updated: UserProfile = {
      ...profile,
      settings: { ...(profile.settings ?? { restMode: false }), restMode: enabled },
    };
    await this.updateProfile(updated);
    return updated;
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

    const defaultSettings: AppSettings = {
      notifications: true,
      soundEnabled: true,
      theme: 'auto',
    };

    return {
      profiles: profiles || [],
      activeProfileId,
      settings: (settings as AppSettings) || defaultSettings,
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

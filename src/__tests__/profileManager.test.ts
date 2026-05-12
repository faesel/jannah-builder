/**
 * ProfileManager Tests
 * Verifies CRUD operations for user profiles with mocked AsyncStorage.
 */

import { ProfileManager } from '../persistence/profileManager';
import { GAME_CONFIG } from '../config/game.config';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('ProfileManager', () => {
  // ------------------------------------------------------------------
  // createProfile (synchronous, pure)
  // ------------------------------------------------------------------
  describe('createProfile', () => {
    it('returns a profile with the given name', () => {
      const profile = ProfileManager.createProfile('Faesel');
      expect(profile.name).toBe('Faesel');
    });

    it('generates a unique id starting with "profile_"', () => {
      const a = ProfileManager.createProfile('A');
      const b = ProfileManager.createProfile('B');
      expect(a.id).toMatch(/^profile_/);
      expect(a.id).not.toBe(b.id);
    });

    it('initialises an empty world state', () => {
      const profile = ProfileManager.createProfile('Test');
      expect(profile.worldState.trees).toEqual([]);
      expect(profile.worldState.gridSize).toBe(GAME_CONFIG.map.initialGridSize);
    });

    it('initialises statistics at zero', () => {
      const profile = ProfileManager.createProfile('Test');
      expect(profile.statistics.totalPrayersLogged).toBe(0);
      expect(profile.statistics.totalTreesGrown).toBe(0);
      expect(profile.statistics.currentStreak).toBe(0);
    });

    it('initialises empty prayer logs and streak data', () => {
      const profile = ProfileManager.createProfile('Test');
      expect(profile.prayerLogs).toEqual([]);
      expect(profile.streaks.current).toBe(0);
      expect(profile.streaks.consecutiveFullDays).toBe(0);
    });
  });

  // ------------------------------------------------------------------
  // addProfile / loadProfiles
  // ------------------------------------------------------------------
  describe('addProfile', () => {
    it('persists a new profile and returns it', async () => {
      const profile = await ProfileManager.addProfile('First');
      expect(profile.name).toBe('First');

      const loaded = await ProfileManager.loadProfiles();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('First');
    });

    it('sets the first profile as active automatically', async () => {
      await ProfileManager.addProfile('First');
      const activeId = await ProfileManager.getActiveProfileId();
      expect(activeId).toBeTruthy();
    });

    it('does not overwrite the active profile when adding a second', async () => {
      const first = await ProfileManager.addProfile('First');
      await ProfileManager.addProfile('Second');
      const activeId = await ProfileManager.getActiveProfileId();
      expect(activeId).toBe(first.id);
    });

    it('allows up to maxProfiles profiles', async () => {
      for (let i = 0; i < GAME_CONFIG.profiles.maxProfiles; i++) {
        await ProfileManager.addProfile(`Profile ${i}`);
      }
      const loaded = await ProfileManager.loadProfiles();
      expect(loaded).toHaveLength(GAME_CONFIG.profiles.maxProfiles);
    });

    it('throws when exceeding the maximum number of profiles', async () => {
      for (let i = 0; i < GAME_CONFIG.profiles.maxProfiles; i++) {
        await ProfileManager.addProfile(`Profile ${i}`);
      }
      await expect(ProfileManager.addProfile('Extra')).rejects.toThrow(
        /Maximum number of profiles/
      );
    });
  });

  // ------------------------------------------------------------------
  // getActiveProfile
  // ------------------------------------------------------------------
  describe('getActiveProfile', () => {
    it('returns null when no profiles exist', async () => {
      const result = await ProfileManager.getActiveProfile();
      expect(result).toBeNull();
    });

    it('returns the active profile after adding one', async () => {
      const added = await ProfileManager.addProfile('Active');
      const active = await ProfileManager.getActiveProfile();
      expect(active).not.toBeNull();
      expect(active!.id).toBe(added.id);
    });

    it('returns null when active ID references a deleted profile', async () => {
      const added = await ProfileManager.addProfile('ToDelete');
      await ProfileManager.deleteProfile(added.id);
      const active = await ProfileManager.getActiveProfile();
      expect(active).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // updateProfile
  // ------------------------------------------------------------------
  describe('updateProfile', () => {
    it('persists changes to an existing profile', async () => {
      const profile = await ProfileManager.addProfile('Original');
      const modified = { ...profile, name: 'Updated' };
      await ProfileManager.updateProfile(modified);

      const loaded = await ProfileManager.loadProfiles();
      expect(loaded[0].name).toBe('Updated');
    });

    it('updates the lastActive timestamp', async () => {
      const profile = await ProfileManager.addProfile('Test');
      const before = profile.lastActive;
      // Small delay to ensure Date.now() advances
      await new Promise((r) => setTimeout(r, 10));
      await ProfileManager.updateProfile(profile);

      const loaded = await ProfileManager.loadProfiles();
      expect(loaded[0].lastActive).toBeGreaterThanOrEqual(before);
    });

    it('throws when updating a non-existent profile', async () => {
      const fake = ProfileManager.createProfile('Ghost');
      await expect(ProfileManager.updateProfile(fake)).rejects.toThrow(
        /Profile not found/
      );
    });
  });

  // ------------------------------------------------------------------
  // deleteProfile
  // ------------------------------------------------------------------
  describe('deleteProfile', () => {
    it('removes the profile from the list', async () => {
      const profile = await ProfileManager.addProfile('ToDelete');
      await ProfileManager.deleteProfile(profile.id);
      const loaded = await ProfileManager.loadProfiles();
      expect(loaded).toHaveLength(0);
    });

    it('clears active profile ID when the active profile is deleted', async () => {
      const profile = await ProfileManager.addProfile('Active');
      await ProfileManager.deleteProfile(profile.id);
      const activeId = await ProfileManager.getActiveProfileId();
      expect(activeId).toBeNull();
    });

    it('preserves active profile ID when a non-active profile is deleted', async () => {
      const first = await ProfileManager.addProfile('Keep');
      const second = await ProfileManager.addProfile('Delete');
      await ProfileManager.deleteProfile(second.id);
      const activeId = await ProfileManager.getActiveProfileId();
      expect(activeId).toBe(first.id);
    });

    it('is a no-op when deleting a non-existent profile ID', async () => {
      await ProfileManager.addProfile('Exists');
      await ProfileManager.deleteProfile('non_existent');
      const loaded = await ProfileManager.loadProfiles();
      expect(loaded).toHaveLength(1);
    });
  });

  // ------------------------------------------------------------------
  // loadAppState / saveAppState
  // ------------------------------------------------------------------
  describe('loadAppState', () => {
    it('returns default settings when none are saved', async () => {
      const state = await ProfileManager.loadAppState();
      expect(state.profiles).toEqual([]);
      expect(state.settings.notifications).toBe(true);
      expect(state.settings.theme).toBe('auto');
    });

    it('includes profiles that have been added', async () => {
      await ProfileManager.addProfile('One');
      const state = await ProfileManager.loadAppState();
      expect(state.profiles).toHaveLength(1);
    });
  });

  describe('saveAppState', () => {
    it('round-trips profiles and settings through save/load', async () => {
      const profile = ProfileManager.createProfile('Saved');
      const appState = {
        profiles: [profile],
        activeProfileId: profile.id,
        settings: { notifications: false, soundEnabled: false, theme: 'dark' as const },
        lastSyncedAt: Date.now(),
      };

      await ProfileManager.saveAppState(appState);
      const loaded = await ProfileManager.loadAppState();
      expect(loaded.profiles).toHaveLength(1);
      expect(loaded.profiles[0].name).toBe('Saved');
      expect(loaded.settings.theme).toBe('dark');
    });

    it('clears active profile ID when set to null', async () => {
      const profile = ProfileManager.createProfile('Temp');
      await ProfileManager.saveAppState({
        profiles: [profile],
        activeProfileId: null,
        settings: { notifications: true, soundEnabled: true, theme: 'auto' },
        lastSyncedAt: Date.now(),
      });
      const activeId = await ProfileManager.getActiveProfileId();
      expect(activeId).toBeNull();
    });
  });
});

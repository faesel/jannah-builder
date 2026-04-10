/**
 * AppInitializer Tests
 * Verifies first-launch vs subsequent-launch behaviour with mocked storage.
 */

import { AppInitializer } from '../logic/appInitializer';
import { ProfileManager } from '../persistence/profileManager';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('AppInitializer', () => {
  // ------------------------------------------------------------------
  // needsInitialization
  // ------------------------------------------------------------------
  describe('needsInitialization', () => {
    it('returns true when no profiles exist (first launch)', async () => {
      expect(await AppInitializer.needsInitialization()).toBe(true);
    });

    it('returns false after a profile has been created', async () => {
      await ProfileManager.addProfile('Existing');
      expect(await AppInitializer.needsInitialization()).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // initialize
  // ------------------------------------------------------------------
  describe('initialize', () => {
    it('creates a default "My Journey" profile on first launch', async () => {
      await AppInitializer.initialize();

      const profiles = await ProfileManager.loadProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('My Journey');
    });

    it('sets the default profile as active', async () => {
      await AppInitializer.initialize();

      const active = await ProfileManager.getActiveProfile();
      expect(active).not.toBeNull();
      expect(active!.name).toBe('My Journey');
    });

    it('does not create a second profile on subsequent launches', async () => {
      await AppInitializer.initialize();
      await AppInitializer.initialize();

      const profiles = await ProfileManager.loadProfiles();
      expect(profiles).toHaveLength(1);
    });

    it('does not overwrite an existing profile', async () => {
      await ProfileManager.addProfile('Custom');
      await AppInitializer.initialize();

      const profiles = await ProfileManager.loadProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('Custom');
    });

    it('propagates storage errors', async () => {
      // Simulate a storage failure on getItem
      const getItemSpy = jest.spyOn(AsyncStorage, 'getItem')
        .mockRejectedValueOnce(new Error('Storage failure'));

      await expect(AppInitializer.initialize()).rejects.toThrow('Storage failure');

      getItemSpy.mockRestore();
    });
  });
});

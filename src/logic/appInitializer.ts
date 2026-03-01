/**
 * App Initialization
 * Ensures the app has a default profile on first launch
 */

import { ProfileManager } from '../persistence/profileManager';

export class AppInitializer {
  /**
   * Initialize the app - create default profile if none exists
   */
  static async initialize(): Promise<void> {
    try {
      const profiles = await ProfileManager.loadProfiles();
      
      if (profiles.length === 0) {
        // First time user - create default profile
        await ProfileManager.addProfile('My Journey');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      throw error;
    }
  }

  /**
   * Check if app needs initialization
   */
  static async needsInitialization(): Promise<boolean> {
    const profiles = await ProfileManager.loadProfiles();
    return profiles.length === 0;
  }
}

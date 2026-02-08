/**
 * Storage utility for persisting app data using AsyncStorage
 * Provides a simple key-value interface for storing and retrieving data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  APP_STATE: '@jannah_builder:app_state',
  PROFILES: '@jannah_builder:profiles',
  ACTIVE_PROFILE_ID: '@jannah_builder:active_profile_id',
  SETTINGS: '@jannah_builder:settings',
} as const;

export class Storage {
  /**
   * Save data to storage
   */
  static async set<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving to storage (${key}):`, error);
      throw error;
    }
  }

  /**
   * Retrieve data from storage
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      throw error;
    }
  }

  /**
   * Remove data from storage
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
      throw error;
    }
  }

  /**
   * Clear all storage (use with caution)
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get multiple values at once
   */
  static async multiGet(keys: string[]): Promise<Record<string, unknown>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, unknown> = {};
      
      pairs.forEach(([key, value]) => {
        if (value != null) {
          result[key] = JSON.parse(value);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error reading multiple values from storage:', error);
      throw error;
    }
  }

  /**
   * Set multiple values at once
   */
  static async multiSet(keyValuePairs: Array<[string, unknown]>): Promise<void> {
    try {
      const pairs = keyValuePairs.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('Error writing multiple values to storage:', error);
      throw error;
    }
  }
}

export { STORAGE_KEYS };

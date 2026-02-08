/**
 * Prayer Logic
 * Pure functions for managing prayer logs
 */

import { PrayerLog } from '../types/models';
import { Prayer, GAME_CONFIG } from '../config/game.config';

export class PrayerLogic {
  /**
   * Create a new prayer log for a given date
   */
  static createPrayerLog(date: string): PrayerLog {
    return {
      id: `prayer_${date}_${Date.now()}`,
      date,
      prayers: {
        Fajr: false,
        Dhuhr: false,
        Asr: false,
        Maghrib: false,
        Isha: false,
      },
      isComplete: false,
      quranLogged: false,
      dhikrLogged: false,
      timestamp: Date.now(),
    };
  }

  /**
   * Mark a prayer as logged
   */
  static logPrayer(prayerLog: PrayerLog, prayer: Prayer): PrayerLog {
    const updatedPrayers = {
      ...prayerLog.prayers,
      [prayer]: true,
    };

    const isComplete = this.checkIfComplete(updatedPrayers);

    return {
      ...prayerLog,
      prayers: updatedPrayers,
      isComplete,
    };
  }

  /**
   * Log Qur'an reading for the day
   */
  static logQuran(prayerLog: PrayerLog): PrayerLog {
    return {
      ...prayerLog,
      quranLogged: true,
    };
  }

  /**
   * Log dhikr for the day
   */
  static logDhikr(prayerLog: PrayerLog): PrayerLog {
    return {
      ...prayerLog,
      dhikrLogged: true,
    };
  }

  /**
   * Check if all 5 prayers are logged
   */
  static checkIfComplete(prayers: PrayerLog['prayers']): boolean {
    return Object.values(prayers).every((logged) => logged);
  }

  /**
   * Get prayer log for a specific date or create a new one
   */
  static getOrCreatePrayerLog(
    existingLogs: PrayerLog[],
    date: string
  ): PrayerLog {
    const existing = existingLogs.find((log) => log.date === date);
    return existing || this.createPrayerLog(date);
  }

  /**
   * Count consecutive complete days from a list of prayer logs
   */
  static countConsecutiveDays(prayerLogs: PrayerLog[]): number {
    // Sort by date descending (most recent first)
    const sorted = [...prayerLogs]
      .filter((log) => log.isComplete)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (sorted.length === 0) return 0;

    let consecutive = 0;
    let expectedDate = this.getTodayDate();

    for (const log of sorted) {
      if (log.date === expectedDate) {
        consecutive++;
        expectedDate = this.getPreviousDate(expectedDate);
      } else {
        break;
      }
    }

    return consecutive;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  static getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get previous date in YYYY-MM-DD format
   */
  static getPreviousDate(date: string): string {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  /**
   * Get next date in YYYY-MM-DD format
   */
  static getNextDate(date: string): string {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  /**
   * Check if a date was missed (no log or incomplete)
   */
  static wasDayMissed(prayerLogs: PrayerLog[], date: string): boolean {
    const log = prayerLogs.find((l) => l.date === date);
    return !log || !log.isComplete;
  }
}

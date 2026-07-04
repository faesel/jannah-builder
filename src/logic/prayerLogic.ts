/**
 * Prayer Logic
 * Pure functions for managing prayer logs
 */

import { PrayerLog } from '../types/models';
import { Prayer } from '../config/game.config';

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
      isRestDay: false,
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
      // A day the user actively prays to completion is no longer a rest day.
      isRestDay: isComplete ? false : prayerLog.isRestDay,
    };
  }

  /**
   * Unmark a prayer (undo logging)
   */
  static unlogPrayer(prayerLog: PrayerLog, prayer: Prayer): PrayerLog {
    const updatedPrayers = {
      ...prayerLog.prayers,
      [prayer]: false,
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
    return this.countConsecutiveDaysFrom(prayerLogs, this.getTodayDate());
  }

  /**
   * Count consecutive complete days ending on or before the given date.
   *
   * Rest days (days skipped while rest mode was on) are transparent: they
   * neither count towards nor break the streak, so a streak bridges across a
   * period of rest rather than resetting.
   */
  static countConsecutiveDaysFrom(prayerLogs: PrayerLog[], fromDate: string): number {
    const completeDates = new Set(
      prayerLogs.filter((l) => l.isComplete).map((l) => l.date)
    );
    const restDates = new Set(
      prayerLogs.filter((l) => l.isRestDay && !l.isComplete).map((l) => l.date)
    );

    let count = 0;
    let cursor = fromDate;

    while (true) {
      if (completeDates.has(cursor)) {
        count++;
      } else if (!restDates.has(cursor)) {
        // A genuine gap (missed / partial / no log) ends the streak.
        break;
      }
      // Complete or rest day — keep walking backwards.
      cursor = this.getPreviousDate(cursor);
    }

    return count;
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
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
  }

  /**
   * Get next date in YYYY-MM-DD format
   */
  static getNextDate(date: string): string {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().split('T')[0];
  }

  /**
   * Check if a date was missed (no log or incomplete).
   *
   * Rest days are deliberately not counted as missed — they are a gentle,
   * intentional pause, so they never trigger penalties such as returning
   * obstacles.
   */
  static wasDayMissed(prayerLogs: PrayerLog[], date: string): boolean {
    const log = prayerLogs.find((l) => l.date === date);
    if (log?.isRestDay && !log.isComplete) return false;
    return !log || !log.isComplete;
  }

  /**
   * Mark a date as a rest day, returning an updated logs array. Never marks a
   * completed day as rest. Creates a minimal log when none exists yet so the
   * rest day is recorded for the streak logic and charts. Returns the original
   * array reference unchanged when there is nothing to do.
   */
  static markRestDay(prayerLogs: PrayerLog[], date: string): PrayerLog[] {
    const index = prayerLogs.findIndex((l) => l.date === date);
    if (index >= 0) {
      const existing = prayerLogs[index];
      if (existing.isComplete || existing.isRestDay) return prayerLogs;
      const updated = [...prayerLogs];
      updated[index] = { ...existing, isRestDay: true };
      return updated;
    }
    return [...prayerLogs, { ...this.createPrayerLog(date), isRestDay: true }];
  }

  /**
   * Count consecutive missed days ending on (and including) the given date.
   *
   * Walks backwards while each day is missed, stopping at the first complete
   * day or once it passes the earliest logged day (days before the user ever
   * started playing are not counted as "missed"). Returns 0 when there is no
   * history yet.
   */
  static countConsecutiveMissedDaysFrom(
    prayerLogs: PrayerLog[],
    fromDate: string
  ): number {
    if (prayerLogs.length === 0) return 0;
    const earliestDate = prayerLogs
      .map((l) => l.date)
      .reduce((a, b) => (a < b ? a : b));

    let count = 0;
    let cursor = fromDate;
    while (cursor >= earliestDate && this.wasDayMissed(prayerLogs, cursor)) {
      count++;
      cursor = this.getPreviousDate(cursor);
    }

    return count;
  }
}

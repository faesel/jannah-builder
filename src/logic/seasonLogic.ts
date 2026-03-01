/**
 * Season Logic
 * Pure functions for determining the current season based on player behaviour.
 *
 * Seasons represent continuity, not perfection:
 *   Spring  – default / returning to prayer
 *   Summer  – sustained consistency
 *   Autumn  – a few missed days
 *   Winter  – long pause (growth pauses, nothing destroyed)
 */

import { PrayerLog } from '../types/models';
import { Season, GAME_CONFIG } from '../config/game.config';
import { PrayerLogic } from './prayerLogic';

export class SeasonLogic {
  /**
   * Determine the season based on recent prayer history.
   *
   * Algorithm (evaluated in priority order):
   * 1. If current streak >= summerThreshold → summer
   * 2. If recent gap >= winterThreshold    → winter
   * 3. If recent gap >= autumnThreshold    → autumn
   * 4. Otherwise                           → spring (default)
   */
  static determineSeason(
    prayerLogs: PrayerLog[],
    currentDate: string
  ): Season {
    // No history or no complete days — default to spring (new/returning user)
    if (prayerLogs.length === 0) return 'spring';
    const hasCompleteDays = prayerLogs.some((l) => l.isComplete);
    if (!hasCompleteDays) return 'spring';

    const streak = this.countStreakUpTo(prayerLogs, currentDate);
    const gap = this.countGapUpTo(prayerLogs, currentDate);

    const { summerThreshold, autumnThreshold, winterThreshold } =
      GAME_CONFIG.seasons;

    if (streak >= summerThreshold) return 'summer';
    if (gap >= winterThreshold) return 'winter';
    if (gap >= autumnThreshold) return 'autumn';
    return 'spring';
  }

  /**
   * Count consecutive complete days ending on or before `date`.
   */
  static countStreakUpTo(prayerLogs: PrayerLog[], date: string): number {
    const completeDates = new Set(
      prayerLogs.filter((l) => l.isComplete).map((l) => l.date)
    );

    let count = 0;
    let cursor = date;

    while (completeDates.has(cursor)) {
      count++;
      cursor = PrayerLogic.getPreviousDate(cursor);
    }

    return count;
  }

  /**
   * Count consecutive missed days ending on or before `date`.
   * A day is "missed" if there is no complete prayer log for it.
   */
  static countGapUpTo(prayerLogs: PrayerLog[], date: string): number {
    const completeDates = new Set(
      prayerLogs.filter((l) => l.isComplete).map((l) => l.date)
    );

    let count = 0;
    let cursor = date;

    while (!completeDates.has(cursor)) {
      count++;
      cursor = PrayerLogic.getPreviousDate(cursor);

      // Safety: don't scan infinitely for users with no history
      if (count > 365) break;
    }

    return count;
  }

  /**
   * Check whether the season has changed and return the result.
   */
  static evaluateSeasonChange(
    previousSeason: Season,
    prayerLogs: PrayerLog[],
    currentDate: string
  ): { changed: boolean; newSeason: Season } {
    const newSeason = this.determineSeason(prayerLogs, currentDate);
    return {
      changed: newSeason !== previousSeason,
      newSeason,
    };
  }
}

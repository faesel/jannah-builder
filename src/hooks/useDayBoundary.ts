/**
 * useDayBoundary
 *
 * Detects when a new calendar day has started since the last time
 * the app was active. Returns the list of missed/unprocessed dates
 * so the game loop can process each one.
 */

import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { PrayerLogic } from '../logic/prayerLogic';
import { Storage } from '../persistence/storage';

const LAST_ACTIVE_DATE_KEY = '@jannah_builder:last_active_date';

export interface DayBoundaryResult {
  /** Today's date in YYYY-MM-DD format */
  today: string;
  /** Dates that have passed since the app was last active (excludes today) */
  missedDates: string[];
  /** Whether a new day has started since last check */
  dayChanged: boolean;
  /** Mark the current day as processed */
  markProcessed: () => Promise<void>;
}

/**
 * Returns info about unprocessed days since the app was last active.
 * Re-checks whenever the app returns to the foreground.
 */
export function useDayBoundary(): DayBoundaryResult {
  const [today, setToday] = useState(PrayerLogic.getTodayDate());
  const [missedDates, setMissedDates] = useState<string[]>([]);
  const [dayChanged, setDayChanged] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  const checkBoundary = async () => {
    const currentDate = PrayerLogic.getTodayDate();
    setToday(currentDate);

    const lastActiveDate = await Storage.get<string>(LAST_ACTIVE_DATE_KEY);

    if (!lastActiveDate) {
      // First ever launch — no missed dates, just record today
      await Storage.set(LAST_ACTIVE_DATE_KEY, currentDate);
      setMissedDates([]);
      setDayChanged(false);
      return;
    }

    if (lastActiveDate === currentDate) {
      setMissedDates([]);
      setDayChanged(false);
      return;
    }

    // Collect all dates between lastActiveDate (exclusive) and today (exclusive)
    const missed: string[] = [];
    let cursor = PrayerLogic.getNextDate(lastActiveDate);
    while (cursor < currentDate) {
      missed.push(cursor);
      cursor = PrayerLogic.getNextDate(cursor);
    }

    setMissedDates(missed);
    setDayChanged(true);
  };

  const markProcessed = async () => {
    const currentDate = PrayerLogic.getTodayDate();
    await Storage.set(LAST_ACTIVE_DATE_KEY, currentDate);
    setMissedDates([]);
    setDayChanged(false);
  };

  // Check on mount
  useEffect(() => {
    checkBoundary();
  }, []);

  // Re-check when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        checkBoundary();
      }
      appStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  return { today, missedDates, dayChanged, markProcessed };
}

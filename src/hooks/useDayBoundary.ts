/**
 * useDayBoundary
 *
 * Lightweight trigger source for the game loop. It reports today's date and
 * bumps a token whenever the game loop should re-run its catch-up: on mount and
 * whenever the app returns to the foreground (when a new day may have started).
 *
 * Detection of *which* days were missed, and all persistence, now lives in the
 * game loop itself so the whole catch-up is a single sequential operation. This
 * hook intentionally holds no missed-date state — that split previously caused a
 * race where the loop could run and reset the last-active marker before the
 * missed days had been computed, silently skipping decay after an absence.
 */

import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { PrayerLogic } from '../logic/prayerLogic';

export interface DayBoundaryResult {
  /** Today's date in YYYY-MM-DD format */
  today: string;
  /** Increments whenever the game loop should re-check for missed days */
  changeToken: number;
}

export function useDayBoundary(): DayBoundaryResult {
  const [today, setToday] = useState(PrayerLogic.getTodayDate());
  const [changeToken, setChangeToken] = useState(0);
  const appStateRef = useRef(AppState.currentState);

  // Initial check on mount.
  useEffect(() => {
    setToday(PrayerLogic.getTodayDate());
    setChangeToken((t) => t + 1);
  }, []);

  // Re-check when the app returns to the foreground.
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        setToday(PrayerLogic.getTodayDate());
        setChangeToken((t) => t + 1);
      }
      appStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  return { today, changeToken };
}

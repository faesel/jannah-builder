/**
 * useGameLoop
 *
 * On app open (and whenever the app returns to the foreground), detects any
 * days that elapsed since the last session and replays them in order so growth,
 * worship-based clearing and — when rest mode is off — gentle decay are applied.
 *
 * The whole catch-up is a single sequential operation: read the last-active
 * marker, compute the missed days, process them, persist the profile, then
 * advance the marker. Because the read and the write happen inside one flow,
 * there is no window in which the marker can be reset before the missed days
 * are known — the earlier split-hook design could do that and silently skip
 * decay after a multi-day absence.
 */

import { useEffect, useRef, useState } from 'react';
import { useDayBoundary } from './useDayBoundary';
import { WorldLogic } from '../logic/worldLogic';
import { PrayerLogic } from '../logic/prayerLogic';
import { ProfileManager } from '../persistence/profileManager';
import { Storage, STORAGE_KEYS } from '../persistence/storage';
import { UserProfile } from '../types/models';

const LAST_ACTIVE_DATE_KEY = STORAGE_KEYS.LAST_ACTIVE_DATE;

export interface GameLoopState {
  /** Whether the game loop is currently processing missed days */
  processing: boolean;
  /** Number of days that were processed in the last run */
  daysProcessed: number;
  /** The active profile (refreshed after processing) */
  profile: UserProfile | null;
  /** Any error that occurred during processing */
  error: string | null;
  /** Manually trigger a re-process (e.g. after logging a prayer) */
  refresh: () => Promise<void>;
}

export function useGameLoop(): GameLoopState {
  const { changeToken } = useDayBoundary();
  const [processing, setProcessing] = useState(false);
  const [daysProcessed, setDaysProcessed] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const isRunning = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Guard against overlapping runs (e.g. rapid foreground/refresh events).
      if (isRunning.current) return;
      isRunning.current = true;

      try {
        setProcessing(true);
        setError(null);

        const today = PrayerLogic.getTodayDate();

        let currentProfile = await ProfileManager.getActiveProfile();
        if (!currentProfile) {
          const existing = await ProfileManager.loadProfiles();
          if (existing.length > 0) {
            currentProfile = existing[0];
            await ProfileManager.setActiveProfileId(currentProfile.id);
          } else {
            if (!cancelled) setProfile(null);
            return;
          }
        }

        const lastActiveDate = await Storage.get<string>(LAST_ACTIVE_DATE_KEY);

        // First ever launch — nothing to catch up, just record today.
        if (!lastActiveDate) {
          await Storage.set(LAST_ACTIVE_DATE_KEY, today);
          if (!cancelled) {
            setProfile(currentProfile);
            setDaysProcessed(0);
          }
          return;
        }

        // Only process past days — today is still in progress and is evaluated
        // when the user navigates to the Jannah tab.
        const missedDates = PrayerLogic.getMissedDatesBetween(lastActiveDate, today);

        const { profile: updatedProfile, daysProcessed: processed } =
          WorldLogic.processMissedDays(currentProfile, missedDates);

        if (missedDates.length > 0) {
          await ProfileManager.updateProfile(updatedProfile);
        }

        // Advance the marker only after processing has completed successfully.
        await Storage.set(LAST_ACTIVE_DATE_KEY, today);

        if (!cancelled) {
          setProfile(updatedProfile);
          setDaysProcessed(processed);
        }
      } catch (err) {
        console.error('[useGameLoop] Error processing:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        isRunning.current = false;
        if (!cancelled) setProcessing(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [changeToken, refreshToken]);

  const refresh = async () => {
    setRefreshToken((t) => t + 1);
  };

  return { processing, daysProcessed, profile, error, refresh };
}

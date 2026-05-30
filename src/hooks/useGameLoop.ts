/**
 * useGameLoop
 *
 * On app open, detects any unprocessed days since the last session
 * and runs WorldLogic.processDay() for each one in order.
 * Persists the updated profile after all days are processed.
 */

import { useEffect, useRef, useState } from 'react';
import { useDayBoundary } from './useDayBoundary';
import { WorldLogic } from '../logic/worldLogic';
import { ProfileManager } from '../persistence/profileManager';
import { UserProfile } from '../types/models';

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
  const { today, missedDates, dayChanged, markProcessed } = useDayBoundary();
  const [processing, setProcessing] = useState(false);
  const [daysProcessed, setDaysProcessed] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);
  const isRunning = useRef(false);

  // Store latest values in refs so the effect closure always sees current data
  const missedDatesRef = useRef(missedDates);
  missedDatesRef.current = missedDates;
  const todayRef = useRef(today);
  todayRef.current = today;

  useEffect(() => {
    if (isRunning.current) return;
    if (!hasProcessed.current || dayChanged) {
      hasProcessed.current = true;

      const run = async () => {
        if (isRunning.current) return;
        isRunning.current = true;

        try {
          setProcessing(true);
          setError(null);

          let currentProfile = await ProfileManager.getActiveProfile();
          if (!currentProfile) {
            const existing = await ProfileManager.loadProfiles();
            if (existing.length > 0) {
              currentProfile = existing[0];
              await ProfileManager.setActiveProfileId(currentProfile.id);
            } else {
              setProfile(null);
              return;
            }
          }

          // Only process past missed days — today is still in progress and
          // will be evaluated when the user navigates to the Jannah tab.
          const datesToProcess = [...missedDatesRef.current];

          let processed = 0;

          for (const date of datesToProcess) {
            const result = WorldLogic.processDay(currentProfile, date);

            const hasChanges = Object.values(result).some(
              (arr) => Array.isArray(arr) && arr.length > 0
            );

            if (hasChanges) {
              currentProfile = WorldLogic.applyProcessingResult(
                currentProfile,
                result
              );
              processed++;
            }

            // Track the last date we processed
            currentProfile = {
              ...currentProfile,
              worldState: {
                ...currentProfile.worldState,
                lastProcessedDate: date,
              },
            };
          }

          // Persist if missed days produced changes or if we updated lastProcessedDate
          if (processed > 0 || datesToProcess.length > 0) {
            currentProfile = WorldLogic.updateStatisticsForPrayer(currentProfile);
            await ProfileManager.updateProfile(currentProfile);
          }
          await markProcessed();

          setProfile(currentProfile);
          setDaysProcessed(processed);
        } catch (err) {
          console.error('[useGameLoop] Error processing:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setProcessing(false);
          isRunning.current = false;
        }
      };

      run();
    }
  }, [dayChanged, today, markProcessed]);

  const refresh = async () => {
    hasProcessed.current = false;
    isRunning.current = false;
    // Trigger via state — the effect will pick it up
    setProcessing(false);
  };

  return { processing, daysProcessed, profile, error, refresh };
}

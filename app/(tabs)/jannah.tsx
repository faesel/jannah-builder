import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useGameLoop } from '../../src/hooks/useGameLoop';
import { GAME_CONFIG } from '../../src/config/game.config';
import { UserProfile, WorldState } from '../../src/types/models';
import { PrayerLogic } from '../../src/logic/prayerLogic';
import { WorldLogic } from '../../src/logic/worldLogic';
import { WorldElementLogic } from '../../src/logic/worldElementLogic';
import { computePlacementBounds, boundsEqual } from '../../src/logic/placement';
import { ProfileManager } from '../../src/persistence/profileManager';
import { JannahCanvas } from '../../src/rendering/JannahCanvas';
import { COLORS } from '../../src/config/colors';

const DEFAULT_WORLD: WorldState = {
  trees: [],
  flowers: [],
  dhikrFlowers: [],
  obstacles: [],
  mushrooms: [],
  buildings: [],
  animals: [],
  rivers: [],
  illustriousItems: [],
  mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
  gridSize: GAME_CONFIG.map.initialGridSize,
  lastUpdated: Date.now(),
};

export default function JannahScreen() {
  // Game loop processes missed days on first mount
  const { processing: gameLoopProcessing } = useGameLoop();
  // Bottom safe-area inset — reserved so assets never sit under the navigation.
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  // Guards the bounds-persistence effect against overlapping async writes.
  const boundsSyncInFlight = useRef(false);

  // Reload and reprocess profile every time this tab gets focus
  useFocusEffect(
    useCallback(() => {
      const reprocess = async () => {
        try {
          let current = await ProfileManager.getActiveProfile();
          if (!current) return;

          const today = PrayerLogic.getTodayDate();

          // Only run processDay once per calendar day
          if (current.worldState.lastProcessedDate === today) {
            setProfile(current);
            return;
          }

          const result = WorldLogic.processDay(current, today);

          // Temporary gifts (the black cat and illustrious items) fade gently
          // even while today is still in progress — this is barakah returning,
          // not decay or punishment. Without this they would never disappear
          // for users who open the app every day, because the game loop only
          // processes genuinely missed (un-opened) days.
          const blackCatRemovals = result.animalsRemoved.filter((id) =>
            current!.worldState.animals.some(
              (a) => a.id === id && a.type === 'black_cat'
            )
          );

          // Only apply growth for today — never decay, since the day is still in progress.
          // Decay for genuinely missed days is handled by the game loop on next app open.
          const hasGrowth =
            result.treesAdded.length > 0 ||
            result.treesUpgraded.length > 0 ||
            result.flowersAdded.length > 0 ||
            result.flowersUpgraded.length > 0 ||
            result.dhikrFlowersAdded.length > 0 ||
            result.obstaclesRemoved.length > 0 ||
            result.mushroomsRemoved.length > 0 ||
            result.buildingsAdded.length > 0 ||
            result.animalsAdded.length > 0 ||
            result.riversAdded.length > 0 ||
            result.riversGrown.length > 0 ||
            result.illustriousItemsAdded.length > 0;

          const hasTemporaryFade =
            blackCatRemovals.length > 0 ||
            result.illustriousItemsRemoved.length > 0;

          if (hasGrowth || hasTemporaryFade) {
            // Strip out decay results before applying, but keep temporary-gift
            // fades (black cat expiry and illustrious streak-break fades).
            // Obstacle spawning is the missed-day penalty, so it must NOT happen
            // for today while the day is still in progress — only genuinely
            // missed (un-opened) days spawn obstacles, handled by the game loop.
            const growthOnly = {
              ...result,
              treesDecayed: [],
              treesRemoved: [],
              buildingsDecayed: [],
              buildingsRemoved: [],
              animalsRemoved: blackCatRemovals,
              flowersRemoved: [],
              riversRemoved: [],
              obstaclesAdded: [],
              illustriousItemsRemoved: result.illustriousItemsRemoved,
            };
            current = WorldLogic.applyProcessingResult(current, growthOnly);
          }

          // Mark today as processed
          current = {
            ...current,
            worldState: {
              ...current.worldState,
              lastProcessedDate: today,
            },
          };

          current = WorldLogic.updateStatisticsForPrayer(current);
          await ProfileManager.updateProfile(current);
          setProfile(current);
        } catch (err) {
          console.error('[JannahScreen] Error reprocessing:', err);
        }
      };
      reprocess();
    }, [])
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout((prev) => {
      if (prev && prev.width === width && prev.height === height) return prev;
      return { width, height };
    });
  }, []);

  // Persist screen-derived placement bounds so that all future spawning fills
  // the whole visible map rather than clustering in the centre. We never move
  // existing elements — only record the bounds for subsequent growth. For a
  // brand-new world (no progress yet) we also regenerate the initial obstacles
  // within the real screen bounds so a first-time user sees them spread out.
  useEffect(() => {
    if (!layout || layout.width <= 0 || layout.height <= 0) return;
    if (!profile) return;
    // Wait until the game loop has finished processing any missed days, so we
    // never race its whole-profile write and lose progress (or our bounds).
    if (gameLoopProcessing) return;
    if (boundsSyncInFlight.current) return;

    const bounds = computePlacementBounds(layout.width, layout.height, insets.bottom, insets.top);
    if (
      profile.worldState.placementBounds &&
      boundsEqual(profile.worldState.placementBounds, bounds)
    ) {
      return;
    }

    const syncBounds = async () => {
      boundsSyncInFlight.current = true;
      try {
        // Re-read fresh so we never clobber a concurrent reprocess write.
        const current = await ProfileManager.getActiveProfile();
        if (!current) return;

        const existing = current.worldState.placementBounds;
        if (existing && boundsEqual(existing, bounds)) return;

        // A brand-new world has no progress at all. Detect it by content rather
        // than lastProcessedDate (which the focus reprocess sets to today before
        // this effect runs). Only such worlds get their initial obstacles
        // regenerated within the real screen bounds — existing gardens keep
        // every cleared-obstacle of progress untouched.
        const isFreshWorld =
          existing === undefined &&
          current.statistics.totalPrayersLogged === 0 &&
          current.worldState.trees.length === 0;

        const updated: UserProfile = {
          ...current,
          worldState: {
            ...current.worldState,
            placementBounds: bounds,
            obstacles: isFreshWorld
              ? WorldElementLogic.generateInitialObstacles(bounds)
              : current.worldState.obstacles,
          },
        };

        await ProfileManager.updateProfile(updated);
        setProfile((prev) =>
          prev && prev.id === updated.id ? updated : prev
        );
      } catch (err) {
        console.error('[JannahScreen] Error syncing placement bounds:', err);
      } finally {
        boundsSyncInFlight.current = false;
      }
    };

    syncBounds();
  }, [layout, profile, gameLoopProcessing, insets.bottom, insets.top]);

  const worldState = profile?.worldState ?? DEFAULT_WORLD;

  // Find today's prayer log to drive visual effects
  const today = PrayerLogic.getTodayDate();
  const yesterday = PrayerLogic.getPreviousDate(today);
  const todayLog = profile?.prayerLogs.find((l) => l.date === today);
  const yesterdayLog = profile?.prayerLogs.find((l) => l.date === yesterday);

  // Qur'an glowing flowers persist for 2 days
  const quranLoggedDate = todayLog?.quranLogged
    ? today
    : yesterdayLog?.quranLogged
      ? yesterday
      : undefined;

  return (
    // Full-bleed: the grass texture flows continuously under the status bar so
    // there is no flat-colour band at the top. The status-bar region is kept
    // free of assets via the top inset passed to computePlacementBounds above.
    <View style={styles.safeArea}>
      <View style={styles.container} onLayout={handleLayout}>
        {layout && (
          <JannahCanvas
            worldState={worldState}
            screenWidth={layout.width}
            screenHeight={layout.height}
            quranLogged={Boolean(quranLoggedDate)}
            quranLoggedDate={quranLoggedDate}
            dhikrLogged={todayLog?.dhikrLogged}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.grass,
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});

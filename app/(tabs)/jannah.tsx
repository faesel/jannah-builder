import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useGameLoop } from '../../src/hooks/useGameLoop';
import { GAME_CONFIG } from '../../src/config/game.config';
import { UserProfile, WorldState } from '../../src/types/models';
import { PrayerLogic } from '../../src/logic/prayerLogic';
import { WorldLogic } from '../../src/logic/worldLogic';
import { ProfileManager } from '../../src/persistence/profileManager';
import { JannahCanvas } from '../../src/rendering/JannahCanvas';
import { COLORS } from '../../src/config/colors';

const DEFAULT_WORLD: WorldState = {
  trees: [],
  flowers: [],
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
  useGameLoop();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);

  // Reload and reprocess profile every time this tab gets focus
  useFocusEffect(
    useCallback(() => {
      const reprocess = async () => {
        try {
          let current = await ProfileManager.getActiveProfile();
          if (!current) return;

          // Reprocess today so newly logged prayers generate trees/effects
          const today = PrayerLogic.getTodayDate();
          const result = WorldLogic.processDay(current, today);

          const hasChanges =
            result.treesAdded.length > 0 ||
            result.treesDecayed.length > 0 ||
            result.treesRemoved.length > 0 ||
            result.buildingsAdded.length > 0 ||
            result.animalsAdded.length > 0 ||
            result.illustriousItemsAdded.length > 0 ||
            result.illustriousItemsRemoved.length > 0;

          if (hasChanges) {
            current = WorldLogic.applyProcessingResult(current, result);
          }
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

  const worldState = profile?.worldState ?? DEFAULT_WORLD;

  // Find today's prayer log to drive visual effects
  const today = PrayerLogic.getTodayDate();
  const todayLog = profile?.prayerLogs.find((l) => l.date === today);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container} onLayout={handleLayout}>
        {layout && (
          <JannahCanvas
            worldState={worldState}
            screenWidth={layout.width}
            screenHeight={layout.height}
            quranLogged={todayLog?.quranLogged}
            dhikrLogged={todayLog?.dhikrLogged}
          />
        )}
      </View>
    </SafeAreaView>
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

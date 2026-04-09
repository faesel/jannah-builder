import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { useGameLoop } from '../../src/hooks/useGameLoop';
import { GAME_CONFIG, Season } from '../../src/config/game.config';
import { WorldState } from '../../src/types/models';
import { JannahCanvas } from '../../src/rendering/JannahCanvas';

const DEFAULT_WORLD: WorldState = {
  trees: [],
  flowers: [],
  buildings: [],
  animals: [],
  illustriousItems: [],
  season: 'spring' as Season,
  mapSize: { width: GAME_CONFIG.map.initialGridSize, height: GAME_CONFIG.map.initialGridSize },
  gridSize: GAME_CONFIG.map.initialGridSize,
  lastUpdated: Date.now(),
};

export default function JannahScreen() {
  const { profile } = useGameLoop();
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout((prev) => {
      if (prev && prev.width === width && prev.height === height) return prev;
      return { width, height };
    });
  }, []);

  const worldState = profile?.worldState ?? DEFAULT_WORLD;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {layout && (
        <JannahCanvas
          worldState={worldState}
          screenWidth={layout.width}
          screenHeight={layout.height}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});

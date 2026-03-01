import React from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
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
  const { profile, processing } = useGameLoop();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const worldState = profile?.worldState ?? DEFAULT_WORLD;

  return (
    <View style={styles.container}>
      <JannahCanvas
        worldState={worldState}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

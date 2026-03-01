import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JannahScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Jannah</Text>
        <Text style={styles.subtitle}>
          Your spiritual landscape will appear here
        </Text>
        <Text style={styles.comingSoon}>Coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F3',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2C4A3E',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B9D83',
    textAlign: 'center',
    marginBottom: 20,
  },
  comingSoon: {
    fontSize: 14,
    color: '#C5D1C0',
    fontStyle: 'italic',
  },
});

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Storage } from '../src/persistence/storage';
import { AppInitializer } from '../src/logic/appInitializer';

export default function SettingsScreen() {
  const router = useRouter();

  const handleResetGarden = useCallback(() => {
    Alert.alert(
      'Reset your garden?',
      'All prayers, trees, and progress will be removed. This cannot be undone.',
      [
        { text: 'Keep my garden', style: 'cancel' },
        {
          text: 'Reset everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await Storage.clear();
              await AppInitializer.initialize();
              router.back();
            } catch (err) {
              console.error('[Settings] Error resetting:', err);
            }
          },
        },
      ]
    );
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={true}>
        {/* Header with back button */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color="#4A7C59" />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.backButton} />
        </View>

        {/* About section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Jannah Builder</Text>
          <View style={styles.aboutCard}>
            <View style={styles.aboutIconRow}>
              <View style={styles.aboutIconCircle}>
                <Ionicons name="sparkles" size={28} color="#DAA520" />
              </View>
            </View>
            <Text style={styles.aboutText}>
              Jannah Builder is a gentle motivational tool designed to inspire Muslims by visualising the beauty and reward that awaits them in Jannah (paradise).
            </Text>
            <Text style={styles.aboutText}>
              Every prayer you log nurtures your garden — trees grow, flowers bloom, animals appear, and your world flourishes. This is a reminder that every act of worship, no matter how small, is seen and rewarded by Allah ﷻ.
            </Text>
            <Text style={styles.aboutText}>
              This app does not track perfection. It celebrates consistency, encourages gentle return after absence, and honours the quiet, sincere effort of daily worship.
            </Text>
            <Text style={styles.aboutVerse}>
              "And give good tidings to those who believe and do righteous deeds that they will have gardens beneath which rivers flow."
            </Text>
            <Text style={styles.aboutReference}>— Al-Baqarah 2:25</Text>
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.dangerCard}>
            <View style={styles.dangerInfo}>
              <Ionicons name="warning-outline" size={20} color="#A06060" style={{ marginRight: 10 }} />
              <Text style={styles.dangerDescription}>
                Resetting your garden will permanently remove all prayer logs, trees, buildings, animals, and progress. This action cannot be undone.
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.resetButton,
                pressed && styles.resetButtonPressed,
              ]}
              onPress={handleResetGarden}
              accessibilityRole="button"
              accessibilityLabel="Reset garden and clear all data"
              accessibilityHint="Double tap to reset. You will be asked to confirm."
            >
              <Ionicons name="trash-outline" size={16} color="#A06060" style={{ marginRight: 6 }} />
              <Text style={styles.resetText}>Reset Garden</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF3EC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C4A3E',
    letterSpacing: 0.3,
  },

  /* ── Sections ── */
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C4A3E',
    letterSpacing: 0.3,
    marginBottom: 12,
  },

  /* ── About card ── */
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECE5',
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#2C4A3E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  aboutIconRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  aboutIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(218, 165, 32, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 15,
    color: '#4A5E52',
    lineHeight: 22,
    marginBottom: 12,
  },
  aboutVerse: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#4A7C59',
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 4,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#C4D4B8',
  },
  aboutReference: {
    fontSize: 13,
    color: '#8B9D83',
    textAlign: 'right',
    marginBottom: 4,
  },

  /* ── Danger zone ── */
  dangerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8D4D4',
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#2C4A3E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  dangerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dangerDescription: {
    flex: 1,
    fontSize: 14,
    color: '#8B7070',
    lineHeight: 20,
  },
  resetButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4A0A0',
    backgroundColor: 'rgba(212, 160, 160, 0.06)',
  },
  resetButtonPressed: {
    backgroundColor: 'rgba(212, 160, 160, 0.15)',
  },
  resetText: {
    fontSize: 14,
    color: '#A06060',
    fontWeight: '600',
  },
});

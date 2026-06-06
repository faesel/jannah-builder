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
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Storage } from '../src/persistence/storage';
import { AppInitializer } from '../src/logic/appInitializer';
import { ProfileManager } from '../src/persistence/profileManager';
import { parseImportedState } from '../src/logic/stateImport';

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

  const handleExportState = useCallback(async () => {
    try {
      const profile = await ProfileManager.getActiveProfile();
      if (!profile) {
        Alert.alert('No profile', 'No active profile found to export.');
        return;
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        appVersion: Constants.expoConfig?.version ?? 'unknown',
        profile: {
          id: profile.id,
          name: profile.name,
          createdAt: profile.createdAt,
          lastActive: profile.lastActive,
          worldState: profile.worldState,
          prayerLogs: profile.prayerLogs,
          statistics: profile.statistics,
          streaks: profile.streaks,
        },
      };

      const json = JSON.stringify(exportData, null, 2);
      const fileName = `jannah-state-${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export game state',
        });
      } else {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
      }
    } catch (err) {
      console.error('[Settings] Error exporting state:', err);
      Alert.alert('Export failed', 'Could not export game state.');
    }
  }, []);

  const handleImportState = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const json = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const parsed = parseImportedState(json);
      if (!parsed.ok || !parsed.profile) {
        Alert.alert('Import failed', parsed.error ?? 'Could not read this file.');
        return;
      }

      const profile = parsed.profile;
      const repairNote =
        parsed.repairs && parsed.repairs.length > 0
          ? `\n\nA few totals were gently tidied up:\n• ${parsed.repairs.join('\n• ')}`
          : '';

      Alert.alert(
        'Restore this garden?',
        `This will restore the saved garden for "${profile.name}" and make it your active garden.${repairNote}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            onPress: async () => {
              try {
                await ProfileManager.importProfile(profile);
                Alert.alert('Garden restored', 'Your saved garden has been imported.', [
                  { text: 'Continue', onPress: () => router.back() },
                ]);
              } catch (err) {
                console.error('[Settings] Error importing state:', err);
                const message =
                  err instanceof Error ? err.message : 'Could not save the imported garden.';
                Alert.alert('Import failed', message);
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('[Settings] Error importing state:', err);
      Alert.alert('Import failed', 'Could not read the selected file.');
    }
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

        {/* Tips section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipRow}>
              <Ionicons name="hand-left-outline" size={18} color="#4A7C59" style={{ marginRight: 10, marginTop: 2 }} />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Undo a prayer:</Text> Long-press on a logged prayer to undo it. You'll be asked to confirm before it's unmarked.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="calendar-outline" size={18} color="#4A7C59" style={{ marginRight: 10, marginTop: 2 }} />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Missed a day?</Text> Long-press on a past day in the Statistics screen to complete all prayers for that day.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="book-outline" size={18} color="#4A7C59" style={{ marginRight: 10, marginTop: 2 }} />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Qur'an &amp; Dhikr:</Text> Tap the Qur'an or Dhikr icons to log them for today. These add gentle visual effects to your garden but don't affect tree growth.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="leaf-outline" size={18} color="#4A7C59" style={{ marginRight: 10, marginTop: 2 }} />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Growing trees:</Text> Complete all 5 prayers for 3 consecutive days to grow a new tree. On your very first complete day, you'll receive a seedling as encouragement.
              </Text>
            </View>
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.exportCard}>
            <View style={styles.exportInfo}>
              <Ionicons name="save-outline" size={20} color="#4A7C59" style={{ marginRight: 10 }} />
              <Text style={styles.exportDescription}>
                Export your full game state as a JSON file to back it up or share with the developer, or import a previously exported file to restore your garden.
              </Text>
            </View>
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.exportButton,
                  styles.buttonRowItem,
                  pressed && styles.exportButtonPressed,
                ]}
                onPress={handleExportState}
                accessibilityRole="button"
                accessibilityLabel="Export game state as JSON"
              >
                <Ionicons name="share-outline" size={16} color="#4A7C59" style={{ marginRight: 6 }} />
                <Text style={styles.exportText}>Export</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.exportButton,
                  styles.buttonRowItem,
                  pressed && styles.exportButtonPressed,
                ]}
                onPress={handleImportState}
                accessibilityRole="button"
                accessibilityLabel="Import game state from a JSON file"
              >
                <Ionicons name="folder-open-outline" size={16} color="#4A7C59" style={{ marginRight: 6 }} />
                <Text style={styles.exportText}>Import</Text>
              </Pressable>
            </View>
          </View>
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

        {/* Version */}
        <Text style={styles.versionText}>
          Jannah Builder v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
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

  /* ── Tips card ── */
  tipsCard: {
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
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5E52',
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '600',
    color: '#2C4A3E',
  },

  /* ── Danger zone ── */
  dangerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8D4D4',
    padding: 20,
    marginTop: 16,
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
  exportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4E8D4',
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
  exportInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exportDescription: {
    flex: 1,
    fontSize: 14,
    color: '#5A7A5A',
    lineHeight: 20,
  },
  exportButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A0D4A0',
    backgroundColor: 'rgba(160, 212, 160, 0.06)',
  },
  exportButtonPressed: {
    backgroundColor: 'rgba(160, 212, 160, 0.15)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonRowItem: {
    flex: 1,
  },
  exportText: {
    fontSize: 14,
    color: '#4A7C59',
    fontWeight: '600',
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
  versionText: {
    fontSize: 13,
    color: '#B0BFA8',
    textAlign: 'center',
    marginTop: 24,
  },
});

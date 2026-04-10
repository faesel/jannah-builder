import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { PrayerLog } from '../../src/types/models';
import { COLORS } from '../../src/config/colors';
import { PrayerLogic } from '../../src/logic/prayerLogic';
import { ProfileManager } from '../../src/persistence/profileManager';
import { GAME_CONFIG } from '../../src/config/game.config';

const SPIRITUAL_ICONS = {
  quran: require('../../assets/quran.png') as number,
  dhikr: require('../../assets/dhikr.png') as number,
};

const PRAYER_ICONS: Record<string, any> = {
  Fajr:    require('../../assets/prayers/fajr.png'),
  Dhuhr:   require('../../assets/prayers/dhuhr.png'),
  Asr:     require('../../assets/prayers/asr.png'),
  Maghrib: require('../../assets/prayers/maghrib.png'),
  Isha:    require('../../assets/prayers/isha.png'),
};

const PRAYER_TIMES: Record<string, string> = {
  Fajr: 'Dawn',
  Dhuhr: 'Midday',
  Asr: 'Afternoon',
  Maghrib: 'Sunset',
  Isha: 'Night',
};

export default function LogPrayerScreen() {
  const [todayLog, setTodayLog] = useState<PrayerLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const hasPlayedChime = React.useRef(false);

  const playCompletionChime = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/completion-chime.wav'),
        { volume: 0.5 }
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch {
      // Fail silently — sound is a nice-to-have
    }
  };

  const loadTodayLog = useCallback(async () => {
    try {
      const profile = await ProfileManager.getActiveProfile();
      
      if (!profile) {
        const today = PrayerLogic.getTodayDate();
        const newLog = PrayerLogic.createPrayerLog(today);
        setTodayLog(newLog);
        setLoading(false);
        return;
      }

      const today = PrayerLogic.getTodayDate();
      const log = PrayerLogic.getOrCreatePrayerLog(profile.prayerLogs, today);
      setTodayLog(log);
      setLoading(false);
    } catch (err) {
      console.error('[LogPrayerScreen] Error loading prayer log:', err);
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      hasPlayedChime.current = false;
      loadTodayLog();
    }, [loadTodayLog])
  );

  const handlePrayerToggle = (prayer: string) => {
    if (!todayLog) return;
    const isAlreadyLogged = Boolean(todayLog.prayers[prayer as keyof typeof todayLog.prayers]);
    if (isAlreadyLogged) return; // Tap does nothing if already logged — use long-press to undo

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const updatedLog = PrayerLogic.logPrayer(
      todayLog,
      prayer as typeof GAME_CONFIG.prayers.dailyPrayers[number]
    );
    if (updatedLog.isComplete && !todayLog.isComplete && !hasPlayedChime.current) {
      hasPlayedChime.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      playCompletionChime();
    }
    setTodayLog(updatedLog);
    debouncedSave(updatedLog);
  };

  const handlePrayerUndo = (prayer: string) => {
    if (!todayLog) return;
    const isLogged = Boolean(todayLog.prayers[prayer as keyof typeof todayLog.prayers]);
    if (!isLogged) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    Alert.alert(
      'Undo prayer',
      `Unmark ${prayer} as prayed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: () => {
            const updatedLog = PrayerLogic.logPrayer(
              todayLog,
              prayer as typeof GAME_CONFIG.prayers.dailyPrayers[number]
            );
            setTodayLog(updatedLog);
            debouncedSave(updatedLog);
          },
        },
      ]
    );
  };

  const handleQuranToggle = () => {
    if (!todayLog) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const updatedLog = PrayerLogic.logQuran(todayLog);
    setTodayLog(updatedLog);
    debouncedSave(updatedLog);
  };

  const handleDhikrToggle = () => {
    if (!todayLog) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const updatedLog = PrayerLogic.logDhikr(todayLog);
    setTodayLog(updatedLog);
    debouncedSave(updatedLog);
  };

  const debouncedSave = (log: PrayerLog) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      savePrayerLog(log);
    }, 500);
  };

  const savePrayerLog = async (log: PrayerLog) => {
    try {
      let profile = await ProfileManager.getActiveProfile();

      // Auto-create or recover a profile on first interaction
      if (!profile) {
        const existing = await ProfileManager.loadProfiles();
        if (existing.length > 0) {
          // Recover: set first existing profile as active
          profile = existing[0];
          await ProfileManager.setActiveProfileId(profile.id);
        } else {
          profile = await ProfileManager.addProfile(GAME_CONFIG.profiles.defaultName);
        }
      }

      const existingLogIndex = profile.prayerLogs.findIndex(
        (l) => l.date === log.date
      );

      const updatedPrayerLogs = [...profile.prayerLogs];
      if (existingLogIndex >= 0) {
        updatedPrayerLogs[existingLogIndex] = log;
      } else {
        updatedPrayerLogs.push(log);
      }

      await ProfileManager.updateProfile({
        ...profile,
        prayerLogs: updatedPrayerLogs,
      });
    } catch (err) {
      console.error('[LogPrayerScreen] Error saving prayer:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View> */}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!todayLog) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Unable to load prayer log</Text>
        </View>
      </SafeAreaView>
    );
  }

  const prayerCount = todayLog
    ? Object.values(todayLog.prayers).filter(Boolean).length
    : 0;
  const totalPrayers = GAME_CONFIG.prayers.dailyPrayers.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with decorative background */}
        <View style={styles.headerCard}>
          <Text style={styles.greeting}>Assalamu Alaikum</Text>
          <Text style={styles.title}>Today's Prayers</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(prayerCount / totalPrayers) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {prayerCount}/{totalPrayers} prayers
            </Text>
          </View>
        </View>

        {/* Prayer cards */}
        <View style={styles.prayersSection}>
          {GAME_CONFIG.prayers.dailyPrayers.map((prayer, index) => {
            const isChecked = Boolean(todayLog.prayers[prayer]);
            const iconSource = PRAYER_ICONS[prayer];
            const timeLabel = PRAYER_TIMES[prayer] ?? '';
            return (
              <Pressable
                key={prayer}
                style={({ pressed }) => [
                  styles.prayerCard,
                  isChecked && styles.prayerCardComplete,
                  pressed && !isChecked && styles.prayerCardPressed,
                  { zIndex: 10 - index },
                ]}
                onPress={() => handlePrayerToggle(prayer)}
                onLongPress={() => handlePrayerUndo(prayer)}
                delayLongPress={500}
                android_ripple={{ color: '#4A7C5920' }}
                accessibilityRole="switch"
                accessibilityState={{ checked: isChecked }}
                accessibilityLabel={`${prayer} prayer`}
                accessibilityHint={isChecked ? 'Long press to undo' : 'Tap to mark as prayed'}
              >
                <View style={styles.prayerLeft}>
                  {iconSource ? (
                    <Image source={iconSource} style={styles.prayerIcon} />
                  ) : null}
                  <View>
                    <Text style={[styles.prayerName, isChecked && styles.prayerNameComplete]}>
                      {prayer}
                    </Text>
                    <Text style={[styles.prayerTime, isChecked && styles.prayerTimeComplete]}>
                      {timeLabel}
                    </Text>
                  </View>
                </View>
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Completion banner */}
        {todayLog.isComplete ? (
          <View style={styles.completionBanner}>
            <Ionicons name="checkmark-circle" size={36} color="#4A7C59" style={{ marginBottom: 8 }} />
            <Text style={styles.completionText}>All prayers logged today</Text>
            <Text style={styles.completionSubtext}>May Allah accept your prayers</Text>
          </View>
        ) : null}

        {/* Spiritual practices */}
        <View style={styles.spiritualSection}>
          <Text style={styles.sectionTitle}>Spiritual Practices</Text>
          <View style={styles.spiritualRow}>
            <Pressable
              style={({ pressed }) => [
                styles.spiritualCard,
                todayLog.quranLogged && styles.spiritualCardActive,
                pressed && styles.prayerCardPressed,
              ]}
              onPress={() => handleQuranToggle()}
              android_ripple={{ color: '#7B68AE20' }}
              accessibilityRole="switch"
              accessibilityState={{ checked: todayLog.quranLogged }}
              accessibilityLabel="Qur'an reading"
              accessibilityHint={todayLog.quranLogged ? 'Double tap to unmark' : 'Double tap to mark as read'}
            >
              <Image source={SPIRITUAL_ICONS.quran} style={styles.spiritualIcon} />
              <Text style={[styles.spiritualLabel, todayLog.quranLogged && styles.spiritualLabelActive]}>
                Qur'an
              </Text>
              <View style={[styles.miniCheck, todayLog.quranLogged && styles.miniCheckActive]}>
                {todayLog.quranLogged ? <Text style={styles.miniCheckMark}>✓</Text> : null}
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.spiritualCard,
                todayLog.dhikrLogged && styles.spiritualCardActive,
                pressed && styles.prayerCardPressed,
              ]}
              onPress={() => handleDhikrToggle()}
              android_ripple={{ color: '#7B68AE20' }}
              accessibilityRole="switch"
              accessibilityState={{ checked: todayLog.dhikrLogged }}
              accessibilityLabel="Dhikr practice"
              accessibilityHint={todayLog.dhikrLogged ? 'Double tap to unmark' : 'Double tap to mark as done'}
            >
              <Image source={SPIRITUAL_ICONS.dhikr} style={styles.spiritualIcon} />
              <Text style={[styles.spiritualLabel, todayLog.dhikrLogged && styles.spiritualLabelActive]}>
                Dhikr
              </Text>
              <View style={[styles.miniCheck, todayLog.dhikrLogged && styles.miniCheckActive]}>
                {todayLog.dhikrLogged ? <Text style={styles.miniCheckMark}>✓</Text> : null}
              </View>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8B9D83',
  },
  errorText: {
    fontSize: 16,
    color: '#A67C52',
  },

  /* ── Header card ── */
  headerCard: {
    backgroundColor: '#4A7C59',
    borderRadius: 20,
    padding: 24,
    paddingTop: 28,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#2C4A3E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  date: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 20,
  },

  /* ── Progress bar ── */
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A8D5A2',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    minWidth: 70,
    textAlign: 'right',
  },

  /* ── Prayer cards ── */
  prayersSection: {
    gap: 10,
    marginBottom: 8,
  },
  prayerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8ECE5',
    ...Platform.select({
      ios: {
        shadowColor: '#2C4A3E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  prayerCardComplete: {
    backgroundColor: '#E8F4EC',
    borderColor: '#A8D5A2',
  },
  prayerCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  prayerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  prayerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C4A3E',
  },
  prayerNameComplete: {
    color: '#4A7C59',
  },
  prayerTime: {
    fontSize: 13,
    color: '#A0B098',
    marginTop: 1,
  },
  prayerTimeComplete: {
    color: '#7BAF85',
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#D0D9CC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
  },
  checkboxChecked: {
    backgroundColor: '#4A7C59',
    borderColor: '#4A7C59',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* ── Completion banner ── */
  completionBanner: {
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A8D5A2',
    ...Platform.select({
      ios: {
        shadowColor: '#4A7C59',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  completionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4A7C59',
    marginBottom: 4,
  },
  completionSubtext: {
    fontSize: 13,
    color: '#8BAF8E',
    fontStyle: 'italic',
  },

  /* ── Spiritual section ── */
  spiritualSection: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C4A3E',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  spiritualRow: {
    flexDirection: 'row',
    gap: 12,
  },
  spiritualCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8ECE5',
    ...Platform.select({
      ios: {
        shadowColor: '#2C4A3E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  spiritualCardActive: {
    backgroundColor: '#F0ECF8',
    borderColor: '#C4B8E0',
  },
  spiritualIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  spiritualLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C4A3E',
    marginBottom: 10,
  },
  spiritualLabelActive: {
    color: '#7B68AE',
  },
  miniCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D9CC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
  },
  miniCheckActive: {
    backgroundColor: '#7B68AE',
    borderColor: '#7B68AE',
  },
  miniCheckMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

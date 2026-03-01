import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrayerLog } from '../../src/types/models';
import { PrayerLogic } from '../../src/logic/prayerLogic';
import { ProfileManager } from '../../src/persistence/profileManager';
import { GAME_CONFIG } from '../../src/config/game.config';

export default function LogPrayerScreen() {
  console.log('[LogPrayerScreen] Component mounting');
  
  const [todayLog, setTodayLog] = useState<PrayerLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('[LogPrayerScreen] useEffect running');
    loadTodayLog();
  }, []);

  const loadTodayLog = async () => {
    try {
      console.log('[LogPrayerScreen] Loading today log...');
      const profile = await ProfileManager.getActiveProfile();
      console.log('[LogPrayerScreen] Profile loaded:', profile ? 'exists' : 'null');
      
      if (!profile) {
        console.log('[LogPrayerScreen] No profile, creating new log');
        const today = PrayerLogic.getTodayDate();
        const newLog = PrayerLogic.createPrayerLog(today);
        console.log('[LogPrayerScreen] New log created:', newLog);
        setTodayLog(newLog);
        setLoading(false);
        return;
      }

      const today = PrayerLogic.getTodayDate();
      console.log('[LogPrayerScreen] Today date:', today);
      const log = PrayerLogic.getOrCreatePrayerLog(profile.prayerLogs, today);
      console.log('[LogPrayerScreen] Log retrieved:', log);
      setTodayLog(log);
      setLoading(false);
    } catch (err) {
      console.error('[LogPrayerScreen] Error loading prayer log:', err);
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const handlePrayerToggle = (prayer: string) => {
    console.log('[LogPrayerScreen] Toggling prayer:', prayer);
    if (!todayLog) return;

    const updatedLog = PrayerLogic.logPrayer(
      todayLog,
      prayer as typeof GAME_CONFIG.prayers.dailyPrayers[number]
    );
    console.log('[LogPrayerScreen] Prayer toggled, new state:', updatedLog.prayers[prayer as keyof typeof updatedLog.prayers]);
    setTodayLog(updatedLog);
    debouncedSave(updatedLog);
  };

  const handleQuranToggle = () => {
    if (!todayLog) return;
    const updatedLog = PrayerLogic.logQuran(todayLog);
    setTodayLog(updatedLog);
    debouncedSave(updatedLog);
  };

  const handleDhikrToggle = () => {
    if (!todayLog) return;
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
      const profile = await ProfileManager.getActiveProfile();
      if (!profile) {
        console.log('[LogPrayerScreen] No profile to save to');
        return;
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
      console.log('[LogPrayerScreen] Prayer saved');
    } catch (err) {
      console.error('[LogPrayerScreen] Error saving prayer:', err);
    }
  };

  console.log('[LogPrayerScreen] Rendering, loading:', loading, 'error:', error, 'todayLog:', todayLog ? 'exists' : 'null');

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Today's Prayers</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.prayersSection}>
          {GAME_CONFIG.prayers.dailyPrayers.map((prayer) => {
            const isChecked = Boolean(todayLog.prayers[prayer]);
            return (
              <Pressable
                key={prayer}
                style={[
                  styles.prayerCard,
                  isChecked ? styles.prayerCardComplete : null,
                ]}
                onPress={() => handlePrayerToggle(prayer)}
                android_ripple={{ color: '#4A7C5930' }}
              >
                <Text
                  style={[
                    styles.prayerName,
                    isChecked ? styles.prayerNameComplete : null,
                  ]}
                >
                  {prayer}
                </Text>
                <View
                  style={[
                    styles.checkbox,
                    isChecked ? styles.checkboxChecked : null,
                  ]}
                >
                  {isChecked ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {todayLog.isComplete ? (
          <View style={styles.completionMessage}>
            <Text style={styles.completionText}>
              ✨ All prayers logged today
            </Text>
          </View>
        ) : null}

        <View style={styles.spiritualSection}>
          <Text style={styles.spiritualTitle}>Spiritual Practices</Text>
          <Pressable
            style={[
              styles.spiritualCard,
              todayLog.quranLogged ? styles.spiritualCardActive : null,
            ]}
            onPress={() => handleQuranToggle()}
            android_ripple={{ color: '#7B68AE30' }}
          >
            <Text
              style={[
                styles.spiritualLabel,
                todayLog.quranLogged ? styles.spiritualLabelActive : null,
              ]}
            >
              I read Qur'an today
            </Text>
            <View
              style={[
                styles.checkbox,
                todayLog.quranLogged ? styles.spiritualCheckboxChecked : null,
              ]}
            >
              {todayLog.quranLogged ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : null}
            </View>
          </Pressable>
          <Pressable
            style={[
              styles.spiritualCard,
              todayLog.dhikrLogged ? styles.spiritualCardActive : null,
            ]}
            onPress={() => handleDhikrToggle()}
            android_ripple={{ color: '#7B68AE30' }}
          >
            <Text
              style={[
                styles.spiritualLabel,
                todayLog.dhikrLogged ? styles.spiritualLabelActive : null,
              ]}
            >
              I did dhikr today
            </Text>
            <View
              style={[
                styles.checkbox,
                todayLog.dhikrLogged ? styles.spiritualCheckboxChecked : null,
              ]}
            >
              {todayLog.dhikrLogged ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : null}
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F3',
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2C4A3E',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#8B9D83',
  },
  prayersSection: {
    // Container for prayer cards
  },
  prayerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E5DD',
    marginBottom: 12,
  },
  prayerCardComplete: {
    backgroundColor: '#E8F4EC',
    borderColor: '#4A7C59',
  },
  prayerName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#2C4A3E',
  },
  prayerNameComplete: {
    color: '#4A7C59',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#C5D1C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A7C59',
    borderColor: '#4A7C59',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completionMessage: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#E8F4EC',
    borderRadius: 12,
    alignItems: 'center',
  },
  completionText: {
    fontSize: 16,
    color: '#4A7C59',
    fontWeight: '500',
  },
  spiritualSection: {
    marginTop: 32,
  },
  spiritualTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C4A3E',
    marginBottom: 12,
  },
  spiritualCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E5DD',
    marginBottom: 12,
  },
  spiritualCardActive: {
    backgroundColor: '#EDE8F5',
    borderColor: '#7B68AE',
  },
  spiritualLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#2C4A3E',
  },
  spiritualLabelActive: {
    color: '#7B68AE',
  },
  spiritualCheckboxChecked: {
    backgroundColor: '#7B68AE',
    borderColor: '#7B68AE',
  },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { COLORS } from '../../src/config/colors';
import { StatCard } from '../../src/components/StatCard';
import { ProfileManager } from '../../src/persistence/profileManager';
import { Storage } from '../../src/persistence/storage';
import { PrayerLogic } from '../../src/logic/prayerLogic';
import { UserProfile, PrayerLog } from '../../src/types/models';
import { AppInitializer } from '../../src/logic/appInitializer';

const SEASON_LABELS: Record<string, string> = {
  spring: '🌸 Spring',
  summer: '☀️ Summer',
  autumn: '🍂 Autumn',
  winter: '❄️ Winter',
};

type DayStatus = 'complete' | 'partial' | 'missed';

interface DayInfo {
  date: string;
  dayLabel: string;
  status: DayStatus;
  prayerCount: number;
}

function getLast7Days(prayerLogs: PrayerLog[]): DayInfo[] {
  const today = PrayerLogic.getTodayDate();
  const days: DayInfo[] = [];
  let cursor = today;

  for (let i = 0; i < 7; i++) {
    const dateObj = new Date(cursor + 'T12:00:00');
    const dayLabel = i === 0
      ? 'Today'
      : dateObj.toLocaleDateString('en-GB', { weekday: 'short' });

    const log = prayerLogs.find((l) => l.date === cursor);
    const prayerCount = log
      ? Object.values(log.prayers).filter(Boolean).length
      : 0;
    let status: DayStatus = 'missed';
    if (log?.isComplete) {
      status = 'complete';
    } else if (prayerCount > 0) {
      status = 'partial';
    }

    days.unshift({ date: cursor, dayLabel, status, prayerCount });
    cursor = PrayerLogic.getPreviousDate(cursor);
  }

  return days;
}

const STATUS_COLOURS: Record<DayStatus, string> = {
  complete: '#4A7C59',
  partial: '#C4A243',
  missed: '#D4D9D0',
};

const STATUS_ICONS: Record<DayStatus, string> = {
  complete: '✓',
  partial: '½',
  missed: '—',
};

const STATUS_LABELS: Record<DayStatus, string> = {
  complete: 'All prayers logged',
  partial: 'Some prayers logged',
  missed: 'No prayers logged',
};

type StatsView = 'allTime' | 'current';

export default function StatisticsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsView, setStatsView] = useState<StatsView>('current');

  const loadProfile = useCallback(async () => {
    try {
      const active = await ProfileManager.getActiveProfile();
      setProfile(active);
    } catch (err) {
      console.error('[StatisticsScreen] Error loading profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, [loadProfile]);

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
              await loadProfile();
            } catch (err) {
              console.error('[StatisticsScreen] Error resetting:', err);
            }
          },
        },
      ]
    );
  }, [loadProfile]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent} />
      </SafeAreaView>
    );
  }

  const hasLogs = (profile?.prayerLogs?.length ?? 0) > 0;

  if (!profile || !hasLogs) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.emptyContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B9D83" />
          }
        >
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={styles.emptyTitle}>Your garden awaits</Text>
          <Text style={styles.emptySubtitle}>
            Log your first prayer to begin your journey
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { statistics, worldState, prayerLogs } = profile;
  const days = getLast7Days(prayerLogs);

  // Compute live values from prayer logs so stats are always fresh
  const totalPrayersLogged = prayerLogs.reduce(
    (sum, log) => sum + Object.values(log.prayers).filter(Boolean).length, 0
  );
  const totalDaysComplete = prayerLogs.filter((log) => log.isComplete).length;
  const currentStreak = PrayerLogic.countConsecutiveDays(prayerLogs);
  const longestStreak = Math.max(statistics.longestStreak, currentStreak);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B9D83" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Journey</Text>
        </View>

        {/* Streak section */}
        <View style={styles.streakSection}>
          <View style={styles.streakCard}>
            <Text style={styles.streakValue}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>
              {currentStreak === 1 ? 'day' : 'days'} continuing
            </Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakCard}>
            <Text style={styles.streakValue}>{longestStreak}</Text>
            <Text style={styles.streakLabel}>
              {longestStreak === 1 ? 'day' : 'days'} longest
            </Text>
          </View>
        </View>

        {/* 7-day history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekRow}>
            {days.map((day) => (
              <View
                key={day.date}
                style={styles.dayColumn}
                accessibilityLabel={`${day.dayLabel}: ${STATUS_LABELS[day.status]}, ${day.prayerCount} of 5`}
              >
                <View
                  style={[
                    styles.dayDot,
                    { backgroundColor: STATUS_COLOURS[day.status] },
                  ]}
                >
                  <Text style={styles.dayDotText}>
                    {STATUS_ICONS[day.status]}
                  </Text>
                </View>
                <Text style={styles.dayCount}>{day.prayerCount}/5</Text>
                <Text style={[
                  styles.dayLabel,
                  day.dayLabel === 'Today' && styles.dayLabelToday,
                ]}>
                  {day.dayLabel}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats grid with toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow} accessibilityRole="tablist">
            <Pressable
              style={[styles.toggleButton, statsView === 'current' && styles.toggleButtonActive]}
              onPress={() => setStatsView('current')}
              accessibilityRole="tab"
              accessibilityState={{ selected: statsView === 'current' }}
              accessibilityLabel="Current stats"
            >
              <Text style={[styles.toggleText, statsView === 'current' && styles.toggleTextActive]}>
                Current
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, statsView === 'allTime' && styles.toggleButtonActive]}
              onPress={() => setStatsView('allTime')}
              accessibilityRole="tab"
              accessibilityState={{ selected: statsView === 'allTime' }}
              accessibilityLabel="All time stats"
            >
              <Text style={[styles.toggleText, statsView === 'allTime' && styles.toggleTextActive]}>
                All Time
              </Text>
            </Pressable>
          </View>
          <View style={styles.statsGrid}>
            {statsView === 'current' ? (
              <>
                <View style={styles.statsRow}>
                  <StatCard icon="🌳" label="Living Trees" value={worldState.trees.length} />
                  <View style={styles.gridGap} />
                  <StatCard icon="🌸" label="Flowers" value={worldState.flowers.length} />
                </View>
                <View style={styles.statsRow}>
                  <StatCard icon="🏠" label="Buildings" value={worldState.buildings.length} />
                  <View style={styles.gridGap} />
                  <StatCard icon="🐦" label="Animals" value={worldState.animals.length} />
                </View>
                <View style={styles.statsRow}>
                  <StatCard icon="✨" label="Illustrious Gifts" value={worldState.illustriousItems.length} />
                  <View style={styles.gridGap} />
                  <StatCard icon="📅" label="Complete Days" value={totalDaysComplete} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.statsRow}>
                  <StatCard icon="🤲" label="Prayers Logged" value={totalPrayersLogged} />
                  <View style={styles.gridGap} />
                  <StatCard icon="📅" label="Complete Days" value={totalDaysComplete} />
                </View>
                <View style={styles.statsRow}>
                  <StatCard icon="🌳" label="Trees Grown" value={statistics.totalTreesGrown} />
                  <View style={styles.gridGap} />
                  <StatCard icon="🍂" label="Trees Returned" value={statistics.totalTreesDecayed} />
                </View>
                <View style={styles.statsRow}>
                  <StatCard icon="🏠" label="Buildings" value={statistics.totalBuildingsCreated} />
                  <View style={styles.gridGap} />
                  <StatCard icon="🐦" label="Animals" value={statistics.totalAnimalsAppeared} />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Season & garden age */}
        <View style={styles.section}>
          <View style={styles.worldCard}>
            <View style={styles.worldRow}>
              <Text style={styles.worldLabel}>Season</Text>
              <Text style={styles.worldValue}>
                {SEASON_LABELS[worldState.season] ?? worldState.season}
              </Text>
            </View>
            <View style={styles.worldDivider} />
            <View style={styles.worldRow}>
              <Text style={styles.worldLabel}>Garden age</Text>
              <Text style={styles.worldValue}>
                {statistics.mapAge} {statistics.mapAge === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>
        </View>

        {/* Reset */}
        <Pressable
          style={styles.resetButton}
          onPress={handleResetGarden}
          accessibilityRole="button"
          accessibilityLabel="Reset garden and clear all data"
          accessibilityHint="Double tap to reset. You will be asked to confirm."
        >
          <Text style={styles.resetText}>Reset Garden</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2C4A3E',
  },

  // Empty state
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2C4A3E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8B9D83',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Streak
  streakSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E5DD',
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  streakCard: {
    flex: 1,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4A7C59',
  },
  streakLabel: {
    fontSize: 14,
    color: '#8B9D83',
    marginTop: 4,
  },
  streakDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E0E5DD',
    marginHorizontal: 16,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C4A3E',
    marginBottom: 12,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E0E5DD',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B9D83',
  },
  toggleTextActive: {
    color: '#2C4A3E',
    fontWeight: '600',
  },

  // 7-day history
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E5DD',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayDotText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dayCount: {
    fontSize: 10,
    color: '#8B9D83',
    marginBottom: 2,
  },
  dayLabel: {
    fontSize: 11,
    color: '#8B9D83',
  },
  dayLabelToday: {
    fontWeight: '700',
    color: '#4A7C59',
  },

  // Stats grid
  statsGrid: {
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
  },
  gridGap: {
    width: 10,
  },

  // World summary
  worldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E5DD',
    padding: 16,
  },
  worldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  worldLabel: {
    fontSize: 15,
    color: '#8B9D83',
  },
  worldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C4A3E',
  },
  worldDivider: {
    height: 1,
    backgroundColor: '#E0E5DD',
  },

  // Reset
  resetButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4A0A0',
  },
  resetText: {
    fontSize: 14,
    color: '#A06060',
    fontWeight: '500',
  },
});

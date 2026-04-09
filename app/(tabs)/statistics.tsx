import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { COLORS } from '../../src/config/colors';
import { StatCard } from '../../src/components/StatCard';
import { ProfileManager } from '../../src/persistence/profileManager';
import { PrayerLogic } from '../../src/logic/prayerLogic';
import { UserProfile, PrayerLog } from '../../src/types/models';

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
    let status: DayStatus = 'missed';
    if (log?.isComplete) {
      status = 'complete';
    } else if (log && Object.values(log.prayers).some(Boolean)) {
      status = 'partial';
    }

    days.unshift({ date: cursor, dayLabel, status });
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
  partial: '·',
  missed: '—',
};

const STATUS_LABELS: Record<DayStatus, string> = {
  complete: 'All prayers logged',
  partial: 'Some prayers logged',
  missed: 'No prayers logged',
};

export default function StatisticsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const { statistics, streaks, worldState, prayerLogs } = profile;
  const days = getLast7Days(prayerLogs);

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
            <Text style={styles.streakValue}>{statistics.currentStreak}</Text>
            <Text style={styles.streakLabel}>
              {statistics.currentStreak === 1 ? 'day' : 'days'} continuing
            </Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakCard}>
            <Text style={styles.streakValue}>{statistics.longestStreak}</Text>
            <Text style={styles.streakLabel}>
              {statistics.longestStreak === 1 ? 'day' : 'days'} longest
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
                accessibilityLabel={`${day.dayLabel}: ${STATUS_LABELS[day.status]}`}
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

        {/* Core stats grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Garden</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard icon="🤲" label="Prayers Logged" value={statistics.totalPrayersLogged} />
              <View style={styles.gridGap} />
              <StatCard icon="📅" label="Complete Days" value={statistics.totalDaysComplete} />
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
          </View>
        </View>

        {/* World summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>World</Text>
          <View style={styles.worldCard}>
            <View style={styles.worldRow}>
              <Text style={styles.worldLabel}>Season</Text>
              <Text style={styles.worldValue}>
                {SEASON_LABELS[worldState.season] ?? worldState.season}
              </Text>
            </View>
            <View style={styles.worldDivider} />
            <View style={styles.worldRow}>
              <Text style={styles.worldLabel}>Living trees</Text>
              <Text style={styles.worldValue}>{worldState.trees.length}</Text>
            </View>
            <View style={styles.worldDivider} />
            <View style={styles.worldRow}>
              <Text style={styles.worldLabel}>Illustrious gifts</Text>
              <Text style={styles.worldValue}>
                {worldState.illustriousItems.length}
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
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatCard } from '../../src/components/StatCard';
import { ProfileManager } from '../../src/persistence/profileManager';
import { PrayerLogic } from '../../src/logic/prayerLogic';
import { WorldLogic } from '../../src/logic/worldLogic';
import { UserProfile, PrayerLog } from '../../src/types/models';

const WEEK_ROW_ICONS = {
  prayer: require('../../assets/prayers/prayer.png'),
  quran: require('../../assets/quran.png'),
  dhikr: require('../../assets/dhikr.png'),
};

type DayStatus = 'complete' | 'partial' | 'missed' | 'pending';

interface DayInfo {
  date: string;
  dayLabel: string;
  status: DayStatus;
  prayerCount: number;
  quranLogged: boolean;
  dhikrLogged: boolean;
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
    let status: DayStatus = cursor === today ? 'pending' : 'missed';
    if (log?.isComplete) {
      status = 'complete';
    } else if (prayerCount > 0) {
      status = 'partial';
    }

    days.unshift({
      date: cursor,
      dayLabel,
      status,
      prayerCount,
      quranLogged: log?.quranLogged ?? false,
      dhikrLogged: log?.dhikrLogged ?? false,
    });
    cursor = PrayerLogic.getPreviousDate(cursor);
  }

  return days;
}

const STATUS_COLOURS: Record<DayStatus, string> = {
  complete: '#4A7C59',
  partial: '#D4A017',
  missed: '#C0392B',
  pending: '#D4D9D0',
};

/** Get all days in a given month with their status */
function getMonthDays(year: number, month: number, prayerLogs: PrayerLog[]): DayInfo[] {
  const today = PrayerLogic.getTodayDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: DayInfo[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(date + 'T12:00:00');
    const dayLabel = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });

    const log = prayerLogs.find((l) => l.date === date);
    const prayerCount = log ? Object.values(log.prayers).filter(Boolean).length : 0;

    let status: DayStatus;
    if (date > today) {
      status = 'pending';
    } else if (date === today) {
      status = log?.isComplete ? 'complete' : prayerCount > 0 ? 'partial' : 'pending';
    } else {
      status = log?.isComplete ? 'complete' : prayerCount > 0 ? 'partial' : 'missed';
    }

    days.push({ date, dayLabel, status, prayerCount, quranLogged: log?.quranLogged ?? false, dhikrLogged: log?.dhikrLogged ?? false });
  }

  return days;
}

/** Get month summary stats */
function getMonthSummary(year: number, month: number, prayerLogs: PrayerLog[]) {
  const today = PrayerLogic.getTodayDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let totalPrayers = 0;
  let completeDays = 0;
  let eligibleDays = 0;
  let quranDays = 0;
  let dhikrDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (date > today) break;
    eligibleDays++;

    const log = prayerLogs.find((l) => l.date === date);
    if (log) {
      totalPrayers += Object.values(log.prayers).filter(Boolean).length;
      if (log.isComplete) completeDays++;
      if (log.quranLogged) quranDays++;
      if (log.dhikrLogged) dhikrDays++;
    }
  }

  const completionRate = eligibleDays > 0 ? Math.round((completeDays / eligibleDays) * 100) : 0;
  return { totalPrayers, completeDays, eligibleDays, completionRate, quranDays, dhikrDays };
}

/** Get year heatmap data — an array of 12 month summaries */
function getYearSummary(year: number, prayerLogs: PrayerLog[]) {
  const months = [];
  for (let m = 0; m < 12; m++) {
    months.push({ month: m, ...getMonthSummary(year, m, prayerLogs) });
  }
  const totalPrayers = months.reduce((s, m) => s + m.totalPrayers, 0);
  const completeDays = months.reduce((s, m) => s + m.completeDays, 0);
  const eligibleDays = months.reduce((s, m) => s + m.eligibleDays, 0);
  const completionRate = eligibleDays > 0 ? Math.round((completeDays / eligibleDays) * 100) : 0;
  const bestMonth = months.reduce((best, m) => m.completionRate > best.completionRate ? m : best, months[0]);
  return { months, totalPrayers, completeDays, eligibleDays, completionRate, bestMonth };
}

const STATUS_ICONS: Record<DayStatus, string> = {
  complete: '✓',
  partial: '!',
  missed: '✕',
  pending: '·',
};

const STATUS_LABELS: Record<DayStatus, string> = {
  complete: 'All prayers logged',
  partial: 'Some prayers missed',
  missed: 'All prayers missed',
  pending: 'In progress',
};

type StatsView = 'current' | 'allTime';
type TimeView = 'week' | 'month' | 'year';

export default function StatisticsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsView, setStatsView] = useState<StatsView>('current');
  const [timeView, setTimeView] = useState<TimeView>('week');

  // Month/year navigation
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [heatmapYear, setHeatmapYear] = useState(now.getFullYear());

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

  const handleDayLongPress = useCallback((date: string, status: DayStatus) => {
    if (!profile) return;
    const today = PrayerLogic.getTodayDate();
    if (date === today) return; // Use the prayer screen for today
    if (status === 'complete') return; // Already complete

    const dateObj = new Date(date + 'T12:00:00');
    const label = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

    Alert.alert(
      'Complete all prayers?',
      `Mark all 5 prayers as complete for ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              let log = PrayerLogic.getOrCreatePrayerLog(profile.prayerLogs, date);
              // Mark all prayers
              const prayers: Array<'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'> =
                ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
              for (const prayer of prayers) {
                log = PrayerLogic.logPrayer(log, prayer);
              }

              // Update profile prayer logs
              const existingIndex = profile.prayerLogs.findIndex((l) => l.date === date);
              const updatedLogs = [...profile.prayerLogs];
              if (existingIndex >= 0) {
                updatedLogs[existingIndex] = log;
              } else {
                updatedLogs.push(log);
              }

              let updatedProfile: UserProfile = { ...profile, prayerLogs: updatedLogs };
              updatedProfile = WorldLogic.updateStatisticsForPrayer(updatedProfile);
              await ProfileManager.updateProfile(updatedProfile);
              setProfile(updatedProfile);
            } catch (err) {
              console.error('[StatisticsScreen] Error completing day:', err);
            }
          },
        },
      ]
    );
  }, [profile]);

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
          <View style={styles.emptyIconCircle}>
            <Ionicons name="leaf" size={40} color="#4A7C59" />
          </View>
          <Text style={styles.emptyTitle}>Your garden awaits</Text>
          <Text style={styles.emptySubtitle}>
            Log your first prayer to begin your journey
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { statistics, worldState, prayerLogs } = profile;

  const gardenAge = Math.max(
    0,
    Math.floor((Date.now() - profile.createdAt) / (1000 * 60 * 60 * 24))
  );
  const days = getLast7Days(prayerLogs);

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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#A8D5A2" />
        }
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <Text style={styles.headerSubtitle}>Your Journey</Text>
          <Text style={styles.headerTitle}>Statistics</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={styles.streakValue}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>
                {currentStreak === 1 ? 'day' : 'days'} continuing
              </Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakValue}>{longestStreak}</Text>
              <Text style={styles.streakLabel}>
                {longestStreak === 1 ? 'day' : 'days'} longest
              </Text>
            </View>
          </View>
        </View>

        {/* Time-based history (Week / Month / Year) */}
        <View style={styles.section}>
          <View style={styles.toggleRow} accessibilityRole="tablist">
            {(['week', 'month', 'year'] as TimeView[]).map((view) => (
              <Pressable
                key={view}
                style={[styles.toggleButton, timeView === view && styles.toggleButtonActive]}
                onPress={() => setTimeView(view)}
                accessibilityRole="tab"
                accessibilityState={{ selected: timeView === view }}
                accessibilityLabel={`${view.charAt(0).toUpperCase() + view.slice(1)} view`}
              >
                <Text style={[styles.toggleText, timeView === view && styles.toggleTextActive]}>
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {timeView === 'week' && (
            <View style={styles.weekCard}>
              {/* Day labels row */}
              <View style={styles.weekRow}>
                <View style={styles.weekRowLabel} />
                {days.map((day) => (
                  <Text
                    key={`label-${day.date}`}
                    style={[
                      styles.weekDayLabel,
                      day.dayLabel === 'Today' && styles.dayLabelToday,
                    ]}
                  >
                    {day.dayLabel}
                  </Text>
                ))}
              </View>

              {/* Prayer row */}
              <View style={styles.weekRow}>
                <View style={styles.weekRowLabel}>
                  <Image source={WEEK_ROW_ICONS.prayer} style={styles.weekRowIcon} />
                </View>
                {days.map((day) => (
                  <Pressable
                    key={`prayer-${day.date}`}
                    style={styles.weekCell}
                    onLongPress={() => handleDayLongPress(day.date, day.status)}
                    accessibilityLabel={`${day.dayLabel}: ${STATUS_LABELS[day.status]}, ${day.prayerCount} of 5`}
                    accessibilityHint={
                      day.status !== 'complete' && day.dayLabel !== 'Today'
                        ? 'Long press to complete all prayers'
                        : undefined
                    }
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
                  </Pressable>
                ))}
              </View>

              {/* Qur'an row */}
              <View style={styles.weekRow}>
                <View style={styles.weekRowLabel}>
                  <Image source={WEEK_ROW_ICONS.quran} style={styles.weekRowIcon} />
                </View>
                {days.map((day) => (
                  <View
                    key={`quran-${day.date}`}
                    style={styles.weekCell}
                    accessibilityLabel={`${day.dayLabel}: Qur'an ${day.quranLogged ? 'read' : 'not read'}`}
                  >
                    <View
                      style={[
                        styles.weekIndicator,
                        day.quranLogged ? styles.weekIndicatorActive : styles.weekIndicatorInactive,
                      ]}
                    >
                      {day.quranLogged && (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Dhikr row */}
              <View style={styles.weekRow}>
                <View style={styles.weekRowLabel}>
                  <Image source={WEEK_ROW_ICONS.dhikr} style={styles.weekRowIcon} />
                </View>
                {days.map((day) => (
                  <View
                    key={`dhikr-${day.date}`}
                    style={styles.weekCell}
                    accessibilityLabel={`${day.dayLabel}: Dhikr ${day.dhikrLogged ? 'done' : 'not done'}`}
                  >
                    <View
                      style={[
                        styles.weekIndicator,
                        day.dhikrLogged ? styles.weekIndicatorActive : styles.weekIndicatorInactive,
                      ]}
                    >
                      {day.dhikrLogged && (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {timeView === 'month' && (() => {
            const monthDays = getMonthDays(viewYear, viewMonth, prayerLogs);
            const summary = getMonthSummary(viewYear, viewMonth, prayerLogs);
            const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
            const startOffset = (firstDayOfWeek + 6) % 7;
            const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

            return (
              <View>
                {/* Month navigation */}
                <View style={styles.monthNav}>
                  <Pressable
                    onPress={() => {
                      if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
                      else setViewMonth(viewMonth - 1);
                    }}
                    style={styles.monthNavButton}
                    accessibilityLabel="Previous month"
                  >
                    <Ionicons name="chevron-back" size={20} color="#4A7C59" />
                  </Pressable>
                  <Text style={styles.monthNavTitle}>{monthName}</Text>
                  <Pressable
                    onPress={() => {
                      if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
                      else setViewMonth(viewMonth + 1);
                    }}
                    style={styles.monthNavButton}
                    accessibilityLabel="Next month"
                  >
                    <Ionicons name="chevron-forward" size={20} color="#4A7C59" />
                  </Pressable>
                </View>

                {/* Calendar grid */}
                <View style={styles.calendarCard}>
                  <View style={styles.calendarRow}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                      <View key={`hdr-${i}`} style={styles.calendarCell}>
                        <Text style={styles.calendarHeaderText}>{d}</Text>
                      </View>
                    ))}
                  </View>
                  {(() => {
                    const rows: React.ReactNode[] = [];
                    let dayIndex = 0;
                    const totalCells = startOffset + monthDays.length;
                    const rowCount = Math.ceil(totalCells / 7);
                    for (let row = 0; row < rowCount; row++) {
                      const cells: React.ReactNode[] = [];
                      for (let col = 0; col < 7; col++) {
                        const cellIndex = row * 7 + col;
                        if (cellIndex < startOffset || dayIndex >= monthDays.length) {
                          cells.push(<View key={`empty-${cellIndex}`} style={styles.calendarCell} />);
                        } else {
                          const day = monthDays[dayIndex];
                          const dayNum = dayIndex + 1;
                          dayIndex++;
                          cells.push(
                            <View key={day.date} style={styles.calendarCell}>
                              <View style={[styles.calendarDot, { backgroundColor: STATUS_COLOURS[day.status] }]}>
                                <Text style={styles.calendarDotText}>{dayNum}</Text>
                              </View>
                            </View>
                          );
                        }
                      }
                      rows.push(<View key={`row-${row}`} style={styles.calendarRow}>{cells}</View>);
                    }
                    return rows;
                  })()}
                  <View style={styles.calendarLegend}>
                    {(['complete', 'partial', 'missed', 'pending'] as DayStatus[]).map((s) => (
                      <View key={s} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: STATUS_COLOURS[s] }]} />
                        <Text style={styles.legendText}>{STATUS_LABELS[s]}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Month summary */}
                <View style={styles.monthSummary}>
                  <View style={styles.statsRow}>
                    <StatCard icon={<Ionicons name="checkbox" size={24} color="#4A7C59" />} label="Prayers" value={summary.totalPrayers} />
                    <View style={styles.gridGap} />
                    <StatCard icon={<Ionicons name="calendar" size={24} color="#4A7C59" />} label="Complete Days" value={summary.completeDays} />
                  </View>
                  <View style={styles.statsRow}>
                    <StatCard icon={<Ionicons name="trending-up" size={24} color="#4A7C59" />} label="Completion" value={`${summary.completionRate}%`} />
                    <View style={styles.gridGap} />
                    <StatCard icon={<Ionicons name="book" size={24} color="#7B8FA6" />} label="Qur'an Days" value={summary.quranDays} />
                  </View>
                </View>
              </View>
            );
          })()}

          {timeView === 'year' && (() => {
            const yearData = getYearSummary(heatmapYear, prayerLogs);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const bestMonthName = monthNames[yearData.bestMonth.month];

            return (
              <View>
                {/* Year navigation */}
                <View style={styles.monthNav}>
                  <Pressable
                    onPress={() => setHeatmapYear(heatmapYear - 1)}
                    style={styles.monthNavButton}
                    accessibilityLabel="Previous year"
                  >
                    <Ionicons name="chevron-back" size={20} color="#4A7C59" />
                  </Pressable>
                  <Text style={styles.monthNavTitle}>{heatmapYear}</Text>
                  <Pressable
                    onPress={() => setHeatmapYear(heatmapYear + 1)}
                    style={styles.monthNavButton}
                    accessibilityLabel="Next year"
                  >
                    <Ionicons name="chevron-forward" size={20} color="#4A7C59" />
                  </Pressable>
                </View>

                {/* Year heatmap — monthly bars */}
                <View style={styles.calendarCard}>
                  {yearData.months.map((m, i) => (
                    <View key={i} style={styles.yearMonthRow}>
                      <Text style={styles.yearMonthLabel}>{monthNames[i]}</Text>
                      <View style={styles.yearBarTrack}>
                        <View
                          style={[
                            styles.yearBarFill,
                            {
                              width: `${m.completionRate}%`,
                              backgroundColor: m.completionRate >= 80 ? '#4A7C59' : m.completionRate >= 50 ? '#D4A017' : m.completionRate > 0 ? '#C0392B' : '#E8ECE5',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.yearBarValue}>{m.eligibleDays > 0 ? `${m.completionRate}%` : '—'}</Text>
                    </View>
                  ))}
                </View>

                {/* Year summary */}
                <View style={styles.monthSummary}>
                  <View style={styles.statsRow}>
                    <StatCard icon={<Ionicons name="checkbox" size={24} color="#4A7C59" />} label="Prayers" value={yearData.totalPrayers} />
                    <View style={styles.gridGap} />
                    <StatCard icon={<Ionicons name="calendar" size={24} color="#4A7C59" />} label="Complete Days" value={yearData.completeDays} />
                  </View>
                  <View style={styles.statsRow}>
                    <StatCard icon={<Ionicons name="trending-up" size={24} color="#4A7C59" />} label="Completion" value={`${yearData.completionRate}%`} />
                    <View style={styles.gridGap} />
                    <StatCard icon={<Ionicons name="star" size={24} color="#C4A020" />} label="Best Month" value={yearData.bestMonth.eligibleDays > 0 ? bestMonthName : '—'} />
                  </View>
                </View>
              </View>
            );
          })()}
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

          {statsView === 'current' && (
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard icon={<Ionicons name="leaf" size={24} color="#4A7C59" />} label="Living Trees" value={worldState.trees.length} />
                <View style={styles.gridGap} />
                <StatCard icon={<Ionicons name="flower" size={24} color="#D4849A" />} label="Flowers" value={worldState.flowers.length} />
              </View>
              <View style={styles.statsRow}>
                <StatCard icon={<Ionicons name="home" size={24} color="#7B8FA6" />} label="Buildings" value={worldState.buildings.length} />
                <View style={styles.gridGap} />
                <StatCard icon={<Ionicons name="paw" size={24} color="#A0856A" />} label="Animals" value={worldState.animals.length} />
              </View>
              <View style={styles.statsRow}>
                <StatCard icon={<Ionicons name="star" size={24} color="#C4A020" />} label="Illustrious Gifts" value={worldState.illustriousItems.length} />
                <View style={styles.gridGap} />
                <StatCard icon={<Ionicons name="calendar" size={24} color="#4A7C59" />} label="Complete Days" value={totalDaysComplete} />
              </View>
            </View>
          )}

          {statsView === 'allTime' && (
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard icon={<Ionicons name="checkbox" size={24} color="#4A7C59" />} label="Prayers Logged" value={totalPrayersLogged} />
                <View style={styles.gridGap} />
                <StatCard icon={<Ionicons name="calendar" size={24} color="#4A7C59" />} label="Complete Days" value={totalDaysComplete} />
              </View>
              <View style={styles.statsRow}>
                <StatCard icon={<Ionicons name="leaf" size={24} color="#4A7C59" />} label="Trees Grown" value={statistics.totalTreesGrown} />
                <View style={styles.gridGap} />
                <StatCard icon={<Ionicons name="leaf-outline" size={24} color="#8B9D83" />} label="Trees Returned" value={statistics.totalTreesDecayed} />
              </View>
              <View style={styles.statsRow}>
                <StatCard icon={<Ionicons name="home" size={24} color="#7B8FA6" />} label="Buildings" value={statistics.totalBuildingsCreated} />
                <View style={styles.gridGap} />
                <StatCard icon={<Ionicons name="home-outline" size={24} color="#9BAAB8" />} label="Buildings Returned" value={statistics.totalBuildingsReturned ?? 0} />
              </View>
              <View style={styles.statsRow}>
                <StatCard icon={<Ionicons name="paw" size={24} color="#A0856A" />} label="Animals" value={statistics.totalAnimalsAppeared} />
                <View style={styles.gridGap} />
                <StatCard icon={<Ionicons name="paw-outline" size={24} color="#B8A08A" />} label="Animals Returned" value={statistics.totalAnimalsReturned ?? 0} />
              </View>
            </View>
          )}
        </View>

        {/* Garden age */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your World</Text>
          <View style={styles.worldCard}>
            <View style={styles.worldRow}>
              <View style={styles.worldLabelRow}>
                <Ionicons name="time" size={18} color="#7B8FA6" style={{ marginRight: 8 }} />
                <Text style={styles.worldLabel}>Garden age</Text>
              </View>
              <Text style={styles.worldValue}>
                {gardenAge} {gardenAge === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <Pressable
          style={({ pressed }) => [
            styles.settingsButton,
            pressed && styles.settingsButtonPressed,
          ]}
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <Ionicons name="settings-outline" size={16} color="#4A7C59" style={{ marginRight: 6 }} />
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF3EC',
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

  /* ── Empty state ── */
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C4A3E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8B9D83',
    textAlign: 'center',
    lineHeight: 22,
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
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 16,
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },

  /* ── Sections ── */
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C4A3E',
    letterSpacing: 0.3,
    marginBottom: 12,
  },

  /* ── Toggle ── */
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E0E5DD',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#2C4A3E',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B9D83',
  },
  toggleTextActive: {
    color: '#2C4A3E',
    fontWeight: '700',
  },

  /* ── 7-day history ── */
  weekCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECE5',
    paddingVertical: 14,
    paddingHorizontal: 10,
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
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  weekRowLabel: {
    width: 28,
    alignItems: 'center',
  },
  weekRowIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#8B9D83',
  },
  dayDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayDotText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dayCount: {
    fontSize: 10,
    color: '#8B9D83',
    fontWeight: '500',
  },
  dayLabelToday: {
    fontWeight: '700',
    color: '#4A7C59',
  },
  weekIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekIndicatorActive: {
    backgroundColor: '#4A7C59',
  },
  weekIndicatorInactive: {
    backgroundColor: '#E8ECE5',
  },

  /* ── Stats grid ── */
  statsGrid: {
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  gridGap: {
    width: 10,
  },

  /* ── Month navigation ── */
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthNavTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C4A3E',
  },

  /* ── Calendar grid ── */
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECE5',
    padding: 14,
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
  calendarRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calendarCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  calendarHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B9D83',
  },
  calendarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDotText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* ── Calendar legend ── */
  calendarLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8ECE5',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#8B9D83',
  },

  /* ── Month summary ── */
  monthSummary: {
    marginTop: 12,
    gap: 10,
  },

  /* ── Year heatmap ── */
  yearMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  yearMonthLabel: {
    width: 32,
    fontSize: 12,
    fontWeight: '600',
    color: '#8B9D83',
  },
  yearBarTrack: {
    flex: 1,
    height: 16,
    backgroundColor: '#E8ECE5',
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  yearBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  yearBarValue: {
    width: 36,
    fontSize: 12,
    fontWeight: '600',
    color: '#2C4A3E',
    textAlign: 'right',
  },

  /* ── World summary ── */
  worldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECE5',
    padding: 16,
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
  worldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  worldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  worldLabel: {
    fontSize: 15,
    color: '#8B9D83',
    fontWeight: '500',
  },
  worldValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C4A3E',
  },

  /* ── Settings ── */
  settingsButton: {
    flexDirection: 'row',
    marginTop: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C4D4B8',
    backgroundColor: 'rgba(74, 124, 89, 0.04)',
  },
  settingsButtonPressed: {
    backgroundColor: 'rgba(74, 124, 89, 0.12)',
  },
  settingsText: {
    fontSize: 14,
    color: '#4A7C59',
    fontWeight: '600',
  },
});

import { PrayerLogic } from '../logic/prayerLogic';
import { PrayerLog } from '../types/models';

function makeLog(date: string, complete: boolean): PrayerLog {
  return {
    id: `prayer_${date}`,
    date,
    prayers: {
      Fajr: complete,
      Dhuhr: complete,
      Asr: complete,
      Maghrib: complete,
      Isha: complete,
    },
    isComplete: complete,
    quranLogged: false,
    dhikrLogged: false,
    timestamp: 0,
  };
}

describe('PrayerLogic', () => {
  describe('createPrayerLog', () => {
    it('creates a log with all prayers unlogged', () => {
      const log = PrayerLogic.createPrayerLog('2026-03-01');
      expect(log.date).toBe('2026-03-01');
      expect(log.isComplete).toBe(false);
      expect(Object.values(log.prayers).every((v) => v === false)).toBe(true);
    });
  });

  describe('logPrayer', () => {
    it('marks a single prayer as logged', () => {
      const log = PrayerLogic.createPrayerLog('2026-03-01');
      const updated = PrayerLogic.logPrayer(log, 'Fajr');
      expect(updated.prayers.Fajr).toBe(true);
      expect(updated.isComplete).toBe(false);
    });

    it('marks isComplete when all 5 prayers are logged', () => {
      let log = PrayerLogic.createPrayerLog('2026-03-01');
      log = PrayerLogic.logPrayer(log, 'Fajr');
      log = PrayerLogic.logPrayer(log, 'Dhuhr');
      log = PrayerLogic.logPrayer(log, 'Asr');
      log = PrayerLogic.logPrayer(log, 'Maghrib');
      log = PrayerLogic.logPrayer(log, 'Isha');
      expect(log.isComplete).toBe(true);
    });
  });

  describe('logQuran / logDhikr', () => {
    it('sets quranLogged to true', () => {
      const log = PrayerLogic.createPrayerLog('2026-03-01');
      expect(PrayerLogic.logQuran(log).quranLogged).toBe(true);
    });

    it('sets dhikrLogged to true', () => {
      const log = PrayerLogic.createPrayerLog('2026-03-01');
      expect(PrayerLogic.logDhikr(log).dhikrLogged).toBe(true);
    });
  });

  describe('countConsecutiveDays', () => {
    it('returns 0 for empty logs', () => {
      expect(PrayerLogic.countConsecutiveDays([])).toBe(0);
    });

    it('counts consecutive complete days ending today', () => {
      const today = PrayerLogic.getTodayDate();
      const yesterday = PrayerLogic.getPreviousDate(today);
      const dayBefore = PrayerLogic.getPreviousDate(yesterday);

      const logs = [
        makeLog(dayBefore, true),
        makeLog(yesterday, true),
        makeLog(today, true),
      ];
      expect(PrayerLogic.countConsecutiveDays(logs)).toBe(3);
    });

    it('stops counting at a gap', () => {
      const today = PrayerLogic.getTodayDate();
      const yesterday = PrayerLogic.getPreviousDate(today);
      const dayBefore = PrayerLogic.getPreviousDate(yesterday);

      const logs = [
        makeLog(dayBefore, true),
        makeLog(yesterday, false),
        makeLog(today, true),
      ];
      expect(PrayerLogic.countConsecutiveDays(logs)).toBe(1);
    });
  });

  describe('date helpers', () => {
    it('getPreviousDate returns the day before', () => {
      expect(PrayerLogic.getPreviousDate('2026-03-01')).toBe('2026-02-28');
    });

    it('getNextDate returns the day after', () => {
      expect(PrayerLogic.getNextDate('2026-02-28')).toBe('2026-03-01');
    });

    it('getNextDate advances correctly across DST boundaries', () => {
      // US DST spring-forward: 2026-03-08. Previously caused infinite loop
      // because local-time getDate() returned the wrong day on DST transitions.
      expect(PrayerLogic.getNextDate('2026-03-07')).toBe('2026-03-08');
      expect(PrayerLogic.getNextDate('2026-03-08')).toBe('2026-03-09');
      expect(PrayerLogic.getNextDate('2026-03-09')).toBe('2026-03-10');
      // US DST fall-back: 2026-11-01
      expect(PrayerLogic.getNextDate('2026-10-31')).toBe('2026-11-01');
      expect(PrayerLogic.getNextDate('2026-11-01')).toBe('2026-11-02');
    });

    it('getPreviousDate retreats correctly across DST boundaries', () => {
      expect(PrayerLogic.getPreviousDate('2026-03-09')).toBe('2026-03-08');
      expect(PrayerLogic.getPreviousDate('2026-03-08')).toBe('2026-03-07');
      expect(PrayerLogic.getPreviousDate('2026-11-02')).toBe('2026-11-01');
      expect(PrayerLogic.getPreviousDate('2026-11-01')).toBe('2026-10-31');
    });
  });

  describe('wasDayMissed', () => {
    it('returns true when no log exists', () => {
      expect(PrayerLogic.wasDayMissed([], '2026-03-01')).toBe(true);
    });

    it('returns true when log is incomplete', () => {
      const logs = [makeLog('2026-03-01', false)];
      expect(PrayerLogic.wasDayMissed(logs, '2026-03-01')).toBe(true);
    });

    it('returns false when log is complete', () => {
      const logs = [makeLog('2026-03-01', true)];
      expect(PrayerLogic.wasDayMissed(logs, '2026-03-01')).toBe(false);
    });

    it('returns false for a rest day (not counted as missed)', () => {
      const logs = [{ ...makeLog('2026-03-01', false), isRestDay: true }];
      expect(PrayerLogic.wasDayMissed(logs, '2026-03-01')).toBe(false);
    });
  });

  describe('rest days and the streak', () => {
    it('markRestDay creates a rest-marked log when none exists', () => {
      const result = PrayerLogic.markRestDay([], '2026-03-05');
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-03-05');
      expect(result[0].isRestDay).toBe(true);
      expect(result[0].isComplete).toBe(false);
    });

    it('markRestDay never marks a completed day as rest', () => {
      const logs = [makeLog('2026-03-05', true)];
      expect(PrayerLogic.markRestDay(logs, '2026-03-05')).toBe(logs);
      expect(logs[0].isRestDay).toBeUndefined();
    });

    it('logging to completion clears a rest-day flag', () => {
      let log: PrayerLog = { ...PrayerLogic.createPrayerLog('2026-03-05'), isRestDay: true };
      for (const p of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const) {
        log = PrayerLogic.logPrayer(log, p);
      }
      expect(log.isComplete).toBe(true);
      expect(log.isRestDay).toBe(false);
    });

    it('rest days do not break the streak — it bridges across them', () => {
      // Prayed 1-2 Mar, rested 3-9 Mar (7 rest days), prayed again 10 Mar.
      const logs: PrayerLog[] = [
        makeLog('2026-03-01', true),
        makeLog('2026-03-02', true),
        ...['03', '04', '05', '06', '07', '08', '09'].map((d) => ({
          ...makeLog(`2026-03-${d}`, false),
          isRestDay: true,
        })),
        makeLog('2026-03-10', true),
      ];
      // 3 real complete days (1, 2, 10) with the rest gap treated as transparent.
      expect(PrayerLogic.countConsecutiveDaysFrom(logs, '2026-03-10')).toBe(3);
    });

    it('a genuine missed day still breaks the streak', () => {
      const logs: PrayerLog[] = [
        makeLog('2026-03-01', true),
        makeLog('2026-03-02', false), // genuine miss (not rest)
        makeLog('2026-03-03', true),
      ];
      expect(PrayerLogic.countConsecutiveDaysFrom(logs, '2026-03-03')).toBe(1);
    });
  });

  // ================================================================
  // Edge-case coverage
  // ================================================================

  describe('date boundary edge cases', () => {
    it('handles year boundary correctly (Dec 31 → Jan 1)', () => {
      expect(PrayerLogic.getNextDate('2025-12-31')).toBe('2026-01-01');
      expect(PrayerLogic.getPreviousDate('2026-01-01')).toBe('2025-12-31');
    });

    it('handles leap year day (Feb 28 → Feb 29 in leap year)', () => {
      // 2024 is a leap year
      expect(PrayerLogic.getNextDate('2024-02-28')).toBe('2024-02-29');
      expect(PrayerLogic.getNextDate('2024-02-29')).toBe('2024-03-01');
    });

    it('handles non-leap year Feb boundary', () => {
      // 2025 is not a leap year
      expect(PrayerLogic.getNextDate('2025-02-28')).toBe('2025-03-01');
      expect(PrayerLogic.getPreviousDate('2025-03-01')).toBe('2025-02-28');
    });

    it('handles month-end boundaries (30-day months)', () => {
      expect(PrayerLogic.getNextDate('2026-04-30')).toBe('2026-05-01');
      expect(PrayerLogic.getPreviousDate('2026-05-01')).toBe('2026-04-30');
    });

    it('handles month-end boundaries (31-day months)', () => {
      expect(PrayerLogic.getNextDate('2026-01-31')).toBe('2026-02-01');
      expect(PrayerLogic.getPreviousDate('2026-02-01')).toBe('2026-01-31');
    });
  });

  describe('getOrCreatePrayerLog edge cases', () => {
    it('returns existing log when date matches', () => {
      const existing = makeLog('2026-06-15', true);
      const result = PrayerLogic.getOrCreatePrayerLog([existing], '2026-06-15');
      expect(result).toBe(existing);
      expect(result.isComplete).toBe(true);
    });

    it('creates a new log when no match exists', () => {
      const existing = makeLog('2026-06-15', true);
      const result = PrayerLogic.getOrCreatePrayerLog([existing], '2026-06-16');
      expect(result.date).toBe('2026-06-16');
      expect(result.isComplete).toBe(false);
    });

    it('returns correct log when multiple logs exist', () => {
      const logs = [
        makeLog('2026-06-14', true),
        makeLog('2026-06-15', false),
        makeLog('2026-06-16', true),
      ];
      const result = PrayerLogic.getOrCreatePrayerLog(logs, '2026-06-15');
      expect(result.date).toBe('2026-06-15');
      expect(result.isComplete).toBe(false);
    });
  });

  describe('partial prayer logging', () => {
    it('is not complete when only some prayers are logged', () => {
      let log = PrayerLogic.createPrayerLog('2026-05-01');
      log = PrayerLogic.logPrayer(log, 'Fajr');
      log = PrayerLogic.logPrayer(log, 'Dhuhr');
      log = PrayerLogic.logPrayer(log, 'Asr');
      expect(log.isComplete).toBe(false);
      expect(log.prayers.Maghrib).toBe(false);
      expect(log.prayers.Isha).toBe(false);
    });

    it('logging the same prayer twice has no adverse effect', () => {
      let log = PrayerLogic.createPrayerLog('2026-05-01');
      log = PrayerLogic.logPrayer(log, 'Fajr');
      log = PrayerLogic.logPrayer(log, 'Fajr');
      expect(log.prayers.Fajr).toBe(true);
      expect(log.isComplete).toBe(false);
    });

    it('quran and dhikr do not affect completion', () => {
      let log = PrayerLogic.createPrayerLog('2026-05-01');
      log = PrayerLogic.logQuran(log);
      log = PrayerLogic.logDhikr(log);
      expect(log.quranLogged).toBe(true);
      expect(log.dhikrLogged).toBe(true);
      expect(log.isComplete).toBe(false);
    });
  });

  describe('countConsecutiveDays edge cases', () => {
    it('returns 0 when only incomplete logs exist', () => {
      const today = PrayerLogic.getTodayDate();
      const logs = [makeLog(today, false)];
      expect(PrayerLogic.countConsecutiveDays(logs)).toBe(0);
    });

    it('returns 0 when complete logs exist but not for today', () => {
      const today = PrayerLogic.getTodayDate();
      const twoDaysAgo = PrayerLogic.getPreviousDate(
        PrayerLogic.getPreviousDate(today)
      );
      const logs = [makeLog(twoDaysAgo, true)];
      expect(PrayerLogic.countConsecutiveDays(logs)).toBe(0);
    });

    it('handles a single complete day (today)', () => {
      const today = PrayerLogic.getTodayDate();
      const logs = [makeLog(today, true)];
      expect(PrayerLogic.countConsecutiveDays(logs)).toBe(1);
    });

    it('ignores incomplete logs interleaved with complete ones', () => {
      const today = PrayerLogic.getTodayDate();
      const yesterday = PrayerLogic.getPreviousDate(today);
      const logs = [
        makeLog(yesterday, false), // incomplete — breaks streak
        makeLog(today, true),
      ];
      expect(PrayerLogic.countConsecutiveDays(logs)).toBe(1);
    });

    it('handles unsorted input correctly', () => {
      const today = PrayerLogic.getTodayDate();
      const yesterday = PrayerLogic.getPreviousDate(today);
      const dayBefore = PrayerLogic.getPreviousDate(yesterday);
      // Deliberately out of order
      const logs = [
        makeLog(today, true),
        makeLog(dayBefore, true),
        makeLog(yesterday, true),
      ];
      expect(PrayerLogic.countConsecutiveDays(logs)).toBe(3);
    });
  });
});

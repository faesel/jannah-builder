import { SeasonLogic } from '../logic/seasonLogic';
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

/** Generate consecutive complete logs ending on `endDate`. */
function makeConsecutiveLogs(endDate: string, count: number): PrayerLog[] {
  const logs: PrayerLog[] = [];
  let cursor = endDate;
  for (let i = 0; i < count; i++) {
    logs.push(makeLog(cursor, true));
    const d = new Date(cursor);
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().split('T')[0];
  }
  return logs;
}

describe('SeasonLogic', () => {
  describe('determineSeason', () => {
    it('defaults to spring with no history', () => {
      expect(SeasonLogic.determineSeason([], '2026-03-01')).toBe('spring');
    });

    it('returns summer after 14+ consecutive days', () => {
      const logs = makeConsecutiveLogs('2026-03-01', 14);
      expect(SeasonLogic.determineSeason(logs, '2026-03-01')).toBe('summer');
    });

    it('returns autumn after 3-6 missed days', () => {
      // Last complete day was 4 days ago
      const logs = [makeLog('2026-02-25', true)];
      expect(SeasonLogic.determineSeason(logs, '2026-03-01')).toBe('autumn');
    });

    it('returns winter after 7+ missed days', () => {
      const logs = [makeLog('2026-02-20', true)];
      expect(SeasonLogic.determineSeason(logs, '2026-03-01')).toBe('winter');
    });

    it('returns spring for short streak with no gap', () => {
      const logs = makeConsecutiveLogs('2026-03-01', 5);
      expect(SeasonLogic.determineSeason(logs, '2026-03-01')).toBe('spring');
    });
  });

  describe('countStreakUpTo', () => {
    it('returns 0 when the date is not complete', () => {
      const logs = [makeLog('2026-03-01', false)];
      expect(SeasonLogic.countStreakUpTo(logs, '2026-03-01')).toBe(0);
    });

    it('counts consecutive complete days backward', () => {
      const logs = makeConsecutiveLogs('2026-03-01', 5);
      expect(SeasonLogic.countStreakUpTo(logs, '2026-03-01')).toBe(5);
    });
  });

  describe('countGapUpTo', () => {
    it('returns 0 when the date is complete', () => {
      const logs = [makeLog('2026-03-01', true)];
      expect(SeasonLogic.countGapUpTo(logs, '2026-03-01')).toBe(0);
    });

    it('counts consecutive missed days backward', () => {
      // Complete on Feb 25, then nothing until Mar 1
      const logs = [makeLog('2026-02-25', true)];
      // Gap: Feb 26, 27, 28, Mar 1 = 4 days
      expect(SeasonLogic.countGapUpTo(logs, '2026-03-01')).toBe(4);
    });
  });

  describe('evaluateSeasonChange', () => {
    it('detects a change from spring to summer', () => {
      const logs = makeConsecutiveLogs('2026-03-01', 14);
      const result = SeasonLogic.evaluateSeasonChange('spring', logs, '2026-03-01');
      expect(result.changed).toBe(true);
      expect(result.newSeason).toBe('summer');
    });

    it('returns unchanged when season stays the same', () => {
      const logs = makeConsecutiveLogs('2026-03-01', 5);
      const result = SeasonLogic.evaluateSeasonChange('spring', logs, '2026-03-01');
      expect(result.changed).toBe(false);
      expect(result.newSeason).toBe('spring');
    });
  });
});

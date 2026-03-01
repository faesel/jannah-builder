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
  });
});

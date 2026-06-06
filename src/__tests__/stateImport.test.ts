import { parseImportedState, reconcileLifetime } from '../logic/stateImport';

function makeTree(i: number) {
  return {
    id: `tree_${i}`,
    stage: 'mature',
    position: { x: i, y: 0 },
    createdAt: 0,
    lastUpdated: 0,
  };
}

function makeAnimal(i: number) {
  return {
    id: `animal_${i}`,
    type: 'black_cat',
    position: { x: i, y: 0 },
    createdAt: 0,
  };
}

function makeLog(date: string, allPrayers: boolean, quran = false, dhikr = false) {
  const p = allPrayers;
  return {
    id: `log_${date}`,
    date,
    prayers: { Fajr: p, Dhuhr: p, Asr: p, Maghrib: p, Isha: p },
    isComplete: p,
    quranLogged: quran,
    dhikrLogged: dhikr,
    timestamp: Date.parse(date),
  };
}

function baseExport(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    exportedAt: '2026-06-06T00:00:00.000Z',
    appVersion: '2.13.1',
    profile: {
      id: 'profile_test',
      name: 'Test Garden',
      createdAt: 1000,
      lastActive: 2000,
      worldState: {
        trees: [makeTree(0), makeTree(1)],
        flowers: [],
        dhikrFlowers: [],
        obstacles: [],
        buildings: [],
        animals: [makeAnimal(0), makeAnimal(1)],
        rivers: [],
        illustriousItems: [],
        mapSize: { width: 10, height: 10 },
        gridSize: 10,
        lastUpdated: 2000,
      },
      prayerLogs: [],
      statistics: {},
      streaks: {},
      ...overrides,
    },
  });
}

describe('reconcileLifetime', () => {
  it('leaves a consistent trio untouched', () => {
    expect(reconcileLifetime(7, 0, 7)).toEqual({ appeared: 7, returned: 0, changed: false });
  });

  it('raises returned when appeared exceeds current (inflated animal counter)', () => {
    expect(reconcileLifetime(3, 0, 2)).toEqual({ appeared: 3, returned: 1, changed: true });
  });

  it('raises appeared when current exceeds appeared', () => {
    expect(reconcileLifetime(1, 0, 3)).toEqual({ appeared: 3, returned: 0, changed: true });
  });

  it('clamps negative inputs to zero', () => {
    expect(reconcileLifetime(-5, -2, 0)).toEqual({ appeared: 0, returned: 0, changed: false });
  });
});

describe('parseImportedState', () => {
  it('rejects invalid JSON', () => {
    const result = parseImportedState('{ not json');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/JSON/i);
  });

  it('rejects a file with no garden data', () => {
    const result = parseImportedState(JSON.stringify({ hello: 'world' }));
    expect(result.ok).toBe(false);
  });

  it('imports a valid export envelope', () => {
    const result = parseImportedState(baseExport());
    expect(result.ok).toBe(true);
    expect(result.profile?.id).toBe('profile_test');
    expect(result.profile?.name).toBe('Test Garden');
    expect(result.profile?.worldState.trees).toHaveLength(2);
  });

  it('accepts a bare profile object (no envelope)', () => {
    const envelope = JSON.parse(baseExport());
    const result = parseImportedState(JSON.stringify(envelope.profile));
    expect(result.ok).toBe(true);
    expect(result.profile?.worldState.animals).toHaveLength(2);
  });

  it('reconciles inflated animal counters against the map', () => {
    const result = parseImportedState(
      baseExport({
        statistics: { totalAnimalsAppeared: 3, totalAnimalsReturned: 0 },
      })
    );
    expect(result.ok).toBe(true);
    expect(result.profile?.statistics.totalAnimalsAppeared).toBe(3);
    expect(result.profile?.statistics.totalAnimalsReturned).toBe(1);
    expect(result.repairs?.some((r) => /animal/i.test(r))).toBe(true);
  });

  it('leaves consistent tree totals (grown 10, decayed 8, 2 on map) untouched', () => {
    const result = parseImportedState(
      baseExport({
        statistics: { totalTreesGrown: 10, totalTreesDecayed: 8 },
      })
    );
    expect(result.profile?.statistics.totalTreesGrown).toBe(10);
    expect(result.profile?.statistics.totalTreesDecayed).toBe(8);
    expect(result.repairs?.some((r) => /tree/i.test(r))).toBe(false);
  });

  it('recomputes derivable stats from prayer logs', () => {
    const now = Date.parse('2026-01-11T00:00:00.000Z');
    const result = parseImportedState(
      baseExport({
        prayerLogs: [
          makeLog('2026-01-01', true),
          makeLog('2026-01-02', true),
          makeLog('2026-01-03', false),
        ],
        statistics: { totalPrayersLogged: 999, totalDaysComplete: 999, mapAge: 999 },
      }),
      now
    );
    expect(result.profile?.statistics.totalPrayersLogged).toBe(10); // 5 + 5 + 0
    expect(result.profile?.statistics.totalDaysComplete).toBe(2);
    expect(result.profile?.statistics.mapAge).toBe(10); // Jan 1 -> Jan 11
  });

  it('default-fills missing world arrays', () => {
    const result = parseImportedState(
      baseExport({ worldState: { trees: [makeTree(0)] } })
    );
    expect(result.ok).toBe(true);
    expect(result.profile?.worldState.flowers).toEqual([]);
    expect(result.profile?.worldState.obstacles).toEqual([]);
    expect(result.profile?.worldState.animals).toEqual([]);
    expect(result.profile?.worldState.gridSize).toBeGreaterThan(0);
  });

  it('drops malformed prayer logs', () => {
    const result = parseImportedState(
      baseExport({ prayerLogs: [makeLog('2026-01-01', true), { nonsense: true }, null] })
    );
    expect(result.profile?.prayerLogs).toHaveLength(1);
  });

  it('falls back to a default name when missing', () => {
    const result = parseImportedState(baseExport({ name: '   ' }));
    expect(result.profile?.name).toBe('My Journey');
  });

  it('preserves valid placement bounds from the export', () => {
    const result = parseImportedState(
      baseExport({
        worldState: { trees: [makeTree(0)], placementBounds: { halfX: 9, halfY: 19 } },
      })
    );
    expect(result.profile?.worldState.placementBounds).toEqual({ halfX: 9, halfY: 19 });
  });

  it('drops malformed placement bounds', () => {
    const result = parseImportedState(
      baseExport({
        worldState: { trees: [makeTree(0)], placementBounds: { halfX: 'wide' } },
      })
    );
    expect(result.profile?.worldState.placementBounds).toBeUndefined();
  });

  it('drops malformed world elements that would crash rendering', () => {
    const result = parseImportedState(
      baseExport({
        worldState: {
          trees: [
            makeTree(0),
            { id: 'bad', stage: 'mature', position: { x: 'nope', y: 1 } },
            { id: 'bad2', stage: 'not_a_stage', position: { x: 1, y: 1 } },
            null,
          ],
          animals: [makeAnimal(0), { id: 'a', type: 'dragon', position: { x: 1, y: 1 } }],
          buildings: [{ id: 'b', type: 'home', position: { x: 1, y: 1 } }], // missing condition
        },
      })
    );
    expect(result.ok).toBe(true);
    expect(result.profile?.worldState.trees).toHaveLength(1);
    expect(result.profile?.worldState.animals).toHaveLength(1);
    expect(result.profile?.worldState.buildings).toHaveLength(0);
  });
});

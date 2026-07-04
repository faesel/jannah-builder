/**
 * State Import
 *
 * Pure, testable logic for restoring a profile from an exported JSON file.
 *
 * Importing serves two gentle purposes:
 *   1. Recovering a garden after the app (and its local storage) was removed.
 *   2. Quietly repairing historic inconsistencies in a saved state — for
 *      example a lifetime counter that drifted ahead of what is on the map —
 *      without ever removing anything the user can currently see.
 *
 * In keeping with the project's philosophy, repairs only ever reconcile
 * bookkeeping. Visible progress (trees, animals, buildings on the map) is
 * always preserved; only the supporting "lifetime" tallies are nudged back
 * into agreement with it.
 */

import { UserProfile, WorldState, Statistics, StreakData, PrayerLog } from '../types/models';
import { GAME_CONFIG } from '../config/game.config';

export interface ImportResult {
  ok: boolean;
  profile?: UserProfile;
  /** Human-readable, neutral notes about any reconciliation that was applied. */
  repairs?: string[];
  /** Present only when ok is false. */
  error?: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asNonNegativeInt(value: unknown): number {
  const n = asNumber(value, 0);
  return n > 0 ? Math.floor(n) : 0;
}

const TREE_STAGES = new Set<string>(GAME_CONFIG.trees.growthStages as readonly string[]);
const FLOWER_VARIETIES = new Set<string>(GAME_CONFIG.world.flowers.varieties as readonly string[]);
const OBSTACLE_TYPES = new Set<string>(GAME_CONFIG.world.obstacles.types as readonly string[]);
const MUSHROOM_COLORS = new Set<string>(GAME_CONFIG.world.mushrooms.colors as readonly string[]);
const ILLUSTRIOUS_TYPES = new Set<string>(GAME_CONFIG.illustriousItems.types as readonly string[]);
const DHIKR_FLOWER_TYPES = new Set<string>(['basic', 'bush']);
const BUILDING_TYPES = new Set<string>(['home', 'mansion', 'palace']);
const BUILDING_CONDITIONS = new Set<string>(['good', 'dilapidated']);
const ANIMAL_TYPES = new Set<string>(['bird', 'rabbit', 'deer', 'squirrel', 'black_cat']);

function isValidPosition(value: unknown): value is { x: number; y: number } {
  return (
    isObject(value) &&
    typeof value.x === 'number' &&
    Number.isFinite(value.x) &&
    typeof value.y === 'number' &&
    Number.isFinite(value.y)
  );
}

/**
 * Keep only well-formed world elements so a corrupt or outdated export can
 * never persist shapes that the renderer or game logic would later choke on.
 */
function filterValid<T>(value: unknown, predicate: (item: Record<string, unknown>) => boolean): T[] {
  return asArray<unknown>(value)
    .filter((item): item is Record<string, unknown> => isObject(item))
    .filter(predicate) as unknown as T[];
}

/**
 * Reconcile a lifetime "appeared / returned" pair with what is currently on
 * the map so that (appeared - returned) === current, without ever lowering the
 * visible count.
 *
 * - If the pair already agrees, it is left untouched.
 * - Otherwise the "returned" tally is adjusted to absorb the difference.
 * - If "appeared" is somehow lower than what is on the map, it is raised to
 *   match (someone should never have more on the map than ever appeared).
 */
export function reconcileLifetime(
  appeared: number,
  returned: number,
  current: number
): { appeared: number; returned: number; changed: boolean } {
  let a = asNonNegativeInt(appeared);
  let r = asNonNegativeInt(returned);
  const c = Math.max(0, Math.floor(current));

  if (a - r === c) {
    return { appeared: a, returned: r, changed: false };
  }

  if (a >= c) {
    r = a - c;
  } else {
    a = c + r;
  }

  return { appeared: a, returned: r, changed: true };
}

function normaliseWorldState(raw: unknown, now: number): WorldState {
  const ws = isObject(raw) ? raw : {};
  const initialGrid = GAME_CONFIG.map.initialGridSize;
  const mapSize = isObject(ws.mapSize)
    ? {
        width: asNumber(ws.mapSize.width, initialGrid),
        height: asNumber(ws.mapSize.height, initialGrid),
      }
    : { width: initialGrid, height: initialGrid };

  return {
    trees: filterValid(ws.trees, (t) => isValidPosition(t.position) && TREE_STAGES.has(t.stage as string)),
    flowers: filterValid(
      ws.flowers,
      (f) => isValidPosition(f.position) && FLOWER_VARIETIES.has(f.variety as string)
    ),
    dhikrFlowers: filterValid(
      ws.dhikrFlowers,
      (f) => isValidPosition(f.position) && DHIKR_FLOWER_TYPES.has(f.type as string)
    ),
    obstacles: filterValid(
      ws.obstacles,
      (o) => isValidPosition(o.position) && OBSTACLE_TYPES.has(o.type as string)
    ),
    mushrooms: filterValid(
      ws.mushrooms,
      (m) => isValidPosition(m.position) && MUSHROOM_COLORS.has(m.color as string)
    ),
    buildings: filterValid(
      ws.buildings,
      (b) =>
        isValidPosition(b.position) &&
        BUILDING_TYPES.has(b.type as string) &&
        BUILDING_CONDITIONS.has(b.condition as string)
    ),
    animals: filterValid(
      ws.animals,
      (a) => isValidPosition(a.position) && ANIMAL_TYPES.has(a.type as string)
    ),
    rivers: filterValid(
      ws.rivers,
      (r) => Array.isArray(r.tiles) && (r.tiles as unknown[]).every(isValidPosition)
    ),
    illustriousItems: filterValid(
      ws.illustriousItems,
      (i) => isValidPosition(i.position) && ILLUSTRIOUS_TYPES.has(i.type as string)
    ),
    mapSize,
    gridSize: asNumber(ws.gridSize, initialGrid),
    lastUpdated: asNumber(ws.lastUpdated, now),
    lastProcessedDate:
      typeof ws.lastProcessedDate === 'string' ? ws.lastProcessedDate : undefined,
    placementBounds:
      isObject(ws.placementBounds) &&
      typeof ws.placementBounds.halfX === 'number' &&
      typeof ws.placementBounds.halfY === 'number'
        ? {
            halfX: Math.max(1, Math.floor(ws.placementBounds.halfX)),
            halfY: Math.max(1, Math.floor(ws.placementBounds.halfY)),
          }
        : undefined,
  };
}

function sanitisePrayerLog(raw: unknown): PrayerLog | null {
  if (!isObject(raw) || typeof raw.date !== 'string') return null;
  const p = isObject(raw.prayers) ? raw.prayers : {};
  const prayers = {
    Fajr: p.Fajr === true,
    Dhuhr: p.Dhuhr === true,
    Asr: p.Asr === true,
    Maghrib: p.Maghrib === true,
    Isha: p.Isha === true,
  };
  const completedCount = Object.values(prayers).filter(Boolean).length;
  return {
    id: typeof raw.id === 'string' ? raw.id : `log_${raw.date}`,
    date: raw.date,
    prayers,
    isComplete: completedCount === 5,
    quranLogged: raw.quranLogged === true,
    dhikrLogged: raw.dhikrLogged === true,
    timestamp: asNumber(raw.timestamp, Date.parse(raw.date) || Date.now()),
  };
}

/**
 * Recompute derivable statistics from the prayer logs and reconcile the
 * lifetime tallies against what is actually on the map. Returns the repaired
 * statistics plus neutral notes describing any change.
 */
function reconcileStatistics(
  rawStats: unknown,
  prayerLogs: PrayerLog[],
  world: WorldState,
  now: number
): { statistics: Statistics; repairs: string[] } {
  const s = isObject(rawStats) ? rawStats : {};
  const repairs: string[] = [];

  const totalPrayersLogged = prayerLogs.reduce(
    (sum, log) => sum + Object.values(log.prayers).filter(Boolean).length,
    0
  );
  const totalDaysComplete = prayerLogs.filter((log) => log.isComplete).length;

  let mapAge = 0;
  if (prayerLogs.length > 0) {
    const earliest = prayerLogs
      .map((log) => Date.parse(log.date))
      .filter((t) => Number.isFinite(t))
      .sort((a, b) => a - b)[0];
    if (Number.isFinite(earliest)) {
      mapAge = Math.max(0, Math.floor((now - earliest) / MS_PER_DAY));
    }
  }

  const trees = reconcileLifetime(
    asNonNegativeInt(s.totalTreesGrown),
    asNonNegativeInt(s.totalTreesDecayed),
    world.trees.length
  );
  if (trees.changed) {
    repairs.push('Tree totals reconciled with the trees on your map.');
  }

  const buildings = reconcileLifetime(
    asNonNegativeInt(s.totalBuildingsCreated),
    asNonNegativeInt(s.totalBuildingsReturned),
    world.buildings.length
  );
  if (buildings.changed) {
    repairs.push('Building totals reconciled with the buildings on your map.');
  }

  const animals = reconcileLifetime(
    asNonNegativeInt(s.totalAnimalsAppeared),
    asNonNegativeInt(s.totalAnimalsReturned),
    world.animals.length
  );
  if (animals.changed) {
    repairs.push('Animal totals reconciled with the animals on your map.');
  }

  const statistics: Statistics = {
    totalPrayersLogged,
    totalDaysComplete,
    totalTreesGrown: trees.appeared,
    totalTreesDecayed: trees.returned,
    totalBuildingsCreated: buildings.appeared,
    totalBuildingsReturned: buildings.returned,
    totalAnimalsAppeared: animals.appeared,
    totalAnimalsReturned: animals.returned,
    mapAge,
    currentStreak: asNonNegativeInt(s.currentStreak),
    longestStreak: asNonNegativeInt(s.longestStreak),
  };

  return { statistics, repairs };
}

function normaliseStreaks(raw: unknown, stats: Statistics): StreakData {
  const s = isObject(raw) ? raw : {};
  const longest = Math.max(asNonNegativeInt(s.longest), stats.longestStreak);
  return {
    current: asNonNegativeInt(s.current),
    longest,
    lastPrayerDate: typeof s.lastPrayerDate === 'string' ? s.lastPrayerDate : '',
    consecutiveFullDays: asNonNegativeInt(s.consecutiveFullDays),
  };
}

/**
 * Parse, validate, normalise and gently repair an exported state file.
 *
 * Accepts the export envelope `{ profile: {...} }` as written by the export
 * feature, and is also tolerant of a bare profile object.
 */
export function parseImportedState(raw: string, now: number = Date.now()): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "This file isn't valid JSON and couldn't be read." };
  }

  if (!isObject(parsed)) {
    return { ok: false, error: 'This file does not contain a saved garden.' };
  }

  // Tolerate either the export envelope or a bare profile object.
  const rawProfile = isObject(parsed.profile) ? parsed.profile : parsed;

  if (!isObject(rawProfile.worldState) && !Array.isArray(rawProfile.prayerLogs)) {
    return {
      ok: false,
      error: 'This file does not look like a Jannah Builder save.',
    };
  }

  const world = normaliseWorldState(rawProfile.worldState, now);

  const prayerLogs = asArray<unknown>(rawProfile.prayerLogs)
    .map(sanitisePrayerLog)
    .filter((log): log is PrayerLog => log !== null);

  const { statistics, repairs } = reconcileStatistics(
    rawProfile.statistics,
    prayerLogs,
    world,
    now
  );

  const streaks = normaliseStreaks(rawProfile.streaks, statistics);

  const rawSettings = isObject(rawProfile.settings) ? rawProfile.settings : undefined;
  const settings = { restMode: rawSettings?.restMode === true };

  const profile: UserProfile = {
    id: typeof rawProfile.id === 'string' ? rawProfile.id : `profile_${now}`,
    name: typeof rawProfile.name === 'string' && rawProfile.name.trim() ? rawProfile.name : 'My Journey',
    createdAt: asNumber(rawProfile.createdAt, now),
    lastActive: now,
    worldState: world,
    prayerLogs,
    statistics,
    streaks,
    settings,
  };

  return { ok: true, profile, repairs };
}

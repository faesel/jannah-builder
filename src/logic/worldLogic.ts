/**
 * World Logic
 * Processes daily game state updates based on prayer logs.
 *
 * This is the central orchestrator that calls into
 * IllustriousItemLogic, WorldElementLogic, and TreeLogic to
 * produce a single DayProcessingResult for each elapsed day.
 */

import { UserProfile, DayProcessingResult, Position } from '../types/models';
import { GAME_CONFIG } from '../config/game.config';
import { PrayerLogic } from './prayerLogic';
import { TreeLogic } from './treeLogic';
import { IllustriousItemLogic } from './illustriousItemLogic';
import { WorldElementLogic } from './worldElementLogic';
import { defaultPlacementBounds } from './placement';

export class WorldLogic {
  /**
   * Process a single date and return what changed.
   * The date parameter allows replaying missed days in order.
   */
  static processDay(
    profile: UserProfile,
    date: string
  ): DayProcessingResult {
    const result: DayProcessingResult = {
      treesAdded: [],
      treesUpgraded: [],
      treesDecayed: [],
      treesRemoved: [],
      flowersAdded: [],
      flowersUpgraded: [],
      flowersRemoved: [],
      dhikrFlowersAdded: [],
      dhikrFlowersRemoved: [],
      obstaclesAdded: [],
      obstaclesRemoved: [],
      mushroomsRemoved: [],
      buildingsAdded: [],
      buildingsDecayed: [],
      buildingsRemoved: [],
      animalsAdded: [],
      animalsRemoved: [],
      riversAdded: [],
      riversRemoved: [],
      illustriousItemsAdded: [],
      illustriousItemsRemoved: [],
    };

    const dayLog = profile.prayerLogs.find((log) => log.date === date);
    const dayComplete = dayLog?.isComplete ?? false;

    // "Rest days" mode: when enabled, a missed day causes no decay at all —
    // growth simply pauses and nothing is destroyed. A gentle, private way to
    // step back for a while without losing progress. Growth and worship-based
    // clearing (obstacles, mushrooms, barakah flowers) still apply as normal.
    const restMode = profile.settings?.restMode ?? false;

    // Placement bounds derived from the player's actual screen extent (persisted
    // in worldState). Falls back to a square default when unknown so that
    // background processing without screen access still behaves sensibly.
    const bounds = profile.worldState.placementBounds ?? defaultPlacementBounds();

    // Running set of every tile already taken by a placed asset. Threaded into
    // each spawner so no asset is ever placed on top of another (e.g. a radiant
    // fountain over a stump). New positions are appended as the day proceeds so
    // assets spawned earlier in the same day are also avoided.
    const ws = profile.worldState;
    const occupied: Position[] = [
      ...ws.trees.map((t) => t.position),
      ...ws.flowers.map((f) => f.position),
      ...(ws.dhikrFlowers ?? []).map((f) => f.position),
      ...(ws.obstacles ?? []).map((o) => o.position),
      ...(ws.mushrooms ?? []).map((m) => m.position),
      ...ws.buildings.map((b) => b.position),
      ...ws.animals.map((a) => a.position),
      ...ws.rivers.flatMap((r) => r.tiles),
      ...ws.illustriousItems.map((i) => i.position),
    ];

    // --- Trees: generation/upgrade or decay ---
    if (dayComplete) {
      const consecutiveDays = PrayerLogic.countConsecutiveDaysFrom(
        profile.prayerLogs,
        date
      );

      // A tree action is earned each time the *current* streak completes another
      // full `daysForNewTree` block. This is intentionally independent of how
      // many trees already exist: comparing against the lifetime tree count
      // meant growth stalled for many days after any streak break (the new,
      // shorter streak's target sat below the accumulated tree count), which is
      // exactly the "logged every prayer but no trees grow" symptom.
      if (TreeLogic.earnsTreeOnDay(consecutiveDays)) {
        // Prioritise upgrading an existing sapling/young tree over planting a
        // brand new one, so a player's garden matures before it spreads.
        const candidate = TreeLogic.findUpgradeCandidate(profile.worldState.trees);

        if (candidate) {
          const upgraded = TreeLogic.upgradeTree(candidate)!;
          result.treesUpgraded.push(upgraded);
        } else {
          // All existing trees are mature — create a new sapling.
          const newTrees = TreeLogic.generateTrees(
            1,
            profile.worldState.trees,
            bounds,
            occupied
          );
          result.treesAdded.push(...newTrees);
        }
      }

      // First-day seedling incentive: plant one sapling on the user's very first complete day
      if (
        GAME_CONFIG.trees.firstDaySeedling &&
        profile.worldState.trees.length === 0 &&
        result.treesAdded.length === 0 &&
        result.treesUpgraded.length === 0
      ) {
        const completeLogs = profile.prayerLogs.filter((l) => l.isComplete);
        const isFirstCompleteDay =
          completeLogs.length === 1 && completeLogs[0].date === date;
        if (isFirstCompleteDay) {
          result.treesAdded = TreeLogic.generateTrees(1, profile.worldState.trees, bounds, occupied);
        }
      }
    } else if (!restMode) {
      const decayResult = TreeLogic.applyDecay(profile.worldState.trees);
      result.treesDecayed = decayResult.degradedTrees;
      result.treesRemoved = decayResult.removedTreeIds;
    }

    // Project what the tree list will look like after this day
    const projectedTrees = this.projectTrees(profile, result);
    const projectedTreeCount = projectedTrees.length;

    // --- Building, animal, flower & river decay (when trees drop below thresholds) ---
    if (!dayComplete && !restMode) {
      const buildingDecayResult = WorldElementLogic.decayBuildings(
        projectedTreeCount,
        profile.worldState.buildings
      );
      result.buildingsDecayed = buildingDecayResult.degraded;
      result.buildingsRemoved = buildingDecayResult.removed;
      result.animalsRemoved = WorldElementLogic.decayAnimals(
        projectedTreeCount,
        profile.worldState.animals
      );
      const flowerDecayResult = WorldElementLogic.decayFlowers(
        projectedTreeCount,
        profile.worldState.flowers
      );
      result.flowersRemoved = flowerDecayResult.removed;
      // Apply flower degradation as upgrades in reverse (handled in applyProcessingResult)
      result.flowersUpgraded.push(...flowerDecayResult.degraded);
      result.riversRemoved = WorldElementLogic.decayRivers(
        projectedTreeCount,
        profile.worldState.rivers
      );

      // Spawn an obstacle on a missed day — but only after a grace period of
      // consecutive missed days. A single missed day never returns an obstacle,
      // and the current in-progress day is excluded by the Jannah screen (it
      // strips obstaclesAdded), so untamed land only creeps back once prayers
      // have genuinely lapsed for several days.
      const consecutiveMissed = PrayerLogic.countConsecutiveMissedDaysFrom(
        profile.prayerLogs,
        date
      );
      if (
        consecutiveMissed >=
        GAME_CONFIG.world.obstacles.spawnAfterConsecutiveMissedDays
      ) {
        const newObstacle = WorldElementLogic.spawnObstacle(
          projectedTrees,
          profile.worldState.obstacles ?? [],
          occupied,
          bounds
        );
        result.obstaclesAdded.push(newObstacle);
      }
    }

    // --- Flowers, buildings & animals ---
    const flowerResult = WorldElementLogic.evaluateFlowers(
      projectedTreeCount,
      profile.worldState.flowers,
      projectedTrees,
      bounds,
      occupied
    );
    result.flowersAdded = flowerResult.added;
    result.flowersUpgraded.push(...flowerResult.upgraded);
    occupied.push(...result.flowersAdded.map((f) => f.position));

    result.buildingsAdded = WorldElementLogic.evaluateBuildings(
      projectedTreeCount,
      profile.worldState.buildings,
      projectedTrees,
      bounds,
      occupied
    );
    occupied.push(...result.buildingsAdded.map((b) => b.position));

    result.animalsAdded = WorldElementLogic.evaluateAnimals(
      projectedTreeCount,
      profile.worldState.animals,
      projectedTrees,
      bounds,
      occupied
    );
    occupied.push(...result.animalsAdded.map((a) => a.position));

    // --- Barakah flowers (permanent basic flower / bush) ---
    // Spawned at a low chance whenever Qur'an OR dhikr is logged. They are a
    // gentle, permanent visual reward for spiritual practice and never expire.
    if (
      (dayLog?.quranLogged || dayLog?.dhikrLogged) &&
      Math.random() < GAME_CONFIG.world.dhikrFlowers.spawnChance
    ) {
      const barakahFlower = WorldElementLogic.spawnDhikrFlower(
        projectedTrees,
        profile.worldState.flowers,
        profile.worldState.dhikrFlowers ?? [],
        bounds,
        occupied
      );
      result.dhikrFlowersAdded.push(barakahFlower);
      occupied.push(barakahFlower.position);
    }

    // --- Obstacle clearing (progress tames the untamed map) ---
    // Rocks are cleared by logged prayers; stumps by Qur'an and dhikr.
    // Over time, consistent worship clears every obstacle from the map.
    const obstacles = profile.worldState.obstacles ?? [];
    const prayersLoggedToday = dayLog
      ? Object.values(dayLog.prayers).filter(Boolean).length
      : 0;
    const rocksToClear = WorldElementLogic.removeObstaclesByType(
      obstacles,
      'rock',
      prayersLoggedToday
    );
    const stumpsToClear = WorldElementLogic.removeObstaclesByType(
      obstacles,
      'stump',
      (dayLog?.quranLogged ? 1 : 0) + (dayLog?.dhikrLogged ? 1 : 0)
    );
    result.obstaclesRemoved.push(...rocksToClear, ...stumpsToClear);

    // --- Mushroom clearing (Qur'an gently clears them) ---
    // Each day the user logs Qur'an, one mushroom is cleared (oldest first)
    // until none remain — mirroring how logged prayers clear rocks.
    const mushrooms = profile.worldState.mushrooms ?? [];
    result.mushroomsRemoved.push(
      ...WorldElementLogic.removeMushrooms(mushrooms, dayLog?.quranLogged ? 1 : 0)
    );

    // Free up the tiles of any obstacles cleared today so later assets (e.g.
    // illustrious items) can grow on the freshly tamed land.
    const clearedIds = new Set(result.obstaclesRemoved);
    const clearedKeys = new Set(
      obstacles
        .filter((o) => clearedIds.has(o.id))
        .map((o) => `${o.position.x},${o.position.y}`)
    );
    if (clearedKeys.size > 0) {
      for (let i = occupied.length - 1; i >= 0; i--) {
        if (clearedKeys.has(`${occupied[i].x},${occupied[i].y}`)) {
          occupied.splice(i, 1);
        }
      }
    }

    // --- Rivers ---
    result.riversAdded = WorldElementLogic.evaluateRivers(
      projectedTreeCount,
      profile.worldState.rivers,
      projectedTrees,
      [...profile.worldState.buildings, ...result.buildingsAdded],
      bounds,
      occupied
    );
    occupied.push(...result.riversAdded.flatMap((r) => r.tiles));

    // --- Illustrious items ---
    const streak = PrayerLogic.countConsecutiveDaysFrom(
      profile.prayerLogs,
      date
    );
    const illustriousResult = IllustriousItemLogic.evaluate(
      streak,
      profile.worldState.illustriousItems,
      projectedTrees,
      bounds,
      occupied
    );
    result.illustriousItemsAdded = illustriousResult.itemsToAdd;
    result.illustriousItemsRemoved = illustriousResult.itemIdsToRemove;

    // --- Black cat expiry (temporary animals with duration) ---
    const blackCatConfig = GAME_CONFIG.world.animals.black_cat;
    const expiredBlackCats = profile.worldState.animals
      .filter((a) => a.type === 'black_cat')
      .filter((a) => {
        const createdDate = new Date(a.createdAt).toISOString().split('T')[0];
        const daysDiff = this.daysBetween(createdDate, date);
        return daysDiff >= blackCatConfig.durationDays;
      })
      .map((a) => a.id);

    if (expiredBlackCats.length > 0) {
      result.animalsRemoved = Array.from(new Set([
        ...result.animalsRemoved,
        ...expiredBlackCats,
      ]));
    }

    return result;
  }

  /**
   * Legacy entry point — processes today.
   */
  static processDayEnd(profile: UserProfile): DayProcessingResult {
    return this.processDay(profile, PrayerLogic.getTodayDate());
  }

  /**
   * Apply processing result to profile, returning the updated profile.
   */
  static applyProcessingResult(
    profile: UserProfile,
    result: DayProcessingResult
  ): UserProfile {
    const updatedTrees = [...profile.worldState.trees];

    // Add new trees
    updatedTrees.push(...result.treesAdded);

    // Apply upgraded trees
    for (const upgradedTree of result.treesUpgraded) {
      const index = updatedTrees.findIndex((t) => t.id === upgradedTree.id);
      if (index !== -1) {
        updatedTrees[index] = upgradedTree;
      }
    }

    // Update degraded trees
    for (const degradedTree of result.treesDecayed) {
      const index = updatedTrees.findIndex((t) => t.id === degradedTree.id);
      if (index !== -1) {
        updatedTrees[index] = degradedTree;
      }
    }

    // Remove trees
    const filteredTrees = updatedTrees.filter(
      (tree) => !result.treesRemoved.includes(tree.id)
    );

    // Update degraded buildings (good → dilapidated)
    const updatedBuildings = [...profile.worldState.buildings, ...result.buildingsAdded];
    for (const degraded of result.buildingsDecayed) {
      const idx = updatedBuildings.findIndex((b) => b.id === degraded.id);
      if (idx !== -1) {
        updatedBuildings[idx] = degraded;
      }
    }
    const filteredBuildings = updatedBuildings.filter(
      (b) => !result.buildingsRemoved.includes(b.id)
    );

    // Flowers: add, upgrade, remove
    const updatedFlowers = [...profile.worldState.flowers, ...result.flowersAdded];
    for (const upgraded of result.flowersUpgraded) {
      const idx = updatedFlowers.findIndex((f) => f.id === upgraded.id);
      if (idx !== -1) updatedFlowers[idx] = upgraded;
    }
    const filteredFlowers = updatedFlowers.filter(
      (f) => !result.flowersRemoved.includes(f.id)
    );

    // Dhikr flowers
    const updatedDhikrFlowers = [
      ...(profile.worldState.dhikrFlowers ?? []),
      ...result.dhikrFlowersAdded,
    ].filter((f) => !result.dhikrFlowersRemoved.includes(f.id));

    // Obstacles
    const updatedObstacles = [
      ...(profile.worldState.obstacles ?? []),
      ...result.obstaclesAdded,
    ].filter((o) => !result.obstaclesRemoved.includes(o.id));

    // Mushrooms (cleared gently as Qur'an is logged; never added post-seeding)
    const updatedMushrooms = (profile.worldState.mushrooms ?? []).filter(
      (m) => !result.mushroomsRemoved.includes(m.id)
    );

    // Map expansion
    const newMapSize =
      WorldElementLogic.evaluateMapExpansion(
        filteredTrees.length,
        profile.worldState.mapSize
      ) ?? profile.worldState.mapSize;

    // Statistics
    const mapAge = Math.max(
      0,
      Math.floor((Date.now() - profile.createdAt) / (1000 * 60 * 60 * 24))
    );
    const statistics = {
      ...profile.statistics,
      mapAge,
      totalTreesGrown:
        profile.statistics.totalTreesGrown + result.treesAdded.length,
      totalTreesDecayed:
        profile.statistics.totalTreesDecayed +
        result.treesDecayed.length +
        result.treesRemoved.length,
      totalBuildingsCreated:
        profile.statistics.totalBuildingsCreated + result.buildingsAdded.length,
      totalBuildingsReturned:
        profile.statistics.totalBuildingsReturned + result.buildingsRemoved.length,
      totalAnimalsAppeared:
        profile.statistics.totalAnimalsAppeared + result.animalsAdded.length,
      totalAnimalsReturned:
        profile.statistics.totalAnimalsReturned +
        result.animalsRemoved.filter((id) => !id.startsWith('animal_black_cat_')).length,
    };

    return {
      ...profile,
      worldState: {
        ...profile.worldState,
        trees: filteredTrees,
        flowers: filteredFlowers,
        dhikrFlowers: updatedDhikrFlowers,
        obstacles: updatedObstacles,
        mushrooms: updatedMushrooms,
        buildings: filteredBuildings,
        animals: [
          ...profile.worldState.animals,
          ...result.animalsAdded,
        ].filter((a) => !result.animalsRemoved.includes(a.id)),
        rivers: [...profile.worldState.rivers, ...result.riversAdded]
          .filter((r) => !result.riversRemoved.includes(r.id)),
        illustriousItems: profile.worldState.illustriousItems
          .filter((item) => !result.illustriousItemsRemoved.includes(item.id))
          .concat(result.illustriousItemsAdded),
        mapSize: newMapSize,
        gridSize: Math.max(newMapSize.width, newMapSize.height),
        lastUpdated: Date.now(),
      },
      statistics,
    };
  }

  /**
   * Replay a chronological list of elapsed ("missed") days on app launch.
   *
   * This is the pure core of the game loop: for each date it optionally marks
   * a rest day (when rest mode is on), runs {@link processDay}, applies the
   * result, and advances `lastProcessedDate`. Because it reads the previous
   * day's world state before processing the next, decay and growth compound
   * correctly across a multi-day absence (e.g. a week away decays several
   * trees, one per missed day).
   *
   * Keeping this separate from the React hooks makes the catch-up logic
   * deterministic and unit-testable, and removes any dependency on render
   * timing when detecting missed days.
   */
  static processMissedDays(
    profile: UserProfile,
    missedDates: string[]
  ): { profile: UserProfile; daysProcessed: number } {
    let currentProfile = profile;
    let daysProcessed = 0;

    for (const date of missedDates) {
      // While rest mode is on, record each processed past missed day as a rest
      // day so it doesn't break the streak and shows on the charts.
      if (currentProfile.settings?.restMode) {
        const marked = PrayerLogic.markRestDay(currentProfile.prayerLogs, date);
        if (marked !== currentProfile.prayerLogs) {
          currentProfile = { ...currentProfile, prayerLogs: marked };
        }
      }

      const result = WorldLogic.processDay(currentProfile, date);

      const hasChanges = Object.values(result).some(
        (arr) => Array.isArray(arr) && arr.length > 0
      );

      if (hasChanges) {
        currentProfile = WorldLogic.applyProcessingResult(currentProfile, result);
        daysProcessed++;
      }

      currentProfile = {
        ...currentProfile,
        worldState: {
          ...currentProfile.worldState,
          lastProcessedDate: date,
        },
      };
    }

    if (missedDates.length > 0) {
      currentProfile = WorldLogic.updateStatisticsForPrayer(currentProfile);
    }

    return { profile: currentProfile, daysProcessed };
  }

  /**
   * Update statistics after logging a prayer.
   */
  static updateStatisticsForPrayer(profile: UserProfile): UserProfile {
    const totalPrayers = profile.prayerLogs.reduce((sum, log) => {
      return sum + Object.values(log.prayers).filter(Boolean).length;
    }, 0);

    const completeDays = profile.prayerLogs.filter(
      (log) => log.isComplete
    ).length;

    const consecutiveDays = PrayerLogic.countConsecutiveDays(
      profile.prayerLogs
    );

    return {
      ...profile,
      statistics: {
        ...profile.statistics,
        totalPrayersLogged: totalPrayers,
        totalDaysComplete: completeDays,
        currentStreak: consecutiveDays,
        longestStreak: Math.max(
          profile.statistics.longestStreak,
          consecutiveDays
        ),
      },
      streaks: {
        ...profile.streaks,
        current: consecutiveDays,
        longest: Math.max(profile.streaks.longest, consecutiveDays),
        lastPrayerDate: PrayerLogic.getTodayDate(),
        consecutiveFullDays: consecutiveDays,
      },
    };
  }

  // --- Internal helpers ---

  /**
   * Project the tree list after applying a day result (without mutating profile).
   */
  private static projectTrees(
    profile: UserProfile,
    result: DayProcessingResult
  ): typeof profile.worldState.trees {
    const trees = [...profile.worldState.trees, ...result.treesAdded];

    for (const upgraded of result.treesUpgraded) {
      const idx = trees.findIndex((t) => t.id === upgraded.id);
      if (idx !== -1) trees[idx] = upgraded;
    }

    for (const degraded of result.treesDecayed) {
      const idx = trees.findIndex((t) => t.id === degraded.id);
      if (idx !== -1) trees[idx] = degraded;
    }

    return trees.filter((t) => !result.treesRemoved.includes(t.id));
  }

  /**
   * Calculate the number of days between two ISO date strings.
   */
  private static daysBetween(dateA: string, dateB: string): number {
    const a = new Date(dateA + 'T00:00:00Z').getTime();
    const b = new Date(dateB + 'T00:00:00Z').getTime();
    return Math.floor(Math.abs(b - a) / (1000 * 60 * 60 * 24));
  }

  /**
   * Attempt to spawn a black cat (5% chance per prayer logged).
   * Returns the updated profile with the cat added if the roll succeeds.
   *
   * The black cat is a temporary gift (barakah), not a permanent resident.
   * Like illustrious items, it is deliberately NOT counted toward the
   * lifetime "animals appeared" statistic — otherwise transient cats would
   * inflate the tally beyond the animals actually living on the map.
   */
  static trySpawnBlackCat(profile: UserProfile): UserProfile {
    const config = GAME_CONFIG.world.animals.black_cat;
    if (Math.random() >= config.spawnChance) return profile;

    // Only allow one active black cat at a time
    const existingCat = profile.worldState.animals.find((a) => a.type === 'black_cat');
    if (existingCat) return profile;

    const now = Date.now();
    const bounds = profile.worldState.placementBounds ?? defaultPlacementBounds();
    const ws = profile.worldState;
    const occupied: Position[] = [
      ...ws.flowers.map((f) => f.position),
      ...(ws.dhikrFlowers ?? []).map((f) => f.position),
      ...(ws.obstacles ?? []).map((o) => o.position),
      ...(ws.mushrooms ?? []).map((m) => m.position),
      ...ws.buildings.map((b) => b.position),
      ...ws.rivers.flatMap((r) => r.tiles),
      ...ws.illustriousItems.map((i) => i.position),
    ];
    const position = WorldElementLogic.findPositionForAnimal(
      profile.worldState.trees,
      profile.worldState.animals,
      bounds,
      occupied
    );

    const cat = {
      id: `animal_black_cat_${now}`,
      type: 'black_cat' as const,
      position,
      createdAt: now,
    };

    return {
      ...profile,
      worldState: {
        ...profile.worldState,
        animals: [...profile.worldState.animals, cat],
      },
    };
  }
}

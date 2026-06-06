/**
 * World Logic
 * Processes daily game state updates based on prayer logs.
 *
 * This is the central orchestrator that calls into
 * IllustriousItemLogic, WorldElementLogic, and TreeLogic to
 * produce a single DayProcessingResult for each elapsed day.
 */

import { UserProfile, DayProcessingResult } from '../types/models';
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

    // Placement bounds derived from the player's actual screen extent (persisted
    // in worldState). Falls back to a square default when unknown so that
    // background processing without screen access still behaves sensibly.
    const bounds = profile.worldState.placementBounds ?? defaultPlacementBounds();

    // --- Trees: generation/upgrade or decay ---
    if (dayComplete) {
      const consecutiveDays = PrayerLogic.countConsecutiveDaysFrom(
        profile.prayerLogs,
        date
      );
      const treesToGenerate = TreeLogic.shouldGenerateTrees(consecutiveDays);
      const currentTreeCount = profile.worldState.trees.length;
      const actionsAvailable = treesToGenerate - currentTreeCount;

      if (actionsAvailable > 0) {
        // Build a working copy of trees to track upgrades across multiple actions
        const workingTrees = [...profile.worldState.trees];

        for (let i = 0; i < actionsAvailable; i++) {
          // Prioritise upgrading existing trees over creating new ones
          const candidate = TreeLogic.findUpgradeCandidate(workingTrees);

          if (candidate) {
            const upgraded = TreeLogic.upgradeTree(candidate)!;
            result.treesUpgraded.push(upgraded);
            // Update working copy so next iteration sees the upgraded state
            const idx = workingTrees.findIndex((t) => t.id === candidate.id);
            workingTrees[idx] = upgraded;
          } else {
            // All trees are mature — create a new sapling
            const newTrees = TreeLogic.generateTrees(1, [
              ...workingTrees,
              ...result.treesAdded,
            ], bounds);
            result.treesAdded.push(...newTrees);
            workingTrees.push(...newTrees);
          }
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
          result.treesAdded = TreeLogic.generateTrees(1, profile.worldState.trees, bounds);
        }
      }
    } else {
      const decayResult = TreeLogic.applyDecay(profile.worldState.trees);
      result.treesDecayed = decayResult.degradedTrees;
      result.treesRemoved = decayResult.removedTreeIds;
    }

    // Project what the tree list will look like after this day
    const projectedTrees = this.projectTrees(profile, result);
    const projectedTreeCount = projectedTrees.length;

    // --- Building, animal, flower & river decay (when trees drop below thresholds) ---
    if (!dayComplete) {
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

      // Spawn an obstacle on missed day
      const newObstacle = WorldElementLogic.spawnObstacle(
        projectedTrees,
        profile.worldState.obstacles ?? [],
        [],
        bounds
      );
      result.obstaclesAdded.push(newObstacle);
    }

    // --- Flowers, buildings & animals ---
    const flowerResult = WorldElementLogic.evaluateFlowers(
      projectedTreeCount,
      profile.worldState.flowers,
      projectedTrees,
      bounds
    );
    result.flowersAdded = flowerResult.added;
    result.flowersUpgraded.push(...flowerResult.upgraded);
    result.buildingsAdded = WorldElementLogic.evaluateBuildings(
      projectedTreeCount,
      profile.worldState.buildings,
      projectedTrees,
      bounds
    );
    result.animalsAdded = WorldElementLogic.evaluateAnimals(
      projectedTreeCount,
      profile.worldState.animals,
      projectedTrees,
      bounds
    );

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
        bounds
      );
      result.dhikrFlowersAdded.push(barakahFlower);
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

    // --- Rivers ---
    result.riversAdded = WorldElementLogic.evaluateRivers(
      projectedTreeCount,
      profile.worldState.rivers,
      projectedTrees,
      [...profile.worldState.buildings, ...result.buildingsAdded],
      bounds
    );

    // --- Illustrious items ---
    const streak = PrayerLogic.countConsecutiveDaysFrom(
      profile.prayerLogs,
      date
    );
    const illustriousResult = IllustriousItemLogic.evaluate(
      streak,
      profile.worldState.illustriousItems,
      projectedTrees,
      bounds
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
    const position = WorldElementLogic.findPositionForAnimal(
      profile.worldState.trees,
      profile.worldState.animals,
      bounds
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

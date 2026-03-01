/**
 * World Logic
 * Processes daily game state updates based on prayer logs.
 *
 * This is the central orchestrator that calls into SeasonLogic,
 * IllustriousItemLogic, WorldElementLogic, and TreeLogic to
 * produce a single DayProcessingResult for each elapsed day.
 */

import { UserProfile, DayProcessingResult } from '../types/models';
import { PrayerLogic } from './prayerLogic';
import { TreeLogic } from './treeLogic';
import { SeasonLogic } from './seasonLogic';
import { IllustriousItemLogic } from './illustriousItemLogic';
import { WorldElementLogic } from './worldElementLogic';

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
      treesDecayed: [],
      treesRemoved: [],
      buildingsAdded: [],
      animalsAdded: [],
      illustriousItemsAdded: [],
      illustriousItemsRemoved: [],
      seasonChanged: false,
    };

    const dayLog = profile.prayerLogs.find((log) => log.date === date);
    const dayComplete = dayLog?.isComplete ?? false;

    // --- Trees: generation or decay ---
    if (dayComplete) {
      const consecutiveDays = SeasonLogic.countStreakUpTo(
        profile.prayerLogs,
        date
      );
      const treesToGenerate = TreeLogic.shouldGenerateTrees(consecutiveDays);
      const currentTreeCount = profile.worldState.trees.length;
      const treesNeeded = treesToGenerate - currentTreeCount;

      if (treesNeeded > 0) {
        result.treesAdded = TreeLogic.generateTrees(
          treesNeeded,
          profile.worldState.trees
        );
      }
    } else {
      const decayResult = TreeLogic.applyDecay(profile.worldState.trees);
      result.treesDecayed = decayResult.degradedTrees;
      result.treesRemoved = decayResult.removedTreeIds;
    }

    // Project what the tree list will look like after this day
    const projectedTrees = this.projectTrees(profile, result);
    const projectedTreeCount = projectedTrees.length;

    // --- Season ---
    const seasonResult = SeasonLogic.evaluateSeasonChange(
      profile.worldState.season,
      profile.prayerLogs,
      date
    );
    if (seasonResult.changed) {
      result.seasonChanged = true;
      result.newSeason = seasonResult.newSeason;
    }

    // --- Buildings & animals ---
    result.buildingsAdded = WorldElementLogic.evaluateBuildings(
      projectedTreeCount,
      profile.worldState.buildings,
      projectedTrees
    );
    result.animalsAdded = WorldElementLogic.evaluateAnimals(
      projectedTreeCount,
      profile.worldState.animals,
      projectedTrees
    );

    // --- Illustrious items ---
    const streak = SeasonLogic.countStreakUpTo(profile.prayerLogs, date);
    const illustriousResult = IllustriousItemLogic.evaluate(
      streak,
      profile.worldState.illustriousItems,
      projectedTrees
    );
    result.illustriousItemsAdded = illustriousResult.itemsToAdd;
    result.illustriousItemsRemoved = illustriousResult.itemIdsToRemove;

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

    // Map expansion
    const newMapSize =
      WorldElementLogic.evaluateMapExpansion(
        filteredTrees.length,
        profile.worldState.mapSize
      ) ?? profile.worldState.mapSize;

    // Season
    const season = result.newSeason ?? profile.worldState.season;

    // Statistics
    const statistics = {
      ...profile.statistics,
      totalTreesGrown:
        profile.statistics.totalTreesGrown + result.treesAdded.length,
      totalTreesDecayed:
        profile.statistics.totalTreesDecayed +
        result.treesDecayed.length +
        result.treesRemoved.length,
      totalBuildingsCreated:
        profile.statistics.totalBuildingsCreated + result.buildingsAdded.length,
      totalAnimalsAppeared:
        profile.statistics.totalAnimalsAppeared + result.animalsAdded.length,
    };

    return {
      ...profile,
      worldState: {
        ...profile.worldState,
        trees: filteredTrees,
        flowers: profile.worldState.flowers,
        buildings: [
          ...profile.worldState.buildings,
          ...result.buildingsAdded,
        ],
        animals: [...profile.worldState.animals, ...result.animalsAdded],
        illustriousItems: profile.worldState.illustriousItems
          .filter((item) => !result.illustriousItemsRemoved.includes(item.id))
          .concat(result.illustriousItemsAdded),
        season,
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

    for (const degraded of result.treesDecayed) {
      const idx = trees.findIndex((t) => t.id === degraded.id);
      if (idx !== -1) trees[idx] = degraded;
    }

    return trees.filter((t) => !result.treesRemoved.includes(t.id));
  }
}

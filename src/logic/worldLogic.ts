/**
 * World Logic
 * Processes daily game state updates based on prayer logs
 */

import { UserProfile, DayProcessingResult, Tree } from '../types/models';
import { GAME_CONFIG } from '../config/game.config';
import { PrayerLogic } from './prayerLogic';
import { TreeLogic } from './treeLogic';

export class WorldLogic {
  /**
   * Process the end of a day and update world state
   * This is the main game loop function
   */
  static processDayEnd(profile: UserProfile): DayProcessingResult {
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

    const today = PrayerLogic.getTodayDate();
    const todayLog = profile.prayerLogs.find((log) => log.date === today);

    // Check if today was complete
    if (todayLog && todayLog.isComplete) {
      // Day was complete - check for tree generation
      const consecutiveDays = PrayerLogic.countConsecutiveDays(
        profile.prayerLogs
      );

      const treesToGenerate = TreeLogic.shouldGenerateTrees(consecutiveDays);
      const currentTreeCount = profile.worldState.trees.length;
      const treesNeeded = treesToGenerate - currentTreeCount;

      if (treesNeeded > 0) {
        const newTrees = TreeLogic.generateTrees(
          treesNeeded,
          profile.worldState.trees
        );
        result.treesAdded = newTrees;
      }
    } else {
      // Day was missed - apply decay
      const decayResult = TreeLogic.applyDecay(profile.worldState.trees);
      result.treesDecayed = decayResult.degradedTrees;
      result.treesRemoved = decayResult.removedTreeIds;
    }

    return result;
  }

  /**
   * Apply processing result to profile
   */
  static applyProcessingResult(
    profile: UserProfile,
    result: DayProcessingResult
  ): UserProfile {
    const updatedTrees = [...profile.worldState.trees];

    // Add new trees
    updatedTrees.push(...result.treesAdded);

    // Update degraded trees
    result.treesDecayed.forEach((degradedTree) => {
      const index = updatedTrees.findIndex((t) => t.id === degradedTree.id);
      if (index !== -1) {
        updatedTrees[index] = degradedTree;
      }
    });

    // Remove trees
    const filteredTrees = updatedTrees.filter(
      (tree) => !result.treesRemoved.includes(tree.id)
    );

    // Update statistics
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
        buildings: [
          ...profile.worldState.buildings,
          ...result.buildingsAdded,
        ],
        animals: [...profile.worldState.animals, ...result.animalsAdded],
        illustriousItems: profile.worldState.illustriousItems
          .filter((item) => !result.illustriousItemsRemoved.includes(item.id))
          .concat(result.illustriousItemsAdded),
        lastUpdated: Date.now(),
      },
      statistics,
    };
  }

  /**
   * Update statistics after logging a prayer
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
}

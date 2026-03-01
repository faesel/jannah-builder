/**
 * Illustrious Item Logic
 * Pure functions for managing streak-based illustrious items.
 *
 * Illustrious items are temporary spiritual gifts that appear during
 * long streaks and fade gently when consistency breaks.
 * They never affect core gameplay, trees, or permanent progress.
 */

import { IllustriousItem, Position, Tree } from '../types/models';
import { IllustriousItemType, GAME_CONFIG } from '../config/game.config';

export class IllustriousItemLogic {
  /**
   * Evaluate which illustrious items should exist given the current streak.
   * Returns items to add and item IDs to remove.
   */
  static evaluate(
    currentStreak: number,
    existingItems: IllustriousItem[],
    existingTrees: Tree[]
  ): { itemsToAdd: IllustriousItem[]; itemIdsToRemove: string[] } {
    if (!GAME_CONFIG.illustriousItems.enabled) {
      return { itemsToAdd: [], itemIdsToRemove: [] };
    }

    const thresholds = GAME_CONFIG.illustriousItems.streakThresholds;
    const existingTypes = new Set(existingItems.map((i) => i.type));

    const itemsToAdd: IllustriousItem[] = [];
    const itemIdsToRemove: string[] = [];

    // Check each item type
    for (const itemType of GAME_CONFIG.illustriousItems.types) {
      const threshold = thresholds[itemType];
      const alreadyExists = existingTypes.has(itemType);

      if (currentStreak >= threshold && !alreadyExists) {
        // Earned a new item
        itemsToAdd.push(
          this.createItem(itemType, currentStreak, existingTrees, existingItems)
        );
      } else if (currentStreak < threshold && alreadyExists) {
        // Streak broken — item fades away gently
        const item = existingItems.find((i) => i.type === itemType);
        if (item) {
          itemIdsToRemove.push(item.id);
        }
      }
    }

    return { itemsToAdd, itemIdsToRemove };
  }

  /**
   * Create a new illustrious item at a position that doesn't overlap trees.
   */
  static createItem(
    type: IllustriousItemType,
    streakDays: number,
    existingTrees: Tree[],
    existingItems: IllustriousItem[]
  ): IllustriousItem {
    const now = Date.now();
    const position = this.findPosition(existingTrees, existingItems);

    return {
      id: `illustrious_${type}_${now}`,
      type,
      position,
      createdAt: now,
      streakDays,
    };
  }

  /**
   * Find a position for an illustrious item, offset from the tree cluster.
   */
  static findPosition(
    existingTrees: Tree[],
    existingItems: IllustriousItem[]
  ): Position {
    const occupied = new Set([
      ...existingTrees.map((t) => `${t.position.x},${t.position.y}`),
      ...existingItems.map((i) => `${i.position.x},${i.position.y}`),
    ]);

    // Place items slightly outside the main tree cluster
    const offsetBase = Math.max(
      5,
      Math.ceil(Math.sqrt(existingTrees.length)) + 2
    );

    // Try positions in a ring around the cluster
    const offsets = [
      { x: offsetBase, y: 0 },
      { x: -offsetBase, y: 0 },
      { x: 0, y: offsetBase },
      { x: 0, y: -offsetBase },
      { x: offsetBase, y: offsetBase },
      { x: -offsetBase, y: -offsetBase },
      { x: offsetBase, y: -offsetBase },
      { x: -offsetBase, y: offsetBase },
    ];

    for (const offset of offsets) {
      const key = `${offset.x},${offset.y}`;
      if (!occupied.has(key)) {
        return offset;
      }
    }

    // Fallback
    return { x: offsetBase + 1, y: offsetBase + 1 };
  }
}

/**
 * Tree Logic
 * Pure functions for managing tree growth and decay
 */

import { Tree, Position } from '../types/models';
import { TreeStage, GAME_CONFIG } from '../config/game.config';

export class TreeLogic {
  /**
   * Create a new tree at a given position
   */
  static createTree(position: Position): Tree {
    const now = Date.now();
    return {
      id: `tree_${now}_${Math.random().toString(36).substring(2, 11)}`,
      stage: 'sapling',
      position,
      createdAt: now,
      lastUpdated: now,
    };
  }

  /**
   * Upgrade a tree to the next growth stage
   */
  static upgradeTree(tree: Tree): Tree | null {
    const stages = GAME_CONFIG.trees.growthStages;
    const currentIndex = stages.indexOf(tree.stage);

    // Already at max stage
    if (currentIndex === stages.length - 1) {
      return null;
    }

    return {
      ...tree,
      stage: stages[currentIndex + 1],
      lastUpdated: Date.now(),
    };
  }

  /**
   * Degrade a tree to the previous stage
   */
  static degradeTree(tree: Tree): Tree | null {
    const stages = GAME_CONFIG.trees.growthStages;
    const currentIndex = stages.indexOf(tree.stage);

    // Already at minimum stage (sapling) - should be removed instead
    if (currentIndex === 0) {
      return null;
    }

    return {
      ...tree,
      stage: stages[currentIndex - 1],
      lastUpdated: Date.now(),
    };
  }

  /**
   * Determine if new trees should be generated based on consecutive days
   */
  static shouldGenerateTrees(consecutiveDays: number): number {
    const daysPerTree = GAME_CONFIG.trees.daysForNewTree;
    return Math.floor(consecutiveDays / daysPerTree);
  }

  /**
   * Generate multiple trees for placement
   */
  static generateTrees(count: number, existingTrees: Tree[]): Tree[] {
    const newTrees: Tree[] = [];
    
    for (let i = 0; i < count; i++) {
      const position = this.findAvailablePosition(existingTrees, newTrees);
      newTrees.push(this.createTree(position));
    }

    return newTrees;
  }

  /**
   * Find an available position for a new tree
   * Simple spiral placement algorithm
   */
  static findAvailablePosition(
    existingTrees: Tree[],
    newTrees: Tree[]
  ): Position {
    const allTrees = [...existingTrees, ...newTrees];
    const occupied = new Set(
      allTrees.map((t) => `${t.position.x},${t.position.y}`)
    );

    const gridHalf = Math.floor(GAME_CONFIG.map.initialGridSize / 2) - 1;

    // Try random positions within the grid
    for (let attempt = 0; attempt < 200; attempt++) {
      const x = Math.floor(Math.random() * (gridHalf * 2 + 1)) - gridHalf;
      const y = Math.floor(Math.random() * (gridHalf * 2 + 1)) - gridHalf;
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        return { x, y };
      }
    }

    // Fallback: scan for any free position
    for (let x = -gridHalf; x <= gridHalf; x++) {
      for (let y = -gridHalf; y <= gridHalf; y++) {
        if (!occupied.has(`${x},${y}`)) {
          return { x, y };
        }
      }
    }

    return { x: 0, y: 0 };
  }

  /**
   * Apply decay to trees (affects one tree at a time)
   */
  static applyDecay(
    trees: Tree[]
  ): { degradedTrees: Tree[]; removedTreeIds: string[] } {
    if (trees.length === 0) {
      return { degradedTrees: [], removedTreeIds: [] };
    }

    // Find the most mature tree to decay
    const sortedTrees = [...trees].sort((a, b) => {
      const stageOrder = { mature: 2, young: 1, sapling: 0 };
      return stageOrder[b.stage] - stageOrder[a.stage];
    });

    const treeToDecay = sortedTrees[0];
    const degradedTree = this.degradeTree(treeToDecay);

    if (degradedTree === null) {
      // Tree was a sapling, remove it
      return {
        degradedTrees: [],
        removedTreeIds: [treeToDecay.id],
      };
    }

    return {
      degradedTrees: [degradedTree],
      removedTreeIds: [],
    };
  }

  /**
   * Find the best tree to upgrade — oldest sapling first, then oldest young.
   * Returns null if all trees are already mature.
   */
  static findUpgradeCandidate(trees: Tree[]): Tree | null {
    const saplings = trees
      .filter((t) => t.stage === 'sapling')
      .sort((a, b) => a.createdAt - b.createdAt);

    if (saplings.length > 0) return saplings[0];

    const young = trees
      .filter((t) => t.stage === 'young')
      .sort((a, b) => a.createdAt - b.createdAt);

    if (young.length > 0) return young[0];

    return null;
  }

  /**
   * Get tree count by stage
   */
  static countByStage(trees: Tree[]): Record<TreeStage, number> {
    return trees.reduce(
      (acc, tree) => {
        acc[tree.stage]++;
        return acc;
      },
      { sapling: 0, young: 0, mature: 0 } as Record<TreeStage, number>
    );
  }
}

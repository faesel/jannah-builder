/**
 * World Element Logic
 * Pure functions for spawning buildings and animals based on tree milestones.
 *
 * Buildings and animals appear when total tree count crosses configured
 * thresholds, with additional instances spawning every `repeatEvery` trees
 * beyond the initial threshold.
 */

import {
  Building,
  Animal,
  Tree,
  Position,
} from '../types/models';
import { GAME_CONFIG } from '../config/game.config';

type BuildingType = Building['type'];
type AnimalType = Animal['type'];

/**
 * Registry of building types and their config thresholds.
 */
const BUILDING_TYPES: { type: BuildingType; threshold: number; repeatEvery: number }[] = [
  { type: 'home', threshold: GAME_CONFIG.world.buildings.home.threshold, repeatEvery: GAME_CONFIG.world.buildings.home.repeatEvery },
  { type: 'mansion', threshold: GAME_CONFIG.world.buildings.mansion.threshold, repeatEvery: GAME_CONFIG.world.buildings.mansion.repeatEvery },
  { type: 'palace', threshold: GAME_CONFIG.world.buildings.palace.threshold, repeatEvery: GAME_CONFIG.world.buildings.palace.repeatEvery },
];

/**
 * Registry of animal types and their config thresholds.
 */
const ANIMAL_TYPES: { type: AnimalType; threshold: number; repeatEvery: number }[] = [
  { type: 'bird', threshold: GAME_CONFIG.world.animals.birds.threshold, repeatEvery: GAME_CONFIG.world.animals.birds.repeatEvery },
  { type: 'rabbit', threshold: GAME_CONFIG.world.animals.rabbits.threshold, repeatEvery: GAME_CONFIG.world.animals.rabbits.repeatEvery },
  { type: 'squirrel', threshold: GAME_CONFIG.world.animals.squirrels.threshold, repeatEvery: GAME_CONFIG.world.animals.squirrels.repeatEvery },
  { type: 'deer', threshold: GAME_CONFIG.world.animals.deer.threshold, repeatEvery: GAME_CONFIG.world.animals.deer.repeatEvery },
];

/**
 * Calculate how many of a given type should exist based on tree count.
 * Returns 0 below threshold, 1 at threshold, then +1 per repeatEvery trees.
 */
function targetCount(treeCount: number, threshold: number, repeatEvery: number): number {
  if (treeCount < threshold) return 0;
  return 1 + Math.floor((treeCount - threshold) / repeatEvery);
}

export class WorldElementLogic {
  /**
   * Determine which new buildings should spawn given the current tree count.
   */
  static evaluateBuildings(
    treeCount: number,
    existingBuildings: Building[],
    existingTrees: Tree[]
  ): Building[] {
    const newBuildings: Building[] = [];

    for (const { type, threshold, repeatEvery } of BUILDING_TYPES) {
      const desired = targetCount(treeCount, threshold, repeatEvery);
      const current = existingBuildings.filter((b) => b.type === type).length;
      const needed = desired - current;

      for (let i = 0; i < needed; i++) {
        newBuildings.push(
          this.createBuilding(type, existingTrees, existingBuildings, newBuildings)
        );
      }
    }

    return newBuildings;
  }

  /**
   * Determine which new animals should spawn given the current tree count.
   */
  static evaluateAnimals(
    treeCount: number,
    existingAnimals: Animal[],
    existingTrees: Tree[]
  ): Animal[] {
    const newAnimals: Animal[] = [];

    for (const { type, threshold, repeatEvery } of ANIMAL_TYPES) {
      const desired = targetCount(treeCount, threshold, repeatEvery);
      const current = existingAnimals.filter((a) => a.type === type).length;
      const needed = desired - current;

      for (let i = 0; i < needed; i++) {
        newAnimals.push(
          this.createAnimal(type, existingTrees, existingAnimals, newAnimals)
        );
      }
    }

    return newAnimals;
  }

  /**
   * Evaluate grid expansion. Returns new grid size if growth is warranted.
   */
  static evaluateMapExpansion(
    treeCount: number,
    currentSize: { width: number; height: number }
  ): { width: number; height: number } | null {
    const { initialGridSize, maxGridSize, growthInterval } = GAME_CONFIG.map;

    if (growthInterval <= 0) return null;

    const earned = initialGridSize + Math.floor(treeCount / growthInterval);
    const target = Math.min(maxGridSize, earned);

    if (target > currentSize.width || target > currentSize.height) {
      return { width: target, height: target };
    }

    return null;
  }

  // --- Private helpers ---

  private static createBuilding(
    type: BuildingType,
    trees: Tree[],
    existingBuildings: Building[],
    newBuildings: Building[]
  ): Building {
    const now = Date.now();
    return {
      id: `building_${type}_${now}_${newBuildings.length}`,
      type,
      position: this.findClearPosition(
        trees.map((t) => t.position),
        [
          ...existingBuildings.map((b) => b.position),
          ...newBuildings.map((b) => b.position),
        ]
      ),
      createdAt: now,
    };
  }

  private static createAnimal(
    type: AnimalType,
    trees: Tree[],
    existingAnimals: Animal[],
    newAnimals: Animal[]
  ): Animal {
    const now = Date.now();
    return {
      id: `animal_${type}_${now}_${newAnimals.length}`,
      type,
      position: this.findClearPosition(
        trees.map((t) => t.position),
        [
          ...existingAnimals.map((a) => a.position),
          ...newAnimals.map((a) => a.position),
        ]
      ),
      createdAt: now,
    };
  }

  /**
   * Find a position near the tree cluster that doesn't overlap existing elements.
   */
  private static findClearPosition(
    treePositions: Position[],
    occupiedPositions: Position[]
  ): Position {
    const occupied = new Set([
      ...treePositions.map((p) => `${p.x},${p.y}`),
      ...occupiedPositions.map((p) => `${p.x},${p.y}`),
    ]);

    const radius = Math.max(3, Math.ceil(Math.sqrt(treePositions.length)) + 1);

    for (let r = radius; r < radius + 10; r++) {
      for (let angle = 0; angle < 8; angle++) {
        const x = Math.round(r * Math.cos((angle * Math.PI) / 4));
        const y = Math.round(r * Math.sin((angle * Math.PI) / 4));
        const key = `${x},${y}`;
        if (!occupied.has(key)) {
          return { x, y };
        }
      }
    }

    return { x: radius + 1, y: 0 };
  }
}

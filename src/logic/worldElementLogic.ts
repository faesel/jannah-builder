/**
 * World Element Logic
 * Pure functions for spawning buildings and animals based on tree milestones.
 *
 * Buildings and animals appear when total tree count crosses configured
 * thresholds. Each type spawns at most once.
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
 * Add new building types here to automatically include them in evaluation.
 */
const BUILDING_TYPES: { type: BuildingType; threshold: number }[] = [
  { type: 'home', threshold: GAME_CONFIG.world.buildings.home.threshold },
  { type: 'mansion', threshold: GAME_CONFIG.world.buildings.mansion.threshold },
  { type: 'palace', threshold: GAME_CONFIG.world.buildings.palace.threshold },
];

/**
 * Registry of animal types and their config thresholds.
 * Add new animal types here to automatically include them in evaluation.
 */
const ANIMAL_TYPES: { type: AnimalType; threshold: number }[] = [
  { type: 'bird', threshold: GAME_CONFIG.world.animals.birds.threshold },
  { type: 'rabbit', threshold: GAME_CONFIG.world.animals.rabbits.threshold },
  { type: 'squirrel', threshold: GAME_CONFIG.world.animals.squirrels.threshold },
  { type: 'deer', threshold: GAME_CONFIG.world.animals.deer.threshold },
];

export class WorldElementLogic {
  /**
   * Determine which new buildings should spawn given the current tree count.
   */
  static evaluateBuildings(
    treeCount: number,
    existingBuildings: Building[],
    existingTrees: Tree[]
  ): Building[] {
    const existingTypes = new Set(existingBuildings.map((b) => b.type));
    const newBuildings: Building[] = [];

    for (const { type, threshold } of BUILDING_TYPES) {
      if (treeCount >= threshold && !existingTypes.has(type)) {
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
    const existingTypes = new Set(existingAnimals.map((a) => a.type));
    const newAnimals: Animal[] = [];

    for (const { type, threshold } of ANIMAL_TYPES) {
      if (treeCount >= threshold && !existingTypes.has(type)) {
        newAnimals.push(
          this.createAnimal(type, existingTrees, existingAnimals, newAnimals)
        );
      }
    }

    return newAnimals;
  }

  /**
   * Evaluate map expansion. Returns new size if expansion is warranted.
   */
  static evaluateMapExpansion(
    treeCount: number,
    currentSize: { width: number; height: number }
  ): { width: number; height: number } | null {
    const { expansionThreshold, expansionRate, initialSize } = GAME_CONFIG.map;

    // How many expansions have been earned
    const expansionsEarned = Math.floor(treeCount / expansionThreshold);
    const expectedWidth = initialSize.width + expansionsEarned * expansionRate;
    const expectedHeight = initialSize.height + expansionsEarned * expansionRate;

    if (expectedWidth > currentSize.width || expectedHeight > currentSize.height) {
      return {
        width: Math.max(currentSize.width, expectedWidth),
        height: Math.max(currentSize.height, expectedHeight),
      };
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
      id: `building_${type}_${now}`,
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
      id: `animal_${type}_${now}`,
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

    // Place near the edge of the tree cluster
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

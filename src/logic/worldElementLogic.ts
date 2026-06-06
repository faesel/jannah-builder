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
  Flower,
  DhikrFlower,
  Obstacle,
  River,
  Tree,
  Position,
  PlacementBounds,
} from '../types/models';
import { GAME_CONFIG, FlowerVariety, ObstacleType, RESERVED_POSITIONS } from '../config/game.config';
import { defaultPlacementBounds, randomPositionInBounds, isWithinBounds } from './placement';

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

/** Add reserved positions (e.g. signboard) to an occupied set. */
function addReserved(occupied: Set<string>): Set<string> {
  RESERVED_POSITIONS.forEach((p) => occupied.add(p));
  return occupied;
}

export class WorldElementLogic {
  /**
   * Determine which new buildings should spawn given the current tree count.
   */
  static evaluateBuildings(
    treeCount: number,
    existingBuildings: Building[],
    existingTrees: Tree[],
    bounds: PlacementBounds = defaultPlacementBounds()
  ): Building[] {
    const newBuildings: Building[] = [];

    for (const { type, threshold, repeatEvery } of BUILDING_TYPES) {
      const desired = targetCount(treeCount, threshold, repeatEvery);
      const current = existingBuildings.filter((b) => b.type === type).length;
      const needed = desired - current;

      for (let i = 0; i < needed; i++) {
        newBuildings.push(
          this.createBuilding(type, existingTrees, existingBuildings, newBuildings, bounds)
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
    existingTrees: Tree[],
    bounds: PlacementBounds = defaultPlacementBounds()
  ): Animal[] {
    const newAnimals: Animal[] = [];

    for (const { type, threshold, repeatEvery } of ANIMAL_TYPES) {
      const desired = targetCount(treeCount, threshold, repeatEvery);
      const current = existingAnimals.filter((a) => a.type === type).length;
      const needed = desired - current;

      for (let i = 0; i < needed; i++) {
        newAnimals.push(
          this.createAnimal(type, existingTrees, existingAnimals, newAnimals, bounds)
        );
      }
    }

    return newAnimals;
  }

  /**
   * Determine which new flowers should spawn or be upgraded.
   * Prioritises upgrading existing flowers over creating new ones.
   */
  static evaluateFlowers(
    treeCount: number,
    existingFlowers: Flower[],
    existingTrees: Tree[],
    bounds: PlacementBounds = defaultPlacementBounds()
  ): { added: Flower[]; upgraded: Flower[] } {
    const fc = GAME_CONFIG.world.flowers;
    const desired = targetCount(treeCount, fc.baseThreshold, fc.repeatEvery);
    const actionsAvailable = desired - existingFlowers.length;

    if (actionsAvailable <= 0) return { added: [], upgraded: [] };

    const added: Flower[] = [];
    const upgraded: Flower[] = [];
    const workingFlowers = [...existingFlowers];
    const occupied = new Set([
      ...existingTrees.map((t) => `${t.position.x},${t.position.y}`),
      ...existingFlowers.map((f) => `${f.position.x},${f.position.y}`),
    ]);
    addReserved(occupied);

    for (let i = 0; i < actionsAvailable; i++) {
      // Prioritise upgrading oldest non-max-stage flower (only pre-existing ones)
      const preExistingIds = new Set(existingFlowers.map((f) => f.id));
      const upgradeableFlowers = workingFlowers.filter((f) => preExistingIds.has(f.id));
      const candidate = this.findFlowerUpgradeCandidate(upgradeableFlowers);

      if (candidate) {
        const upgradedFlower: Flower = {
          ...candidate,
          stage: candidate.stage + 1,
        };
        upgraded.push(upgradedFlower);
        const idx = workingFlowers.findIndex((f) => f.id === candidate.id);
        workingFlowers[idx] = upgradedFlower;
      } else {
        // All pre-existing flowers are at max stage — create a new one
        const position = this.findFlowerPosition(existingTrees, occupied, bounds);
        const variety = this.randomFlowerVariety();
        const now = Date.now();
        const flower: Flower = {
          id: `flower_${now}_${added.length}`,
          position,
          variety,
          stage: 1,
          createdAt: now,
        };
        added.push(flower);
        workingFlowers.push(flower);
        occupied.add(`${position.x},${position.y}`);
      }
    }

    return { added, upgraded };
  }

  /**
   * Find the oldest flower not yet at max stage (earliest stage first).
   */
  static findFlowerUpgradeCandidate(flowers: Flower[]): Flower | null {
    const fc = GAME_CONFIG.world.flowers;
    const upgradeable = flowers
      .filter((f) => f.stage < fc.stages[f.variety])
      .sort((a, b) => {
        // Lowest stage first, then oldest
        if (a.stage !== b.stage) return a.stage - b.stage;
        return a.createdAt - b.createdAt;
      });

    return upgradeable.length > 0 ? upgradeable[0] : null;
  }

  /**
   * Determine flower decay when trees drop below threshold.
   * Degrades one flower per missed day: reduce stage, or remove if at stage 1.
   */
  static decayFlowers(
    treeCount: number,
    existingFlowers: Flower[]
  ): { degraded: Flower[]; removed: string[] } {
    const fc = GAME_CONFIG.world.flowers;
    const desired = targetCount(treeCount, fc.baseThreshold, fc.repeatEvery);
    const excess = existingFlowers.length - desired;

    if (excess <= 0) return { degraded: [], removed: [] };

    // Target the newest flower at the highest stage
    const sorted = [...existingFlowers].sort((a, b) => {
      if (b.stage !== a.stage) return b.stage - a.stage;
      return b.createdAt - a.createdAt;
    });

    const target = sorted[0];
    if (target.stage <= 1) {
      return { degraded: [], removed: [target.id] };
    }

    return {
      degraded: [{ ...target, stage: target.stage - 1 }],
      removed: [],
    };
  }

  /**
   * Pick a random flower variety from the configured list.
   */
  private static randomFlowerVariety(): FlowerVariety {
    const varieties = GAME_CONFIG.world.flowers.varieties;
    return varieties[Math.floor(Math.random() * varieties.length)];
  }

  /**
   * Spawn a permanent barakah flower (basic flower or bush) as a gentle
   * visual reward for logging Qur'an or dhikr. These never expire.
   */
  static spawnDhikrFlower(
    existingTrees: Tree[],
    existingFlowers: Flower[],
    existingDhikrFlowers: DhikrFlower[],
    bounds: PlacementBounds = defaultPlacementBounds()
  ): DhikrFlower {
    const types = GAME_CONFIG.world.dhikrFlowers.types;
    const type = types[Math.floor(Math.random() * types.length)];
    const occupied = new Set([
      ...existingTrees.map((t) => `${t.position.x},${t.position.y}`),
      ...existingFlowers.map((f) => `${f.position.x},${f.position.y}`),
      ...existingDhikrFlowers.map((f) => `${f.position.x},${f.position.y}`),
    ]);
    addReserved(occupied);
    const position = this.findFlowerPosition(existingTrees, occupied, bounds);
    const now = Date.now();

    return {
      id: `dhikr_${type}_${now}`,
      position,
      type,
      createdAt: now,
    };
  }

  // --- Obstacle logic ---

  /**
   * Generate initial obstacles for a new profile.
   */
  static generateInitialObstacles(
    bounds: PlacementBounds = defaultPlacementBounds()
  ): Obstacle[] {
    const config = GAME_CONFIG.world.obstacles;
    const obstacles: Obstacle[] = [];
    const occupied = new Set<string>();
    addReserved(occupied);
    const now = Date.now();

    for (let i = 0; i < config.initialCount; i++) {
      const type = config.types[Math.floor(Math.random() * config.types.length)];
      const maxVariant = type === 'stump' ? config.stumpVariants : config.rockVariants;
      const variant = Math.floor(Math.random() * maxVariant) + 1;

      const position = randomPositionInBounds(occupied, bounds, 100);
      occupied.add(`${position.x},${position.y}`);

      obstacles.push({
        id: `obstacle_${type}_${now}_${i}`,
        type,
        variant,
        position,
        createdAt: now,
      });
    }

    return obstacles;
  }

  /**
   * Select the oldest `count` obstacles of a given type to clear.
   * Returns their IDs (oldest first). Progress clears the untamed map:
   * rocks are cleared by logged prayers, stumps by Qur'an/dhikr.
   */
  static removeObstaclesByType(
    obstacles: Obstacle[],
    type: ObstacleType,
    count: number
  ): string[] {
    if (count <= 0 || obstacles.length === 0) return [];
    return [...obstacles]
      .filter((o) => o.type === type)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, count)
      .map((o) => o.id);
  }

  /**
   * Spawn an obstacle on a missed day (stump or rock returns).
   */
  static spawnObstacle(
    existingTrees: Tree[],
    existingObstacles: Obstacle[],
    extraOccupied: Position[] = [],
    bounds: PlacementBounds = defaultPlacementBounds()
  ): Obstacle {
    const config = GAME_CONFIG.world.obstacles;
    const type = config.types[Math.floor(Math.random() * config.types.length)];
    const maxVariant = type === 'stump' ? config.stumpVariants : config.rockVariants;
    const variant = Math.floor(Math.random() * maxVariant) + 1;
    const now = Date.now();

    const occupied = new Set([
      ...existingTrees.map((t) => `${t.position.x},${t.position.y}`),
      ...(existingObstacles ?? []).map((o) => `${o.position.x},${o.position.y}`),
      ...extraOccupied.map((p) => `${p.x},${p.y}`),
    ]);
    addReserved(occupied);

    const position = randomPositionInBounds(occupied, bounds);

    return {
      id: `obstacle_${type}_${now}`,
      type,
      variant,
      position,
      createdAt: now,
    };
  }

  /**
   * Determine building decay when trees drop below thresholds.
   * Buildings degrade: good → dilapidated → removed.
   * Only one building is affected per missed day.
   */
  static decayBuildings(
    treeCount: number,
    existingBuildings: Building[]
  ): { degraded: Building[]; removed: string[] } {
    if (!GAME_CONFIG.decay.buildings.enabled) return { degraded: [], removed: [] };

    const degraded: Building[] = [];
    const removed: string[] = [];

    for (const { type, threshold, repeatEvery } of BUILDING_TYPES) {
      const desired = targetCount(treeCount, threshold, repeatEvery);
      const ofType = existingBuildings
        .filter((b) => b.type === type)
        .sort((a, b) => b.createdAt - a.createdAt); // newest first

      const excess = ofType.length - desired;
      if (excess > 0) {
        const target = ofType[0];
        if (target.condition === 'dilapidated') {
          removed.push(target.id);
        } else {
          degraded.push({ ...target, condition: 'dilapidated' });
        }
        break; // Only one building affected per missed day
      }
    }

    return { degraded, removed };
  }

  /**
   * Determine which animals should be removed when trees drop below thresholds.
   * Removes one animal at a time — the most recently created one whose type
   * now exceeds the desired count for the current tree level.
   */
  static decayAnimals(
    treeCount: number,
    existingAnimals: Animal[]
  ): string[] {
    if (!GAME_CONFIG.decay.animals.enabled) return [];

    const removals: string[] = [];

    for (const { type, threshold, repeatEvery } of ANIMAL_TYPES) {
      const desired = targetCount(treeCount, threshold, repeatEvery);
      const ofType = existingAnimals
        .filter((a) => a.type === type)
        .sort((a, b) => b.createdAt - a.createdAt); // newest first

      const excess = ofType.length - desired;
      for (let i = 0; i < excess && i < 1; i++) {
        removals.push(ofType[i].id);
      }
    }

    // Only remove one animal per missed day to keep decay gentle
    return removals.slice(0, 1);
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

  /**
   * Find a position for a new animal (public helper for ad-hoc spawns like black_cat).
   */
  static findPositionForAnimal(
    trees: Tree[],
    existingAnimals: Animal[],
    bounds: PlacementBounds = defaultPlacementBounds()
  ): Position {
    return this.findClearPosition(
      trees.map((t) => t.position),
      existingAnimals.map((a) => a.position),
      bounds
    );
  }

  // --- Private helpers ---

  private static createBuilding(
    type: BuildingType,
    trees: Tree[],
    existingBuildings: Building[],
    newBuildings: Building[],
    bounds: PlacementBounds = defaultPlacementBounds()
  ): Building {
    const now = Date.now();
    const allBuildings = [...existingBuildings, ...newBuildings];
    const sameType = allBuildings.filter((b) => b.type === type);
    const allOccupied = [
      ...trees.map((t) => t.position),
      ...allBuildings.map((b) => b.position),
    ];

    let position: Position;
    if (sameType.length > 0) {
      // Check if current cluster has reached its random size limit
      const config = GAME_CONFIG.world.buildings[type];
      const clusters = this.groupIntoClusters(sameType.map((b) => b.position));
      const latestCluster = clusters[clusters.length - 1];
      const clusterLimit = config.clusterSize.min +
        Math.floor(Math.random() * (config.clusterSize.max - config.clusterSize.min + 1));

      if (latestCluster.length >= clusterLimit) {
        // Start a new cluster away from existing ones
        position = this.findClearPosition(
          trees.map((t) => t.position),
          allBuildings.map((b) => b.position),
          bounds
        );
      } else {
        // Continue current cluster (street pattern)
        position = this.findClusterPosition(latestCluster, allOccupied, bounds);
      }
    } else {
      // First of this type: place near tree cluster
      position = this.findClearPosition(
        trees.map((t) => t.position),
        allBuildings.map((b) => b.position),
        bounds
      );
    }

    return {
      id: `building_${type}_${now}_${newBuildings.length}`,
      type,
      position,
      createdAt: now,
      condition: 'good' as const,
    };
  }

  /**
   * Group positions into clusters based on proximity (within distance 4).
   * Returns an array of clusters, each being an array of positions.
   */
  private static groupIntoClusters(positions: Position[]): Position[][] {
    const clusters: Position[][] = [];
    const assigned = new Set<number>();

    for (let i = 0; i < positions.length; i++) {
      if (assigned.has(i)) continue;
      const cluster: Position[] = [positions[i]];
      assigned.add(i);

      // BFS to find all connected positions within distance 4
      const queue = [positions[i]];
      while (queue.length > 0) {
        const current = queue.shift()!;
        for (let j = 0; j < positions.length; j++) {
          if (assigned.has(j)) continue;
          const dist = Math.abs(positions[j].x - current.x) + Math.abs(positions[j].y - current.y);
          if (dist <= 4) {
            cluster.push(positions[j]);
            assigned.add(j);
            queue.push(positions[j]);
          }
        }
      }
      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Find a position adjacent to an existing cluster of same-type buildings.
   * Tries immediate neighbours first (street-like), then expands outward.
   */
  private static findClusterPosition(
    clusterPositions: Position[],
    allOccupied: Position[],
    bounds: PlacementBounds = defaultPlacementBounds()
  ): Position {
    const occupied = new Set(allOccupied.map((p) => `${p.x},${p.y}`));
    addReserved(occupied);
    // Cardinal directions for street-like adjacency
    const directions = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
    ];

    // Try distance 1, then 2 from any cluster member
    for (let dist = 1; dist <= 3; dist++) {
      for (const pos of clusterPositions) {
        for (const dir of directions) {
          const x = pos.x + dir.dx * dist;
          const y = pos.y + dir.dy * dist;
          if (isWithinBounds(x, y, bounds) && !occupied.has(`${x},${y}`)) {
            return { x, y };
          }
        }
      }
    }

    // Fallback: expand in a wider ring around the cluster centroid
    const cx = Math.round(clusterPositions.reduce((s, p) => s + p.x, 0) / clusterPositions.length);
    const cy = Math.round(clusterPositions.reduce((s, p) => s + p.y, 0) / clusterPositions.length);
    for (let r = 2; r < 12; r++) {
      for (let angle = 0; angle < 8; angle++) {
        const x = cx + Math.round(r * Math.cos((angle * Math.PI) / 4));
        const y = cy + Math.round(r * Math.sin((angle * Math.PI) / 4));
        if (isWithinBounds(x, y, bounds) && !occupied.has(`${x},${y}`)) {
          return { x, y };
        }
      }
    }

    // Last resort: any free tile within bounds
    return randomPositionInBounds(occupied, bounds);
  }

  private static createAnimal(
    type: AnimalType,
    trees: Tree[],
    existingAnimals: Animal[],
    newAnimals: Animal[],
    bounds: PlacementBounds = defaultPlacementBounds()
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
        ],
        bounds
      ),
      createdAt: now,
    };
  }

  /**
   * Find a position near the tree cluster that doesn't overlap existing elements.
   */
  private static findClearPosition(
    treePositions: Position[],
    occupiedPositions: Position[],
    bounds: PlacementBounds = defaultPlacementBounds()
  ): Position {
    const occupied = new Set([
      ...treePositions.map((p) => `${p.x},${p.y}`),
      ...occupiedPositions.map((p) => `${p.x},${p.y}`),
    ]);
    addReserved(occupied);

    const radius = Math.max(3, Math.ceil(Math.sqrt(treePositions.length)) + 1);

    for (let r = radius; r < radius + 10; r++) {
      for (let angle = 0; angle < 8; angle++) {
        const x = Math.round(r * Math.cos((angle * Math.PI) / 4));
        const y = Math.round(r * Math.sin((angle * Math.PI) / 4));
        if (isWithinBounds(x, y, bounds) && !occupied.has(`${x},${y}`)) {
          return { x, y };
        }
      }
    }

    // Fallback: any free tile within bounds
    return randomPositionInBounds(occupied, bounds);
  }

  /**
   * Determine which rivers should be removed when trees drop below threshold.
   * Removes one river per missed day — the most recently created one.
   */
  static decayRivers(
    treeCount: number,
    existingRivers: River[]
  ): string[] {
    const rc = GAME_CONFIG.world.rivers;
    const desired = targetCount(treeCount, rc.threshold, rc.repeatEvery);
    const excess = existingRivers.length - desired;

    if (excess <= 0) return [];

    // Remove one river per missed day (newest first)
    const sorted = [...existingRivers].sort((a, b) => b.createdAt - a.createdAt);
    return [sorted[0].id];
  }

  /**
   * Find a position for a flower — adjacent to a tree for a natural look.
   */
  private static findFlowerPosition(
    trees: Tree[],
    occupied: Set<string>,
    bounds: PlacementBounds = defaultPlacementBounds()
  ): Position {
    const directions = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
      { dx: 1, dy: 1 }, { dx: -1, dy: -1 },
      { dx: 1, dy: -1 }, { dx: -1, dy: 1 },
    ];

    // Try positions adjacent to random trees
    const shuffledTrees = [...trees].sort(() => Math.random() - 0.5);
    for (const tree of shuffledTrees) {
      const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);
      for (const dir of shuffledDirs) {
        const x = tree.position.x + dir.dx;
        const y = tree.position.y + dir.dy;
        if (isWithinBounds(x, y, bounds) && !occupied.has(`${x},${y}`)) {
          return { x, y };
        }
      }
    }

    // Fallback: find any clear position near the tree cluster
    return this.findClearPosition(
      trees.map((t) => t.position),
      [...occupied].map((key) => {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
      }),
      bounds
    );
  }

  // --- River logic ---

  /**
   * Evaluate how many rivers should exist and return any new ones to add.
   */
  static evaluateRivers(
    treeCount: number,
    existingRivers: River[],
    trees: Tree[],
    buildings: Building[],
    bounds: PlacementBounds = defaultPlacementBounds()
  ): River[] {
    const rc = GAME_CONFIG.world.rivers;
    const desired = targetCount(treeCount, rc.threshold, rc.repeatEvery);
    const needed = desired - existingRivers.length;
    if (needed <= 0) return [];

    const occupied = new Set<string>([
      ...trees.map((t) => `${t.position.x},${t.position.y}`),
      ...buildings.map((b) => `${b.position.x},${b.position.y}`),
      ...existingRivers.flatMap((r) => r.tiles.map((t) => `${t.x},${t.y}`)),
    ]);
    addReserved(occupied);

    // River length scales with tree count
    const extraLength = Math.floor((treeCount - rc.threshold) * rc.lengthGrowth);
    const riverLength = Math.min(
      rc.length.min + Math.floor(Math.random() * (rc.length.max - rc.length.min + 1)) + extraLength,
      rc.maxLength
    );

    const newRivers: River[] = [];
    for (let i = 0; i < needed; i++) {
      const river = this.generateRiver(riverLength, occupied, bounds);
      if (river) {
        river.tiles.forEach((t) => occupied.add(`${t.x},${t.y}`));
        newRivers.push(river);
      }
    }
    return newRivers;
  }

  /**
   * Generate a single river with a snaking path.
   * The snake constraint: no water tile may be cardinally adjacent to a
   * non-consecutive tile in the path (prevents thick/blobby water).
   */
  private static generateRiver(
    targetLength: number,
    occupied: Set<string>,
    bounds: PlacementBounds = defaultPlacementBounds()
  ): River | null {
    const now = Date.now();
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const start = this.findRiverStart(bounds, occupied);
      if (!start) continue;

      const path = this.walkRiverPath(start, targetLength, bounds, occupied);
      if (path.length >= Math.max(3, Math.floor(targetLength * 0.5))) {
        return {
          id: `river_${now}_${attempt}`,
          tiles: path,
          createdAt: now,
        };
      }
    }
    return null;
  }

  /**
   * Find a starting position for a river near the map edge.
   */
  private static findRiverStart(
    bounds: PlacementBounds,
    occupied: Set<string>
  ): Position | null {
    // Try random positions along the map edges
    const edges: Position[] = [];
    for (let x = -bounds.halfX; x <= bounds.halfX; x++) {
      edges.push({ x, y: -bounds.halfY }); // top
      edges.push({ x, y: bounds.halfY });  // bottom
    }
    for (let y = -bounds.halfY; y <= bounds.halfY; y++) {
      edges.push({ x: -bounds.halfX, y }); // left
      edges.push({ x: bounds.halfX, y });  // right
    }
    // Shuffle edges
    for (let i = edges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [edges[i], edges[j]] = [edges[j], edges[i]];
    }
    for (const pos of edges) {
      if (!occupied.has(`${pos.x},${pos.y}`)) {
        return pos;
      }
    }
    return null;
  }

  /**
   * Random-walk to build a snaking river path.
   * At each step, picks a random cardinal direction that:
   *  - is within bounds
   *  - is not occupied
   *  - does not cardinally touch any earlier path tile except the previous one
   */
  private static walkRiverPath(
    start: Position,
    targetLength: number,
    bounds: PlacementBounds,
    occupied: Set<string>
  ): Position[] {
    const path: Position[] = [start];
    const pathSet = new Set<string>([`${start.x},${start.y}`]);
    const directions = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
    ];

    for (let step = 1; step < targetLength; step++) {
      const current = path[path.length - 1];
      // Shuffle directions for randomness
      const shuffled = [...directions].sort(() => Math.random() - 0.5);

      let moved = false;
      for (const dir of shuffled) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const key = `${nx},${ny}`;

        // Bounds check
        if (Math.abs(nx) > bounds.halfX || Math.abs(ny) > bounds.halfY) continue;
        // Already occupied by tree/building/other river
        if (occupied.has(key)) continue;
        // Already in this path
        if (pathSet.has(key)) continue;
        // Snake constraint: new tile must not be cardinally adjacent to any
        // path tile except the current one (the previous in the path)
        if (this.violatesSnakeConstraint(nx, ny, path, path.length - 1)) continue;

        path.push({ x: nx, y: ny });
        pathSet.add(key);
        moved = true;
        break;
      }

      if (!moved) break; // Dead end — stop growing
    }

    return path;
  }

  /**
   * Check if placing water at (x,y) would cardinally touch a path tile
   * other than the one at `allowIndex` (the current head).
   */
  private static violatesSnakeConstraint(
    x: number,
    y: number,
    path: Position[],
    allowIndex: number
  ): boolean {
    const cardinals = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
    ];
    for (const dir of cardinals) {
      const ax = x + dir.dx;
      const ay = y + dir.dy;
      for (let i = 0; i < path.length; i++) {
        if (i === allowIndex) continue;
        if (path[i].x === ax && path[i].y === ay) {
          // Adjacent to a non-consecutive path tile — violation
          return true;
        }
      }
    }
    return false;
  }
}

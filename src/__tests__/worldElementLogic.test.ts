import { WorldElementLogic } from '../logic/worldElementLogic';
import { GAME_CONFIG } from '../config/game.config';
import { Tree, Building, Animal, Flower } from '../types/models';

function makeTrees(count: number): Tree[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `tree_${i}`,
    stage: 'mature' as const,
    position: { x: i, y: 0 },
    createdAt: 0,
    lastUpdated: 0,
  }));
}

describe('WorldElementLogic', () => {
  describe('evaluateBuildings', () => {
    it('returns nothing below the home threshold', () => {
      const result = WorldElementLogic.evaluateBuildings(5, [], makeTrees(5));
      expect(result).toHaveLength(0);
    });

    it('spawns a home at threshold', () => {
      const result = WorldElementLogic.evaluateBuildings(12, [], makeTrees(12));
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('home');
    });

    it('spawns home and mansion at mansion threshold', () => {
      const result = WorldElementLogic.evaluateBuildings(35, [], makeTrees(35));
      const homes = result.filter((b) => b.type === 'home');
      const mansions = result.filter((b) => b.type === 'mansion');
      // home: 1 + floor((35-12)/10) = 3, mansion: 1
      expect(homes).toHaveLength(3);
      expect(mansions).toHaveLength(1);
    });

    it('scales buildings proportionally with many trees', () => {
      const result = WorldElementLogic.evaluateBuildings(100, [], makeTrees(100));
      const homes = result.filter((b) => b.type === 'home');
      const mansions = result.filter((b) => b.type === 'mansion');
      const palaces = result.filter((b) => b.type === 'palace');
      // home: 1 + floor((100-12)/10) = 9
      // mansion: 1 + floor((100-35)/40) = 2
      // palace: 1 + floor((100-70)/80) = 1
      expect(homes).toHaveLength(9);
      expect(mansions).toHaveLength(2);
      expect(palaces).toHaveLength(1);
    });

    it('does not duplicate already existing buildings', () => {
      const existing: Building[] = [
        { id: 'b1', type: 'home', position: { x: 5, y: 5 }, createdAt: 0, condition: 'good' },
      ];
      const result = WorldElementLogic.evaluateBuildings(35, existing, makeTrees(35));
      // Should add 2 more homes (need 3, have 1) + 1 mansion
      const homes = result.filter((b) => b.type === 'home');
      const mansions = result.filter((b) => b.type === 'mansion');
      expect(homes).toHaveLength(2);
      expect(mansions).toHaveLength(1);
    });

    it('clusters same-type buildings adjacently within clusters', () => {
      const result = WorldElementLogic.evaluateBuildings(100, [], makeTrees(100));
      const homes = result.filter((b) => b.type === 'home');
      if (homes.length <= 1) return;
      // Most homes should be near at least one other home (distance ≤ 4)
      let clusteredCount = 0;
      for (let i = 0; i < homes.length; i++) {
        const nearAny = homes.some(
          (h, j) => j !== i && Math.abs(h.position.x - homes[i].position.x) + Math.abs(h.position.y - homes[i].position.y) <= 4
        );
        if (nearAny) clusteredCount++;
      }
      // At least half of homes should be clustered with a neighbour
      expect(clusteredCount).toBeGreaterThanOrEqual(Math.floor(homes.length / 2));
    });

    it('keeps different building types in separate clusters', () => {
      const result = WorldElementLogic.evaluateBuildings(100, [], makeTrees(100));
      const homes = result.filter((b) => b.type === 'home');
      const mansions = result.filter((b) => b.type === 'mansion');
      if (homes.length > 0 && mansions.length > 0) {
        // Centroid of each cluster should not be at the same position
        const homeCx = homes.reduce((s, h) => s + h.position.x, 0) / homes.length;
        const homeCy = homes.reduce((s, h) => s + h.position.y, 0) / homes.length;
        const manCx = mansions.reduce((s, m) => s + m.position.x, 0) / mansions.length;
        const manCy = mansions.reduce((s, m) => s + m.position.y, 0) / mansions.length;
        const dist = Math.abs(homeCx - manCx) + Math.abs(homeCy - manCy);
        expect(dist).toBeGreaterThan(0);
      }
    });
  });

  describe('evaluateAnimals', () => {
    it('returns nothing below the lowest threshold', () => {
      const result = WorldElementLogic.evaluateAnimals(2, [], makeTrees(2));
      expect(result).toHaveLength(0);
    });

    it('spawns birds at 5 trees', () => {
      const result = WorldElementLogic.evaluateAnimals(5, [], makeTrees(5));
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('bird');
    });

    it('does not exceed target count for existing animals', () => {
      const existing: Animal[] = [
        { id: 'a1', type: 'bird', position: { x: 3, y: 3 }, createdAt: 0 },
      ];
      const result = WorldElementLogic.evaluateAnimals(5, existing, makeTrees(5));
      expect(result).toHaveLength(0);
    });

    it('spawns multiple animals at 40+ trees', () => {
      const result = WorldElementLogic.evaluateAnimals(40, [], makeTrees(40));
      const birds = result.filter((a) => a.type === 'bird');
      const rabbits = result.filter((a) => a.type === 'rabbit');
      const squirrels = result.filter((a) => a.type === 'squirrel');
      const deer = result.filter((a) => a.type === 'deer');
      // bird: 1 + floor((40-5)/8) = 5
      // rabbit: 1 + floor((40-15)/15) = 2
      // squirrel: 1 + floor((40-25)/20) = 1
      // deer: 1 + floor((40-40)/30) = 1
      expect(birds).toHaveLength(5);
      expect(rabbits).toHaveLength(2);
      expect(squirrels).toHaveLength(1);
      expect(deer).toHaveLength(1);
    });

    it('scales proportionally with many trees', () => {
      const result = WorldElementLogic.evaluateAnimals(120, [], makeTrees(120));
      const birds = result.filter((a) => a.type === 'bird');
      // bird: 1 + floor((120-5)/8) = 15
      expect(birds).toHaveLength(15);
    });
  });

  describe('evaluateMapExpansion', () => {
    const initial = { width: 4, height: 4 };
    let savedGrowthInterval: number;
    let savedInitialGridSize: number;
    let savedMaxGridSize: number;

    beforeEach(() => {
      savedGrowthInterval = GAME_CONFIG.map.growthInterval;
      savedInitialGridSize = GAME_CONFIG.map.initialGridSize;
      savedMaxGridSize = GAME_CONFIG.map.maxGridSize;
      (GAME_CONFIG.map as any).growthInterval = 3;
      (GAME_CONFIG.map as any).initialGridSize = 4;
      (GAME_CONFIG.map as any).maxGridSize = 24;
    });

    afterEach(() => {
      (GAME_CONFIG.map as any).growthInterval = savedGrowthInterval;
      (GAME_CONFIG.map as any).initialGridSize = savedInitialGridSize;
      (GAME_CONFIG.map as any).maxGridSize = savedMaxGridSize;
    });

    it('returns null when no growth earned', () => {
      // 0 trees → initialGridSize(4) + 0 = 4, already at 4
      expect(WorldElementLogic.evaluateMapExpansion(0, initial)).toBeNull();
    });

    it('expands after growthInterval trees', () => {
      // 3 trees → 4 + floor(3/3) = 5
      const result = WorldElementLogic.evaluateMapExpansion(3, initial);
      expect(result).toEqual({ width: 5, height: 5 });
    });

    it('expands further with more trees', () => {
      // 9 trees → 4 + floor(9/3) = 7
      const result = WorldElementLogic.evaluateMapExpansion(9, initial);
      expect(result).toEqual({ width: 7, height: 7 });
    });

    it('returns null if grid is already large enough', () => {
      const large = { width: 10, height: 10 };
      // 3 trees → target 5, but already at 10
      expect(WorldElementLogic.evaluateMapExpansion(3, large)).toBeNull();
    });

    it('caps at maxGridSize', () => {
      // Huge tree count → capped at maxGridSize (24)
      const result = WorldElementLogic.evaluateMapExpansion(200, initial);
      expect(result).toEqual({ width: 24, height: 24 });
    });
  });

  describe('evaluateRivers', () => {
    it('returns nothing below threshold', () => {
      const result = WorldElementLogic.evaluateRivers(15, [], makeTrees(15), []);
      expect(result).toHaveLength(0);
    });

    it('returns one river at threshold', () => {
      const trees = makeTrees(18);
      const result = WorldElementLogic.evaluateRivers(18, [], trees, []);
      expect(result).toHaveLength(1);
      expect(result[0].tiles.length).toBeGreaterThanOrEqual(3);
    });

    it('scales river count with trees', () => {
      const trees = makeTrees(100);
      const result = WorldElementLogic.evaluateRivers(100, [], trees, []);
      // 1 + floor((100-18)/30) = 3
      expect(result).toHaveLength(3);
    });

    it('does not add rivers if already at target', () => {
      const trees = makeTrees(18);
      const existingRivers = [{ id: 'r1', tiles: [{ x: -8, y: -8 }], createdAt: 0 }];
      const result = WorldElementLogic.evaluateRivers(18, existingRivers, trees, []);
      expect(result).toHaveLength(0);
    });

    it('generates cardinally connected paths', () => {
      const trees = makeTrees(18);
      const result = WorldElementLogic.evaluateRivers(18, [], trees, []);
      for (const river of result) {
        for (let i = 1; i < river.tiles.length; i++) {
          const prev = river.tiles[i - 1];
          const curr = river.tiles[i];
          const dist = Math.abs(curr.x - prev.x) + Math.abs(curr.y - prev.y);
          expect(dist).toBe(1); // cardinally adjacent
        }
      }
    });

    it('enforces snake constraint (no non-consecutive cardinal adjacency)', () => {
      const trees = makeTrees(65);
      const result = WorldElementLogic.evaluateRivers(65, [], trees, []);
      for (const river of result) {
        for (let i = 0; i < river.tiles.length; i++) {
          const tile = river.tiles[i];
          const cardinals = [
            { x: tile.x + 1, y: tile.y },
            { x: tile.x - 1, y: tile.y },
            { x: tile.x, y: tile.y + 1 },
            { x: tile.x, y: tile.y - 1 },
          ];
          for (const adj of cardinals) {
            const adjIndex = river.tiles.findIndex((t) => t.x === adj.x && t.y === adj.y);
            if (adjIndex === -1) continue;
            // Adjacent tile must be consecutive in path (i-1 or i+1)
            expect(Math.abs(adjIndex - i)).toBe(1);
          }
        }
      }
    });

    it('does not overlap trees or buildings', () => {
      const trees = makeTrees(50);
      const buildings = [
        { id: 'b1', type: 'home' as const, position: { x: -5, y: -5 }, createdAt: 0, condition: 'good' as const },
      ];
      const result = WorldElementLogic.evaluateRivers(50, [], trees, buildings);
      const treePositions = new Set(trees.map((t) => `${t.position.x},${t.position.y}`));
      const buildingPositions = new Set(buildings.map((b) => `${b.position.x},${b.position.y}`));
      for (const river of result) {
        for (const tile of river.tiles) {
          expect(treePositions.has(`${tile.x},${tile.y}`)).toBe(false);
          expect(buildingPositions.has(`${tile.x},${tile.y}`)).toBe(false);
        }
      }
    });
  });

  describe('decayBuildings', () => {
    it('returns empty when tree count meets threshold', () => {
      const buildings: Building[] = [
        { id: 'home_1', type: 'home', position: { x: 0, y: 0 }, createdAt: 100, condition: 'good' },
      ];
      const result = WorldElementLogic.decayBuildings(
        GAME_CONFIG.world.buildings.home.threshold,
        buildings
      );
      expect(result.degraded).toHaveLength(0);
      expect(result.removed).toHaveLength(0);
    });

    it('degrades a good building to dilapidated when trees drop below threshold', () => {
      const buildings: Building[] = [
        { id: 'home_1', type: 'home', position: { x: 0, y: 0 }, createdAt: 100, condition: 'good' },
        { id: 'home_2', type: 'home', position: { x: 2, y: 2 }, createdAt: 200, condition: 'good' },
      ];
      // Only 1 home is warranted at threshold, so 1 excess
      const result = WorldElementLogic.decayBuildings(
        GAME_CONFIG.world.buildings.home.threshold,
        buildings
      );
      expect(result.degraded).toHaveLength(1);
      expect(result.removed).toHaveLength(0);
      expect(result.degraded[0].id).toBe('home_2');
      expect(result.degraded[0].condition).toBe('dilapidated');
    });

    it('removes a dilapidated building on next decay', () => {
      const buildings: Building[] = [
        { id: 'home_1', type: 'home', position: { x: 0, y: 0 }, createdAt: 100, condition: 'good' },
        { id: 'home_2', type: 'home', position: { x: 2, y: 2 }, createdAt: 200, condition: 'dilapidated' },
      ];
      const result = WorldElementLogic.decayBuildings(
        GAME_CONFIG.world.buildings.home.threshold,
        buildings
      );
      expect(result.degraded).toHaveLength(0);
      expect(result.removed).toHaveLength(1);
      expect(result.removed[0]).toBe('home_2');
    });

    it('affects at most one building per call', () => {
      const buildings: Building[] = [
        { id: 'home_1', type: 'home', position: { x: 0, y: 0 }, createdAt: 100, condition: 'good' },
        { id: 'home_2', type: 'home', position: { x: 2, y: 2 }, createdAt: 200, condition: 'good' },
        { id: 'home_3', type: 'home', position: { x: 4, y: 4 }, createdAt: 300, condition: 'good' },
      ];
      // 0 trees: 0 homes warranted, 3 excess, but only affect 1
      const result = WorldElementLogic.decayBuildings(0, buildings);
      expect(result.degraded.length + result.removed.length).toBe(1);
    });
  });

  describe('decayAnimals', () => {
    it('returns empty when tree count meets threshold', () => {
      const animals: Animal[] = [
        { id: 'bird_1', type: 'bird', position: { x: 0, y: 0 }, createdAt: 100 },
      ];
      const result = WorldElementLogic.decayAnimals(
        GAME_CONFIG.world.animals.birds.threshold,
        animals
      );
      expect(result).toHaveLength(0);
    });

    it('removes one animal when trees drop below threshold', () => {
      const animals: Animal[] = [
        { id: 'bird_1', type: 'bird', position: { x: 0, y: 0 }, createdAt: 100 },
      ];
      const result = WorldElementLogic.decayAnimals(0, animals);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('bird_1');
    });

    it('removes at most one animal per call', () => {
      const animals: Animal[] = [
        { id: 'bird_1', type: 'bird', position: { x: 0, y: 0 }, createdAt: 100 },
        { id: 'bird_2', type: 'bird', position: { x: 1, y: 1 }, createdAt: 200 },
        { id: 'rabbit_1', type: 'rabbit', position: { x: 2, y: 2 }, createdAt: 300 },
      ];
      const result = WorldElementLogic.decayAnimals(0, animals);
      expect(result).toHaveLength(1);
    });
  });

  describe('evaluateFlowers', () => {
    it('returns nothing below the flower threshold', () => {
      const result = WorldElementLogic.evaluateFlowers(3, [], makeTrees(3));
      expect(result.added).toHaveLength(0);
      expect(result.upgraded).toHaveLength(0);
    });

    it('spawns a flower at threshold', () => {
      const result = WorldElementLogic.evaluateFlowers(4, [], makeTrees(4));
      expect(result.added).toHaveLength(1);
      expect(result.added[0].stage).toBe(1);
      expect(result.added[0].variety).toBeDefined();
    });

    it('spawns additional flowers as trees grow', () => {
      const result = WorldElementLogic.evaluateFlowers(10, [], makeTrees(10));
      // targetCount = 1 + floor((10-4)/2) = 4
      expect(result.added).toHaveLength(4);
    });

    it('does not spawn flowers that already exist', () => {
      const existing = [
        { id: 'flower_1', position: { x: 5, y: 5 }, variety: 'pink' as const, stage: 1, createdAt: 1000 },
      ];
      const result = WorldElementLogic.evaluateFlowers(4, existing, makeTrees(4));
      // 1 desired, 1 existing → 0 needed, but 1 action available if flower can be upgraded
      // Since stage 1 < max stage (3), it should upgrade
      expect(result.added).toHaveLength(0);
    });

    it('prioritises upgrading over creating new flowers', () => {
      const existing = [
        { id: 'flower_1', position: { x: 5, y: 5 }, variety: 'pink' as const, stage: 1, createdAt: 1000 },
      ];
      // 6 trees → targetCount = 1 + floor((6-4)/2) = 2, actions = 2-1 = 1
      const result = WorldElementLogic.evaluateFlowers(6, existing, makeTrees(6));
      expect(result.upgraded).toHaveLength(1);
      expect(result.upgraded[0].id).toBe('flower_1');
      expect(result.upgraded[0].stage).toBe(2);
      expect(result.added).toHaveLength(0);
    });

    it('keeps maturing flowers when the tree count has plateaued', () => {
      // 4 trees → desired flower count is 1, already met, so no new flowers are
      // due. A below-max flower must still progress one stage per complete day.
      let flowers = [
        { id: 'flower_1', position: { x: 5, y: 5 }, variety: 'pink' as const, stage: 1, createdAt: 1000 },
      ] as Flower[];
      const maxStage = 4; // pink has 4 stages
      for (let day = 0; day < 10; day++) {
        const result = WorldElementLogic.evaluateFlowers(4, flowers, makeTrees(4));
        expect(result.added).toHaveLength(0);
        if (result.upgraded.length > 0) {
          flowers = flowers.map((f) =>
            f.id === result.upgraded[0].id ? result.upgraded[0] : f
          );
        }
      }
      expect(flowers[0].stage).toBe(maxStage);

      // Once at max stage, no further upgrades or additions happen.
      const settled = WorldElementLogic.evaluateFlowers(4, flowers, makeTrees(4));
      expect(settled.upgraded).toHaveLength(0);
      expect(settled.added).toHaveLength(0);
    });
  });

  describe('decayFlowers', () => {
    it('returns nothing when flowers are at or below desired count', () => {
      const flowers = [
        { id: 'flower_1', position: { x: 1, y: 1 }, variety: 'pink' as const, stage: 2, createdAt: 1000 },
      ];
      const result = WorldElementLogic.decayFlowers(4, flowers);
      expect(result.removed).toHaveLength(0);
      expect(result.degraded).toHaveLength(0);
    });

    it('degrades a flower stage when tree count drops below threshold', () => {
      const flowers = [
        { id: 'flower_a', position: { x: 1, y: 1 }, variety: 'pink' as const, stage: 2, createdAt: 1000 },
        { id: 'flower_b', position: { x: 2, y: 2 }, variety: 'leaf' as const, stage: 1, createdAt: 2000 },
      ];
      // 2 trees → desired = 0 (below threshold of 4), so both are excess
      const result = WorldElementLogic.decayFlowers(2, flowers);
      // One degraded (the highest stage, newest first)
      expect(result.degraded).toHaveLength(1);
      expect(result.degraded[0].stage).toBe(1);
    });

    it('removes a flower at stage 1', () => {
      const flowers = [
        { id: 'flower_a', position: { x: 1, y: 1 }, variety: 'pink' as const, stage: 1, createdAt: 1000 },
      ];
      const result = WorldElementLogic.decayFlowers(2, flowers);
      expect(result.removed).toHaveLength(1);
      expect(result.removed[0]).toBe('flower_a');
    });
  });

  describe('decayRivers', () => {
    it('returns nothing when rivers are at or below desired count', () => {
      const rivers = [
        { id: 'river_1', tiles: [{ x: 0, y: 0 }], createdAt: 100 },
      ];
      // 18 trees = threshold → desired = 1
      const result = WorldElementLogic.decayRivers(18, rivers);
      expect(result).toHaveLength(0);
    });

    it('removes one river when tree count drops below threshold', () => {
      const rivers = [
        { id: 'river_old', tiles: [{ x: 0, y: 0 }], createdAt: 100 },
        { id: 'river_new', tiles: [{ x: 5, y: 5 }], createdAt: 200 },
      ];
      // 10 trees → below threshold of 18 → desired = 0, excess = 2
      const result = WorldElementLogic.decayRivers(10, rivers);
      expect(result).toHaveLength(1);
      // Newest river removed first
      expect(result[0]).toBe('river_new');
    });
  });

  describe('removeObstaclesByType', () => {
    const obstacles = [
      { id: 'rock_old', type: 'rock' as const, variant: 1, position: { x: 0, y: 0 }, createdAt: 100 },
      { id: 'rock_new', type: 'rock' as const, variant: 2, position: { x: 1, y: 0 }, createdAt: 300 },
      { id: 'stump_old', type: 'stump' as const, variant: 1, position: { x: 2, y: 0 }, createdAt: 200 },
      { id: 'stump_new', type: 'stump' as const, variant: 2, position: { x: 3, y: 0 }, createdAt: 400 },
    ];

    it('returns nothing for a count of zero', () => {
      expect(WorldElementLogic.removeObstaclesByType(obstacles, 'rock', 0)).toHaveLength(0);
    });

    it('clears the oldest obstacles of the requested type first', () => {
      const result = WorldElementLogic.removeObstaclesByType(obstacles, 'rock', 1);
      expect(result).toEqual(['rock_old']);
    });

    it('only clears the requested type', () => {
      const result = WorldElementLogic.removeObstaclesByType(obstacles, 'stump', 5);
      // Both stumps, oldest first; no rocks included
      expect(result).toEqual(['stump_old', 'stump_new']);
    });

    it('never returns more than exist', () => {
      const result = WorldElementLogic.removeObstaclesByType(obstacles, 'rock', 10);
      expect(result).toHaveLength(2);
    });
  });

  describe('bounds-aware placement', () => {
    it('spreads initial obstacles across the full vertical extent', () => {
      // A tall portrait bounds (wide-ish X, much taller Y).
      const bounds = { halfX: 9, halfY: 19 };
      const obstacles = WorldElementLogic.generateInitialObstacles(bounds);

      const ys = obstacles.map((o) => o.position.y);
      const maxY = Math.max(...ys);
      const minY = Math.min(...ys);

      // Every obstacle stays within bounds...
      obstacles.forEach((o) => {
        expect(Math.abs(o.position.x)).toBeLessThanOrEqual(bounds.halfX);
        expect(Math.abs(o.position.y)).toBeLessThanOrEqual(bounds.halfY);
      });
      // ...and at least some reach the outer thirds (not just the centre).
      expect(maxY).toBeGreaterThan(9);
      expect(minY).toBeLessThan(-9);
    });

    it('keeps spawned obstacles within the supplied bounds', () => {
      const bounds = { halfX: 3, halfY: 12 };
      for (let i = 0; i < 50; i++) {
        const obstacle = WorldElementLogic.spawnObstacle([], [], [], bounds);
        expect(Math.abs(obstacle.position.x)).toBeLessThanOrEqual(bounds.halfX);
        expect(Math.abs(obstacle.position.y)).toBeLessThanOrEqual(bounds.halfY);
      }
    });
  });
});

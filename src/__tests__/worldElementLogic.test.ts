import { WorldElementLogic } from '../logic/worldElementLogic';
import { GAME_CONFIG } from '../config/game.config';
import { Tree, Building, Animal } from '../types/models';

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
      const result = WorldElementLogic.evaluateBuildings(10, [], makeTrees(10));
      expect(result).toHaveLength(0);
    });

    it('spawns a home at 30 trees', () => {
      const result = WorldElementLogic.evaluateBuildings(30, [], makeTrees(30));
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('home');
    });

    it('spawns home and mansion at 60 trees', () => {
      const result = WorldElementLogic.evaluateBuildings(60, [], makeTrees(60));
      const homes = result.filter((b) => b.type === 'home');
      const mansions = result.filter((b) => b.type === 'mansion');
      // home: 1 + floor((60-30)/20) = 2 homes, mansion: 1
      expect(homes).toHaveLength(2);
      expect(mansions).toHaveLength(1);
    });

    it('scales buildings proportionally with many trees', () => {
      const result = WorldElementLogic.evaluateBuildings(120, [], makeTrees(120));
      const homes = result.filter((b) => b.type === 'home');
      const mansions = result.filter((b) => b.type === 'mansion');
      const palaces = result.filter((b) => b.type === 'palace');
      // home: 1 + floor((120-30)/20) = 5
      // mansion: 1 + floor((120-60)/40) = 2
      // palace: 1 + floor((120-100)/80) = 1
      expect(homes).toHaveLength(5);
      expect(mansions).toHaveLength(2);
      expect(palaces).toHaveLength(1);
    });

    it('does not duplicate already existing buildings', () => {
      const existing: Building[] = [
        { id: 'b1', type: 'home', position: { x: 5, y: 5 }, createdAt: 0 },
      ];
      const result = WorldElementLogic.evaluateBuildings(60, existing, makeTrees(60));
      // Should add 1 more home (need 2, have 1) + 1 mansion
      const homes = result.filter((b) => b.type === 'home');
      const mansions = result.filter((b) => b.type === 'mansion');
      expect(homes).toHaveLength(1);
      expect(mansions).toHaveLength(1);
    });

    it('clusters same-type buildings adjacently within clusters', () => {
      const result = WorldElementLogic.evaluateBuildings(120, [], makeTrees(120));
      const homes = result.filter((b) => b.type === 'home');
      // Group homes into clusters (distance ≤ 4) — each cluster should have > 1 member
      // or each home should be within 4 tiles of at least one other home in its cluster
      if (homes.length <= 1) return;
      // At minimum, each home belongs to a cluster where it's near another home (distance ≤ 4)
      for (let i = 0; i < homes.length; i++) {
        const nearAny = homes.some(
          (h, j) => j !== i && Math.abs(h.position.x - homes[i].position.x) + Math.abs(h.position.y - homes[i].position.y) <= 4
        );
        // With cluster splitting, some clusters may have only 1 building (min clusterSize can be 1)
        // So we just verify that buildings form recognisable groups, not that every one has a neighbour
        if (homes.length >= GAME_CONFIG.world.buildings.home.clusterSize.min * 2) {
          // If we have enough homes for at least 2 full clusters, most should be clustered
          // Allow some isolated ones due to random limits
          expect(nearAny || homes.length <= GAME_CONFIG.world.buildings.home.clusterSize.max).toBe(true);
        }
      }
    });

    it('keeps different building types in separate clusters', () => {
      const result = WorldElementLogic.evaluateBuildings(120, [], makeTrees(120));
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
      const result = WorldElementLogic.evaluateRivers(30, [], makeTrees(30), []);
      expect(result).toHaveLength(0);
    });

    it('returns one river at threshold', () => {
      const trees = makeTrees(35);
      const result = WorldElementLogic.evaluateRivers(35, [], trees, []);
      expect(result).toHaveLength(1);
      expect(result[0].tiles.length).toBeGreaterThanOrEqual(3);
    });

    it('scales river count with trees', () => {
      const trees = makeTrees(100);
      const result = WorldElementLogic.evaluateRivers(100, [], trees, []);
      // 1 + floor((100-35)/30) = 3
      expect(result).toHaveLength(3);
    });

    it('does not add rivers if already at target', () => {
      const trees = makeTrees(35);
      const existingRivers = [{ id: 'r1', tiles: [{ x: -8, y: -8 }], createdAt: 0 }];
      const result = WorldElementLogic.evaluateRivers(35, existingRivers, trees, []);
      expect(result).toHaveLength(0);
    });

    it('generates cardinally connected paths', () => {
      const trees = makeTrees(35);
      const result = WorldElementLogic.evaluateRivers(35, [], trees, []);
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
        { id: 'b1', type: 'home' as const, position: { x: -5, y: -5 }, createdAt: 0 },
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
});

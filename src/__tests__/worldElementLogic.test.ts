import { WorldElementLogic } from '../logic/worldElementLogic';
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
      expect(result).toHaveLength(2);
      const types = result.map((b) => b.type);
      expect(types).toContain('home');
      expect(types).toContain('mansion');
    });

    it('does not duplicate already existing buildings', () => {
      const existing: Building[] = [
        { id: 'b1', type: 'home', position: { x: 5, y: 5 }, createdAt: 0 },
      ];
      const result = WorldElementLogic.evaluateBuildings(60, existing, makeTrees(60));
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('mansion');
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

    it('does not duplicate existing animals', () => {
      const existing: Animal[] = [
        { id: 'a1', type: 'bird', position: { x: 3, y: 3 }, createdAt: 0 },
      ];
      const result = WorldElementLogic.evaluateAnimals(5, existing, makeTrees(5));
      expect(result).toHaveLength(0);
    });

    it('spawns all animals at 40+ trees', () => {
      const result = WorldElementLogic.evaluateAnimals(40, [], makeTrees(40));
      expect(result).toHaveLength(4);
      const types = result.map((a) => a.type);
      expect(types).toContain('bird');
      expect(types).toContain('rabbit');
      expect(types).toContain('squirrel');
      expect(types).toContain('deer');
    });
  });

  describe('evaluateMapExpansion', () => {
    const initial = { width: 4, height: 4 };

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
});

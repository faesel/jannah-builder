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
    const initial = { width: 20, height: 20 };

    it('returns null when below the threshold', () => {
      expect(WorldElementLogic.evaluateMapExpansion(10, initial)).toBeNull();
    });

    it('expands at the first threshold (20 trees)', () => {
      const result = WorldElementLogic.evaluateMapExpansion(20, initial);
      expect(result).toEqual({ width: 25, height: 25 });
    });

    it('expands further at 40 trees', () => {
      const result = WorldElementLogic.evaluateMapExpansion(40, initial);
      expect(result).toEqual({ width: 30, height: 30 });
    });

    it('returns null if map is already large enough', () => {
      const large = { width: 30, height: 30 };
      expect(WorldElementLogic.evaluateMapExpansion(20, large)).toBeNull();
    });
  });
});

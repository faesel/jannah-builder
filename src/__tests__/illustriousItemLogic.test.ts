import { IllustriousItemLogic } from '../logic/illustriousItemLogic';
import { IllustriousItem, Tree } from '../types/models';
import { defaultPlacementBounds } from '../logic/placement';

function makeTree(x: number, y: number): Tree {
  return {
    id: `tree_${x}_${y}`,
    stage: 'mature',
    position: { x, y },
    createdAt: 0,
    lastUpdated: 0,
  };
}

function makeItem(type: IllustriousItem['type']): IllustriousItem {
  return {
    id: `illustrious_${type}_1`,
    type,
    position: { x: 10, y: 0 },
    createdAt: 0,
    streakDays: 30,
  };
}

describe('IllustriousItemLogic', () => {
  const trees = [makeTree(0, 0), makeTree(1, 0), makeTree(0, 1)];

  describe('evaluate', () => {
    it('adds radiant_fountain at 30 day streak', () => {
      const result = IllustriousItemLogic.evaluate(30, [], trees);
      expect(result.itemsToAdd).toHaveLength(1);
      expect(result.itemsToAdd[0].type).toBe('radiant_fountain');
      expect(result.itemIdsToRemove).toHaveLength(0);
    });

    it('does not duplicate an existing item', () => {
      const existing = [makeItem('radiant_fountain')];
      const result = IllustriousItemLogic.evaluate(30, existing, trees);
      expect(result.itemsToAdd).toHaveLength(0);
    });

    it('removes an item when streak drops below threshold', () => {
      const existing = [makeItem('radiant_fountain')];
      const result = IllustriousItemLogic.evaluate(10, existing, trees);
      expect(result.itemIdsToRemove).toEqual(['illustrious_radiant_fountain_1']);
    });

    it('adds multiple items for long streaks', () => {
      const result = IllustriousItemLogic.evaluate(120, [], trees);
      expect(result.itemsToAdd).toHaveLength(4);
      const types = result.itemsToAdd.map((i) => i.type);
      expect(types).toContain('radiant_fountain');
      expect(types).toContain('glowing_tree');
      expect(types).toContain('floating_lantern');
      expect(types).toContain('light_arch');
    });

    it('returns nothing for 0 streak and no existing items', () => {
      const result = IllustriousItemLogic.evaluate(0, [], trees);
      expect(result.itemsToAdd).toHaveLength(0);
      expect(result.itemIdsToRemove).toHaveLength(0);
    });
  });

  describe('findPosition collision avoidance', () => {
    const bounds = defaultPlacementBounds();

    it('never places an item on a tile occupied by another asset', () => {
      // {3,0} is the first preferred offset for a 3-tree cluster — the exact
      // tile the radiant fountain used to land on top of a stump.
      const stump = { x: 3, y: 0 };
      const pos = IllustriousItemLogic.findPosition(trees, [], bounds, [stump]);
      expect(pos).not.toEqual(stump);
    });

    it('falls back to a free tile when every preferred offset is blocked', () => {
      const blocked = [
        { x: 3, y: 0 }, { x: -3, y: 0 }, { x: 0, y: 3 }, { x: 0, y: -3 },
        { x: 3, y: 1 }, { x: -3, y: -1 }, { x: 1, y: -3 }, { x: -1, y: 3 },
      ];
      const occupiedKeys = new Set(
        [...blocked, ...trees.map((t) => t.position)].map((p) => `${p.x},${p.y}`)
      );
      const pos = IllustriousItemLogic.findPosition(trees, [], bounds, blocked);
      expect(occupiedKeys.has(`${pos.x},${pos.y}`)).toBe(false);
    });

    it('routes extraOccupied through evaluate so a fountain avoids a stump', () => {
      const stump = { x: 3, y: 0 };
      const result = IllustriousItemLogic.evaluate(30, [], trees, bounds, [stump]);
      expect(result.itemsToAdd).toHaveLength(1);
      expect(result.itemsToAdd[0].position).not.toEqual(stump);
    });

    it('places multiple new items on distinct tiles', () => {
      const result = IllustriousItemLogic.evaluate(120, [], trees, bounds, []);
      const keys = result.itemsToAdd.map((i) => `${i.position.x},${i.position.y}`);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });
});

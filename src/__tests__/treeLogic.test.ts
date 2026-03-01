import { TreeLogic } from '../logic/treeLogic';
import { Tree } from '../types/models';

function makeTree(stage: 'sapling' | 'young' | 'mature', x = 0, y = 0): Tree {
  return {
    id: `tree_${x}_${y}`,
    stage,
    position: { x, y },
    createdAt: 0,
    lastUpdated: 0,
  };
}

describe('TreeLogic', () => {
  describe('createTree', () => {
    it('creates a sapling', () => {
      const tree = TreeLogic.createTree({ x: 5, y: 3 });
      expect(tree.stage).toBe('sapling');
      expect(tree.position).toEqual({ x: 5, y: 3 });
    });
  });

  describe('upgradeTree', () => {
    it('upgrades sapling to young', () => {
      const tree = makeTree('sapling');
      const upgraded = TreeLogic.upgradeTree(tree);
      expect(upgraded?.stage).toBe('young');
    });

    it('upgrades young to mature', () => {
      const tree = makeTree('young');
      const upgraded = TreeLogic.upgradeTree(tree);
      expect(upgraded?.stage).toBe('mature');
    });

    it('returns null when already mature', () => {
      const tree = makeTree('mature');
      expect(TreeLogic.upgradeTree(tree)).toBeNull();
    });
  });

  describe('degradeTree', () => {
    it('degrades mature to young', () => {
      const tree = makeTree('mature');
      const degraded = TreeLogic.degradeTree(tree);
      expect(degraded?.stage).toBe('young');
    });

    it('degrades young to sapling', () => {
      const tree = makeTree('young');
      const degraded = TreeLogic.degradeTree(tree);
      expect(degraded?.stage).toBe('sapling');
    });

    it('returns null for sapling (should be removed)', () => {
      const tree = makeTree('sapling');
      expect(TreeLogic.degradeTree(tree)).toBeNull();
    });
  });

  describe('shouldGenerateTrees', () => {
    it('returns 0 for fewer than 3 consecutive days', () => {
      expect(TreeLogic.shouldGenerateTrees(0)).toBe(0);
      expect(TreeLogic.shouldGenerateTrees(1)).toBe(0);
      expect(TreeLogic.shouldGenerateTrees(2)).toBe(0);
    });

    it('returns 1 for 3 consecutive days', () => {
      expect(TreeLogic.shouldGenerateTrees(3)).toBe(1);
    });

    it('returns 3 for 9 consecutive days', () => {
      expect(TreeLogic.shouldGenerateTrees(9)).toBe(3);
    });
  });

  describe('applyDecay', () => {
    it('returns empty results for empty tree list', () => {
      const result = TreeLogic.applyDecay([]);
      expect(result.degradedTrees).toHaveLength(0);
      expect(result.removedTreeIds).toHaveLength(0);
    });

    it('degrades the most mature tree first', () => {
      const trees = [makeTree('sapling', 0, 0), makeTree('mature', 1, 1)];
      const result = TreeLogic.applyDecay(trees);
      expect(result.degradedTrees).toHaveLength(1);
      expect(result.degradedTrees[0].id).toBe('tree_1_1');
      expect(result.degradedTrees[0].stage).toBe('young');
    });

    it('removes a sapling when it is the only tree', () => {
      const trees = [makeTree('sapling', 0, 0)];
      const result = TreeLogic.applyDecay(trees);
      expect(result.removedTreeIds).toEqual(['tree_0_0']);
      expect(result.degradedTrees).toHaveLength(0);
    });

    it('only affects one tree at a time', () => {
      const trees = [
        makeTree('mature', 0, 0),
        makeTree('mature', 1, 1),
        makeTree('young', 2, 2),
      ];
      const result = TreeLogic.applyDecay(trees);
      const totalAffected =
        result.degradedTrees.length + result.removedTreeIds.length;
      expect(totalAffected).toBe(1);
    });
  });

  describe('generateTrees', () => {
    it('generates the requested number of trees', () => {
      const trees = TreeLogic.generateTrees(3, []);
      expect(trees).toHaveLength(3);
      trees.forEach((t) => expect(t.stage).toBe('sapling'));
    });

    it('avoids occupied positions', () => {
      const existing = [makeTree('sapling', 0, 0)];
      const newTrees = TreeLogic.generateTrees(1, existing);
      expect(newTrees[0].position).not.toEqual({ x: 0, y: 0 });
    });
  });

  describe('countByStage', () => {
    it('counts correctly', () => {
      const trees = [
        makeTree('sapling'),
        makeTree('sapling'),
        makeTree('young'),
        makeTree('mature'),
      ];
      expect(TreeLogic.countByStage(trees)).toEqual({
        sapling: 2,
        young: 1,
        mature: 1,
      });
    });
  });
});

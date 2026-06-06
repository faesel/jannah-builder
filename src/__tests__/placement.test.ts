import {
  defaultPlacementBounds,
  computePlacementBounds,
  computeTileSize,
  boundsEqual,
  isWithinBounds,
  randomPositionInBounds,
} from '../logic/placement';
import { GAME_CONFIG } from '../config/game.config';

describe('placement bounds', () => {
  describe('defaultPlacementBounds', () => {
    it('produces a square half-extent from the configured grid size', () => {
      const bounds = defaultPlacementBounds();
      const expected = Math.floor(GAME_CONFIG.map.initialGridSize / 2) - 1;
      expect(bounds.halfX).toBe(expected);
      expect(bounds.halfY).toBe(expected);
    });
  });

  describe('computeTileSize', () => {
    it('keeps a constant tile size across typical phone screens', () => {
      // Two very different devices (slab phone vs. foldable inner screen) must
      // draw assets at the same size — the whole point of the fix.
      const slab = computeTileSize(411, 891);
      const foldInner = computeTileSize(707, 883);
      expect(slab).toBe(GAME_CONFIG.map.targetTileSize);
      expect(foldInner).toBe(GAME_CONFIG.map.targetTileSize);
      expect(slab).toBe(foldInner);
    });

    it('shrinks the tile on very narrow screens to keep enough tiles visible', () => {
      const narrowAxis = GAME_CONFIG.map.minVisibleTiles * (GAME_CONFIG.map.targetTileSize - 4);
      const tile = computeTileSize(narrowAxis, 1200);
      expect(tile).toBeLessThan(GAME_CONFIG.map.targetTileSize);
      // Still keeps at least the configured minimum number of tiles.
      expect(Math.floor(narrowAxis / tile)).toBeGreaterThanOrEqual(GAME_CONFIG.map.minVisibleTiles);
    });

    it('never drops below the minimum recognisable tile size', () => {
      const tile = computeTileSize(10, 10);
      expect(tile).toBeGreaterThanOrEqual(GAME_CONFIG.map.minTileSize);
    });
  });

  describe('computePlacementBounds', () => {
    it('makes a tall portrait screen taller than it is wide', () => {
      // A typical tall phone viewport.
      const bounds = computePlacementBounds(400, 800);
      expect(bounds.halfY).toBeGreaterThan(bounds.halfX);
    });

    it('mirrors the renderer horizontal tile maths', () => {
      const width = 400;
      const height = 800;
      const tileSize = computeTileSize(width, height);
      const cols = Math.ceil(width / tileSize);

      const bounds = computePlacementBounds(width, height);
      expect(bounds.halfX).toBe(Math.max(1, Math.floor(cols / 2) - 1));
    });

    it('gives a larger screen larger bounds (reveals more world)', () => {
      const small = computePlacementBounds(400, 800);
      const large = computePlacementBounds(800, 1200);
      expect(large.halfX).toBeGreaterThan(small.halfX);
      expect(large.halfY).toBeGreaterThan(small.halfY);
    });

    it('reserves a bottom margin so tall sprites are not clipped', () => {
      const width = 400;
      const height = 800;
      const tileSize = computeTileSize(width, height);
      const rows = Math.ceil(height / tileSize);

      const bounds = computePlacementBounds(width, height);
      // The lowest base row must sit strictly above the last fully visible row,
      // leaving room for the two-tile-tall tree sprite and the navigation.
      const centerRow = Math.floor(rows / 2);
      const lastFullyVisibleRow = Math.floor(height / tileSize) - 1;
      const lowestBaseRow = centerRow + bounds.halfY;
      expect(lowestBaseRow).toBeLessThan(lastFullyVisibleRow);
      // And it is strictly tighter than the old centre-row half-extent.
      expect(bounds.halfY).toBeLessThan(Math.floor(rows / 2) - 1);
    });

    it('reserves additional room for a bottom inset (navigation)', () => {
      const withoutInset = computePlacementBounds(400, 800);
      const withInset = computePlacementBounds(400, 800, 120);
      expect(withInset.halfY).toBeLessThan(withoutInset.halfY);
    });

    it('never returns a degenerate (zero) extent', () => {
      const bounds = computePlacementBounds(10, 10);
      expect(bounds.halfX).toBeGreaterThanOrEqual(1);
      expect(bounds.halfY).toBeGreaterThanOrEqual(1);
    });
  });

  describe('boundsEqual', () => {
    it('treats matching extents as equal', () => {
      expect(boundsEqual({ halfX: 9, halfY: 18 }, { halfX: 9, halfY: 18 })).toBe(true);
    });

    it('treats differing extents as unequal', () => {
      expect(boundsEqual({ halfX: 9, halfY: 18 }, { halfX: 9, halfY: 19 })).toBe(false);
    });

    it('handles undefined operands', () => {
      expect(boundsEqual(undefined, undefined)).toBe(true);
      expect(boundsEqual({ halfX: 1, halfY: 1 }, undefined)).toBe(false);
    });
  });

  describe('isWithinBounds', () => {
    const bounds = { halfX: 5, halfY: 10 };

    it('accepts tiles on the boundary', () => {
      expect(isWithinBounds(5, 10, bounds)).toBe(true);
      expect(isWithinBounds(-5, -10, bounds)).toBe(true);
    });

    it('rejects tiles outside the rectangle', () => {
      expect(isWithinBounds(6, 0, bounds)).toBe(false);
      expect(isWithinBounds(0, 11, bounds)).toBe(false);
    });
  });

  describe('randomPositionInBounds', () => {
    it('always returns a position inside the bounds', () => {
      const bounds = { halfX: 4, halfY: 8 };
      for (let i = 0; i < 200; i++) {
        const pos = randomPositionInBounds(new Set(), bounds);
        expect(isWithinBounds(pos.x, pos.y, bounds)).toBe(true);
      }
    });

    it('avoids occupied tiles', () => {
      const bounds = { halfX: 1, halfY: 1 };
      // Occupy every tile except (1, 1)
      const occupied = new Set<string>();
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          if (!(x === 1 && y === 1)) occupied.add(`${x},${y}`);
        }
      }
      const pos = randomPositionInBounds(occupied, bounds);
      expect(pos).toEqual({ x: 1, y: 1 });
    });

    it('spreads positions across the full vertical extent', () => {
      const bounds = { halfX: 4, halfY: 18 };
      const ys = new Set<number>();
      for (let i = 0; i < 500; i++) {
        ys.add(randomPositionInBounds(new Set(), bounds).y);
      }
      // Expect at least one placement in the outer thirds (top and bottom),
      // proving spawning is not confined to the centre.
      const maxY = Math.max(...ys);
      const minY = Math.min(...ys);
      expect(maxY).toBeGreaterThan(10);
      expect(minY).toBeLessThan(-10);
    });
  });
});

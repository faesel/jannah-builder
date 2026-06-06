/**
 * Placement bounds
 *
 * Shared helpers for deciding where world elements may spawn. The map is
 * rendered across the whole device screen, but on a tall portrait phone the
 * visible area is much taller than it is wide. To stop assets clustering in the
 * centre, placement is constrained to a screen-derived rectangle expressed as a
 * half-extent from the centre tile (`halfX`, `halfY`).
 *
 * The computation mirrors how `JannahCanvas` lays out tiles so that the
 * placement region exactly matches what the player can see.
 */

import { Position, PlacementBounds } from '../types/models';
import { GAME_CONFIG } from '../config/game.config';

/**
 * Square fallback used when the real screen size is not yet known (e.g. during
 * background day-processing before the Jannah screen has rendered).
 */
export function defaultPlacementBounds(): PlacementBounds {
  const half = Math.floor(GAME_CONFIG.map.initialGridSize / 2) - 1;
  return { halfX: half, halfY: half };
}

/**
 * On-screen tile size in density-independent pixels.
 *
 * The map neither pans nor zooms, so we keep tiles a *constant* size across
 * devices rather than fitting a fixed number of tiles along an axis. This draws
 * every asset at the same physical size on every screen; larger displays simply
 * reveal more of the world. `minVisibleTiles` shrinks the tile on very narrow
 * screens so a minimum number of tiles always fit, and `minTileSize` keeps a
 * tile recognisable on tiny displays.
 *
 * This is the single source of truth for tile size — both the renderer and the
 * placement-bounds calculation must use it so they never drift apart.
 */
export function computeTileSize(screenWidth: number, screenHeight: number): number {
  const { targetTileSize, minTileSize, minVisibleTiles } = GAME_CONFIG.map;
  const shortAxis = Math.min(screenWidth, screenHeight);
  const fitForNarrowScreen = Math.floor(shortAxis / minVisibleTiles);
  return Math.max(minTileSize, Math.min(targetTileSize, fitForNarrowScreen));
}

/**
 * Derive placement bounds from the rendered screen size, matching the tile
 * layout used by JannahCanvas (a constant `computeTileSize`, so larger screens
 * yield more tiles and therefore larger bounds).
 *
 * Two things would otherwise clip assets near the bottom of a tall screen:
 *   1. Tree sprites are two tiles tall, anchored at their base tile — so a tree
 *      on the very bottom row has its trunk drawn right at the screen edge.
 *   2. The canvas grid uses `ceil(screenHeight / tileSize)` rows, which can
 *      overflow the visible container (the overflow is hidden), and the bottom
 *      navigation sits directly beneath the scene.
 *
 * To keep every placed asset fully visible we constrain the vertical extent to
 * rows that are wholly inside the un-occluded area, reserving one tile of
 * breathing room at the bottom and one tile at the top for tree canopies.
 * `bottomInset` (in pixels) lets the caller exclude an occluded region such as
 * the bottom navigation / system inset.
 */
export function computePlacementBounds(
  screenWidth: number,
  screenHeight: number,
  bottomInset = 0
): PlacementBounds {
  const tileSize = computeTileSize(screenWidth, screenHeight);
  const cols = Math.ceil(screenWidth / tileSize);
  const rows = Math.ceil(screenHeight / tileSize);
  const centerRow = Math.floor(rows / 2);

  // Last grid row whose full tile height fits within the un-occluded area.
  const visibleHeight = Math.max(0, screenHeight - Math.max(0, bottomInset));
  const lastFullyVisibleRow = Math.floor(visibleHeight / tileSize) - 1;

  // Reserve one tile above the base for the tree canopy, and one tile of
  // breathing room below the lowest base so a two-tile-tall tree never clips.
  const halfYTop = centerRow - 1;
  const halfYBottom = lastFullyVisibleRow - 1 - centerRow;

  return {
    halfX: Math.max(1, Math.floor(cols / 2) - 1),
    halfY: Math.max(1, Math.min(halfYTop, halfYBottom)),
  };
}

export function boundsEqual(a?: PlacementBounds, b?: PlacementBounds): boolean {
  if (!a || !b) return a === b;
  return a.halfX === b.halfX && a.halfY === b.halfY;
}

/** True when a tile lies within the placement rectangle. */
export function isWithinBounds(x: number, y: number, bounds: PlacementBounds): boolean {
  return Math.abs(x) <= bounds.halfX && Math.abs(y) <= bounds.halfY;
}

/**
 * Find a random unoccupied tile within the bounds. Falls back to a full scan so
 * a position is always returned when any free tile exists.
 */
export function randomPositionInBounds(
  occupied: Set<string>,
  bounds: PlacementBounds,
  attempts = 200
): Position {
  const spanX = bounds.halfX * 2 + 1;
  const spanY = bounds.halfY * 2 + 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const x = Math.floor(Math.random() * spanX) - bounds.halfX;
    const y = Math.floor(Math.random() * spanY) - bounds.halfY;
    if (!occupied.has(`${x},${y}`)) {
      return { x, y };
    }
  }

  for (let x = -bounds.halfX; x <= bounds.halfX; x++) {
    for (let y = -bounds.halfY; y <= bounds.halfY; y++) {
      if (!occupied.has(`${x},${y}`)) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: 0 };
}

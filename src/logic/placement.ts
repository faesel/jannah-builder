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
 * Derive placement bounds from the rendered screen size, matching the tile
 * layout used by JannahCanvas (gridSize tiles along the shorter axis).
 */
export function computePlacementBounds(
  screenWidth: number,
  screenHeight: number
): PlacementBounds {
  const gridSize = GAME_CONFIG.map.initialGridSize;
  const tileSize = Math.max(
    GAME_CONFIG.map.minTileSize,
    Math.floor(Math.min(screenWidth, screenHeight) / gridSize)
  );
  const cols = Math.ceil(screenWidth / tileSize);
  const rows = Math.ceil(screenHeight / tileSize);
  return {
    halfX: Math.max(1, Math.floor(cols / 2) - 1),
    halfY: Math.max(1, Math.floor(rows / 2) - 1),
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

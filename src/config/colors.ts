/**
 * Shared color constants.
 * Single source of truth — change here to debug or restyle globally.
 */

import { Season } from './game.config';

export const COLORS = {
  /** Grass / Jannah map background */
  grass: '#7EC850',

  /** Season-specific grass colors for tile rendering */
  grassBySeason: {
    spring: '#7EC850',
    summer: '#5DAE3B',
    autumn: '#C4A243',
    winter: '#D4DFE6',
  } as Record<Season, string>,

  /** Slightly darker grass for checkerboard variation */
  grassDarkBySeason: {
    spring: '#6FB844',
    summer: '#519E30',
    autumn: '#B89438',
    winter: '#C5D0D8',
  } as Record<Season, string>,

  /** Default app background (non-map screens) */
  appBackground: '#F5F7F3',
} as const;

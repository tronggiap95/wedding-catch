/**
 * Display depth layers (higher draws above lower).
 * Keep gaps between bands so mid-layer objects can insert later.
 */
export const Depth = {
  Background: 0,
  Items: 100,
  Player: 200,
  Effects: 300,
  Ui: 400,
  Overlay: 500,
} as const;

export type DepthLayer = (typeof Depth)[keyof typeof Depth];

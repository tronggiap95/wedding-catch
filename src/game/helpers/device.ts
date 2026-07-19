/** iPhone 16 Pro Max CSS width — baseline for mobile layout / keyboard speed. */
export const MOBILE_DESIGN_WIDTH = 430;

/**
 * Max playfield width on large screens.
 * Slightly wider than a phone, but capped so desktop play stays fair.
 */
export const MAX_GAME_WIDTH = 480;

/** True when the primary input model is touch (mobile / tablet). */
export function isTouchPrimary(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

/** True when the viewport is in portrait orientation. */
export function isPortrait(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.innerHeight >= window.innerWidth;
}

/**
 * Device pixel ratio capped for sharpness vs GPU cost.
 * iPhone 16 Pro Max is 3x — keep that ceiling so assets stay crisp.
 */
export function getDisplayPixelRatio(): number {
  if (typeof window === 'undefined') {
    return 1;
  }

  const raw = window.devicePixelRatio || 1;
  return Math.min(Math.max(raw, 1), 3);
}

/**
 * CSS size for the game parent: full height, width capped for desktop fairness.
 */
export function getViewportCssSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: MOBILE_DESIGN_WIDTH, height: 932 };
  }

  const vv = window.visualViewport;
  const rawW = Math.round(vv?.width ?? window.innerWidth);
  const rawH = Math.round(vv?.height ?? window.innerHeight);
  return {
    width: Math.max(1, Math.min(rawW, MAX_GAME_WIDTH)),
    height: Math.max(1, rawH),
  };
}

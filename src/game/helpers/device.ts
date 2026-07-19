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
 * CSS viewport size for mobile browsers (visualViewport when available).
 * Prefer this over a fixed design size so the canvas can fill the phone.
 */
export function getViewportCssSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    // iPhone 16 Pro Max logical points as a sensible SSR/fallback default.
    return { width: 430, height: 932 };
  }

  const vv = window.visualViewport;
  const width = Math.round(vv?.width ?? window.innerWidth);
  const height = Math.round(vv?.height ?? window.innerHeight);
  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}

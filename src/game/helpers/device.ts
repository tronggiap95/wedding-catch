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

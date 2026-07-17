/** Clamps `value` into the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation between a and b. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

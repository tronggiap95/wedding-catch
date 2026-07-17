/** Weighted random pick. Returns undefined if the pool is empty. */
export function pickWeighted<T extends { readonly spawnWeight: number }>(
  pool: readonly T[],
): T | undefined {
  if (pool.length === 0) {
    return undefined;
  }

  let total = 0;
  for (const entry of pool) {
    total += entry.spawnWeight;
  }

  if (total <= 0) {
    return pool[0];
  }

  let roll = Math.random() * total;
  for (const entry of pool) {
    roll -= entry.spawnWeight;
    if (roll <= 0) {
      return entry;
    }
  }

  return pool[pool.length - 1];
}

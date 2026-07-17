import type { ItemRarity } from '../types/config';

/**
 * Border / aura colors for falling items (readable on mobile).
 */
export const ItemBorder = {
  bad: 0xe63946,
  badGlow: 0xff4d6d,
  /** Special bad (e.g. bad magnet) — deeper red than normal bad. */
  specialBad: 0x8b0000,
  specialBadGlow: 0xc1121f,
  bonus: 0xffd60a,
  bonusSecondary: 0xff8fab,
  rarity: {
    common: 0xffffff,
    rare: 0x4cc9f0,
    epic: 0x9b5de5,
    legendary: 0xffc300,
    mythic: 0xf72585,
  } satisfies Record<ItemRarity, number>,
} as const;

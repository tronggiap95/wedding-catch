/**
 * Shared palette as Phaser-friendly integer colors (0xRRGGBB).
 */
export const Colors = {
  Background: 0x1a1a2e,
  Ink: 0xf5f0e8,
  Accent: 0xc4a484,
  Success: 0x6b8f71,
  Danger: 0xb54a4a,
  Muted: 0x8a857c,
} as const;

export type ColorToken = (typeof Colors)[keyof typeof Colors];

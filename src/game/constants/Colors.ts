/**
 * Shared palette as Phaser-friendly integer colors (0xRRGGBB).
 * Soft wedding pastel (graphics.md).
 */
export const Colors = {
  Background: 0xfff0e6,
  BackgroundDeep: 0xf3d5c5,
  Ink: 0x5c3d2e,
  InkOnDark: 0xfff8f0,
  Accent: 0xe89a9a,
  Gold: 0xd4a017,
  Success: 0x6b8f71,
  Danger: 0xb54a4a,
  Muted: 0x8a6a58,
} as const;

export type ColorToken = (typeof Colors)[keyof typeof Colors];

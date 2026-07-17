/**
 * Stable scene identifiers.
 */
export const SceneKey = {
  Boot: 'BootScene',
  Menu: 'MenuScene',
  Countdown: 'CountdownScene',
  Play: 'PlayScene',
  Result: 'ResultScene',
} as const;

export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];

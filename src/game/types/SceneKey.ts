/**
 * Stable scene identifiers. Prefer these over string literals
 * so scene transitions stay typed and searchable.
 */
export const SceneKey = {
  Boot: 'BootScene',
  Menu: 'MenuScene',
} as const;

export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];

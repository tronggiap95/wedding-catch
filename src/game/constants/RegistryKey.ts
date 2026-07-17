/**
 * Keys for values stored on Phaser's DataManager registry.
 */
export const RegistryKey = {
  AssetManager: 'manager:assets',
  AudioManager: 'manager:audio',
  SceneManager: 'manager:scenes',
  ResponsiveManager: 'manager:responsive',
} as const;

export type RegistryKey = (typeof RegistryKey)[keyof typeof RegistryKey];

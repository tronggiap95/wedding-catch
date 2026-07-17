/**
 * Keys for Phaser registry values shared across scenes.
 */
export const RegistryKey = {
  AssetManager: 'manager:assets',
  AudioManager: 'manager:audio',
  SceneManager: 'manager:scenes',
  ResponsiveManager: 'manager:responsive',
  ConfigStore: 'config:store',
  GameState: 'state:game',
  LocaleStore: 'i18n:locale',
} as const;

export type RegistryKey = (typeof RegistryKey)[keyof typeof RegistryKey];

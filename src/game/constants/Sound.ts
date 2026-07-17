/**
 * Audio keys registered with the Phaser sound manager.
 * File paths live under public/assets/audio via AssetPath.
 */
export const Sound = {
  Catch: 'catch',
  Miss: 'miss',
  Combo: 'combo',
  MenuSelect: 'menu-select',
  BgmMenu: 'bgm-menu',
  BgmPlay: 'bgm-play',
} as const;

export type SoundKey = (typeof Sound)[keyof typeof Sound];

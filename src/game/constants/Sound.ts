/**
 * Phaser sound keys. Files live in public/assets/audio/.
 */
export const Sound = {
  BgmMenu: 'bgm_menu',
  BgmPlay: 'bgm_play',
  BgmResult: 'bgm_result',

  UiClick: 'ui_click',
  UiToggle: 'ui_toggle',

  CatchGood: 'sfx_catch_good',
  CatchBad: 'sfx_catch_bad',
  CatchBonus: 'sfx_catch_bonus',
  BonusFanfare: 'sfx_bonus_fanfare',
  BonusMagnet: 'sfx_bonus_magnet',
  BonusDouble: 'sfx_bonus_double',
  BonusStar: 'sfx_bonus_lucky_rain',
  Miss: 'sfx_miss',
  Combo: 'sfx_combo',
  Strike: 'sfx_strike',
  Stage: 'sfx_stage',

  Countdown: 'sfx_countdown',
  Go: 'sfx_go',
  GameStart: 'sfx_game_start',
  GameOver: 'sfx_game_over',
  Result: 'sfx_result',
} as const;

export type SoundKey = (typeof Sound)[keyof typeof Sound];

export const SOUND_FILES: readonly SoundKey[] = Object.values(Sound);

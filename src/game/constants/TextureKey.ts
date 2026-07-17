/**
 * Phaser texture keys for loaded images.
 */
export const TextureKey = {
  CoupleIdle: 'couple_idle',
  CoupleHappy: 'couple_happy',
  CoupleSad: 'couple_sad',

  CharDevilIdle: 'char_devil_idle',
  CharDevilThrow: 'char_devil_throw',
  CharAngelIdle: 'char_angel_idle',
  CharAngelThrow: 'char_angel_throw',
  CharGuestIdle: 'char_guest_idle',
  CharGuestThrow: 'char_guest_throw',

  UiBtnPause: 'ui_btn_pause',
  UiBtnPlay: 'ui_btn_play',
  UiBtnSoundOn: 'ui_btn_sound_on',
  UiBtnSoundOff: 'ui_btn_sound_off',
  UiHeartFull: 'ui_heart_full',
  UiHeartEmpty: 'ui_heart_empty',
  UiPanel: 'ui_panel',
  UiBtnPrimary: 'ui_btn_primary',
  UiBtnPlayLarge: 'ui_btn_play_large',
  UiBtnMenu: 'ui_btn_menu',
  UiBtnRank: 'ui_btn_rank',
  UiMenuBanner: 'ui_menu_banner',
  UiLangVi: 'ui_lang_vi',
  UiLangEn: 'ui_lang_en',
  UiLangZh: 'ui_lang_zh',
  UiHudPill: 'ui_hud_pill',
  UiIconCoin: 'ui_icon_coin',

  BgStage1: 'bg_stage_1',
  BgStage2: 'bg_stage_2',
  BgStage3: 'bg_stage_3',
  BgStage4: 'bg_stage_4',
  BgStage5: 'bg_stage_5',
  BgStage6: 'bg_stage_6',
} as const;

export type TextureKey = (typeof TextureKey)[keyof typeof TextureKey];

export const UI_TEXTURES = [
  TextureKey.UiBtnPause,
  TextureKey.UiBtnPlay,
  TextureKey.UiBtnSoundOn,
  TextureKey.UiBtnSoundOff,
  TextureKey.UiHeartFull,
  TextureKey.UiHeartEmpty,
  TextureKey.UiPanel,
  TextureKey.UiBtnPrimary,
  TextureKey.UiBtnPlayLarge,
  TextureKey.UiBtnMenu,
  TextureKey.UiBtnRank,
  TextureKey.UiMenuBanner,
  TextureKey.UiLangVi,
  TextureKey.UiLangEn,
  TextureKey.UiLangZh,
  TextureKey.UiHudPill,
  TextureKey.UiIconCoin,
] as const;

export const CHARACTER_TEXTURES = [
  TextureKey.CharDevilIdle,
  TextureKey.CharDevilThrow,
  TextureKey.CharAngelIdle,
  TextureKey.CharAngelThrow,
  TextureKey.CharGuestIdle,
  TextureKey.CharGuestThrow,
] as const;

export const BACKGROUND_TEXTURES = [
  TextureKey.BgStage1,
  TextureKey.BgStage2,
  TextureKey.BgStage3,
  TextureKey.BgStage4,
  TextureKey.BgStage5,
  TextureKey.BgStage6,
] as const;

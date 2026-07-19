import type Phaser from 'phaser';
import { Sound, SOUND_FILES } from '../constants/Sound';
import { TextureKey, UI_TEXTURES, CHARACTER_TEXTURES, BACKGROUND_TEXTURES } from '../constants/TextureKey';

const ITEM_TEXTURES = [
  'good_rose',
  'good_heart',
  'good_lucky_envelope',
  'good_bubble_tea',
  'good_champagne',
  'good_gift_box',
  'good_teddy_bear',
  'good_clover',
  'good_gold_bag',
  'good_sjc_gold',
  'good_watch',
  'good_jewelry',
  'good_pearl',
  'good_travel_ticket',
  'good_diamond',
  'good_iphone',
  'good_ipad',
  'good_macbook',
  'good_computer',
  'good_tv',
  'good_car',
  'good_house',
  'good_refrigerator',
  'good_washing_machine',
  'good_dream_home',
  'bad_banana',
  'bad_torn_socks',
  'bad_dried_fish',
  'bad_empty_box',
  'bad_bomb',
  'bad_chili',
  'bad_insult',
  'bad_torn_underwear',
  'bad_stock_crash',
  'bad_dead_mouse',
  'bad_tomato',
  'bad_brick',
  'bad_expired_medicine',
  'bad_instant_noodles',
  'bad_empty_barrel',
  'bad_empty_wallet',
  'bad_broken_phone',
  'bad_snake',
  'bad_rotten_egg',
  'bad_stress',
  'bad_magnet',
  'bad_beer',
  'bonus_magnet',
  'bonus_double_score',
  'bonus_star',
] as const;

/**
 * Queues configs + art + audio onto Phaser's loader.
 */
export class AssetManager {
  private readonly load: Phaser.Loader.LoaderPlugin;

  public constructor(load: Phaser.Loader.LoaderPlugin) {
    this.load = load;
  }

  public setBaseUrl(baseUrl: string): void {
    this.load.setBaseURL(baseUrl);
  }

  public queueBootAssets(): void {
    this.load.setBaseURL('');
    this.load.setPath('');

    this.load.json('runtime', '/config/runtime.json');
    this.load.json('stages', '/config/stages.json');
    this.load.json('items', '/config/items.json');
    this.load.json('bonuses', '/config/bonus.json');
    this.load.json('audio', '/config/audio.json');

    this.load.image(TextureKey.CoupleIdle, '/assets/images/couple_idle.png');
    this.load.image(TextureKey.CoupleHappy, '/assets/images/couple_happy.png');
    this.load.image(TextureKey.CoupleSad, '/assets/images/couple_sad.png');
    this.load.image(TextureKey.CoupleDrunk, '/assets/images/couple_drunk.png');

    for (const key of UI_TEXTURES) {
      this.load.image(key, `/assets/images/ui/${key}.png`);
    }

    for (const key of CHARACTER_TEXTURES) {
      this.load.image(key, `/assets/images/characters/${key}.png`);
    }

    for (const key of BACKGROUND_TEXTURES) {
      this.load.image(key, `/assets/images/backgrounds/${key}.png`);
    }

    for (const key of ITEM_TEXTURES) {
      this.load.image(key, `/assets/images/items/${key}.png`);
    }

    for (const key of SOUND_FILES) {
      // Continuous wedding BGM is an mp3; other cues remain wav.
      const ext = key === Sound.BgmMenu ? 'mp3' : 'wav';
      this.load.audio(key, `/assets/audio/${key}.${ext}`);
    }
  }
}

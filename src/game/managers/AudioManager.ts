import Phaser from 'phaser';
import { Sound, type SoundKey } from '../constants/Sound';
import { clamp } from '../helpers/math';

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}

interface AudioFileMeta {
  readonly path: string;
  readonly loop: boolean;
  readonly bus: 'music' | 'sfx';
  readonly volume: number;
}

interface AudioConfigFile {
  readonly master: number;
  readonly music: number;
  readonly sfx: number;
  readonly muted: boolean;
  readonly files: Readonly<Record<string, AudioFileMeta>>;
}

const STORAGE_KEY = 'wedding-catch-audio';

const DEFAULTS: AudioSettings = {
  master: 0.85,
  music: 0.55,
  sfx: 0.85,
  muted: false,
};

/**
 * Music / SFX buses, mute, and preference persistence.
 */
export class AudioManager {
  private readonly sound: Phaser.Sound.BaseSoundManager;
  private settings: AudioSettings;
  private fileMeta: Readonly<Record<string, AudioFileMeta>> = {};
  private currentBgm: SoundKey | null = null;
  private unlocked = false;
  private bonusFanfareTimer: ReturnType<typeof setTimeout> | null = null;
  private bgmDucked = false;

  public constructor(sound: Phaser.Sound.BaseSoundManager) {
    this.sound = sound;
    this.settings = this.loadSettings();
    this.applyMute();
  }

  public hydrateFromCache(cache: Phaser.Cache.CacheManager): void {
    const config = cache.json.get('audio') as AudioConfigFile | undefined;
    if (config === undefined) {
      return;
    }

    this.fileMeta = config.files;
    if (!this.hasStoredSettings()) {
      this.settings = {
        master: config.master,
        music: config.music,
        sfx: config.sfx,
        muted: config.muted,
      };
      this.persist();
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public unlock(): void {
    if (this.unlocked) {
      return;
    }
    this.unlocked = true;
    // Resume AudioContext after a user gesture (browser autoplay policy).
    try {
      const ctx = (
        this.sound as Phaser.Sound.BaseSoundManager & {
          context?: AudioContext;
        }
      ).context;
      void ctx?.resume();
    } catch {
      // Ignore unlock failures on platforms without WebAudio.
    }
  }

  public playSfx(key: SoundKey, volumeScale = 1): void {
    if (this.settings.muted || !this.has(key)) {
      return;
    }

    const meta = this.fileMeta[key];
    const base = meta?.volume ?? 1;
    this.sound.play(key, {
      volume: base * volumeScale * this.settings.sfx * this.settings.master,
    });
  }

  public playBgm(key: SoundKey): void {
    if (!this.has(key)) {
      return;
    }

    if (this.currentBgm === key) {
      const existing = this.sound.get(key);
      if (existing !== null && existing.isPlaying) {
        this.refreshBgmVolume();
        return;
      }
    }

    this.stopBgm();
    this.currentBgm = key;

    if (this.settings.muted) {
      return;
    }

    const meta = this.fileMeta[key];
    const base = meta?.volume ?? 0.65;
    this.sound.play(key, {
      loop: meta?.loop ?? true,
      volume: base * this.settings.music * this.settings.master,
    });
  }

  /** Keep the main wedding theme looping across every scene. */
  public ensureThemeBgm(): void {
    this.playBgm(Sound.BgmMenu);
  }

  /**
   * Light Mario-style fanfare layered over BGM for the bonus duration.
   * Restarts the timer if another bonus is picked up mid-fanfare.
   */
  public playBonusFanfare(durationMs: number): void {
    if (this.settings.muted || !this.has(Sound.BonusFanfare)) {
      return;
    }

    this.clearBonusFanfareTimer();
    this.sound.stopByKey(Sound.BonusFanfare);

    const meta = this.fileMeta[Sound.BonusFanfare];
    const base = meta?.volume ?? 0.55;
    this.sound.play(Sound.BonusFanfare, {
      loop: true,
      volume: base * this.settings.music * this.settings.master * 0.65,
    });

    this.setBgmDuck(true);

    this.bonusFanfareTimer = setTimeout(() => {
      this.stopBonusFanfare();
    }, Math.max(500, durationMs));
  }

  public stopBonusFanfare(): void {
    this.clearBonusFanfareTimer();
    this.sound.stopByKey(Sound.BonusFanfare);
    this.setBgmDuck(false);
  }

  private clearBonusFanfareTimer(): void {
    if (this.bonusFanfareTimer !== null) {
      clearTimeout(this.bonusFanfareTimer);
      this.bonusFanfareTimer = null;
    }
  }

  private setBgmDuck(duck: boolean): void {
    this.bgmDucked = duck;
    this.refreshBgmVolume();
  }

  public stopBgm(): void {
    if (this.currentBgm !== null) {
      this.sound.stopByKey(this.currentBgm);
    }
    this.sound.stopByKey(Sound.BgmMenu);
    this.sound.stopByKey(Sound.BgmPlay);
    this.sound.stopByKey(Sound.BgmResult);
    this.currentBgm = null;
  }

  public setMasterVolume(volume: number): void {
    this.settings.master = clamp(volume, 0, 1);
    this.persist();
    this.refreshBgmVolume();
  }

  public setMusicVolume(volume: number): void {
    this.settings.music = clamp(volume, 0, 1);
    this.persist();
    this.refreshBgmVolume();
  }

  public setSfxVolume(volume: number): void {
    this.settings.sfx = clamp(volume, 0, 1);
    this.persist();
  }

  public setMuted(muted: boolean): void {
    this.settings.muted = muted;
    this.applyMute();
    this.persist();

    if (muted) {
      this.stopBonusFanfare();
      if (this.currentBgm !== null) {
        this.sound.stopByKey(this.currentBgm);
      }
      return;
    }

    if (this.currentBgm !== null) {
      const key = this.currentBgm;
      this.currentBgm = null;
      this.playBgm(key);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.settings.muted);
    return this.settings.muted;
  }

  public isMuted(): boolean {
    return this.settings.muted;
  }

  private refreshBgmVolume(): void {
    if (this.currentBgm === null || this.settings.muted) {
      return;
    }

    const key = this.currentBgm;
    const active = this.sound.get(key) as Phaser.Sound.WebAudioSound | null;
    if (active === null) {
      return;
    }

    const meta = this.fileMeta[key];
    const base = meta?.volume ?? 0.65;
    const duck = this.bgmDucked ? 0.35 : 1;
    active.setVolume(base * this.settings.music * this.settings.master * duck);
  }

  private applyMute(): void {
    this.sound.mute = this.settings.muted;
  }

  private has(key: string): boolean {
    return this.sound.game.cache.audio.exists(key);
  }

  private loadSettings(): AudioSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return { ...DEFAULTS };
      }
      const parsed = JSON.parse(raw) as Partial<AudioSettings>;
      return {
        master: clamp(parsed.master ?? DEFAULTS.master, 0, 1),
        music: clamp(parsed.music ?? DEFAULTS.music, 0, 1),
        sfx: clamp(parsed.sfx ?? DEFAULTS.sfx, 0, 1),
        muted: Boolean(parsed.muted ?? DEFAULTS.muted),
      };
    } catch {
      return { ...DEFAULTS };
    }
  }

  private hasStoredSettings(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
  }
}

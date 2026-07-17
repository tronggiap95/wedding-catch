import type Phaser from 'phaser';
import type { SoundKey } from '../constants/Sound';
import { clamp } from '../helpers/math';

/**
 * Thin wrapper over Phaser sound. Methods are safe before assets exist.
 */
export class AudioManager {
  private readonly sound: Phaser.Sound.BaseSoundManager;
  private muted = false;
  private masterVolume = 1;

  public constructor(sound: Phaser.Sound.BaseSoundManager) {
    this.sound = sound;
  }

  public playSfx(key: SoundKey, volume = 1): void {
    if (this.muted) {
      return;
    }

    if (!this.sound.get(key)) {
      return;
    }

    this.sound.play(key, { volume: volume * this.masterVolume });
  }

  public playBgm(key: SoundKey, volume = 0.5): void {
    if (this.muted || !this.sound.get(key)) {
      return;
    }

    this.sound.stopByKey(key);
    this.sound.play(key, { loop: true, volume: volume * this.masterVolume });
  }

  public stopBgm(key?: SoundKey): void {
    if (key !== undefined) {
      this.sound.stopByKey(key);
      return;
    }

    this.sound.stopAll();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.sound.mute = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = clamp(volume, 0, 1);
  }
}

import { Events } from '../constants/Events';
import { Sound } from '../constants/Sound';
import { EventBus } from '../events/EventBus';
import type { AudioManager } from './AudioManager';

/**
 * Routes gameplay events to SFX without scenes owning audio details.
 */
export class AudioBridge {
  private readonly audio: AudioManager;
  private lastCombo = 0;

  public constructor(audio: AudioManager) {
    this.audio = audio;

    EventBus.on(Events.ItemCollected, this.onCollected, this);
    EventBus.on(Events.ItemMissed, this.onMissed, this);
    EventBus.on(Events.ComboChanged, this.onCombo, this);
    EventBus.on(Events.StageChanged, this.onStage, this);
    EventBus.on(Events.GameOver, this.onGameOver, this);
  }

  public destroy(): void {
    EventBus.off(Events.ItemCollected, this.onCollected, this);
    EventBus.off(Events.ItemMissed, this.onMissed, this);
    EventBus.off(Events.ComboChanged, this.onCombo, this);
    EventBus.off(Events.StageChanged, this.onStage, this);
    EventBus.off(Events.GameOver, this.onGameOver, this);
    this.audio.stopBonusFanfare();
  }

  private onCollected = (payload: {
    category: 'good' | 'bad' | 'bonus';
  }): void => {
    if (payload.category === 'good') {
      this.audio.playSfx(Sound.CatchGood, this.tingVolumeScale(this.lastCombo));
      return;
    }
    if (payload.category === 'bad') {
      this.audio.playSfx(Sound.CatchBad, 1.15);
      return;
    }
    // Distinct from good-item ting — no looping bonus music.
    this.audio.playSfx(Sound.CatchBonus, 1.05);
  };

  private onMissed = (payload: { category: 'good' | 'bad' | 'bonus' }): void => {
    if (payload.category === 'good') {
      this.audio.playSfx(Sound.Miss);
    }
  };

  private onCombo = (payload: { combo: number }): void => {
    this.lastCombo = payload.combo;
  };

  private onStage = (payload: { stage: number }): void => {
    if (payload.stage > 1) {
      this.audio.playSfx(Sound.Stage);
    }
  };

  private onGameOver = (): void => {
    this.audio.stopBonusFanfare();
    this.audio.playSfx(Sound.GameOver);
  };

  /** Combo 1 ≈ soft, high combo ≈ loud (capped). */
  private tingVolumeScale(combo: number): number {
    const c = Math.max(1, combo);
    return Math.min(1.55, 0.55 + (c - 1) * 0.028);
  }
}

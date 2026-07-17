import Phaser from 'phaser';
import { Depth } from '../constants/Depth';
import { Events } from '../constants/Events';
import { EventBus } from '../events/EventBus';

/**
 * Dual-layer stage backgrounds with soft crossfade on stage change.
 */
export class StageBackground {
  private readonly scene: Phaser.Scene;
  private readonly bottom: Phaser.GameObjects.Image;
  private readonly top: Phaser.GameObjects.Image;
  private readonly wash: Phaser.GameObjects.Rectangle;
  private readonly transitionMs = 700;
  private currentKey: string | null = null;
  private transitioning = false;

  public constructor(scene: Phaser.Scene, initialKey: string) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.bottom = scene.add
      .image(cx, cy, initialKey)
      .setDepth(Depth.Background)
      .setAlpha(1);
    this.fitCover(this.bottom);

    this.top = scene.add
      .image(cx, cy, initialKey)
      .setDepth(Depth.Background)
      .setAlpha(0);
    this.fitCover(this.top);

    // Soft cream wash keeps falling items readable on busy art.
    this.wash = scene.add
      .rectangle(cx, cy, width, height, 0xfff5eb, 0.18)
      .setDepth(Depth.Background);

    this.currentKey = initialKey;

    EventBus.on(Events.StageChanged, this.onStageChanged, this);
    this.applyStageWash(1);
  }

  public destroy(): void {
    EventBus.off(Events.StageChanged, this.onStageChanged, this);
    this.scene.tweens.killTweensOf([this.bottom, this.top, this.wash]);
    this.bottom.destroy();
    this.top.destroy();
    this.wash.destroy();
  }

  private onStageChanged = (payload: {
    stage: number;
    name: string;
    background: string;
  }): void => {
    this.transitionTo(payload.background);
    this.applyStageWash(payload.stage);
  };

  /** Stage 6 (wedding) gets a darker wash so bright art does not wash out items. */
  private applyStageWash(stage: number): void {
    const { width, height } = this.scene.scale;
    this.wash.setPosition(width / 2, height / 2).setSize(width, height);
    if (stage >= 6) {
      this.wash.setFillStyle(0x241830, 0.32);
    } else {
      this.wash.setFillStyle(0xfff5eb, 0.18);
    }
  }

  private transitionTo(key: string): void {
    if (!this.scene.textures.exists(key)) {
      return;
    }

    if (key === this.currentKey && !this.transitioning) {
      return;
    }

    this.scene.tweens.killTweensOf([this.bottom, this.top]);

    if (this.currentKey === null || this.currentKey === key) {
      this.bottom.setTexture(key).setAlpha(1);
      this.fitCover(this.bottom);
      this.top.setAlpha(0);
      this.currentKey = key;
      this.transitioning = false;
      return;
    }

    this.transitioning = true;

    // Keep current art on bottom; fade new art in on top.
    this.bottom.setTexture(this.currentKey).setAlpha(1);
    this.fitCover(this.bottom);

    this.top.setTexture(key).setAlpha(0);
    this.fitCover(this.top);

    this.scene.tweens.add({
      targets: this.top,
      alpha: 1,
      duration: this.transitionMs,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.bottom.setTexture(key).setAlpha(1);
        this.fitCover(this.bottom);
        this.top.setAlpha(0);
        this.currentKey = key;
        this.transitioning = false;
      },
    });

    // Brief wash pulse for a soft "scene change" feel.
    this.wash.setAlpha(0.18);
    this.scene.tweens.add({
      targets: this.wash,
      alpha: 0.34,
      duration: this.transitionMs * 0.4,
      yoyo: true,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.wash.setAlpha(0.18);
      },
    });
  }

  private fitCover(image: Phaser.GameObjects.Image): void {
    const { width, height } = this.scene.scale;
    const frame = image.frame;
    const scale = Math.max(width / frame.width, height / frame.height);
    image
      .setDisplaySize(frame.width * scale, frame.height * scale)
      .setPosition(width / 2, height / 2);
  }
}

import Phaser from 'phaser';
import { Depth } from '../constants/Depth';
import { Events } from '../constants/Events';
import { TextureKey } from '../constants/TextureKey';
import { EventBus } from '../events/EventBus';
import { t } from '../i18n';
import type { RuntimeConfigFile } from '../types/config';

type Reaction = 'idle' | 'happy' | 'sad';

/**
 * Bride (left) + Groom (right) share one basket.
 * Smooth follow + can slide half off-screen to dodge.
 */
export class Player {
  public readonly container: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly reactionText: Phaser.GameObjects.Text;
  private readonly hitbox: Phaser.GameObjects.Rectangle;
  private targetX: number;
  private readonly speed: number;
  private readonly followLerp: number;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private readonly keyA: Phaser.Input.Keyboard.Key | undefined;
  private readonly keyD: Phaser.Input.Keyboard.Key | undefined;
  private pointerActive = false;
  private bobMs = 0;
  private lean = 0;
  private reaction: Reaction = 'idle';
  private reactionTimer: Phaser.Time.TimerEvent | null = null;
  private readonly spriteHeight: number;
  private readonly spriteWidth: number;
  private inputEnabled = true;
  private invincible = false;
  private invincibleBlinkMs = 0;

  public constructor(scene: Phaser.Scene, runtime: RuntimeConfigFile) {
    this.scene = scene;
    const { width, height } = scene.scale;
    this.speed = runtime.playerSpeed;
    this.followLerp = 0.22;
    this.targetX = width / 2;
    this.spriteWidth = runtime.playerWidth;
    this.spriteHeight = runtime.playerHeight;

    const y = height - runtime.playerHeight / 2 - 8;

    this.sprite = scene.add
      .image(0, 0, TextureKey.CoupleIdle)
      .setDisplaySize(this.spriteWidth, this.spriteHeight)
      .setOrigin(0.5, 0.5);

    // Catch focus: shared basket near the top.
    this.hitbox = scene.add
      .rectangle(
        0,
        -runtime.playerHeight * 0.32,
        runtime.playerWidth * 0.7,
        runtime.playerHeight * 0.26,
        0xffffff,
        0,
      )
      .setOrigin(0.5);

    this.reactionText = scene.add
      .text(0, -runtime.playerHeight * 0.58, '', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '22px',
        color: '#ffffff',
        stroke: '#2b2118',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.container = scene.add
      .container(this.targetX, y, [this.sprite, this.hitbox, this.reactionText])
      .setDepth(Depth.Player);

    const keyboard = scene.input.keyboard;
    this.cursors = keyboard?.createCursorKeys();
    this.keyA = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    scene.input.on('pointerdown', this.onPointer, this);
    scene.input.on('pointermove', this.onPointer, this);
    scene.input.on('pointerup', this.onPointerUp, this);

    EventBus.on(Events.ItemCollected, this.onItemCollected, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(Events.ItemCollected, this.onItemCollected, this);
    });
  }

  public get x(): number {
    return this.container.x;
  }

  public get y(): number {
    return this.container.y + this.hitbox.y;
  }

  public get hitWidth(): number {
    return this.hitbox.width * 0.92;
  }

  public get hitHeight(): number {
    return this.hitbox.height * 0.9;
  }

  public setInputEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
    if (!enabled) {
      this.pointerActive = false;
    }
  }

  public setInvincible(active: boolean): void {
    this.invincible = active;
    if (!active) {
      this.sprite.setAlpha(1);
      this.sprite.clearTint();
      this.invincibleBlinkMs = 0;
    }
  }

  public update(deltaMs: number): void {
    if (!this.inputEnabled) {
      return;
    }

    const { width } = this.scene.scale;
    // Allow half the couple off-screen left/right for dodging.
    const minX = 0;
    const maxX = width;

    if (!this.pointerActive) {
      const left =
        (this.cursors?.left.isDown ?? false) || (this.keyA?.isDown ?? false);
      const right =
        (this.cursors?.right.isDown ?? false) || (this.keyD?.isDown ?? false);

      if (left !== right) {
        const dir = left ? -1 : 1;
        this.targetX += dir * this.speed * (deltaMs / 1000);
      }
    }

    this.targetX = Phaser.Math.Clamp(this.targetX, minX, maxX);

    // Smooth follow — no hard snap.
    const t = 1 - Math.pow(1 - this.followLerp, deltaMs / 16.67);
    const prevX = this.container.x;
    this.container.x = Phaser.Math.Linear(this.container.x, this.targetX, t);

    const dx = this.container.x - prevX;
    this.updateMotionFx(deltaMs, dx);
    this.updateInvincibleBlink(deltaMs);
  }

  public destroy(): void {
    this.scene.input.off('pointerdown', this.onPointer, this);
    this.scene.input.off('pointermove', this.onPointer, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    EventBus.off(Events.ItemCollected, this.onItemCollected, this);
    this.reactionTimer?.remove(false);
    this.container.destroy(true);
  }

  private onItemCollected = (payload: {
    category: 'good' | 'bad' | 'bonus';
  }): void => {
    if (payload.category === 'good' || payload.category === 'bonus') {
      this.showReaction('happy', t('player.thanks'));
      return;
    }

    if (payload.category === 'bad') {
      if (this.invincible) {
        this.showReaction('happy', t('player.hehe'));
        return;
      }
      this.showReaction('sad', t('player.sad'));
    }
  };

  private showReaction(kind: 'happy' | 'sad', label: string): void {
    this.reaction = kind;
    const texture =
      kind === 'happy' ? TextureKey.CoupleHappy : TextureKey.CoupleSad;
    this.sprite
      .setTexture(texture)
      .setDisplaySize(this.spriteWidth, this.spriteHeight);

    // Soft pop on catch — keeps focus on the catching couple.
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setDisplaySize(this.spriteWidth, this.spriteHeight);
    this.scene.tweens.add({
      targets: this.sprite,
      displayWidth: this.spriteWidth * 1.06,
      displayHeight: this.spriteHeight * 1.06,
      duration: 120,
      yoyo: true,
      ease: 'Sine.Out',
      onComplete: () => {
        this.sprite.setDisplaySize(this.spriteWidth, this.spriteHeight);
      },
    });

    this.reactionText
      .setText(label)
      .setColor(kind === 'happy' ? '#ffe066' : '#ff8fa3')
      .setAlpha(1)
      .setScale(0.75)
      .setY(-this.spriteHeight * 0.58);

    this.scene.tweens.killTweensOf(this.reactionText);
    this.scene.tweens.add({
      targets: this.reactionText,
      y: -this.spriteHeight * 0.74,
      scale: 1.08,
      duration: 240,
      ease: 'Cubic.Out',
    });

    this.reactionTimer?.remove(false);
    this.reactionTimer = this.scene.time.delayedCall(850, () => {
      this.clearReaction();
    });
  }

  private clearReaction(): void {
    this.reaction = 'idle';
    this.sprite
      .setTexture(TextureKey.CoupleIdle)
      .setDisplaySize(this.spriteWidth, this.spriteHeight);
    if (!this.invincible) {
      this.sprite.clearTint().setAlpha(1);
    }

    this.scene.tweens.add({
      targets: this.reactionText,
      alpha: 0,
      y: -this.spriteHeight * 0.58,
      duration: 160,
      ease: 'Sine.In',
    });
  }

  private updateMotionFx(deltaMs: number, dx: number): void {
    this.bobMs += deltaMs;
    const moving = Math.abs(dx) > 0.08;

    const desiredLean = moving ? Phaser.Math.Clamp(dx * 2.2, -7, 7) : 0;
    this.lean = Phaser.Math.Linear(this.lean, desiredLean, 0.18);
    this.sprite.setAngle(this.lean);

    if (moving) {
      // Smooth run bob while catching unit slides.
      this.sprite.y = Math.sin(this.bobMs / 85) * 2.4;
      return;
    }

    if (this.reaction === 'idle') {
      this.sprite.y = Math.sin(this.bobMs / 380) * 1.5;
    } else {
      this.sprite.y = Phaser.Math.Linear(this.sprite.y, 0, 0.18);
    }
  }

  private updateInvincibleBlink(deltaMs: number): void {
    if (!this.invincible) {
      return;
    }

    this.invincibleBlinkMs += deltaMs;
    // Rainbow invincibility shimmer.
    const rainbow = [
      0xff6b6b, 0xff9f43, 0xffd93d, 0x6bcb77, 0x4d96ff, 0x9b5de5, 0xff8fab,
    ];
    const idx = Math.floor(this.invincibleBlinkMs / 110) % rainbow.length;
    this.sprite.setTint(rainbow[idx]!);

    const pulse = 0.55 + (Math.sin(this.invincibleBlinkMs / 85) + 1) * 0.22;
    this.sprite.setAlpha(pulse);
  }

  private onPointer(pointer: Phaser.Input.Pointer): void {
    if (!this.inputEnabled || !pointer.isDown) {
      return;
    }

    const hits = this.scene.input.hitTestPointer(pointer);
    if (hits.some((obj) => obj.getData?.('isHud') === true)) {
      return;
    }

    this.pointerActive = true;
    const { width } = this.scene.scale;
    this.targetX = Phaser.Math.Clamp(pointer.worldX, 0, width);
  }

  private onPointerUp(): void {
    this.pointerActive = false;
  }
}

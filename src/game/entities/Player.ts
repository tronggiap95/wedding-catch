import Phaser from 'phaser';
import { Depth } from '../constants/Depth';
import { Events } from '../constants/Events';
import { TextureKey } from '../constants/TextureKey';
import {
  pickCoupleLines,
  type CoupleMood,
} from '../data/coupleDialogue';
import { EventBus } from '../events/EventBus';
import { MOBILE_DESIGN_WIDTH } from '../helpers/device';
import { localeStore } from '../i18n';
import { COUPLE_NAMES } from '../state/GuestNameStore';
import type { RuntimeConfigFile } from '../types/config';
import { UiTheme } from '../ui/UiTheme';

type Reaction = 'idle' | 'happy' | 'sad';

/**
 * Bride (left) + Groom (right) share one basket.
 * Smooth follow + can slide half off-screen to dodge.
 */
export class Player {
  public readonly container: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly brideBubble: Phaser.GameObjects.Container;
  private readonly brideBubbleBg: Phaser.GameObjects.Graphics;
  private readonly brideBubbleText: Phaser.GameObjects.Text;
  private readonly groomBubble: Phaser.GameObjects.Container;
  private readonly groomBubbleBg: Phaser.GameObjects.Graphics;
  private readonly groomBubbleText: Phaser.GameObjects.Text;
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
  private drunk = false;
  private specialBad = false;

  private static readonly specialBadTint = 0xff2a2a;

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

    this.brideBubbleBg = scene.add.graphics();
    this.brideBubbleText = scene.add
      .text(0, 0, '', {
        fontFamily: UiTheme.font,
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#8a3d5c',
        align: 'center',
        wordWrap: { width: 98 },
        lineSpacing: 3,
      })
      .setOrigin(0.5);
    this.brideBubble = scene.add
      .container(-this.spriteWidth * 0.48, -this.spriteHeight * 0.76, [
        this.brideBubbleBg,
        this.brideBubbleText,
      ])
      .setVisible(false)
      .setAlpha(0);

    this.groomBubbleBg = scene.add.graphics();
    this.groomBubbleText = scene.add
      .text(0, 0, '', {
        fontFamily: UiTheme.font,
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#3f4f72',
        align: 'center',
        wordWrap: { width: 98 },
        lineSpacing: 3,
      })
      .setOrigin(0.5);
    this.groomBubble = scene.add
      .container(this.spriteWidth * 0.48, -this.spriteHeight * 0.76, [
        this.groomBubbleBg,
        this.groomBubbleText,
      ])
      .setVisible(false)
      .setAlpha(0);

    this.container = scene.add
      .container(this.targetX, y, [
        this.sprite,
        this.hitbox,
        this.brideBubble,
        this.groomBubble,
      ])
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
      this.invincibleBlinkMs = 0;
      this.refreshTint();
    }
  }

  public setDrunk(active: boolean): void {
    const wasDrunk = this.drunk;
    this.drunk = active;
    if (this.reaction !== 'idle') {
      return;
    }
    if (active || wasDrunk) {
      this.applyIdleTexture();
      this.refreshTint();
    }
  }

  /** Special-bad affliction: full red tint on the couple. */
  public setSpecialBad(active: boolean): void {
    if (this.specialBad === active) {
      if (active) {
        this.refreshTint();
      }
      return;
    }
    this.specialBad = active;
    this.refreshTint();
  }

  public update(deltaMs: number): void {
    if (!this.inputEnabled) {
      return;
    }

    const { width } = this.scene.scale;
    // Allow half the couple off-screen left/right for dodging.
    const minX = 0;
    const maxX = width;
    const invert = this.drunk ? -1 : 1;

    if (!this.pointerActive) {
      const left =
        (this.cursors?.left.isDown ?? false) || (this.keyA?.isDown ?? false);
      const right =
        (this.cursors?.right.isDown ?? false) || (this.keyD?.isDown ?? false);

      if (left !== right) {
        const dir = (left ? -1 : 1) * invert;
        // Wide screens: keyboard must cross more pixels — scale with width.
        const keyboardSpeed =
          this.speed * Math.max(1, width / MOBILE_DESIGN_WIDTH);
        this.targetX += dir * keyboardSpeed * (deltaMs / 1000);
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
    id: string;
    category: 'good' | 'bad' | 'bonus';
    special?: boolean;
  }): void => {
    let mood: CoupleMood = 'good';
    let kind: Reaction = 'happy';

    if (payload.category === 'bonus') {
      mood = 'bonus';
      kind = 'happy';
    } else if (payload.category === 'bad') {
      if (payload.special === true) {
        mood = 'specialBad';
        kind = 'sad';
      } else if (this.invincible) {
        mood = 'good';
        kind = 'happy';
      } else {
        mood = 'bad';
        kind = 'sad';
      }
    }

    const lines = pickCoupleLines(
      localeStore.getLocale(),
      mood,
      payload.id,
    );
    this.showReaction(kind, lines.bride, lines.groom);
  };

  private showReaction(
    kind: 'happy' | 'sad',
    brideLine: string,
    groomLine: string,
  ): void {
    this.reaction = kind;
    const texture =
      kind === 'happy' ? TextureKey.CoupleHappy : TextureKey.CoupleSad;
    this.sprite
      .setTexture(texture)
      .setDisplaySize(this.spriteWidth, this.spriteHeight);
    this.refreshTint();

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

    this.paintBubble(
      this.brideBubble,
      this.brideBubbleBg,
      this.brideBubbleText,
      `${COUPLE_NAMES.bride}\n${brideLine}`,
      'bride',
    );
    this.paintBubble(
      this.groomBubble,
      this.groomBubbleBg,
      this.groomBubbleText,
      `${COUPLE_NAMES.groom}\n${groomLine}`,
      'groom',
    );

    this.reactionTimer?.remove(false);
    this.reactionTimer = this.scene.time.delayedCall(1600, () => {
      this.clearReaction();
    });
  }

  private paintBubble(
    root: Phaser.GameObjects.Container,
    bg: Phaser.GameObjects.Graphics,
    text: Phaser.GameObjects.Text,
    line: string,
    side: 'bride' | 'groom',
  ): void {
    this.scene.tweens.killTweensOf(root);
    text.setText(line);

    const isBride = side === 'bride';
    const fill = isBride ? 0xfff7fa : 0xf6f9ff;
    const stroke = isBride ? 0xff9db8 : 0x8eb6ea;
    const soft = isBride ? 0xffd6e4 : 0xd7e6fb;
    const accent = isBride ? 0xff6b9a : 0x6a9adf;

    const padX = 12;
    const padY = 9;
    const tw = Math.min(98, Math.max(52, text.width));
    const th = Math.max(28, text.height);
    const boxW = tw + padX * 2;
    const boxH = th + padY * 2;
    const radius = 14;
    text.setPosition(0, -2);

    bg.clear();

    // Soft shadow
    bg.fillStyle(0x5c3d2e, 0.1);
    bg.fillRoundedRect(-boxW / 2 + 2, -boxH / 2 + 3, boxW, boxH, radius);

    // Outer pastel ring
    bg.fillStyle(soft, 1);
    bg.fillRoundedRect(-boxW / 2 - 2, -boxH / 2 - 2, boxW + 4, boxH + 4, radius + 2);

    // Main cream card
    bg.fillStyle(fill, 0.98);
    bg.lineStyle(2, stroke, 1);
    bg.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, radius);
    bg.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, radius);

    // Inner highlight
    bg.lineStyle(1.5, 0xffffff, 0.55);
    bg.strokeRoundedRect(
      -boxW / 2 + 2.5,
      -boxH / 2 + 2.5,
      boxW - 5,
      boxH - 5,
      radius - 3,
    );

    // Cute accent: heart (bride) / spark (groom) at top
    if (isBride) {
      this.drawMiniHeart(bg, boxW / 2 - 10, -boxH / 2 + 2, accent);
    } else {
      this.drawMiniSpark(bg, -boxW / 2 + 10, -boxH / 2 + 3, accent);
    }

    // Centered tip pointing down toward the couple
    const tipY = boxH / 2;
    bg.fillStyle(fill, 0.98);
    bg.beginPath();
    bg.moveTo(-7, tipY - 1);
    bg.lineTo(0, tipY + 9);
    bg.lineTo(7, tipY - 1);
    bg.closePath();
    bg.fillPath();
    bg.lineStyle(2, stroke, 1);
    bg.beginPath();
    bg.moveTo(-7, tipY - 1);
    bg.lineTo(0, tipY + 9);
    bg.lineTo(7, tipY - 1);
    bg.strokePath();
    // Cover tip top seam
    bg.lineStyle(2, fill, 1);
    bg.beginPath();
    bg.moveTo(-5, tipY - 1);
    bg.lineTo(5, tipY - 1);
    bg.strokePath();

    const x = isBride ? -this.spriteWidth * 0.48 : this.spriteWidth * 0.48;
    const yBase = -this.spriteHeight * 0.76;
    const yPop = -this.spriteHeight * 0.82;

    root.setPosition(x, yBase).setVisible(true).setAlpha(0).setScale(0.78);
    this.scene.tweens.add({
      targets: root,
      alpha: 1,
      scale: 1,
      y: yPop,
      duration: 240,
      ease: 'Back.Out',
    });
  }

  private drawMiniHeart(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    color: number,
  ): void {
    const s = 3.2;
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(x, y + s * 0.35);
    g.lineTo(x - s, y - s * 0.35);
    g.lineTo(x - s * 0.35, y - s);
    g.lineTo(x, y - s * 0.55);
    g.lineTo(x + s * 0.35, y - s);
    g.lineTo(x + s, y - s * 0.35);
    g.closePath();
    g.fillPath();
    g.fillCircle(x - s * 0.45, y - s * 0.45, s * 0.55);
    g.fillCircle(x + s * 0.45, y - s * 0.45, s * 0.55);
  }

  private drawMiniSpark(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    color: number,
  ): void {
    g.fillStyle(color, 1);
    g.fillCircle(x, y, 2.2);
    g.fillRect(x - 0.7, y - 5, 1.4, 10);
    g.fillRect(x - 5, y - 0.7, 10, 1.4);
  }

  private clearReaction(): void {
    this.reaction = 'idle';
    this.applyIdleTexture();
    this.refreshTint();

    for (const bubble of [this.brideBubble, this.groomBubble]) {
      this.scene.tweens.killTweensOf(bubble);
      this.scene.tweens.add({
        targets: bubble,
        alpha: 0,
        scale: 0.86,
        y: -this.spriteHeight * 0.76,
        duration: 180,
        ease: 'Sine.In',
        onComplete: () => {
          bubble.setVisible(false);
        },
      });
    }
  }

  private applyIdleTexture(): void {
    const texture = this.drunk ? TextureKey.CoupleDrunk : TextureKey.CoupleIdle;
    this.sprite
      .setTexture(texture)
      .setDisplaySize(this.spriteWidth, this.spriteHeight);
  }

  private refreshTint(): void {
    if (this.specialBad) {
      this.sprite.setTint(Player.specialBadTint).setAlpha(1);
      return;
    }
    if (!this.invincible) {
      this.sprite.clearTint().setAlpha(1);
    }
  }

  private updateMotionFx(deltaMs: number, dx: number): void {
    this.bobMs += deltaMs;
    const moving = Math.abs(dx) > 0.08;
    const leanAmp = this.drunk ? 11 : 7;
    const bobAmp = this.drunk ? 3.6 : 2.4;

    const desiredLean = moving ? Phaser.Math.Clamp(dx * 2.2, -leanAmp, leanAmp) : 0;
    this.lean = Phaser.Math.Linear(this.lean, desiredLean, 0.18);
    // Extra tipsy sway while drunk even when idle.
    const tipsy = this.drunk ? Math.sin(this.bobMs / 140) * 3.2 : 0;
    this.sprite.setAngle(this.lean + tipsy);

    if (moving) {
      // Smooth run bob while catching unit slides.
      this.sprite.y = Math.sin(this.bobMs / 85) * bobAmp;
      return;
    }

    if (this.reaction === 'idle') {
      this.sprite.y = Math.sin(this.bobMs / (this.drunk ? 220 : 380)) * (this.drunk ? 2.4 : 1.5);
    } else {
      this.sprite.y = Phaser.Math.Linear(this.sprite.y, 0, 0.18);
    }
  }

  private updateInvincibleBlink(deltaMs: number): void {
    if (this.specialBad) {
      this.sprite.setTint(Player.specialBadTint).setAlpha(1);
      return;
    }

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
    const worldX = this.drunk ? width - pointer.worldX : pointer.worldX;
    this.targetX = Phaser.Math.Clamp(worldX, 0, width);
  }

  private onPointerUp(): void {
    this.pointerActive = false;
  }
}

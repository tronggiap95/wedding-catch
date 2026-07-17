import Phaser from 'phaser';
import { Depth } from '../constants/Depth';
import { ItemBorder } from '../constants/ItemBorder';
import type {
  ItemCategory,
  ItemRarity,
  SpawnableDefinition,
} from '../types/config';
import { isBonusDefinition, isSpecialBad } from '../types/config';

type FxMode = 'bad' | 'specialBad' | 'good' | 'bonus';

/**
 * Pooled falling item with category-specific aura FX.
 * Bad = danger pulse, Good = rarity glow, Bonus = special orbit.
 */
export class FallingItem {
  public readonly container: Phaser.GameObjects.Container;
  public active = false;
  public resolved = false;
  public fallSpeed = 0;
  public definition: SpawnableDefinition | null = null;

  private readonly glow: Phaser.GameObjects.Arc;
  private readonly ringOuter: Phaser.GameObjects.Arc;
  private readonly ringInner: Phaser.GameObjects.Arc;
  private readonly sparkles: Phaser.GameObjects.Arc[];
  private readonly warning: Phaser.GameObjects.Text;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly fallback: Phaser.GameObjects.Text;
  private readonly size: number;
  private readonly scene: Phaser.Scene;

  private pulseMs = 0;
  private mode: FxMode = 'good';
  private borderColor = ItemBorder.rarity.common;
  private secondaryColor = ItemBorder.rarity.common;
  private sparkleCount = 0;
  private baseX = 0;
  private startX = 0;
  private laneX = 0;
  private driftElapsedMs = 0;
  private drifting = false;
  private magnetizedThisFrame = false;
  private readonly driftDurationMs = 420;

  public constructor(scene: Phaser.Scene, size: number) {
    this.scene = scene;
    this.size = size;

    if (!scene.textures.exists('item_blank')) {
      const g = scene.make.graphics();
      g.fillStyle(0xffffff, 0);
      g.fillRect(0, 0, 8, 8);
      g.generateTexture('item_blank', 8, 8);
      g.destroy();
    }

    const ringRadius = size * 0.54;

    this.glow = scene.add
      .circle(0, 0, ringRadius + 8, 0xffffff, 0.2)
      .setVisible(false);

    this.ringOuter = scene.add
      .circle(0, 0, ringRadius + 4, 0xffffff, 0)
      .setStrokeStyle(6, 0xffffff, 0.35)
      .setVisible(false);

    this.ringInner = scene.add
      .circle(0, 0, ringRadius, 0xffffff, 0)
      .setStrokeStyle(3, 0xffffff, 0.95)
      .setVisible(false);

    this.sparkles = [0, 1, 2, 3, 4, 5].map(() =>
      scene.add.circle(0, 0, 3, 0xffffff, 1).setVisible(false),
    );

    this.warning = scene.add
      .text(0, -size * 0.55, '!', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: `${Math.round(size * 0.42)}px`,
        color: '#ffffff',
        stroke: '#e63946',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.sprite = scene.add
      .image(0, 0, 'item_blank')
      .setDisplaySize(size, size)
      .setVisible(false);

    this.fallback = scene.add
      .text(0, 0, '', { fontSize: `${Math.floor(size * 0.55)}px` })
      .setOrigin(0.5)
      .setVisible(false);

    this.container = scene.add
      .container(-100, -100, [
        this.glow,
        this.ringOuter,
        this.ringInner,
        ...this.sparkles,
        this.sprite,
        this.fallback,
        this.warning,
      ])
      .setDepth(Depth.Items)
      .setVisible(false)
      .setActive(false);
  }

  public get category(): ItemCategory {
    if (this.definition === null) {
      return 'good';
    }

    return isBonusDefinition(this.definition)
      ? 'bonus'
      : this.definition.category;
  }

  public get id(): string {
    return this.definition?.id ?? '';
  }

  public get x(): number {
    return this.container.x;
  }

  public get y(): number {
    return this.container.y;
  }

  /**
   * Magnet pull — updates lane anchors so FX don't snap X back each frame.
   */
  public attractToward(
    targetX: number,
    targetY: number,
    strength: number,
    deltaMs: number,
  ): void {
    if (!this.active) {
      return;
    }

    const t = Math.min(1, strength * (deltaMs / 1000));
    const nextX = Phaser.Math.Linear(this.container.x, targetX, t);
    const nextY = Phaser.Math.Linear(this.container.y, targetY, t * 0.85);

    this.container.x = nextX;
    this.container.y = nextY;
    this.baseX = nextX;
    this.laneX = nextX;
    this.startX = nextX;
    this.drifting = false;
    this.magnetizedThisFrame = true;
  }

  /**
   * Reverse magnet — shove good items away from the couple (still falls).
   */
  public repelFrom(
    sourceX: number,
    sourceY: number,
    strength: number,
    deltaMs: number,
  ): void {
    if (!this.active) {
      return;
    }

    let dx = this.container.x - sourceX;
    let dy = this.container.y - sourceY;
    let dist = Math.hypot(dx, dy);
    if (dist < 10) {
      dx = dx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(dx);
      dy = 0;
      dist = Math.abs(dx);
    }

    const push = strength * 95 * (deltaMs / 1000);
    const nextX = this.container.x + (dx / dist) * push;
    const nextY = this.container.y + (dy / dist) * push * 0.35;

    this.container.x = nextX;
    this.container.y = nextY;
    this.baseX = nextX;
    this.laneX = nextX;
    this.startX = nextX;
    this.drifting = false;
  }

  public spawn(
    definition: SpawnableDefinition,
    x: number,
    y: number,
    fallSpeed: number,
    laneX: number = x,
  ): void {
    this.definition = definition;
    this.fallSpeed = fallSpeed;
    this.active = true;
    this.resolved = false;
    this.pulseMs = 0;
    this.startX = x;
    this.laneX = laneX;
    this.baseX = x;
    this.driftElapsedMs = 0;
    this.drifting = Math.abs(laneX - x) > 2;

    const key = definition.texture;
    if (this.scene.textures.exists(key)) {
      this.sprite
        .setTexture(key)
        .setDisplaySize(this.size, this.size)
        .setVisible(true)
        .clearTint();
      this.fallback.setVisible(false);
    } else {
      this.sprite.setVisible(false);
      this.fallback.setText(definition.label).setVisible(true);
    }

    this.configureFx(definition);
    this.container.setPosition(x, y).setVisible(true).setActive(true);
  }

  public update(deltaMs: number): void {
    if (!this.active) {
      return;
    }

    if (!this.magnetizedThisFrame) {
      this.container.y += this.fallSpeed * (deltaMs / 1000);
    }
    this.magnetizedThisFrame = false;
    this.pulseMs += deltaMs;

    if (this.drifting) {
      this.driftElapsedMs += deltaMs;
      const t = Math.min(1, this.driftElapsedMs / this.driftDurationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      this.baseX = Phaser.Math.Linear(this.startX, this.laneX, eased);
      if (t >= 1) {
        this.drifting = false;
        this.baseX = this.laneX;
      }
    } else {
      this.baseX = this.laneX;
    }

    if (this.mode === 'bad' || this.mode === 'specialBad') {
      this.updateBadFx();
    } else if (this.mode === 'bonus') {
      this.updateBonusFx();
    } else {
      this.updateGoodFx();
    }
  }

  public getHitBounds(shrink: number): Phaser.Geom.Rectangle {
    const inset = this.size * shrink;
    return new Phaser.Geom.Rectangle(
      this.container.x - this.size / 2 + inset,
      this.container.y - this.size / 2 + inset,
      this.size - inset * 2,
      this.size - inset * 2,
    );
  }

  public sleep(): void {
    this.active = false;
    this.resolved = true;
    this.definition = null;
    this.sprite.setVisible(false).clearTint().setAngle(0);
    this.fallback.setVisible(false);
    this.glow.setVisible(false);
    this.ringOuter.setVisible(false);
    this.ringInner.setVisible(false);
    this.warning.setVisible(false);
    for (const sparkle of this.sparkles) {
      sparkle.setVisible(false);
    }
    this.container.setVisible(false).setActive(false).setPosition(-100, -100);
  }

  private configureFx(definition: SpawnableDefinition): void {
    this.glow.setVisible(true);
    this.ringOuter.setVisible(true);
    this.ringInner.setVisible(true);
    this.warning.setVisible(false);

    if (isBonusDefinition(definition)) {
      this.mode = 'bonus';
      this.borderColor = ItemBorder.bonus;
      this.secondaryColor = ItemBorder.bonusSecondary;
      this.sparkleCount = 6;
      this.sprite.clearTint();
      this.showSparkles(6);
      return;
    }

    if (definition.category === 'bad') {
      const special = isSpecialBad(definition);
      this.mode = special ? 'specialBad' : 'bad';
      this.borderColor = special ? ItemBorder.specialBad : ItemBorder.bad;
      this.secondaryColor = special
        ? ItemBorder.specialBadGlow
        : ItemBorder.badGlow;
      this.sparkleCount = 0;
      this.sprite.setTint(special ? 0xffb3b3 : 0xffc9c9);
      this.warning.setVisible(true);
      this.warning.setStroke(special ? '#8b0000' : '#e63946', 4);
      this.hideSparkles();
      return;
    }

    this.mode = 'good';
    this.borderColor = ItemBorder.rarity[definition.rarity];
    this.secondaryColor = this.borderColor;
    this.sparkleCount = this.sparklesForRarity(definition.rarity);
    this.sprite.clearTint();
    this.showSparkles(this.sparkleCount);
  }

  private sparklesForRarity(rarity: ItemRarity): number {
    switch (rarity) {
      case 'common':
        return 2;
      case 'rare':
        return 3;
      case 'epic':
        return 4;
      case 'legendary':
        return 5;
      case 'mythic':
        return 6;
      default:
        return 2;
    }
  }

  private showSparkles(count: number): void {
    this.sparkles.forEach((sparkle, index) => {
      sparkle.setVisible(index < count);
    });
  }

  private hideSparkles(): void {
    for (const sparkle of this.sparkles) {
      sparkle.setVisible(false);
    }
  }

  private updateBadFx(): void {
    const special = this.mode === 'specialBad';
    const beat = Math.sin(this.pulseMs / (special ? 70 : 90));
    const pulse = 1 + beat * (special ? 0.22 : 0.18);
    const glowAlpha = (special ? 0.34 : 0.28) + beat * 0.2;
    const ringAlpha = 0.75 + beat * 0.25;
    const outerW = special ? 9 : 7;
    const innerW = special ? 5.5 : 4;

    this.glow
      .setFillStyle(this.secondaryColor, glowAlpha)
      .setScale(pulse * (special ? 1.22 : 1.15));
    this.ringOuter
      .setScale(pulse)
      .setStrokeStyle(outerW, this.borderColor, 0.45 + beat * 0.2);
    this.ringInner
      .setScale(pulse)
      .setStrokeStyle(innerW, this.borderColor, ringAlpha);

    // Danger shake — keeps center feel but reads as urgent.
    this.container.x = this.baseX + Math.sin(this.pulseMs / 40) * (special ? 3 : 2.2);
    this.warning.setScale(1 + beat * 0.15).setAlpha(0.75 + beat * 0.25);
    this.sprite.setAngle(Math.sin(this.pulseMs / 50) * (special ? 6 : 4));
  }

  private updateGoodFx(): void {
    const beat = Math.sin(this.pulseMs / 180);
    const pulse = 1 + beat * 0.06;
    const glowAlpha = 0.14 + beat * 0.08;

    this.container.x = this.baseX;
    this.sprite.setAngle(0);

    this.glow
      .setFillStyle(this.borderColor, glowAlpha)
      .setScale(pulse * 1.2);
    this.ringOuter
      .setScale(pulse)
      .setStrokeStyle(5, this.borderColor, 0.25 + beat * 0.1);
    this.ringInner
      .setScale(pulse)
      .setStrokeStyle(2.5, this.borderColor, 0.85 + beat * 0.1);

    this.updateOrbitSparkles(this.pulseMs / 500, this.size * 0.48, 1);
  }

  private updateBonusFx(): void {
    const beat = Math.sin(this.pulseMs / 110);
    const pulse = 1 + beat * 0.12;
    const color =
      Math.floor(this.pulseMs / 220) % 2 === 0
        ? this.borderColor
        : this.secondaryColor;

    this.container.x = this.baseX;
    this.sprite.setAngle(this.pulseMs * 0.04);

    this.glow
      .setFillStyle(color, 0.3 + beat * 0.15)
      .setScale(pulse * 1.35);
    this.ringOuter
      .setScale(pulse * 1.08)
      .setStrokeStyle(6, color, 0.55)
      .setAngle(this.pulseMs * 0.12);
    this.ringInner
      .setScale(pulse)
      .setStrokeStyle(3.5, 0xffffff, 0.9)
      .setAngle(-this.pulseMs * 0.18);

    this.updateOrbitSparkles(this.pulseMs / 280, this.size * 0.58, 1.35);
  }

  private updateOrbitSparkles(
    angle: number,
    radius: number,
    sizeScale: number,
  ): void {
    for (let i = 0; i < this.sparkleCount; i += 1) {
      const sparkle = this.sparkles[i];
      if (sparkle === undefined) {
        continue;
      }

      const theta = angle + (i / this.sparkleCount) * Math.PI * 2;
      const twinkle = 0.55 + Math.sin(this.pulseMs / 100 + i) * 0.45;
      sparkle
        .setPosition(Math.cos(theta) * radius, Math.sin(theta) * radius)
        .setFillStyle(
          i % 2 === 0 ? this.borderColor : 0xffffff,
          twinkle,
        )
        .setScale(sizeScale * (0.7 + twinkle * 0.5));
    }
  }
}

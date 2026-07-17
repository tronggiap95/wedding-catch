import Phaser from 'phaser';
import { Depth } from '../constants/Depth';
import { TextureKey } from '../constants/TextureKey';
import { UiTheme } from './UiTheme';

/**
 * Glossy circular icon button with soft press pop.
 * Avoid setScale(1) after setDisplaySize — that snaps to native texture size.
 */
export function createIconButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  texture: string,
  size: number = UiTheme.iconBtn,
): Phaser.GameObjects.Image {
  const btn = scene.add
    .image(x, y, texture)
    .setDisplaySize(size, size)
    .setDepth(Depth.Hud)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true })
    .setData('isHud', true)
    .setData('iconSize', size);

  syncImageHitArea(btn, size, size);

  btn.on('pointerdown', () => {
    scene.tweens.killTweensOf(btn);
    fitImageDisplaySize(btn, size * 0.92, size * 0.92);
    syncImageHitArea(btn, size * 0.92, size * 0.92);
  });

  const release = (): void => {
    scene.tweens.killTweensOf(btn);
    fitImageDisplaySize(btn, size, size);
    syncImageHitArea(btn, size, size);
  };
  btn.on('pointerup', release);
  btn.on('pointerout', release);

  return btn;
}

/**
 * Wide primary CTA. Hit target is a Zone (reliable); plate/label are visual only.
 */
export function createPrimaryButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  width = 220,
  height = 64,
  texture: string = TextureKey.UiBtnPrimary,
): Phaser.GameObjects.Container {
  return createLabeledPlateButton(scene, x, y, label, width, height, texture, {
    fontSize: '22px',
    stroke: '#8b3a3a',
    strokeThickness: 4,
    color: UiTheme.cream,
  });
}

/**
 * Secondary menu plate button (guide / leaderboard).
 */
export function createMenuPlateButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  width = 200,
  height = 52,
  texture: string = TextureKey.UiBtnMenu,
): Phaser.GameObjects.Container {
  return createLabeledPlateButton(scene, x, y, label, width, height, texture, {
    fontSize: '18px',
    stroke: '#fff8f0',
    strokeThickness: 3,
    color: UiTheme.ink,
  });
}

/**
 * Secondary text button (e.g. Hướng dẫn).
 */
export function createSecondaryButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
): Phaser.GameObjects.Text {
  const btn = scene.add
    .text(x, y, label, {
      fontFamily: UiTheme.font,
      fontSize: '18px',
      fontStyle: 'bold',
      color: UiTheme.inkSoft,
      backgroundColor: '#fff8f0',
      padding: { x: 22, y: 10 },
    })
    .setOrigin(0.5)
    .setDepth(Depth.Hud)
    .setInteractive({ useHandCursor: true })
    .setData('isHud', true);

  btn.on('pointerover', () => {
    btn.setColor(UiTheme.ink);
    btn.setScale(1.04);
  });
  btn.on('pointerout', () => {
    btn.setColor(UiTheme.inkSoft);
    btn.setScale(1);
  });
  btn.on('pointerdown', () => {
    btn.setScale(0.96);
  });
  btn.on('pointerup', () => {
    btn.setScale(1.04);
  });

  return btn;
}

function createLabeledPlateButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  width: number,
  height: number,
  texture: string,
  textStyle: {
    fontSize: string;
    stroke: string;
    strokeThickness: number;
    color: string;
  },
): Phaser.GameObjects.Container {
  const plate = scene.add.image(0, 0, texture);
  // Keep texture aspect — forcing a flat box on a tall PNG warps the art.
  const fitted = fitTextureSize(plate.frame.width, plate.frame.height, width, height);
  fitImageDisplaySize(plate, fitted.width, fitted.height);

  const text = scene.add
    .text(0, -2, label, {
      fontFamily: UiTheme.font,
      fontSize: textStyle.fontSize,
      fontStyle: 'bold',
      color: textStyle.color,
      stroke: textStyle.stroke,
      strokeThickness: textStyle.strokeThickness,
    })
    .setOrigin(0.5);

  const hitW = fitted.width;
  const hitH = fitted.height;
  const hit = scene.add
    .zone(0, 0, hitW, hitH)
    .setInteractive({ useHandCursor: true })
    .setData('isHud', true);

  const root = scene.add
    .container(x, y, [plate, text, hit])
    .setDepth(Depth.Hud)
    .setData('isHud', true)
    .setData('hitZone', hit)
    .setData('plate', plate)
    .setData('label', text)
    .setData('baseW', hitW)
    .setData('baseH', hitH)
    .setSize(hitW, hitH);

  const setVisualSize = (mul: number): void => {
    const w = hitW * mul;
    const h = hitH * mul;
    fitImageDisplaySize(plate, w, h);
    text.setScale(mul);
  };

  const bounce = (mul: number, duration: number): void => {
    scene.tweens.killTweensOf(plate);
    scene.tweens.killTweensOf(text);
    const w = hitW * mul;
    const h = hitH * mul;
    scene.tweens.add({
      targets: plate,
      displayWidth: w,
      displayHeight: h,
      duration,
      ease: 'Sine.Out',
    });
    scene.tweens.add({
      targets: text,
      scaleX: mul,
      scaleY: mul,
      duration,
      ease: 'Sine.Out',
    });
  };

  hit.on('pointerover', () => bounce(1.04, 100));
  hit.on('pointerout', () => bounce(1, 100));
  hit.on('pointerdown', () => {
    scene.tweens.killTweensOf(plate);
    scene.tweens.killTweensOf(text);
    setVisualSize(0.96);
  });
  hit.on('pointerup', () => bounce(1, 120));

  for (const event of [
    'pointerup',
    'pointerdown',
    'pointerover',
    'pointerout',
  ] as const) {
    hit.on(event, (...args: unknown[]) => {
      root.emit(event, ...args);
    });
  }

  return root;
}

/** Fit inside a box while preserving aspect ratio. */
export function fitTextureSize(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number,
): { width: number; height: number } {
  const scale = Math.min(maxW / srcW, maxH / srcH);
  return {
    width: Math.round(srcW * scale),
    height: Math.round(srcH * scale),
  };
}

/**
 * Size an image without leaving a stale absolute scale that tweens can blow up.
 */
export function fitImageDisplaySize(
  image: Phaser.GameObjects.Image,
  width: number,
  height: number,
): void {
  image.setDisplaySize(width, height);
}

function syncImageHitArea(
  image: Phaser.GameObjects.Image,
  width: number,
  height: number,
): void {
  if (image.input === null) {
    return;
  }
  image.input.hitArea = new Phaser.Geom.Rectangle(
    -width / 2,
    -height / 2,
    width,
    height,
  );
  image.input.hitAreaCallback = Phaser.Geom.Rectangle.Contains;
}

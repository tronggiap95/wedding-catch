import Phaser from 'phaser';
import { Depth } from '../constants/Depth';
import { Sound } from '../constants/Sound';
import { TextureKey } from '../constants/TextureKey';
import { t } from '../i18n';
import type { AudioManager } from '../managers/AudioManager';
import { createPrimaryButton } from './UiFactory';
import { UiTheme } from './UiTheme';

export interface PauseMenuHandlers {
  readonly onPauseRequest: () => void;
  readonly onResumeRequest: () => void;
}

/**
 * Top-right pause / mute + polished pause card (content stays inside the frame).
 */
export class PauseMenu {
  private static readonly cardW = 300;
  private static readonly cardH = 300;

  private readonly scene: Phaser.Scene;
  private readonly audio: AudioManager;
  private readonly handlers: PauseMenuHandlers;
  private readonly pauseIcon: Phaser.GameObjects.Image;
  private readonly muteIcon: Phaser.GameObjects.Image;
  private readonly pauseHit: Phaser.GameObjects.Zone;
  private readonly muteHit: Phaser.GameObjects.Zone;

  private readonly root: Phaser.GameObjects.Container;
  private readonly dim: Phaser.GameObjects.Rectangle;
  private readonly card: Phaser.GameObjects.Container;
  private readonly cardBg: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly resumeButton: Phaser.GameObjects.Container;
  private readonly muteChip: Phaser.GameObjects.Container;
  private readonly muteChipIcon: Phaser.GameObjects.Image;
  private readonly muteChipLabel: Phaser.GameObjects.Text;
  private readonly accentHearts: Phaser.GameObjects.Container[] = [];
  private paused = false;

  public constructor(
    scene: Phaser.Scene,
    audio: AudioManager,
    handlers: PauseMenuHandlers,
  ) {
    this.scene = scene;
    this.audio = audio;
    this.handlers = handlers;

    const { width, height } = scene.scale;
    const size = UiTheme.iconBtn;
    const y = UiTheme.topPad + size / 2;
    const pauseX = width - 14 - size / 2;
    const muteX = pauseX - size - UiTheme.controlGap;

    this.pauseIcon = scene.add
      .image(pauseX, y, TextureKey.UiBtnPause)
      .setDisplaySize(size, size)
      .setDepth(Depth.Hud + 20)
      .setScrollFactor(0)
      .setData('isHud', true);

    this.muteIcon = scene.add
      .image(muteX, y, TextureKey.UiBtnSoundOn)
      .setDisplaySize(size, size)
      .setDepth(Depth.Hud + 20)
      .setScrollFactor(0)
      .setData('isHud', true);

    this.pauseHit = scene.add
      .zone(pauseX, y, size + 10, size + 10)
      .setDepth(Depth.Hud + 21)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true);

    this.muteHit = scene.add
      .zone(muteX, y, size + 10, size + 10)
      .setDepth(Depth.Hud + 21)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true);

    this.muteHit.on('pointerup', () => {
      this.audio.unlock();
      this.audio.toggleMute();
      this.audio.playSfx(Sound.UiToggle);
      this.refreshMute();
    });

    this.pauseHit.on('pointerup', () => {
      this.audio.unlock();
      this.audio.playSfx(Sound.UiClick);
      if (this.paused) {
        this.handlers.onResumeRequest();
        return;
      }
      this.handlers.onPauseRequest();
    });

    // —— Overlay: dim (fullscreen) + card (fixed size, all chrome inside) ——
    this.dim = scene.add
      .rectangle(0, 0, width, height, 0x2b2118, 0)
      .setOrigin(0.5)
      .setInteractive()
      .setData('isHud', true);

    this.cardBg = scene.add.graphics();
    this.paintCard(this.cardBg, PauseMenu.cardW, PauseMenu.cardH);

    this.title = scene.add
      .text(0, -PauseMenu.cardH / 2 + 48, t('pause.title'), {
        fontFamily: UiTheme.font,
        fontSize: '28px',
        fontStyle: 'bold',
        color: UiTheme.ink,
        stroke: '#fff8f0',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.hint = scene.add
      .text(0, -PauseMenu.cardH / 2 + 84, t('pause.hint'), {
        fontFamily: UiTheme.font,
        fontSize: '13px',
        color: UiTheme.inkSoft,
        align: 'center',
        wordWrap: { width: PauseMenu.cardW - 48 },
      })
      .setOrigin(0.5);

    if (scene.textures.exists(TextureKey.UiHeartFull)) {
      for (const ox of [-78, 78]) {
        const heart = scene.add
          .image(0, 0, TextureKey.UiHeartFull)
          .setDisplaySize(18, 18)
          .setAlpha(0.85);
        // Wrapper scale keeps display size correct (never setScale on the image).
        this.accentHearts.push(
          scene.add.container(ox, -PauseMenu.cardH / 2 + 48, [heart]),
        );
      }
    }

    this.resumeButton = createPrimaryButton(
      scene,
      0,
      18,
      t('pause.resume'),
      200,
      56,
    );

    this.resumeButton.on('pointerup', () => {
      this.audio.unlock();
      this.audio.playSfx(Sound.UiClick);
      this.handlers.onResumeRequest();
    });

    this.muteChipIcon = scene.add
      .image(-36, 0, TextureKey.UiBtnSoundOn)
      .setDisplaySize(30, 30);
    this.muteChipLabel = scene.add
      .text(10, 0, t('pause.soundOn'), {
        fontFamily: UiTheme.font,
        fontSize: '13px',
        fontStyle: 'bold',
        color: UiTheme.ink,
      })
      .setOrigin(0, 0.5);

    const muteChipBg = scene.add.graphics();
    this.paintMuteChip(muteChipBg, false);
    const muteHit = scene.add
      .zone(0, 0, 160, 44)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true);
    muteHit.on('pointerup', () => {
      this.audio.unlock();
      this.audio.toggleMute();
      this.audio.playSfx(Sound.UiToggle);
      this.refreshMute();
    });

    this.muteChip = scene.add.container(0, PauseMenu.cardH / 2 - 52, [
      muteChipBg,
      this.muteChipIcon,
      this.muteChipLabel,
      muteHit,
    ]);

    this.card = scene.add.container(0, 0, [
      this.cardBg,
      ...this.accentHearts,
      this.title,
      this.hint,
      this.resumeButton,
      this.muteChip,
    ]);

    this.root = scene.add
      .container(width / 2, height / 2, [this.dim, this.card])
      .setDepth(Depth.Popup)
      .setScrollFactor(0)
      .setVisible(false)
      .setActive(false);

    this.setOverlayInputEnabled(false);
    this.refreshMute();
  }

  public layout(width: number): void {
    const size = UiTheme.iconBtn;
    const y = UiTheme.topPad + size / 2;
    const pauseX = width - 14 - size / 2;
    const muteX = pauseX - size - UiTheme.controlGap;

    this.pauseIcon.setPosition(pauseX, y);
    this.muteIcon.setPosition(muteX, y);
    this.pauseHit.setPosition(pauseX, y);
    this.muteHit.setPosition(muteX, y);

    if (this.paused) {
      const { height } = this.scene.scale;
      this.root.setPosition(width / 2, height / 2);
      this.dim.setSize(width, height);
    }
  }

  public get controlsLeft(): number {
    const size = UiTheme.iconBtn;
    const pauseX = this.scene.scale.width - 14 - size / 2;
    const muteX = pauseX - size - UiTheme.controlGap;
    return muteX - size / 2 - 8;
  }

  public showPaused(): void {
    this.paused = true;
    this.pauseIcon
      .setTexture(TextureKey.UiBtnPlay)
      .setDisplaySize(UiTheme.iconBtn, UiTheme.iconBtn);

    const { width, height } = this.scene.scale;
    this.root
      .setPosition(width / 2, height / 2)
      .setVisible(true)
      .setActive(true)
      .setDepth(Depth.Popup);
    this.dim.setSize(width, height);
    this.setOverlayInputEnabled(true);

    // PlayScene freezes the tween manager right after this call
    // (tweens.pauseAll). Entry tweens would stick at alpha 0 —
    // always snap the card to a fully visible final state first.
    this.scene.tweens.killTweensOf(this.dim);
    this.scene.tweens.killTweensOf(this.card);
    this.dim.setAlpha(0.55);
    this.card.setScale(1).setAlpha(1).setY(0);

    this.refreshMute();
  }

  public hidePaused(): void {
    this.paused = false;
    this.pauseIcon
      .setTexture(TextureKey.UiBtnPause)
      .setDisplaySize(UiTheme.iconBtn, UiTheme.iconBtn);

    this.scene.tweens.killTweensOf(this.dim);
    this.scene.tweens.killTweensOf(this.card);
    this.accentHearts.forEach((h) => this.scene.tweens.killTweensOf(h));

    // Same freeze issue: do not rely on tweens for dismiss.
    this.dim.setAlpha(0);
    this.card.setScale(1).setAlpha(1).setY(0);
    this.setOverlayInputEnabled(false);
    this.root.setVisible(false).setActive(false);
  }

  public isShowing(): boolean {
    return this.paused;
  }

  public destroy(): void {
    this.scene.tweens.killTweensOf(this.dim);
    this.scene.tweens.killTweensOf(this.card);
    this.accentHearts.forEach((h) => this.scene.tweens.killTweensOf(h));
    this.pauseIcon.destroy();
    this.muteIcon.destroy();
    this.pauseHit.destroy();
    this.muteHit.destroy();
    this.root.destroy(true);
  }

  private paintCard(
    g: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
  ): void {
    g.clear();
    const x = -w / 2;
    const y = -h / 2;
    const r = 28;

    // Soft outer shadow
    g.fillStyle(0x000000, 0.14);
    g.fillRoundedRect(x + 3, y + 6, w, h, r);

    // Outer rose ring
    g.fillStyle(0xe8b4a8, 1);
    g.fillRoundedRect(x, y, w, h, r);

    // Cream face
    g.fillStyle(0xfff8f0, 1);
    g.fillRoundedRect(x + 5, y + 5, w - 10, h - 10, r - 4);

    // Top blush band
    g.fillStyle(0xffe8dc, 0.9);
    g.fillRoundedRect(x + 14, y + 14, w - 28, 56, 16);

    // Gold hairline
    g.lineStyle(2, 0xd4a017, 0.55);
    g.strokeRoundedRect(x + 10, y + 10, w - 20, h - 20, r - 6);
  }

  private paintMuteChip(
    g: Phaser.GameObjects.Graphics,
    muted: boolean,
  ): void {
    g.clear();
    const w = 156;
    const h = 42;
    g.fillStyle(muted ? 0xf0d8d0 : 0xfff0e0, 1);
    g.lineStyle(2, muted ? 0xc48070 : 0xe8b86d, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
  }

  private setOverlayInputEnabled(enabled: boolean): void {
    if (enabled) {
      this.dim.setInteractive();
    } else {
      this.dim.disableInteractive();
    }
    const resumeHit = this.resumeButton.getData('hitZone') as
      | Phaser.GameObjects.Zone
      | undefined;
    if (resumeHit?.input) {
      resumeHit.input.enabled = enabled;
    }
    this.muteChip.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.Zone && child.input) {
        child.input.enabled = enabled;
      }
    });
  }

  private refreshMute(): void {
    const muted = this.audio.isMuted();
    const tex = muted ? TextureKey.UiBtnSoundOff : TextureKey.UiBtnSoundOn;
    this.muteIcon
      .setTexture(tex)
      .setDisplaySize(UiTheme.iconBtn, UiTheme.iconBtn);
    this.muteChipIcon.setTexture(tex).setDisplaySize(30, 30);
    this.muteChipLabel.setText(
      muted ? t('pause.soundOff') : t('pause.soundOn'),
    );

    const bg = this.muteChip.list[0];
    if (bg instanceof Phaser.GameObjects.Graphics) {
      this.paintMuteChip(bg, muted);
    }
  }
}

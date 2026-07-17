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
 * Top-right pause / mute controls + polished pause overlay.
 * Hit targets are Zones so button clicks stay reliable after setDisplaySize.
 */
export class PauseMenu {
  private readonly scene: Phaser.Scene;
  private readonly audio: AudioManager;
  private readonly handlers: PauseMenuHandlers;
  private readonly pauseIcon: Phaser.GameObjects.Image;
  private readonly muteIcon: Phaser.GameObjects.Image;
  private readonly pauseHit: Phaser.GameObjects.Zone;
  private readonly muteHit: Phaser.GameObjects.Zone;
  private readonly overlay: Phaser.GameObjects.Container;
  private readonly dim: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Image;
  private readonly title: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly resumeButton: Phaser.GameObjects.Container;
  private readonly overlayMuteIcon: Phaser.GameObjects.Image;
  private readonly overlayMuteHit: Phaser.GameObjects.Zone;
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

    this.dim = scene.add
      .rectangle(0, 0, width, height, 0x5c3d2e, 0.55)
      .setOrigin(0.5)
      .setData('isHud', true);

    this.panel = scene.add
      .image(0, -10, TextureKey.UiPanel)
      .setDisplaySize(Math.min(340, width * 0.86), 280)
      .setData('isHud', true);

    this.title = scene.add
      .text(0, -88, t('pause.title'), {
        fontFamily: UiTheme.font,
        fontSize: '34px',
        fontStyle: 'bold',
        color: UiTheme.ink,
        stroke: '#fff8f0',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.hint = scene.add
      .text(0, -48, t('pause.hint'), {
        fontFamily: UiTheme.font,
        fontSize: '14px',
        color: UiTheme.inkSoft,
      })
      .setOrigin(0.5);

    this.resumeButton = createPrimaryButton(
      scene,
      0,
      20,
      t('pause.resume'),
      210,
      62,
    );
    this.resumeButton.on('pointerup', () => {
      this.audio.unlock();
      this.audio.playSfx(Sound.UiClick);
      this.handlers.onResumeRequest();
    });

    this.overlayMuteIcon = scene.add
      .image(0, 95, TextureKey.UiBtnSoundOn)
      .setDisplaySize(52, 52)
      .setData('isHud', true);

    this.overlayMuteHit = scene.add
      .zone(0, 95, 60, 60)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true);
    this.overlayMuteHit.on('pointerup', () => {
      this.audio.unlock();
      this.audio.toggleMute();
      this.audio.playSfx(Sound.UiToggle);
      this.refreshMute();
    });

    this.overlay = scene.add
      .container(width / 2, height / 2, [
        this.dim,
        this.panel,
        this.title,
        this.hint,
        this.resumeButton,
        this.overlayMuteIcon,
        this.overlayMuteHit,
      ])
      .setDepth(Depth.Popup)
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
  }

  /** Right edge reserved for mute+pause (so HUD can avoid overlap). */
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
    this.overlay
      .setPosition(width / 2, height / 2)
      .setVisible(true)
      .setActive(true);
    this.dim.setSize(width, height);
    this.panel.setDisplaySize(Math.min(340, width * 0.86), 280);
    this.setOverlayInputEnabled(true);

    this.scene.tweens.add({
      targets: [
        this.panel,
        this.title,
        this.hint,
        this.resumeButton,
        this.overlayMuteIcon,
      ],
      scale: { from: 0.86, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 220,
      ease: 'Back.Out',
    });

    this.refreshMute();
  }

  public hidePaused(): void {
    this.paused = false;
    this.pauseIcon
      .setTexture(TextureKey.UiBtnPause)
      .setDisplaySize(UiTheme.iconBtn, UiTheme.iconBtn);
    this.setOverlayInputEnabled(false);
    this.overlay.setVisible(false).setActive(false);
  }

  public isShowing(): boolean {
    return this.paused;
  }

  public destroy(): void {
    this.pauseIcon.destroy();
    this.muteIcon.destroy();
    this.pauseHit.destroy();
    this.muteHit.destroy();
    this.overlay.destroy(true);
  }

  private setOverlayInputEnabled(enabled: boolean): void {
    if (enabled) {
      this.dim.setInteractive();
    } else {
      this.dim.disableInteractive();
    }
    this.overlayMuteHit.input && (this.overlayMuteHit.input.enabled = enabled);
    const resumeHit = this.resumeButton.getData('hitZone') as
      | Phaser.GameObjects.Zone
      | undefined;
    if (resumeHit?.input) {
      resumeHit.input.enabled = enabled;
    }
  }

  private refreshMute(): void {
    const muted = this.audio.isMuted();
    const tex = muted ? TextureKey.UiBtnSoundOff : TextureKey.UiBtnSoundOn;
    this.muteIcon.setTexture(tex).setDisplaySize(UiTheme.iconBtn, UiTheme.iconBtn);
    this.overlayMuteIcon.setTexture(tex).setDisplaySize(52, 52);
  }
}

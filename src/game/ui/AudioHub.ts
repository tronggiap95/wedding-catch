import Phaser from 'phaser';
import { Colors } from '../constants/Colors';
import { Depth } from '../constants/Depth';
import { Sound } from '../constants/Sound';
import { TextureKey } from '../constants/TextureKey';
import { t } from '../i18n';
import type { AudioManager, AudioSettings } from '../managers/AudioManager';
import { createIconButton } from './UiFactory';
import { UiTheme } from './UiTheme';

type SliderId = 'music' | 'sfx';

/**
 * Menu audio settings: music + SFX volume (+ mute).
 */
export class AudioHub {
  private readonly root: Phaser.GameObjects.Container;
  private readonly dim: Phaser.GameObjects.Rectangle;
  private readonly audio: AudioManager;
  private readonly scene: Phaser.Scene;
  private readonly onChange: (() => void) | undefined;
  private visible = false;
  private readonly valueLabels: Record<SliderId, Phaser.GameObjects.Text>;
  private readonly muteButton: Phaser.GameObjects.Image;
  private readonly fills: Record<SliderId, Phaser.GameObjects.Rectangle>;
  private readonly thumbs: Record<SliderId, Phaser.GameObjects.Arc>;
  private readonly title: Phaser.GameObjects.Text;
  private readonly close: Phaser.GameObjects.Text;

  public constructor(
    scene: Phaser.Scene,
    audio: AudioManager,
    onChange?: () => void,
  ) {
    this.scene = scene;
    this.audio = audio;
    this.onChange = onChange;

    const { width: sw, height: sh } = scene.scale;
    const width = Math.min(300, sw * 0.86);
    const height = 260;

    this.dim = scene.add
      .rectangle(0, 0, sw, sh, 0x5c3d2e, 0.5)
      .setInteractive()
      .setData('isHud', true);
    this.dim.on('pointerup', () => {
      this.hide();
    });

    const panel = scene.add
      .image(0, 0, TextureKey.UiPanel)
      .setDisplaySize(width, height);

    this.title = scene.add
      .text(0, -height / 2 + 34, t('audio.title'), {
        fontFamily: UiTheme.font,
        fontSize: '24px',
        fontStyle: 'bold',
        color: UiTheme.ink,
        stroke: '#fff8f0',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.muteButton = createIconButton(
      scene,
      0,
      -height / 2 + 78,
      TextureKey.UiBtnSoundOn,
      46,
    );
    this.muteButton.setDepth(Depth.Popup);
    this.muteButton.on('pointerup', () => {
      this.audio.unlock();
      this.audio.toggleMute();
      this.audio.playSfx(Sound.UiToggle);
      this.refresh();
      this.onChange?.();
    });

    this.valueLabels = {
      music: this.makeValueLabel(scene),
      sfx: this.makeValueLabel(scene),
    };
    this.fills = {} as Record<SliderId, Phaser.GameObjects.Rectangle>;
    this.thumbs = {} as Record<SliderId, Phaser.GameObjects.Arc>;

    const musicRow = this.makeSliderRow(scene, t('audio.music'), 'music', -8);
    const sfxRow = this.makeSliderRow(scene, t('audio.sfx'), 'sfx', 52);

    this.close = scene.add
      .text(0, height / 2 - 34, t('audio.close'), {
        fontFamily: UiTheme.font,
        fontSize: '17px',
        fontStyle: 'bold',
        color: UiTheme.cream,
        backgroundColor: '#c97b84',
        padding: { x: 22, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true);

    this.close.on('pointerup', () => {
      this.audio.playSfx(Sound.UiClick);
      this.hide();
      this.onChange?.();
    });

    this.root = scene.add
      .container(sw / 2, sh / 2, [
        this.dim,
        panel,
        this.title,
        this.muteButton,
        ...musicRow,
        ...sfxRow,
        this.valueLabels.music,
        this.valueLabels.sfx,
        this.close,
      ])
      .setDepth(Depth.Popup)
      .setVisible(false)
      .setActive(false);

    this.setInputEnabled(false);
    this.refresh();
  }

  public show(): void {
    this.visible = true;
    this.refreshCopy();
    this.root
      .setPosition(this.scene.scale.width / 2, this.scene.scale.height / 2)
      .setVisible(true)
      .setActive(true);
    this.dim.setSize(this.scene.scale.width, this.scene.scale.height);
    this.setInputEnabled(true);
    this.refresh();
    this.scene.tweens.add({
      targets: this.root,
      scale: { from: 0.92, to: 1 },
      duration: 200,
      ease: 'Back.Out',
    });
  }

  public hide(): void {
    this.visible = false;
    this.setInputEnabled(false);
    this.root.setVisible(false).setActive(false);
  }

  public isOpen(): boolean {
    return this.visible;
  }

  public toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public destroy(): void {
    this.root.destroy(true);
  }

  private refreshCopy(): void {
    this.title.setText(t('audio.title'));
    this.close.setText(t('audio.close'));
  }

  private setInputEnabled(enabled: boolean): void {
    this.root.each((child: Phaser.GameObjects.GameObject) => {
      if (!('input' in child) || child.input === null) {
        return;
      }
      child.input.enabled = enabled;
    });
  }

  private makeValueLabel(scene: Phaser.Scene): Phaser.GameObjects.Text {
    return scene.add
      .text(108, 0, '100%', {
        fontFamily: UiTheme.font,
        fontSize: '14px',
        fontStyle: 'bold',
        color: UiTheme.ink,
      })
      .setOrigin(0, 0.5);
  }

  private makeSliderRow(
    scene: Phaser.Scene,
    label: string,
    id: SliderId,
    y: number,
  ): Phaser.GameObjects.GameObject[] {
    const text = scene.add
      .text(-128, y, label, {
        fontFamily: UiTheme.font,
        fontSize: '15px',
        fontStyle: 'bold',
        color: UiTheme.ink,
      })
      .setOrigin(0, 0.5)
      .setData('sliderLabel', id);

    const track = scene.add
      .rectangle(18, y, 150, 12, 0xe8d5c4)
      .setOrigin(0.5)
      .setStrokeStyle(2, Colors.Accent)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true);

    const fill = scene.add
      .rectangle(-57, y, 150, 12, Colors.Accent)
      .setOrigin(0, 0.5);

    const thumb = scene.add
      .circle(18, y, 11, 0xfff8f0)
      .setStrokeStyle(3, Colors.Gold)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true);

    this.fills[id] = fill;
    this.thumbs[id] = thumb;
    this.valueLabels[id].setPosition(108, y);

    const applyFromLocalX = (localX: number): void => {
      const left = -57;
      const right = 93;
      const ratio = Phaser.Math.Clamp((localX - left) / (right - left), 0, 1);
      this.setBus(id, ratio);
      this.layoutSlider(id, ratio);
      this.refreshLabels();
      this.onChange?.();
    };

    track.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.audio.unlock();
      applyFromLocalX(pointer.worldX - this.root.x);
      this.audio.playSfx(Sound.UiClick, 0.55);
    });

    thumb.on('pointerdown', () => {
      this.audio.unlock();
    });

    thumb.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) {
        return;
      }
      applyFromLocalX(pointer.worldX - this.root.x);
    });

    thumb.on('pointerup', () => {
      this.audio.playSfx(Sound.UiToggle, 0.45);
    });

    this.layoutSlider(id, this.audio.getSettings()[id]);
    return [text, track, fill, thumb];
  }

  private setBus(id: SliderId, value: number): void {
    if (id === 'music') {
      this.audio.setMusicVolume(value);
    } else {
      this.audio.setSfxVolume(value);
    }
  }

  private layoutSlider(id: SliderId, value: number): void {
    const fill = this.fills[id];
    const thumb = this.thumbs[id];
    const left = -57;
    const trackWidth = 150;
    fill.setSize(Math.max(4, trackWidth * value), 12);
    thumb.setPosition(left + trackWidth * value, fill.y);
  }

  private refresh(): void {
    const settings = this.audio.getSettings();
    const tex = settings.muted
      ? TextureKey.UiBtnSoundOff
      : TextureKey.UiBtnSoundOn;
    this.muteButton.setTexture(tex).setDisplaySize(46, 46);
    this.refreshLabels(settings);
    (['music', 'sfx'] as const).forEach((id) => {
      this.layoutSlider(id, settings[id]);
    });

    // Refresh slider labels for locale.
    this.root.each((child: Phaser.GameObjects.GameObject) => {
      const id = child.getData('sliderLabel') as SliderId | undefined;
      if (id === undefined || !('setText' in child)) {
        return;
      }
      (child as Phaser.GameObjects.Text).setText(
        id === 'music' ? t('audio.music') : t('audio.sfx'),
      );
    });
  }

  private refreshLabels(
    settings: AudioSettings = this.audio.getSettings(),
  ): void {
    this.valueLabels.music.setText(`${Math.round(settings.music * 100)}%`);
    this.valueLabels.sfx.setText(`${Math.round(settings.sfx * 100)}%`);
  }
}

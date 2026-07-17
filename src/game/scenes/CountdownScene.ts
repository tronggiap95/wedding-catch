import Phaser from 'phaser';
import type { ConfigStore } from '../config/ConfigStore';
import { Colors } from '../constants/Colors';
import { Depth } from '../constants/Depth';
import { RegistryKey } from '../constants/RegistryKey';
import { Sound } from '../constants/Sound';
import { t } from '../i18n';
import type { AudioManager } from '../managers/AudioManager';
import { UiTheme } from '../ui/UiTheme';
import { SceneKey } from '../types/SceneKey';

/**
 * 3-2-1-GO countdown before gameplay.
 */
export class CountdownScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKey.Countdown });
  }

  public create(): void {
    const config = this.registry.get(RegistryKey.ConfigStore) as ConfigStore;
    const audio = this.registry.get(RegistryKey.AudioManager) as AudioManager;
    const { width, height } = this.scale;

    audio.unlock();
    audio.ensureThemeBgm();

    this.add
      .rectangle(width / 2, height / 2, width, height, Colors.Background)
      .setDepth(Depth.Background);

    const goLabel = t('countdown.go');
    const steps = ['3', '2', '1', goLabel];

    const label = this.add
      .text(width / 2, height / 2, steps[0]!, {
        fontFamily: UiTheme.font,
        fontSize: '96px',
        fontStyle: 'bold',
        color: `#${Colors.Ink.toString(16).padStart(6, '0')}`,
        stroke: '#fff8f0',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(Depth.Popup);

    audio.playSfx(Sound.Countdown);

    const stepMs = config.runtime.countdownMs / steps.length;
    let index = 0;

    this.time.addEvent({
      delay: stepMs,
      repeat: steps.length - 1,
      callback: () => {
        index += 1;
        if (index >= steps.length) {
          this.scene.start(SceneKey.Play);
          return;
        }

        const value = steps[index] ?? goLabel;
        label.setText(value);
        label.setScale(0.6);
        this.tweens.add({
          targets: label,
          scale: 1,
          duration: 180,
          ease: 'Back.Out',
        });

        if (value === goLabel) {
          audio.playSfx(Sound.Go);
        } else {
          audio.playSfx(Sound.Countdown);
        }
      },
    });

    label.setScale(0.6);
    this.tweens.add({
      targets: label,
      scale: 1,
      duration: 180,
      ease: 'Back.Out',
    });
  }
}

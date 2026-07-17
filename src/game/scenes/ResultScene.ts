import Phaser from 'phaser';
import { Colors } from '../constants/Colors';
import { Depth } from '../constants/Depth';
import { RegistryKey } from '../constants/RegistryKey';
import { Sound } from '../constants/Sound';
import { TextureKey } from '../constants/TextureKey';
import { localeStore, t } from '../i18n';
import type { AudioManager } from '../managers/AudioManager';
import type { GameState } from '../state/GameState';
import { createPrimaryButton } from '../ui/UiFactory';
import { UiTheme } from '../ui/UiTheme';
import { SceneKey } from '../types/SceneKey';

function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * End-of-run summary + replay (graphics.md UI).
 */
export class ResultScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKey.Result });
  }

  public create(): void {
    const state = this.registry.get(RegistryKey.GameState) as GameState;
    const audio = this.registry.get(RegistryKey.AudioManager) as AudioManager;
    const { width, height } = this.scale;

    audio.playSfx(Sound.Result);
    audio.ensureThemeBgm();

    this.add
      .rectangle(width / 2, height / 2, width, height, Colors.Background)
      .setDepth(Depth.Background);

    this.add
      .rectangle(
        width / 2,
        height * 0.8,
        width,
        height * 0.5,
        Colors.BackgroundDeep,
        0.5,
      )
      .setDepth(Depth.Background);

    const panel = this.add
      .image(width / 2, height * 0.42, TextureKey.UiPanel)
      .setDisplaySize(Math.min(360, width * 0.9), Math.min(420, height * 0.58))
      .setDepth(Depth.Popup);

    const reason = state.lastGameOverReason ?? 'strike';

    const title = this.add
      .text(width / 2, height * 0.22, t('result.title'), {
        fontFamily: UiTheme.font,
        fontSize: '36px',
        fontStyle: 'bold',
        color: `#${Colors.Ink.toString(16).padStart(6, '0')}`,
        stroke: '#fff8f0',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(Depth.Popup);

    const stats = [
      `⏱ ${formatElapsed(state.elapsedMs)}`,
      `⭐ ${state.score}`,
      `💰 ${localeStore.formatNumber(state.weddingFund)}`,
      `🔥 ${t('result.comboStage', {
        combo: state.maxCombo,
        stage: state.stage,
      })}`,
      t(`result.reason.${reason}`),
    ];

    stats.forEach((line, index) => {
      this.add
        .text(width / 2, height * 0.3 + index * 28, line, {
          fontFamily: UiTheme.font,
          fontSize: index === stats.length - 1 ? '14px' : '18px',
          fontStyle: 'bold',
          color:
            index === stats.length - 1
              ? `#${Colors.Danger.toString(16).padStart(6, '0')}`
              : `#${Colors.Ink.toString(16).padStart(6, '0')}`,
          align: 'center',
          wordWrap: { width: width * 0.72 },
        })
        .setOrigin(0.5)
        .setDepth(Depth.Popup);
    });

    this.add
      .text(width / 2, height * 0.58, localeStore.funnyResultLine(), {
        fontFamily: UiTheme.font,
        fontSize: '15px',
        color: `#${Colors.Muted.toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: width * 0.72 },
      })
      .setOrigin(0.5)
      .setDepth(Depth.Popup);

    const replay = createPrimaryButton(
      this,
      width / 2,
      height * 0.72,
      t('result.replay'),
      220,
      64,
    );
    replay.setDepth(Depth.Popup);
    replay.on('pointerup', () => {
      audio.playSfx(Sound.UiClick);
      this.scene.start(SceneKey.Countdown);
    });

    const menu = this.add
      .text(width / 2, height * 0.84, t('result.menu'), {
        fontFamily: UiTheme.font,
        fontSize: '18px',
        fontStyle: 'bold',
        color: `#${Colors.Muted.toString(16).padStart(6, '0')}`,
      })
      .setOrigin(0.5)
      .setDepth(Depth.Popup)
      .setInteractive({ useHandCursor: true });

    menu.on('pointerup', () => {
      audio.playSfx(Sound.UiClick);
      this.scene.start(SceneKey.Menu);
    });

    this.tweens.add({
      targets: [panel, title, replay],
      scale: { from: 0.9, to: 1 },
      duration: 360,
      ease: 'Back.Out',
    });
  }
}

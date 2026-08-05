import Phaser from 'phaser';
import { Colors } from '../constants/Colors';
import { Depth } from '../constants/Depth';
import { RegistryKey } from '../constants/RegistryKey';
import { Sound } from '../constants/Sound';
import { TextureKey } from '../constants/TextureKey';
import { localeStore, t } from '../i18n';
import type { AudioManager } from '../managers/AudioManager';
import type { GameState } from '../state/GameState';
import { createMenuPlateButton, createPrimaryButton } from '../ui/UiFactory';
import { UiTheme } from '../ui/UiTheme';
import { SceneKey } from '../types/SceneKey';

function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * End-of-run summary — single framed card, staggered entrance, tight layout.
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

    if (this.textures.exists(TextureKey.BgStage1)) {
      const bg = this.add
        .image(width / 2, height / 2, TextureKey.BgStage1)
        .setDepth(Depth.Background);
      const frame = bg.frame;
      const scale = Math.max(width / frame.width, height / frame.height);
      bg.setDisplaySize(frame.width * scale, frame.height * scale);
    } else {
      this.add
        .rectangle(width / 2, height / 2, width, height, Colors.Background)
        .setDepth(Depth.Background);
    }

    const dim = this.add
      .rectangle(width / 2, height / 2, width, height, 0x2b2118, 0)
      .setDepth(Depth.Popup - 1);

    // Card sized for the viewport with safe padding — never full bleed.
    // Taller bottom zone so CTA buttons sit cleanly above the frame edge.
    const cardW = Math.min(320, width - 36);
    const cardH = Math.min(500, height - 40);
    const innerW = cardW - 44;
    const halfH = cardH / 2;

    // Bottom footer: [pad] replay ── gap ── menu [pad]
    const bottomPad = 36;
    const menuH = 44;
    const replayH = 54;
    const btnGap = 56; // center-to-center gap between the two CTAs
    const yMenu = halfH - bottomPad - menuH / 2;
    const yReplay = yMenu - btnGap;
    // Content sits above the button footer (extra air below funny/reason).
    const footerTop = yReplay - replayH / 2 - 22;
    const yFunny = footerTop - 28;
    const yReason = yFunny - 28;

    // Vertical slots (local y, origin = card center).
    const yTitle = -halfH + 40;
    const yScore = -halfH + 100;
    const yScoreLab = -halfH + 130;
    const yRows0 = -halfH + 168;

    const cardBg = this.add.graphics().setDepth(Depth.Popup);
    this.paintCard(cardBg, cardW, cardH);

    const title = this.add
      .text(0, yTitle, t('result.title'), {
        fontFamily: UiTheme.font,
        fontSize: '26px',
        fontStyle: 'bold',
        color: UiTheme.ink,
        stroke: '#fff8f0',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    const hearts: Phaser.GameObjects.Container[] = [];
    if (this.textures.exists(TextureKey.UiHeartFull)) {
      for (const ox of [-Math.min(92, cardW / 2 - 36), Math.min(92, cardW / 2 - 36)]) {
        const img = this.add
          .image(0, 0, TextureKey.UiHeartFull)
          .setDisplaySize(15, 15)
          .setAlpha(0.9);
        hearts.push(this.add.container(ox, yTitle, [img]));
      }
    }

    const scoreValue = this.add
      .text(0, yScore, localeStore.formatNumber(state.score), {
        fontFamily: UiTheme.font,
        fontSize: '38px',
        fontStyle: 'bold',
        color: '#c99218',
        stroke: '#fff8f0',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    const scoreLabel = this.add
      .text(0, yScoreLab, t('hud.score'), {
        fontFamily: UiTheme.font,
        fontSize: '12px',
        fontStyle: 'bold',
        color: UiTheme.inkSoft,
      })
      .setOrigin(0.5);

    const rowsData = [
      { icon: '⏱', value: formatElapsed(state.elapsedMs) },
      {
        icon: '💰',
        value: localeStore.formatNumber(state.weddingFund),
      },
      {
        icon: '🔥',
        value: t('result.comboStage', {
          combo: state.maxCombo,
          stage: state.stage,
        }),
      },
    ];

    const rowRoots = rowsData.map((row, index) =>
      this.makeStatRow(0, yRows0 + index * 36, row.icon, row.value, innerW),
    );

    const reason = state.lastGameOverReason ?? 'strike';
    const reasonText = this.add
      .text(0, yReason, t(`result.reason.${reason}`), {
        fontFamily: UiTheme.font,
        fontSize: '11px',
        fontStyle: 'bold',
        color: `#${Colors.Danger.toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: innerW },
      })
      .setOrigin(0.5);

    const funny = this.add
      .text(0, yFunny, localeStore.funnyResultLine(), {
        fontFamily: UiTheme.font,
        fontSize: '11px',
        color: UiTheme.inkSoft,
        align: 'center',
        wordWrap: { width: innerW },
        lineSpacing: 2,
      })
      .setOrigin(0.5);
    // Cap height so long funny lines do not invade buttons.
    if (funny.height > 40) {
      funny.setFontSize(10);
    }

    const btnW = Math.min(210, innerW - 4);
    const replay = createPrimaryButton(
      this,
      0,
      yReplay,
      t('result.replay'),
      btnW,
      replayH,
    );
    replay.on('pointerup', () => {
      audio.playSfx(Sound.UiClick);
      this.scene.start(SceneKey.Countdown);
    });

    const menu = createMenuPlateButton(
      this,
      0,
      yMenu,
      t('result.menu'),
      Math.min(180, btnW - 8),
      menuH,
    );
    menu.on('pointerup', () => {
      audio.playSfx(Sound.UiClick);
      this.scene.start(SceneKey.Menu);
    });

    const card = this.add
      .container(width / 2, height / 2, [
        cardBg,
        ...hearts,
        title,
        scoreValue,
        scoreLabel,
        ...rowRoots,
        reasonText,
        funny,
        replay,
        menu,
      ])
      .setDepth(Depth.Popup);

    // Entrance
    dim.setAlpha(0);
    card.setScale(0.86).setAlpha(0).setY(height / 2 + 28);

    this.tweens.add({
      targets: dim,
      alpha: 0.48,
      duration: 280,
      ease: 'Sine.Out',
    });
    this.tweens.add({
      targets: card,
      alpha: 1,
      scale: 1,
      y: height / 2,
      duration: 360,
      ease: 'Back.Out',
    });

    const stagger = [
      title,
      scoreValue,
      scoreLabel,
      ...rowRoots,
      reasonText,
      funny,
      replay,
      menu,
    ];
    stagger.forEach((target, i) => {
      target.setAlpha(0);
      this.tweens.add({
        targets: target,
        alpha: 1,
        duration: 220,
        delay: 160 + i * 40,
        ease: 'Sine.Out',
      });
    });

    hearts.forEach((heart, i) => {
      this.tweens.add({
        targets: heart,
        scale: 1.12,
        duration: 720,
        delay: 360 + i * 90,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });

    scoreValue.setScale(0.55);
    this.tweens.add({
      targets: scoreValue,
      scale: 1,
      duration: 420,
      delay: 200,
      ease: 'Back.Out',
    });
  }

  private paintCard(
    g: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
  ): void {
    g.clear();
    const x = -w / 2;
    const y = -h / 2;
    const r = 26;

    g.fillStyle(0x000000, 0.14);
    g.fillRoundedRect(x + 3, y + 7, w, h, r);

    g.fillStyle(0xe8b4a8, 1);
    g.fillRoundedRect(x, y, w, h, r);

    g.fillStyle(0xfff8f0, 1);
    g.fillRoundedRect(x + 5, y + 5, w - 10, h - 10, r - 4);

    g.fillStyle(0xffe8dc, 0.95);
    g.fillRoundedRect(x + 14, y + 12, w - 28, 48, 14);

    g.fillStyle(0xfff0c8, 0.9);
    g.fillRoundedRect(x + 26, y + 72, w - 52, 68, 16);
    g.lineStyle(1.5, 0xd4a017, 0.45);
    g.strokeRoundedRect(x + 26, y + 72, w - 52, 68, 16);

    g.lineStyle(2, 0xd4a017, 0.5);
    g.strokeRoundedRect(x + 10, y + 10, w - 20, h - 20, r - 5);
  }

  private makeStatRow(
    x: number,
    y: number,
    icon: string,
    value: string,
    width: number,
  ): Phaser.GameObjects.Container {
    const h = 32;
    const bg = this.add.graphics();
    bg.fillStyle(0xfff3e8, 0.95);
    bg.lineStyle(1.5, 0xe8c9a8, 0.9);
    bg.fillRoundedRect(-width / 2, -h / 2, width, h, 11);
    bg.strokeRoundedRect(-width / 2, -h / 2, width, h, 11);

    const iconText = this.add
      .text(-width / 2 + 14, 0, icon, {
        fontFamily: UiTheme.font,
        fontSize: '15px',
      })
      .setOrigin(0, 0.5);

    const valueText = this.add
      .text(width / 2 - 12, 0, value, {
        fontFamily: UiTheme.font,
        fontSize: '13px',
        fontStyle: 'bold',
        color: UiTheme.ink,
      })
      .setOrigin(1, 0.5);

    // Truncate long combo/stage strings so they stay inside the row.
    const maxValW = width - 48;
    if (valueText.width > maxValW) {
      valueText.setFontSize(11);
    }
    if (valueText.width > maxValW) {
      const clipped = value.length > 28 ? `${value.slice(0, 26)}…` : value;
      valueText.setText(clipped);
    }

    return this.add.container(x, y, [bg, iconText, valueText]);
  }
}

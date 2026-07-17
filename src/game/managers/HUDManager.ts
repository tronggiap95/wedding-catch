import Phaser from 'phaser';
import { Depth } from '../constants/Depth';
import { Events } from '../constants/Events';
import { TextureKey } from '../constants/TextureKey';
import { EventBus } from '../events/EventBus';
import { localeStore, t } from '../i18n';
import type { GameState } from '../state/GameState';
import type { ComboTier } from '../types/config';
import { UiTheme } from '../ui/UiTheme';

interface ComboStyle {
  readonly color: string;
  readonly stroke: string;
  readonly multColor: string;
  readonly fontSize: number;
  readonly multSize: number;
  readonly scale: number;
}

/**
 * Gameplay HUD:
 * - Top: score / time / hearts
 * - Mid-left: Giai Đoạn flavor (behind items)
 * - Mid-right: combo (behind items & couple) + bonus timers on HUD
 */
export class HUDManager {
  private readonly scene: Phaser.Scene;
  private readonly state: GameState;
  private readonly comboTiers: readonly ComboTier[];
  private readonly maxStrikes = 3;

  private readonly timePill: Phaser.GameObjects.Image;
  private readonly timeText: Phaser.GameObjects.Text;
  private readonly scorePill: Phaser.GameObjects.Image;
  private readonly scoreLabel: Phaser.GameObjects.Text;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly stageText: Phaser.GameObjects.Text;
  private readonly fundIcon: Phaser.GameObjects.Image;
  private readonly fundText: Phaser.GameObjects.Text;
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly comboRoot: Phaser.GameObjects.Container;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly comboMultText: Phaser.GameObjects.Text;
  private readonly bonusText: Phaser.GameObjects.Text;

  private readonly comboAnchorX: number;
  private readonly comboAnchorY: number;
  private lastCombo = 0;
  private lastBonusKey = '';

  public constructor(
    scene: Phaser.Scene,
    state: GameState,
    comboTiers: readonly ComboTier[],
  ) {
    this.scene = scene;
    this.state = state;
    this.comboTiers = comboTiers;

    const { width, height } = scene.scale;
    const topY = UiTheme.topPad + 22;
    // Reserve top-right for mute + pause (PauseMenu uses the same math).
    const controlsLeft =
      width - 14 - UiTheme.iconBtn * 2 - UiTheme.controlGap - UiTheme.iconBtn / 2 - 10;

    // Left: time
    this.timePill = scene.add
      .image(14 + 48, topY, TextureKey.UiHudPill)
      .setDisplaySize(96, 34)
      .setDepth(Depth.Hud)
      .setScrollFactor(0);

    this.timeText = scene.add
      .text(this.timePill.x, topY, '0:00', {
        fontFamily: UiTheme.font,
        fontSize: '17px',
        fontStyle: 'bold',
        color: UiTheme.ink,
      })
      .setOrigin(0.5)
      .setDepth(Depth.Hud)
      .setScrollFactor(0);

    // Left under time: wedding fund
    this.fundIcon = scene.add
      .image(18, topY + 26, TextureKey.UiIconCoin)
      .setDisplaySize(18, 18)
      .setDepth(Depth.Hud)
      .setScrollFactor(0);

    this.fundText = scene.add
      .text(this.fundIcon.x + 12, this.fundIcon.y, '0', {
        fontFamily: UiTheme.font,
        fontSize: '12px',
        fontStyle: 'bold',
        color: UiTheme.inkSoft,
      })
      .setOrigin(0, 0.5)
      .setDepth(Depth.Hud)
      .setScrollFactor(0);

    // Center: score (compact — no oversized pill fighting the controls)
    this.scorePill = scene.add
      .image(width / 2, topY + 2, TextureKey.UiHudPill)
      .setDisplaySize(150, 48)
      .setDepth(Depth.Hud)
      .setScrollFactor(0);

    this.scoreLabel = scene.add
      .text(width / 2, topY - 12, t('hud.score'), {
        fontFamily: UiTheme.font,
        fontSize: '10px',
        fontStyle: 'bold',
        color: UiTheme.inkSoft,
      })
      .setOrigin(0.5)
      .setDepth(Depth.Hud)
      .setScrollFactor(0);

    this.scoreText = scene.add
      .text(width / 2, topY + 8, '0', {
        fontFamily: UiTheme.font,
        fontSize: '28px',
        fontStyle: 'bold',
        color: UiTheme.ink,
        stroke: '#fff8f0',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(Depth.Hud)
      .setScrollFactor(0);

    // Hearts sit left of mute/pause, never over the score.
    const heartGap = UiTheme.heart + 3;
    const heartsBlock = this.maxStrikes * heartGap;
    const heartsStart = controlsLeft - heartsBlock;
    for (let i = 0; i < this.maxStrikes; i += 1) {
      const heart = scene.add
        .image(heartsStart + i * heartGap + UiTheme.heart / 2, topY, TextureKey.UiHeartFull)
        .setDisplaySize(UiTheme.heart, UiTheme.heart)
        .setDepth(Depth.Hud)
        .setScrollFactor(0);
      this.hearts.push(heart);
    }

    // Stage flavor: behind items & couple.
    this.stageText = scene.add
      .text(18, height * 0.38, '', {
        fontFamily: UiTheme.font,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#fff8f0',
        stroke: '#5c3d2e',
        strokeThickness: 6,
        align: 'left',
        lineSpacing: 4,
        wordWrap: { width: Math.min(220, width * 0.42) },
      })
      .setOrigin(0, 0.5)
      .setDepth(Depth.Atmosphere)
      .setScrollFactor(0)
      .setAlpha(0.3);

    // Combo sits above the couple, behind falling items.
    this.comboAnchorX = width - 22;
    this.comboAnchorY = height * 0.58;

    this.comboText = scene.add
      .text(0, -14, '', {
        fontFamily: UiTheme.font,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ff6b6b',
        stroke: '#fff8f0',
        strokeThickness: 5,
      })
      .setOrigin(1, 0.5);

    this.comboMultText = scene.add
      .text(0, 12, '', {
        fontFamily: UiTheme.font,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffd60a',
        stroke: '#5c3d2e',
        strokeThickness: 4,
      })
      .setOrigin(1, 0.5);

    this.comboRoot = scene.add
      .container(this.comboAnchorX, this.comboAnchorY, [
        this.comboText,
        this.comboMultText,
      ])
      .setDepth(Depth.Atmosphere)
      .setScrollFactor(0)
      .setVisible(false)
      .setAlpha(0);

    this.bonusText = scene.add
      .text(this.comboAnchorX, this.comboAnchorY + 40, '', {
        fontFamily: UiTheme.font,
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#9b5de5',
        stroke: '#fff8f0',
        strokeThickness: 4,
        align: 'right',
      })
      .setOrigin(1, 0)
      .setDepth(Depth.Hud)
      .setScrollFactor(0)
      .setVisible(false)
      .setAlpha(0);

    EventBus.on(Events.ScoreChanged, this.refresh, this);
    EventBus.on(Events.ComboChanged, this.refresh, this);
    EventBus.on(Events.StrikeChanged, this.refresh, this);
    EventBus.on(Events.StageChanged, this.onStage, this);
    EventBus.on(Events.TimeChanged, this.onTime, this);
    EventBus.on(Events.BonusActivated, this.onBonus, this);
    EventBus.on(Events.HudRefresh, this.refresh, this);

    this.refresh();
  }

  public destroy(): void {
    EventBus.off(Events.ScoreChanged, this.refresh, this);
    EventBus.off(Events.ComboChanged, this.refresh, this);
    EventBus.off(Events.StrikeChanged, this.refresh, this);
    EventBus.off(Events.StageChanged, this.onStage, this);
    EventBus.off(Events.TimeChanged, this.onTime, this);
    EventBus.off(Events.BonusActivated, this.onBonus, this);
    EventBus.off(Events.HudRefresh, this.refresh, this);

    this.scene.tweens.killTweensOf([
      this.scoreText,
      this.comboRoot,
      this.bonusText,
      this.stageText,
    ]);

    this.timePill.destroy();
    this.timeText.destroy();
    this.scorePill.destroy();
    this.scoreLabel.destroy();
    this.scoreText.destroy();
    this.stageText.destroy();
    this.fundIcon.destroy();
    this.fundText.destroy();
    this.comboRoot.destroy(true);
    this.bonusText.destroy();
    this.hearts.forEach((h) => h.destroy());
  }

  public tickBonuses(): void {
    // Only tick bonus timers — do not reset combo scale tweens every frame.
    this.refreshBonuses();
  }

  private refresh = (): void => {
    const prevScore = this.scoreText.text;
    const nextScore = `${this.state.score}`;
    this.scoreText.setText(nextScore);
    if (prevScore !== nextScore && this.state.score > 0) {
      this.scene.tweens.killTweensOf(this.scoreText);
      this.scoreText.setScale(1.18);
      this.scene.tweens.add({
        targets: this.scoreText,
        scale: 1,
        duration: 180,
        ease: 'Back.Out',
      });
    }

    this.fundText.setText(localeStore.formatNumber(this.state.weddingFund));

    const remaining = Math.max(0, this.maxStrikes - this.state.strike);
    this.hearts.forEach((heart, index) => {
      const alive = index < remaining;
      heart.setTexture(alive ? TextureKey.UiHeartFull : TextureKey.UiHeartEmpty);
      heart.setDisplaySize(UiTheme.heart, UiTheme.heart);
      heart.setAlpha(alive ? 1 : 0.85);
    });

    this.refreshCombo();
    this.refreshBonuses();
  };

  private refreshCombo(): void {
    const combo = this.state.combo;
    const comboMult = this.getComboMultiplier(combo);
    const doubleOn = this.state.doubleScoreRemainingMs > 0;
    const totalMult = comboMult * (doubleOn ? 2 : 1);
    const style = this.styleForCombo(combo);

    if (combo <= 0) {
      this.lastCombo = 0;
      this.scene.tweens.killTweensOf(this.comboRoot);
      this.comboRoot.setVisible(false).setAlpha(0).setScale(1);
      this.comboRoot.setPosition(this.comboAnchorX, this.comboAnchorY);
      return;
    }

    this.comboText
      .setText(t('hud.combo', { count: combo }))
      .setColor(style.color)
      .setStroke(style.stroke, 5)
      .setFontSize(style.fontSize);

    this.comboMultText
      .setText(
        t('hud.comboMult', { mult: this.formatMult(totalMult) }),
      )
      .setColor(style.multColor)
      .setFontSize(style.multSize);

    this.comboRoot.setVisible(true);

    const grew = combo > this.lastCombo;
    this.lastCombo = combo;

    if (!grew) {
      // Keep current tween/scale — only ensure visible.
      this.comboRoot.setAlpha(1);
      return;
    }

    // Punch scale each time a combo catch lands.
    this.scene.tweens.killTweensOf(this.comboRoot);
    this.comboRoot
      .setPosition(this.comboAnchorX, this.comboAnchorY)
      .setAlpha(1)
      .setScale(style.scale * 0.82);

    this.scene.tweens.add({
      targets: this.comboRoot,
      scale: style.scale * 1.12,
      duration: 140,
      ease: 'Back.Out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.comboRoot,
          scale: style.scale,
          duration: 120,
          ease: 'Sine.InOut',
        });
      },
    });
  }

  private refreshBonuses(): void {
    const lines: string[] = [];
    if (this.state.magnetRemainingMs > 0) {
      lines.push(
        t('hud.bonus.magnet', {
          seconds: Math.ceil(this.state.magnetRemainingMs / 1000),
        }),
      );
    }
    if (this.state.repelRemainingMs > 0) {
      lines.push(
        t('hud.bonus.repel', {
          seconds: Math.ceil(this.state.repelRemainingMs / 1000),
        }),
      );
    }
    if (this.state.doubleScoreRemainingMs > 0) {
      lines.push(
        t('hud.bonus.double', {
          seconds: Math.ceil(this.state.doubleScoreRemainingMs / 1000),
        }),
      );
    }
    if (this.state.invincibleRemainingMs > 0) {
      lines.push(
        t('hud.bonus.invincible', {
          seconds: Math.ceil(this.state.invincibleRemainingMs / 1000),
        }),
      );
    }

    const key = lines.join('|');
    const appeared = key !== '' && key !== this.lastBonusKey;
    this.lastBonusKey = key;

    if (lines.length === 0) {
      this.scene.tweens.killTweensOf(this.bonusText);
      this.bonusText.setVisible(false).setAlpha(0);
      return;
    }

    this.bonusText.setText(lines.join('\n')).setVisible(true);

    if (appeared) {
      this.scene.tweens.killTweensOf(this.bonusText);
      this.bonusText.setAlpha(0).setY(this.comboAnchorY + 52);
      this.scene.tweens.add({
        targets: this.bonusText,
        alpha: 1,
        y: this.comboAnchorY + 40,
        duration: 240,
        ease: 'Cubic.Out',
      });
    } else {
      this.bonusText.setAlpha(1).setY(this.comboAnchorY + 40);
    }
  }

  private styleForCombo(combo: number): ComboStyle {
    if (combo >= 40) {
      return {
        color: '#ff4ecd',
        stroke: '#3b0a45',
        multColor: '#ffe066',
        fontSize: 24,
        multSize: 18,
        scale: 1.28,
      };
    }
    if (combo >= 25) {
      return {
        color: '#9b5de5',
        stroke: '#2b1240',
        multColor: '#ffd60a',
        fontSize: 22,
        multSize: 17,
        scale: 1.18,
      };
    }
    if (combo >= 15) {
      return {
        color: '#f77f00',
        stroke: '#4a2200',
        multColor: '#ffd60a',
        fontSize: 20,
        multSize: 16,
        scale: 1.1,
      };
    }
    if (combo >= 8) {
      return {
        color: '#e63946',
        stroke: '#fff0f0',
        multColor: '#ffb703',
        fontSize: 18,
        multSize: 15,
        scale: 1.04,
      };
    }
    return {
      color: '#c1121f',
      stroke: '#fff8f0',
      multColor: '#d4a017',
      fontSize: 17,
      multSize: 14,
      scale: 1,
    };
  }

  private getComboMultiplier(combo: number): number {
    for (const tier of this.comboTiers) {
      if (combo >= tier.minCombo) {
        return tier.multiplier;
      }
    }
    return 1;
  }

  private formatMult(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  }

  private onStage = (payload: {
    stage: number;
    name: string;
    description: string;
  }): void => {
    this.stageText.setText(
      `${t('hud.stage', { stage: payload.stage })}\n${payload.name}\n${payload.description}`,
    );
    this.scene.tweens.killTweensOf(this.stageText);
    this.stageText.setAlpha(0.2).setScale(0.92);
    this.scene.tweens.add({
      targets: this.stageText,
      alpha: 0.3,
      scale: 1,
      duration: 480,
      ease: 'Sine.Out',
    });
    this.refresh();
  };

  private onTime = (payload: { elapsedMs: number }): void => {
    const totalSeconds = Math.floor(payload.elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    this.timeText.setText(
      `${minutes}:${seconds.toString().padStart(2, '0')}`,
    );
  };

  private onBonus = (): void => {
    this.refresh();
  };
}

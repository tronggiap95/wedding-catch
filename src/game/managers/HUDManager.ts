import Phaser from 'phaser';
import { Depth } from '../constants/Depth';
import { Events } from '../constants/Events';
import { TextureKey } from '../constants/TextureKey';
import type { ThrowerCharacters } from '../entities/ThrowerCharacters';
import { EventBus } from '../events/EventBus';
import { t } from '../i18n';
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
 * - Top: time / hearts (score on devil badge via ThrowerCharacters)
 * - Mid-left: stage flavor + special-bad timers (behind items)
 * - Mid-right: combo + bonus timers (behind items)
 */
export class HUDManager {
  /** Soft enough that falling items stay readable over flavor text. */
  private static readonly flavorAlpha = 0.52;

  private readonly scene: Phaser.Scene;
  private readonly state: GameState;
  private readonly throwers: ThrowerCharacters;
  private readonly comboTiers: readonly ComboTier[];
  private readonly maxStrikes = 3;

  private readonly timePill: Phaser.GameObjects.Image;
  private readonly timeText: Phaser.GameObjects.Text;
  private readonly stageText: Phaser.GameObjects.Text;
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly comboRoot: Phaser.GameObjects.Container;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly comboMultText: Phaser.GameObjects.Text;
  private readonly bonusText: Phaser.GameObjects.Text;
  private readonly debuffText: Phaser.GameObjects.Text;

  private readonly comboAnchorX: number;
  private readonly comboAnchorY: number;
  private readonly effectAnchorY: number;
  private readonly leftFlavorX: number;
  private lastCombo = 0;
  private lastBonusKey = '';
  private lastDebuffKey = '';

  public constructor(
    scene: Phaser.Scene,
    state: GameState,
    comboTiers: readonly ComboTier[],
    throwers: ThrowerCharacters,
  ) {
    this.scene = scene;
    this.state = state;
    this.comboTiers = comboTiers;
    this.throwers = throwers;

    const { width, height } = scene.scale;
    const topY = UiTheme.topPad + 22;
    const controlsLeft =
      width - 14 - UiTheme.iconBtn * 2 - UiTheme.controlGap - UiTheme.iconBtn / 2 - 10;

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

    this.comboAnchorX = width - 22;
    this.comboAnchorY = height * 0.58;
    this.effectAnchorY = this.comboAnchorY + 40;
    this.leftFlavorX = 18;

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
      .text(this.comboAnchorX, this.effectAnchorY, '', {
        fontFamily: UiTheme.font,
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#9b5de5',
        stroke: '#fff8f0',
        strokeThickness: 4,
        align: 'right',
        wordWrap: { width: Math.min(200, width * 0.42) },
      })
      .setOrigin(1, 0)
      .setDepth(Depth.Atmosphere)
      .setScrollFactor(0)
      .setVisible(false)
      .setAlpha(0);

    this.debuffText = scene.add
      .text(this.leftFlavorX, this.effectAnchorY, '', {
        fontFamily: UiTheme.font,
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#c1121f',
        stroke: '#fff8f0',
        strokeThickness: 4,
        align: 'left',
        wordWrap: { width: Math.min(200, width * 0.42) },
      })
      .setOrigin(0, 0)
      .setDepth(Depth.Atmosphere)
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
      this.comboRoot,
      this.bonusText,
      this.debuffText,
      this.stageText,
    ]);

    this.timePill.destroy();
    this.timeText.destroy();
    this.stageText.destroy();
    this.comboRoot.destroy(true);
    this.bonusText.destroy();
    this.debuffText.destroy();
    this.hearts.forEach((h) => h.destroy());
  }

  public tickBonuses(): void {
    // Only tick effect timers — do not reset combo scale tweens every frame.
    this.refreshBonuses();
    this.refreshDebuffs();
  }

  private refresh = (): void => {
    this.throwers.setScore(this.state.score);

    const remaining = Math.max(0, this.maxStrikes - this.state.strike);
    this.hearts.forEach((heart, index) => {
      const alive = index < remaining;
      heart.setTexture(alive ? TextureKey.UiHeartFull : TextureKey.UiHeartEmpty);
      heart.setDisplaySize(UiTheme.heart, UiTheme.heart);
      heart.setAlpha(alive ? 1 : 0.85);
    });

    this.refreshCombo();
    this.refreshBonuses();
    this.refreshDebuffs();
  };

  private refreshCombo(): void {
    const combo = this.state.combo;
    const comboMult = this.getComboMultiplier(combo);
    const doubleOn = this.state.doubleScoreRemainingMs > 0;
    const totalMult = comboMult * (doubleOn ? 2 : 1);
    const style = this.styleForCombo(combo);
    const alpha = HUDManager.flavorAlpha;

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
      this.comboRoot.setAlpha(alpha);
      return;
    }

    // Punch scale each time a combo catch lands.
    this.scene.tweens.killTweensOf(this.comboRoot);
    this.comboRoot
      .setPosition(this.comboAnchorX, this.comboAnchorY)
      .setAlpha(alpha)
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

    this.showFlavorLines(this.bonusText, lines, this.comboAnchorX, 'lastBonusKey');
  }

  private refreshDebuffs(): void {
    const lines: string[] = [];
    if (this.state.repelRemainingMs > 0) {
      lines.push(
        t('hud.debuff.repel', {
          seconds: Math.ceil(this.state.repelRemainingMs / 1000),
        }),
      );
    }
    if (this.state.drunkRemainingMs > 0) {
      lines.push(
        t('hud.debuff.drunk', {
          seconds: Math.ceil(this.state.drunkRemainingMs / 1000),
        }),
      );
    }

    this.showFlavorLines(
      this.debuffText,
      lines,
      this.leftFlavorX,
      'lastDebuffKey',
    );
  }

  private showFlavorLines(
    target: Phaser.GameObjects.Text,
    lines: string[],
    x: number,
    keyField: 'lastBonusKey' | 'lastDebuffKey',
  ): void {
    const key = lines.join('|');
    const appeared = key !== '' && key !== this[keyField];
    this[keyField] = key;
    const alpha = HUDManager.flavorAlpha;
    const y = this.effectAnchorY;

    if (lines.length === 0) {
      this.scene.tweens.killTweensOf(target);
      target.setVisible(false).setAlpha(0);
      return;
    }

    target.setText(lines.join('\n')).setVisible(true).setX(x);

    if (appeared) {
      this.scene.tweens.killTweensOf(target);
      target.setAlpha(0).setY(y + 12);
      this.scene.tweens.add({
        targets: target,
        alpha,
        y,
        duration: 240,
        ease: 'Cubic.Out',
      });
    } else {
      target.setAlpha(alpha).setY(y);
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

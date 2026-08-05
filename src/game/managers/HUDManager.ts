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
  readonly glow: number;
}

interface PillMetrics {
  readonly width: number;
  readonly height: number;
}

/**
 * Gameplay HUD — top status bar + mid flavor.
 *
 * Top row: [timer] [score] ········· [hearts] ········· [mute/pause]
 * Each cluster has its own chrome, idle motion, and feedback tween.
 */
export class HUDManager {
  private static readonly flavorAlpha = 0.58;
  private static readonly maxStrikes = 3;
  private static readonly pillH = 36;
  private static readonly timeW = 94;
  private static readonly gap = 8;

  private readonly scene: Phaser.Scene;
  private readonly state: GameState;
  private readonly comboTiers: readonly ComboTier[];

  // —— Timer ——
  private readonly timeRoot: Phaser.GameObjects.Container;
  private readonly timeBg: Phaser.GameObjects.Graphics;
  private readonly timeIcon: Phaser.GameObjects.Graphics;
  private readonly timeText: Phaser.GameObjects.Text;

  // —— Score ——
  private readonly scoreRoot: Phaser.GameObjects.Container;
  private readonly scoreBg: Phaser.GameObjects.Graphics;
  private readonly scoreGlow: Phaser.GameObjects.Graphics;
  private readonly scoreIcon: Phaser.GameObjects.Image;
  private readonly scoreText: Phaser.GameObjects.Text;
  private scorePillW = 108;

  // —— Hearts ——
  private readonly heartsRoot: Phaser.GameObjects.Container;
  private readonly heartSlots: {
    root: Phaser.GameObjects.Container;
    img: Phaser.GameObjects.Image;
    halo: Phaser.GameObjects.Graphics;
  }[] = [];

  // —— Mid flavor ——
  private readonly stageText: Phaser.GameObjects.Text;
  private readonly comboRoot: Phaser.GameObjects.Container;
  private readonly comboGlow: Phaser.GameObjects.Graphics;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly comboMultText: Phaser.GameObjects.Text;
  private readonly bonusText: Phaser.GameObjects.Text;
  private readonly debuffText: Phaser.GameObjects.Text;

  private readonly comboAnchorX: number;
  private readonly comboAnchorY: number;
  private readonly effectAnchorY: number;
  private readonly leftFlavorX: number;

  private lastCombo = 0;
  private lastScore = -1;
  private lastStrike = -1;
  private lastTimeSec = -1;
  private lastBonusKey = '';
  private lastDebuffKey = '';
  private heartBobMs = 0;
  private bonusRefreshMs = 0;

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
    const edgePad = 14;
    const timeW = HUDManager.timeW;

    // —— Timer pill (origin = center) ——
    this.timeBg = scene.add.graphics();
    this.timeIcon = scene.add.graphics();
    this.timeText = scene.add
      .text(0, 0, '0:00', {
        fontFamily: UiTheme.font,
        fontSize: '16px',
        fontStyle: 'bold',
        color: UiTheme.ink,
      })
      .setOrigin(0.5);
    this.timeRoot = scene.add
      .container(edgePad + timeW / 2, topY, [
        this.timeBg,
        this.timeIcon,
        this.timeText,
      ])
      .setDepth(Depth.Hud)
      .setScrollFactor(0);
    this.paintTimePill({ width: timeW, height: HUDManager.pillH });

    // —— Score pill (right of timer) ——
    this.scoreGlow = scene.add.graphics();
    this.scoreBg = scene.add.graphics();
    this.scoreIcon = scene.add
      .image(0, 0, TextureKey.UiIconCoin)
      .setDisplaySize(22, 22);
    this.scoreText = scene.add
      .text(0, 0, '0', {
        fontFamily: UiTheme.font,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#6b3f12',
      })
      .setOrigin(0, 0.5);
    this.scoreRoot = scene.add
      .container(0, topY, [
        this.scoreGlow,
        this.scoreBg,
        this.scoreIcon,
        this.scoreText,
      ])
      .setDepth(Depth.Hud)
      .setScrollFactor(0);
    this.layoutScorePill('0');
    this.placeScoreBesideTime();

    // —— Hearts (between score and controls) ——
    this.heartsRoot = scene.add
      .container(0, topY)
      .setDepth(Depth.Hud)
      .setScrollFactor(0);
    this.buildHearts();
    this.layoutHearts(width);

    // —— Stage flavor ——
    this.stageText = scene.add
      .text(16, height * 0.38, '', {
        fontFamily: UiTheme.font,
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#fff8f0',
        stroke: '#5c3d2e',
        strokeThickness: 6,
        align: 'left',
        lineSpacing: 5,
        wordWrap: { width: Math.min(220, width * 0.42) },
      })
      .setOrigin(0, 0.5)
      .setDepth(Depth.Atmosphere)
      .setScrollFactor(0)
      .setAlpha(0.28);

    this.comboAnchorX = width - 18;
    this.comboAnchorY = height * 0.56;
    this.effectAnchorY = this.comboAnchorY + 44;
    this.leftFlavorX = 16;

    this.comboGlow = scene.add.graphics();
    this.comboText = scene.add
      .text(0, -13, '', {
        fontFamily: UiTheme.font,
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#ff6b6b',
        stroke: '#fff8f0',
        strokeThickness: 5,
      })
      .setOrigin(1, 0.5);
    this.comboMultText = scene.add
      .text(0, 12, '', {
        fontFamily: UiTheme.font,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffd60a',
        stroke: '#5c3d2e',
        strokeThickness: 4,
      })
      .setOrigin(1, 0.5);
    this.comboRoot = scene.add
      .container(this.comboAnchorX, this.comboAnchorY, [
        this.comboGlow,
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
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#7b3fe4',
        stroke: '#fff8f0',
        strokeThickness: 4,
        align: 'right',
        backgroundColor: '#fff8f099',
        padding: { x: 8, y: 5 },
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
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#b01020',
        stroke: '#fff8f0',
        strokeThickness: 4,
        align: 'left',
        backgroundColor: '#fff0f099',
        padding: { x: 8, y: 5 },
        wordWrap: { width: Math.min(200, width * 0.42) },
      })
      .setOrigin(0, 0)
      .setDepth(Depth.Atmosphere)
      .setScrollFactor(0)
      .setVisible(false)
      .setAlpha(0);

    this.startIdleMotions();

    EventBus.on(Events.ScoreChanged, this.onScoreChanged, this);
    EventBus.on(Events.ComboChanged, this.refresh, this);
    EventBus.on(Events.StrikeChanged, this.onStrikeChanged, this);
    EventBus.on(Events.StageChanged, this.onStage, this);
    EventBus.on(Events.TimeChanged, this.onTime, this);
    EventBus.on(Events.BonusActivated, this.onBonus, this);
    EventBus.on(Events.HudRefresh, this.refresh, this);

    this.refresh();
  }

  public destroy(): void {
    EventBus.off(Events.ScoreChanged, this.onScoreChanged, this);
    EventBus.off(Events.ComboChanged, this.refresh, this);
    EventBus.off(Events.StrikeChanged, this.onStrikeChanged, this);
    EventBus.off(Events.StageChanged, this.onStage, this);
    EventBus.off(Events.TimeChanged, this.onTime, this);
    EventBus.off(Events.BonusActivated, this.onBonus, this);
    EventBus.off(Events.HudRefresh, this.refresh, this);

    this.scene.tweens.killTweensOf([
      this.timeRoot,
      this.scoreRoot,
      this.scoreIcon,
      this.scoreText,
      this.comboRoot,
      this.bonusText,
      this.debuffText,
      this.stageText,
      ...this.heartSlots.map((s) => s.root),
      ...this.heartSlots.map((s) => s.img),
    ]);

    this.timeRoot.destroy(true);
    this.scoreRoot.destroy(true);
    this.heartsRoot.destroy(true);
    this.stageText.destroy();
    this.comboRoot.destroy(true);
    this.bonusText.destroy();
    this.debuffText.destroy();
  }

  public tickBonuses(deltaMs = 16): void {
    this.bonusRefreshMs += deltaMs;
    // Bonus timers display whole seconds — 4 Hz is enough UI precision.
    if (this.bonusRefreshMs >= 250) {
      this.bonusRefreshMs = 0;
      this.refreshBonuses();
      this.refreshDebuffs();
    }
    this.tickHeartBob();
  }

  // ─── Paints ───────────────────────────────────────────────────────────

  private paintTimePill(metrics: PillMetrics): void {
    const { width: w, height: h } = metrics;
    const g = this.timeBg;
    g.clear();

    // Soft outer ring (rose wash)
    g.fillStyle(0xf5d0c4, 0.55);
    g.fillRoundedRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, h / 2 + 2);

    // Main cream body
    g.fillStyle(0xfff6ee, 0.96);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);

    // Inner light edge
    g.lineStyle(1.5, 0xffffff, 0.85);
    g.strokeRoundedRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, h / 2 - 1);

    // Soft border
    g.lineStyle(1.5, 0xd4a088, 0.7);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);

    // Accent strip left (timer identity)
    g.fillStyle(0xe89a9a, 0.9);
    g.fillRoundedRect(-w / 2 + 3, -h / 2 + 5, 3, h - 10, 2);

    this.paintClockIcon(-w / 2 + 20, 0, 9);
    this.timeText.setPosition(8, 0);
  }

  private paintClockIcon(cx: number, cy: number, r: number): void {
    const g = this.timeIcon;
    g.clear();
    g.fillStyle(0xe89a9a, 1);
    g.fillCircle(cx, cy, r);
    g.fillStyle(0xfff8f0, 1);
    g.fillCircle(cx, cy, r - 2.2);
    g.lineStyle(1.6, 0x8a5a48, 1);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx, cy - r * 0.45);
    g.strokePath();
    g.lineStyle(1.4, 0xc48070, 1);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + r * 0.38, cy + r * 0.1);
    g.strokePath();
    g.fillStyle(0xc48070, 1);
    g.fillCircle(cx, cy, 1.3);
  }

  private paintScorePill(w: number, h: number, hot = false): void {
    const g = this.scoreBg;
    const glow = this.scoreGlow;
    g.clear();
    glow.clear();

    if (hot) {
      glow.fillStyle(0xffd76a, 0.35);
      glow.fillRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, h / 2 + 4);
    }

    // Outer gold ring
    g.fillStyle(0xf0c86a, 0.45);
    g.fillRoundedRect(-w / 2 - 1.5, -h / 2 - 1.5, w + 3, h + 3, h / 2 + 1.5);

    // Warm gold body
    g.fillStyle(hot ? 0xfff0c8 : 0xffe9a8, 0.97);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);

    // Highlight
    g.fillStyle(0xffffff, 0.35);
    g.fillRoundedRect(-w / 2 + 3, -h / 2 + 2, w - 6, h * 0.38, h / 3);

    g.lineStyle(1.5, 0xc99218, 0.85);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);

    // Accent strip
    g.fillStyle(0xd4a017, 0.95);
    g.fillRoundedRect(-w / 2 + 3, -h / 2 + 5, 3, h - 10, 2);
  }

  private layoutScorePill(value: string): void {
    this.scoreText.setText(value);
    const textW = Math.max(18, this.scoreText.width);
    const padL = 34;
    const padR = 14;
    const w = Math.max(100, padL + textW + padR);
    const h = HUDManager.pillH;
    this.scorePillW = w;

    this.paintScorePill(w, h, false);
    this.scoreIcon.setPosition(-w / 2 + 20, 0);
    this.scoreText.setPosition(-w / 2 + 34, 0.5);
  }

  private buildHearts(): void {
    const gap = UiTheme.heart + 6;
    const start = -((HUDManager.maxStrikes - 1) * gap) / 2;

    for (let i = 0; i < HUDManager.maxStrikes; i += 1) {
      const halo = this.scene.add.graphics();
      const img = this.scene.add
        .image(0, 0, TextureKey.UiHeartFull)
        .setDisplaySize(UiTheme.heart, UiTheme.heart);
      const root = this.scene.add.container(start + i * gap, 0, [halo, img]);
      this.heartsRoot.add(root);
      this.heartSlots.push({ root, img, halo });
      this.paintHeartHalo(halo, true);
    }
  }

  private paintHeartHalo(
    g: Phaser.GameObjects.Graphics,
    alive: boolean,
  ): void {
    g.clear();
    if (!alive) {
      return;
    }
    g.fillStyle(0xff8fab, 0.22);
    g.fillCircle(0, 0, UiTheme.heart * 0.72);
  }

  private placeScoreBesideTime(): void {
    // timeRoot and scoreRoot are both centered; sit flush beside each other.
    this.scoreRoot.x =
      this.timeRoot.x +
      HUDManager.timeW / 2 +
      HUDManager.gap +
      this.scorePillW / 2;
    this.scoreRoot.y = this.timeRoot.y;
  }

  private layoutHearts(width: number): void {
    const controlsLeft =
      width -
      14 -
      UiTheme.iconBtn * 2 -
      UiTheme.controlGap -
      UiTheme.iconBtn / 2 -
      10;
    const scoreRight = this.scoreRoot.x + this.scorePillW / 2;
    const mid = (scoreRight + controlsLeft) / 2;
    this.heartsRoot.setPosition(
      Math.max(scoreRight + 36, mid),
      this.timeRoot.y,
    );
  }

  // ─── Idle motions ─────────────────────────────────────────────────────

  private startIdleMotions(): void {
    // Timer: soft breathing
    this.scene.tweens.add({
      targets: this.timeRoot,
      scale: 1.03,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Coin: gentle rock
    this.scene.tweens.add({
      targets: this.scoreIcon,
      angle: { from: -8, to: 8 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Score pill micro float
    this.scene.tweens.add({
      targets: this.scoreRoot,
      y: this.scoreRoot.y - 1.5,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private tickHeartBob(): void {
    this.heartBobMs += 16;
    this.heartSlots.forEach((slot, i) => {
      // Idle bob only for live hearts.
      if (slot.img.texture.key !== TextureKey.UiHeartFull) {
        slot.root.y = 0;
        return;
      }
      // Never setScale on the image after setDisplaySize — that resets
      // scale to ~1 and shows the full texture (hundreds of px).
      const phase = this.heartBobMs / 420 + i * 0.9;
      slot.root.y = Math.sin(phase) * 2.2;
      const beat = 1 + Math.sin(phase * 2) * 0.045;
      if (!slot.root.getData('animating')) {
        slot.root.setScale(beat);
      }
    });
  }

  // ─── Refresh ──────────────────────────────────────────────────────────

  private refresh = (): void => {
    this.syncScore(false);
    this.syncHearts(false);
    this.refreshCombo();
    this.refreshBonuses();
    this.refreshDebuffs();
  };

  private onScoreChanged = (): void => {
    this.syncScore(true);
  };

  private onStrikeChanged = (): void => {
    this.syncHearts(true);
  };

  private syncScore(animate: boolean): void {
    const score = this.state.score;
    const formatted = localeStore.formatNumber(score);
    const prev = this.lastScore;
    this.lastScore = score;

    this.layoutScorePill(formatted);
    this.placeScoreBesideTime();
    this.layoutHearts(this.scene.scale.width);

    if (!animate || prev < 0 || score === prev) {
      return;
    }

    // Score bump: glow, coin flip, springy text
    this.paintScorePill(this.scorePillW, HUDManager.pillH, true);
    this.scene.tweens.killTweensOf(this.scoreRoot);
    this.scene.tweens.killTweensOf(this.scoreText);
    this.scoreRoot.setY(this.timeRoot.y).setScale(1);

    this.scene.tweens.add({
      targets: this.scoreRoot,
      scale: 1.12,
      duration: 120,
      yoyo: true,
      ease: 'Back.Out',
      onComplete: () => {
        this.paintScorePill(this.scorePillW, HUDManager.pillH, false);
        this.scoreRoot.setY(this.timeRoot.y);
        this.scene.tweens.add({
          targets: this.scoreRoot,
          y: this.timeRoot.y - 1.5,
          duration: 1600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      },
    });

    this.scene.tweens.add({
      targets: this.scoreIcon,
      angle: this.scoreIcon.angle + 360,
      duration: 420,
      ease: 'Cubic.Out',
    });

    this.scoreText.setScale(1.25);
    this.scene.tweens.add({
      targets: this.scoreText,
      scale: 1,
      duration: 220,
      ease: 'Back.Out',
    });
  }

  private syncHearts(animate: boolean): void {
    const remaining = Math.max(
      0,
      HUDManager.maxStrikes - this.state.strike,
    );
    const prevRemaining =
      this.lastStrike < 0
        ? remaining
        : Math.max(0, HUDManager.maxStrikes - this.lastStrike);
    this.lastStrike = this.state.strike;

    this.heartSlots.forEach((slot, index) => {
      const alive = index < remaining;
      const wasAlive = index < prevRemaining;
      slot.img.setTexture(
        alive ? TextureKey.UiHeartFull : TextureKey.UiHeartEmpty,
      );
      slot.img.setDisplaySize(UiTheme.heart, UiTheme.heart);
      this.paintHeartHalo(slot.halo, alive);
      slot.img.setAlpha(alive ? 1 : 0.72);

      if (!animate) {
        return;
      }

      if (wasAlive && !alive) {
        // Lost: shatter pulse
        this.scene.tweens.killTweensOf(slot.root);
        this.scene.tweens.killTweensOf(slot.img);
        slot.root.setData('animating', true);
        slot.root.setScale(1);
        this.scene.tweens.add({
          targets: slot.root,
          scale: 1.35,
          angle: Phaser.Math.Between(-18, 18),
          duration: 90,
          yoyo: true,
          ease: 'Quad.Out',
          onComplete: () => {
            slot.root.setAngle(0).setScale(1);
            slot.root.setData('animating', false);
          },
        });
        this.scene.tweens.add({
          targets: slot.img,
          alpha: 0.35,
          duration: 160,
          yoyo: true,
          onComplete: () => {
            slot.img.setAlpha(0.72);
          },
        });
      } else if (!wasAlive && alive) {
        // Restored: pop in
        slot.root.setData('animating', true);
        slot.root.setScale(0.2);
        this.scene.tweens.add({
          targets: slot.root,
          scale: 1,
          duration: 320,
          ease: 'Back.Out',
          onComplete: () => {
            slot.root.setData('animating', false);
          },
        });
      }
    });
  }

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
      this.comboGlow.clear();
      return;
    }

    this.comboText
      .setText(t('hud.combo', { count: combo }))
      .setColor(style.color)
      .setStroke(style.stroke, 5)
      .setFontSize(style.fontSize);

    this.comboMultText
      .setText(t('hud.comboMult', { mult: this.formatMult(totalMult) }))
      .setColor(style.multColor)
      .setFontSize(style.multSize);

    this.paintComboGlow(style.glow);
    this.comboRoot.setVisible(true);

    const grew = combo > this.lastCombo;
    this.lastCombo = combo;

    if (!grew) {
      this.comboRoot.setAlpha(alpha);
      return;
    }

    this.scene.tweens.killTweensOf(this.comboRoot);
    this.comboRoot
      .setPosition(this.comboAnchorX, this.comboAnchorY)
      .setAlpha(alpha)
      .setScale(style.scale * 0.78)
      .setAngle(-4);

    this.scene.tweens.add({
      targets: this.comboRoot,
      scale: style.scale * 1.14,
      angle: 0,
      duration: 150,
      ease: 'Back.Out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.comboRoot,
          scale: style.scale,
          duration: 140,
          ease: 'Sine.InOut',
        });
      },
    });
  }

  private paintComboGlow(radius: number): void {
    const g = this.comboGlow;
    g.clear();
    g.fillStyle(0xff6b9d, 0.18);
    g.fillCircle(-28, 0, radius);
    g.fillStyle(0xffd60a, 0.12);
    g.fillCircle(-12, 8, radius * 0.55);
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
      target.setAlpha(0).setY(y + 14).setScale(0.88);
      this.scene.tweens.add({
        targets: target,
        alpha,
        y,
        scale: 1,
        duration: 280,
        ease: 'Back.Out',
      });
    } else {
      target.setAlpha(alpha).setY(y).setScale(1);
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
        glow: 42,
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
        glow: 36,
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
        glow: 32,
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
        glow: 28,
      };
    }
    return {
      color: '#c1121f',
      stroke: '#fff8f0',
      multColor: '#d4a017',
      fontSize: 17,
      multSize: 14,
      scale: 1,
      glow: 24,
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
    this.stageText.setAlpha(0.12).setScale(0.9).setX(8);
    this.scene.tweens.add({
      targets: this.stageText,
      alpha: 0.28,
      scale: 1,
      x: 16,
      duration: 520,
      ease: 'Cubic.Out',
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

    // Per-second tick: soft flash on the clock face
    if (totalSeconds !== this.lastTimeSec && this.lastTimeSec >= 0) {
      this.scene.tweens.killTweensOf(this.timeText);
      this.timeText.setScale(1.12);
      this.scene.tweens.add({
        targets: this.timeText,
        scale: 1,
        duration: 180,
        ease: 'Back.Out',
      });
      // Swipe the clock hand feel by recoloring briefly
      this.timeText.setColor('#c48070');
      this.scene.time.delayedCall(120, () => {
        this.timeText.setColor(UiTheme.ink);
      });
    }
    this.lastTimeSec = totalSeconds;
  };

  private onBonus = (): void => {
    this.refresh();
  };
}

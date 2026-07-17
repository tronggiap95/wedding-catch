import { Events } from '../constants/Events';
import type { ConfigStore } from '../config/ConfigStore';
import { EventBus } from '../events/EventBus';
import type { GameState } from '../state/GameState';
import type { BonusDefinition, ItemDefinition } from '../types/config';
import { isBonusDefinition } from '../types/config';

/**
 * Score = item × comboTier × doubleScore.
 * Bad resets combo (+1 strike), unless invincible (combo & strike preserved).
 */
export class ScoreManager {
  private readonly state: GameState;
  private readonly config: ConfigStore;

  public constructor(state: GameState, config: ConfigStore) {
    this.state = state;
    this.config = config;
  }

  public update(deltaMs: number): void {
    if (this.state.magnetRemainingMs > 0) {
      this.state.magnetRemainingMs = Math.max(
        0,
        this.state.magnetRemainingMs - deltaMs,
      );
    }

    if (this.state.repelRemainingMs > 0) {
      this.state.repelRemainingMs = Math.max(
        0,
        this.state.repelRemainingMs - deltaMs,
      );
    }

    if (this.state.doubleScoreRemainingMs > 0) {
      this.state.doubleScoreRemainingMs = Math.max(
        0,
        this.state.doubleScoreRemainingMs - deltaMs,
      );
      this.state.scoreMultiplier =
        this.state.doubleScoreRemainingMs > 0 ? 2 : 1;
    } else {
      this.state.scoreMultiplier = 1;
    }

    if (this.state.invincibleRemainingMs > 0) {
      this.state.invincibleRemainingMs = Math.max(
        0,
        this.state.invincibleRemainingMs - deltaMs,
      );
    }
  }

  public collectGood(item: ItemDefinition): number {
    const comboMultiplier = this.getComboMultiplier(this.state.combo);
    const delta = Math.round(
      item.score * comboMultiplier * this.state.scoreMultiplier,
    );

    this.state.score += delta;
    this.state.weddingFund = Math.round(
      this.state.score * this.config.runtime.weddingFundPerScore,
    );
    this.state.combo += 1;
    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);

    EventBus.emit(Events.ScoreChanged, {
      score: this.state.score,
      weddingFund: this.state.weddingFund,
    });
    EventBus.emit(Events.ComboChanged, { combo: this.state.combo });
    EventBus.emit(Events.ItemCollected, {
      id: item.id,
      category: 'good',
      scoreDelta: delta,
    });

    return delta;
  }

  public collectBad(item: ItemDefinition): void {
    EventBus.emit(Events.ItemCollected, {
      id: item.id,
      category: 'bad',
      scoreDelta: 0,
    });

    // Special bad (e.g. bad magnet): no strike / combo reset; apply effect.
    if (item.special === true) {
      this.applySpecialBad(item);
      return;
    }

    // Invincible: no strike and combo is preserved.
    if (this.state.invincibleRemainingMs > 0) {
      return;
    }

    this.state.combo = 0;
    EventBus.emit(Events.ComboChanged, { combo: 0 });

    this.state.strike += 1;
    EventBus.emit(Events.StrikeChanged, { strike: this.state.strike });

    if (this.state.strike >= this.config.runtime.maxStrikes) {
      this.endGame('strike');
    }
  }

  private applySpecialBad(item: ItemDefinition): void {
    const durationMs = item.effectDurationMs ?? 10_000;
    switch (item.badEffect) {
      case 'repel':
        // Inverse of good magnet — cancel pull while pushing goods away.
        this.state.magnetRemainingMs = 0;
        this.state.repelRemainingMs = durationMs;
        EventBus.emit(Events.BonusActivated, {
          effect: 'repel',
          id: item.id,
          durationMs,
        });
        break;
      default:
        break;
    }
  }

  public collectBonus(bonus: BonusDefinition): void {
    this.state.combo += 1;
    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);

    switch (bonus.effect) {
      case 'magnet':
        this.state.repelRemainingMs = 0;
        this.state.magnetRemainingMs = bonus.durationMs;
        break;
      case 'double_score':
        this.state.doubleScoreRemainingMs = bonus.durationMs;
        this.state.scoreMultiplier = 2;
        break;
      case 'invincible':
        this.state.invincibleRemainingMs = bonus.durationMs;
        break;
      default:
        break;
    }

    EventBus.emit(Events.ComboChanged, { combo: this.state.combo });
    EventBus.emit(Events.BonusActivated, {
      effect: bonus.effect,
      id: bonus.id,
      durationMs: bonus.durationMs,
    });
    EventBus.emit(Events.ItemCollected, {
      id: bonus.id,
      category: 'bonus',
      scoreDelta: 0,
    });
  }

  public missGood(): void {
    this.state.combo = 0;
    EventBus.emit(Events.ComboChanged, { combo: 0 });
  }

  public tickTime(deltaMs: number): void {
    if (!this.state.isPlaying || this.state.isGameOver) {
      return;
    }

    this.state.elapsedMs += deltaMs;
    EventBus.emit(Events.TimeChanged, {
      elapsedMs: this.state.elapsedMs,
    });
  }

  public endGame(reason: 'strike'): void {
    if (this.state.isGameOver) {
      return;
    }

    this.state.isGameOver = true;
    this.state.isPlaying = false;
    this.state.lastGameOverReason = reason;

    EventBus.emit(Events.GameOver, {
      score: this.state.score,
      weddingFund: this.state.weddingFund,
      maxCombo: this.state.maxCombo,
      strike: this.state.strike,
      reason,
    });
  }

  public applyDefinition(def: ItemDefinition | BonusDefinition): void {
    if (isBonusDefinition(def)) {
      this.collectBonus(def);
      return;
    }

    if (def.category === 'good') {
      this.collectGood(def);
      return;
    }

    this.collectBad(def);
  }

  private getComboMultiplier(comboBeforeCatch: number): number {
    const tiers = this.config.items.comboTiers;
    for (const tier of tiers) {
      if (comboBeforeCatch >= tier.minCombo) {
        return tier.multiplier;
      }
    }
    return 1;
  }
}

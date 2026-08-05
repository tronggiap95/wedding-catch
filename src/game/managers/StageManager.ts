import { Events } from '../constants/Events';
import type { ConfigStore } from '../config/ConfigStore';
import { EventBus } from '../events/EventBus';
import { localeStore } from '../i18n';
import type { GameState } from '../state/GameState';
import type { StageDefinition } from '../types/config';

/**
 * Owns the stage timeline. After the last named stage, every durationMs
 * continues to ramp difficulty (endless) so typical runs last ~5 minutes.
 */
export class StageManager {
  private readonly state: GameState;
  private readonly config: ConfigStore;
  private stageElapsedMs = 0;
  private cachedStageId = -1;
  private cachedCurrent: StageDefinition | null = null;

  public constructor(state: GameState, config: ConfigStore) {
    this.state = state;
    this.config = config;
  }

  public get current(): StageDefinition {
    if (
      this.cachedCurrent !== null &&
      this.cachedStageId === this.state.stage
    ) {
      return this.cachedCurrent;
    }

    const stages = this.config.stages.stages;
    const namedCount = stages.length;
    let stage: StageDefinition;

    if (this.state.stage <= namedCount) {
      const base = stages[this.state.stage - 1] ?? stages[0]!;
      stage = {
        ...base,
        name: localeStore.stageName(base.id, namedCount),
        description: localeStore.stageDescription(base.id, namedCount),
      };
    } else {
      const base = stages[namedCount - 1]!;
      const ramp = this.state.stage - namedCount;
      const endless = this.config.stages.endless;

      stage = {
        id: this.state.stage,
        name: localeStore.stageName(this.state.stage, namedCount),
        description: localeStore.stageDescription(this.state.stage, namedCount),
        durationMs: base.durationMs,
        spawnInterval: Math.max(
          endless.minSpawnInterval,
          Math.round(
            base.spawnInterval * Math.pow(endless.spawnIntervalMul, ramp),
          ),
        ),
        bonusInterval: Math.max(
          8000,
          Math.round(base.bonusInterval - ramp * 200),
        ),
        goodChance: Math.max(
          endless.minGoodChance,
          base.goodChance - ramp * endless.goodChanceStep,
        ),
        fallSpeed: Math.min(
          endless.maxFallSpeed,
          Math.round(base.fallSpeed * Math.pow(endless.fallSpeedMul, ramp)),
        ),
        maxConcurrent: Math.min(
          endless.maxConcurrent,
          base.maxConcurrent + Math.floor(ramp / 2),
        ),
        background: base.background,
      };
    }

    this.cachedStageId = this.state.stage;
    this.cachedCurrent = stage;
    return stage;
  }

  public start(): void {
    this.stageElapsedMs = 0;
    this.state.stage = 1;
    this.invalidateCache();
    this.emitStage();
  }

  public update(deltaMs: number): void {
    if (!this.state.isPlaying || this.state.isGameOver) {
      return;
    }

    this.stageElapsedMs += deltaMs;
    const stage = this.current;

    if (this.stageElapsedMs >= stage.durationMs) {
      this.stageElapsedMs = 0;
      this.state.stage += 1;
      this.invalidateCache();
      this.emitStage();
    }
  }

  private invalidateCache(): void {
    this.cachedStageId = -1;
    this.cachedCurrent = null;
  }

  private emitStage(): void {
    const stage = this.current;
    EventBus.emit(Events.StageChanged, {
      stage: stage.id,
      name: stage.name,
      description: stage.description,
      background: stage.background,
    });
  }
}

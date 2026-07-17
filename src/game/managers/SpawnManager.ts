import Phaser from 'phaser';
import type { ConfigStore } from '../config/ConfigStore';
import {
  ThrowerCharacters,
} from '../entities/ThrowerCharacters';
import type { GameState } from '../state/GameState';
import type {
  BonusDefinition,
  ItemDefinition,
  ItemRarity,
  StageDefinition,
} from '../types/config';
import { isBonusDefinition } from '../types/config';
import { pickWeighted } from '../utils/weightedRandom';
import type { ItemManager } from './ItemManager';

/**
 * Stage good/bad ratio + rarity-weighted goods + timed bonuses.
 * Spawns are thrown by guest / devil / angel.
 */
export class SpawnManager {
  private spawnCooldown = 0;
  private bonusCooldown = 0;
  private lastWasBad = false;
  private readonly recentXs: number[] = [];
  private readonly scene: Phaser.Scene;
  private readonly state: GameState;
  private readonly config: ConfigStore;
  private readonly items: ItemManager;
  private readonly throwers: ThrowerCharacters;
  private readonly getPlayerX: () => number;

  public constructor(
    scene: Phaser.Scene,
    state: GameState,
    config: ConfigStore,
    items: ItemManager,
    throwers: ThrowerCharacters,
    getPlayerX: () => number,
  ) {
    this.scene = scene;
    this.state = state;
    this.config = config;
    this.items = items;
    this.throwers = throwers;
    this.getPlayerX = getPlayerX;
  }

  public reset(): void {
    this.spawnCooldown = 400;
    this.bonusCooldown = 5000;
    this.lastWasBad = false;
    this.recentXs.length = 0;
  }

  public update(deltaMs: number, stage: StageDefinition): void {
    if (!this.state.isPlaying || this.state.isGameOver) {
      return;
    }

    this.spawnCooldown -= deltaMs;
    this.bonusCooldown -= deltaMs;

    if (
      this.spawnCooldown <= 0 &&
      this.items.activeCount < stage.maxConcurrent
    ) {
      this.spawnMain(stage);
      this.spawnCooldown = stage.spawnInterval;
    }

    if (
      this.bonusCooldown <= 0 &&
      this.items.activeCount < stage.maxConcurrent
    ) {
      this.spawnBonus(stage);
      this.bonusCooldown = stage.bonusInterval;
    }
  }

  private spawnMain(stage: StageDefinition): void {
    const rollGood = Math.random() < stage.goodChance;
    if (!rollGood && this.lastWasBad) {
      const good = this.pickGood();
      if (good !== undefined) {
        this.throwSpawn(good, stage.fallSpeed);
        this.lastWasBad = false;
        return;
      }
    }

    if (rollGood) {
      const good = this.pickGood();
      if (good !== undefined) {
        this.throwSpawn(good, stage.fallSpeed);
        this.lastWasBad = false;
      }
      return;
    }

    const bad = this.pickBad(stage.id);
    if (bad !== undefined) {
      const speedMul = bad.fallSpeedMul ?? 1;
      this.throwSpawn(bad, stage.fallSpeed * speedMul);
      this.lastWasBad = true;
    }
  }

  private spawnBonus(stage: StageDefinition): void {
    const pool = this.config.bonuses.bonuses.filter(
      (b) => b.minStage <= stage.id,
    );
    const bonus = pickWeighted(pool);
    if (bonus !== undefined) {
      this.throwSpawn(bonus, stage.fallSpeed * 0.9);
    }
  }

  private pickGood(): ItemDefinition | undefined {
    const rarity = this.pickRarity();
    const pool = this.config.items.items.filter(
      (item) => item.category === 'good' && item.rarity === rarity,
    );
    if (pool.length === 0) {
      const fallback = this.config.items.items.filter(
        (item) => item.category === 'good',
      );
      return pickWeighted(fallback);
    }
    return pickWeighted(pool);
  }

  private pickBad(stageId: number): ItemDefinition | undefined {
    const pool = this.config.items.items.filter(
      (item) => item.category === 'bad' && item.minStage <= stageId,
    );
    return pickWeighted(pool);
  }

  private pickRarity(): ItemRarity {
    const weights = this.config.items.rarityWeights;
    const entries = Object.entries(weights) as Array<[ItemRarity, number]>;
    const picked = pickWeighted(
      entries.map(([rarity, spawnWeight]) => ({ rarity, spawnWeight })),
    );
    return picked?.rarity ?? 'common';
  }

  private throwSpawn(
    definition: ItemDefinition | BonusDefinition,
    fallSpeed: number,
  ): void {
    const laneX = this.pickLaneX();
    const category = isBonusDefinition(definition)
      ? 'bonus'
      : definition.category;
    const role = ThrowerCharacters.roleForCategory(category);

    this.throwers.throwAt(role, laneX, (releaseX, releaseY) => {
      this.items.spawn(definition, releaseX, releaseY, fallSpeed, laneX);
    });
  }

  private pickLaneX(): number {
    const { width } = this.scene.scale;
    const margin = this.config.runtime.itemSize;
    let x = Phaser.Math.Between(margin, Math.floor(width - margin));
    const playerX = this.getPlayerX();

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const tooClosePlayer = Math.abs(x - playerX) < margin * 0.8;
      const tooCloseRecent = this.recentXs.some(
        (rx) => Math.abs(x - rx) < margin,
      );
      if (!tooClosePlayer && !tooCloseRecent) {
        break;
      }
      x = Phaser.Math.Between(margin, Math.floor(width - margin));
    }

    this.recentXs.push(x);
    if (this.recentXs.length > 5) {
      this.recentXs.shift();
    }

    return x;
  }
}

import Phaser from 'phaser';
import type { ConfigStore } from '../config/ConfigStore';
import { Events } from '../constants/Events';
import type { FallingItem } from '../entities/FallingItem';
import type { Player } from '../entities/Player';
import { EventBus } from '../events/EventBus';
import type { GameState } from '../state/GameState';
import type { ItemManager } from './ItemManager';
import type { ScoreManager } from './ScoreManager';

/**
 * Collision before out-of-screen; each item resolves once (GDD §2.12).
 */
export class CollisionManager {
  private readonly scene: Phaser.Scene;
  private readonly state: GameState;
  private readonly config: ConfigStore;
  private readonly items: ItemManager;
  private readonly score: ScoreManager;
  private readonly player: Player;

  public constructor(
    scene: Phaser.Scene,
    state: GameState,
    config: ConfigStore,
    items: ItemManager,
    score: ScoreManager,
    player: Player,
  ) {
    this.scene = scene;
    this.state = state;
    this.config = config;
    this.items = items;
    this.score = score;
    this.player = player;
  }

  public update(): void {
    if (!this.state.isPlaying || this.state.isGameOver) {
      return;
    }

    const shrink = this.config.runtime.hitboxShrink;
    const playerBounds = new Phaser.Geom.Rectangle(
      this.player.x - this.player.hitWidth / 2,
      this.player.y - this.player.hitHeight / 2,
      this.player.hitWidth,
      this.player.hitHeight,
    );

    const screenBottom =
      this.scene.scale.height + this.config.runtime.itemSize;

    const ordered = [...this.items.activeItems].sort(
      (a, b) =>
        Math.abs(a.y - this.player.y) - Math.abs(b.y - this.player.y),
    );

    for (const item of ordered) {
      if (!item.active || item.resolved || item.definition === null) {
        continue;
      }

      const hit = item.getHitBounds(shrink);
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, hit)) {
        this.resolveCollect(item);
        continue;
      }

      if (item.y > screenBottom) {
        this.resolveMiss(item);
      }
    }
  }

  private resolveCollect(item: FallingItem): void {
    if (item.definition === null || item.resolved) {
      return;
    }

    item.resolved = true;
    this.score.applyDefinition(item.definition);
    this.items.release(item);
  }

  private resolveMiss(item: FallingItem): void {
    if (item.definition === null || item.resolved) {
      return;
    }

    const category = item.category;
    const id = item.id;
    item.resolved = true;

    if (category === 'good') {
      this.score.missGood();
    }

    EventBus.emit(Events.ItemMissed, { id, category });
    this.items.release(item);
  }
}

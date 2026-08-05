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
  private readonly playerBounds = new Phaser.Geom.Rectangle(0, 0, 0, 0);
  private readonly itemBounds = new Phaser.Geom.Rectangle(0, 0, 0, 0);

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
    const halfW = this.player.hitWidth / 2;
    const halfH = this.player.hitHeight / 2;
    this.playerBounds.setTo(
      this.player.x - halfW,
      this.player.y - halfH,
      this.player.hitWidth,
      this.player.hitHeight,
    );

    const screenBottom =
      this.scene.scale.height + this.config.runtime.itemSize;
    // Skip items still far above the basket (broad-phase).
    const earlyY = this.player.y - this.player.hitHeight * 2;

    for (const item of this.items.activeItems) {
      if (!item.active || item.resolved || item.definition === null) {
        continue;
      }

      if (item.y < earlyY) {
        continue;
      }

      item.writeHitBounds(shrink, this.itemBounds);
      if (Phaser.Geom.Rectangle.Overlaps(this.playerBounds, this.itemBounds)) {
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

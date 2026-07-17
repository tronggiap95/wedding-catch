import type { FallingItem } from '../entities/FallingItem';
import { ObjectPool } from '../utils/ObjectPool';
import type { SpawnableDefinition } from '../types/config';
import type Phaser from 'phaser';

/**
 * Owns the falling-item pool and movement (GDD §2.6 / §2.21).
 */
export class ItemManager {
  private readonly pool: ObjectPool<FallingItem>;
  private readonly active: FallingItem[] = [];
  private readonly createItem: () => FallingItem;

  public constructor(_scene: Phaser.Scene, createItem: () => FallingItem) {
    this.createItem = createItem;
    this.pool = new ObjectPool<FallingItem>(
      () => this.createItem(),
      (item) => {
        item.sleep();
      },
      24,
    );
  }

  public get activeItems(): readonly FallingItem[] {
    return this.active;
  }

  public get activeCount(): number {
    return this.active.length;
  }

  public spawn(
    definition: SpawnableDefinition,
    x: number,
    y: number,
    fallSpeed: number,
    laneX?: number,
  ): FallingItem {
    const item = this.pool.acquire();
    item.spawn(definition, x, y, fallSpeed, laneX);
    this.active.push(item);
    return item;
  }

  /**
   * @param field - good magnet pull and/or bad-magnet repel around the player.
   */
  public update(
    deltaMs: number,
    field: {
      x: number;
      y: number;
      radius: number;
      magnetStrength: number;
      repelStrength: number;
    } | null,
  ): void {
    for (const item of this.active) {
      if (!item.active) {
        continue;
      }

      if (field !== null && item.category === 'good') {
        const dx = field.x - item.x;
        const dy = field.y - item.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist <= field.radius) {
          const falloff = 1 - dist / field.radius;
          if (field.magnetStrength > 0) {
            const strength =
              field.magnetStrength * (0.45 + falloff * 0.9);
            item.attractToward(field.x, field.y, strength, deltaMs);
          } else if (field.repelStrength > 0) {
            const strength =
              field.repelStrength * (0.55 + falloff * 0.85);
            item.repelFrom(field.x, field.y, strength, deltaMs);
          }
        }
      }

      item.update(deltaMs);
    }
  }

  public release(item: FallingItem): void {
    const index = this.active.indexOf(item);
    if (index >= 0) {
      this.active.splice(index, 1);
    }
    this.pool.release(item);
  }

  public clear(): void {
    while (this.active.length > 0) {
      const item = this.active.pop();
      if (item !== undefined) {
        this.pool.release(item);
      }
    }
  }
}

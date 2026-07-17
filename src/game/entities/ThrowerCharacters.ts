import Phaser from 'phaser';
import { Depth } from '../constants/Depth';
import { TextureKey } from '../constants/TextureKey';
import type { ItemCategory } from '../types/config';

export type ThrowerRole = 'devil' | 'guest' | 'angel';

interface ThrowerActor {
  readonly role: ThrowerRole;
  readonly idleKey: string;
  readonly throwKey: string;
  readonly sprite: Phaser.GameObjects.Image;
  bobMs: number;
  busy: boolean;
}

/**
 * Top throwers: devil (bad), guest (good), angel (bonus).
 */
export class ThrowerCharacters {
  private readonly scene: Phaser.Scene;
  private readonly actors: Record<ThrowerRole, ThrowerActor>;
  private readonly size = 78;
  private readonly rootY: number;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width } = scene.scale;
    this.rootY = 108;

    this.actors = {
      devil: this.makeActor(
        'devil',
        TextureKey.CharDevilIdle,
        TextureKey.CharDevilThrow,
        44,
      ),
      guest: this.makeActor(
        'guest',
        TextureKey.CharGuestIdle,
        TextureKey.CharGuestThrow,
        width / 2,
      ),
      angel: this.makeActor(
        'angel',
        TextureKey.CharAngelIdle,
        TextureKey.CharAngelThrow,
        width - 44,
      ),
    };
  }

  public static roleForCategory(category: ItemCategory): ThrowerRole {
    if (category === 'bad') {
      return 'devil';
    }
    if (category === 'bonus') {
      return 'angel';
    }
    return 'guest';
  }

  public getReleasePoint(role: ThrowerRole): { x: number; y: number } {
    const actor = this.actors[role];
    return {
      x: actor.sprite.x,
      y: actor.sprite.y + this.size * 0.28,
    };
  }

  public throwAt(
    role: ThrowerRole,
    targetX: number,
    onRelease: (releaseX: number, releaseY: number) => void,
  ): void {
    const actor = this.actors[role];
    const lean = Phaser.Math.Clamp((targetX - actor.sprite.x) * 0.04, -12, 12);

    if (actor.busy) {
      const release = this.getReleasePoint(role);
      onRelease(release.x, release.y);
      this.playThrowVisual(actor, lean, null);
      return;
    }

    this.playThrowVisual(actor, lean, onRelease);
  }

  public update(deltaMs: number): void {
    (Object.keys(this.actors) as ThrowerRole[]).forEach((role) => {
      const actor = this.actors[role];
      if (actor.busy) {
        return;
      }
      actor.bobMs += deltaMs;
      actor.sprite.y =
        this.rootY + Math.sin(actor.bobMs / 420 + role.length) * 2.2;
    });
  }

  public destroy(): void {
    (Object.keys(this.actors) as ThrowerRole[]).forEach((role) => {
      this.scene.tweens.killTweensOf(this.actors[role].sprite);
      this.actors[role].sprite.destroy();
    });
  }

  private applyDisplaySize(
    sprite: Phaser.GameObjects.Image,
    size: number,
  ): void {
    // setDisplaySize adjusts scale — never call setScale(1) after it
    // or the sprite snaps back to native texture size (512px).
    sprite.setDisplaySize(size, size);
  }

  private showIdle(actor: ThrowerActor): void {
    actor.sprite
      .setTexture(actor.idleKey)
      .setAngle(0)
      .setY(this.rootY);
    this.applyDisplaySize(actor.sprite, this.size);
  }

  private playThrowVisual(
    actor: ThrowerActor,
    lean: number,
    onRelease: ((releaseX: number, releaseY: number) => void) | null,
  ): void {
    actor.busy = true;
    this.scene.tweens.killTweensOf(actor.sprite);

    const sprite = actor.sprite;
    this.showIdle(actor);

    this.scene.tweens.add({
      targets: sprite,
      angle: -lean * 0.45,
      y: this.rootY + 2,
      duration: 90,
      ease: 'Sine.Out',
      onComplete: () => {
        sprite.setTexture(actor.throwKey);
        // Throw pose only slightly larger than idle.
        this.applyDisplaySize(sprite, this.size * 1.06);

        this.scene.tweens.add({
          targets: sprite,
          angle: lean,
          y: this.rootY - 6,
          duration: 150,
          ease: 'Sine.Out',
          onComplete: () => {
            if (onRelease !== null) {
              const release = this.getReleasePoint(actor.role);
              onRelease(release.x, release.y);
            }

            this.scene.tweens.add({
              targets: sprite,
              angle: 0,
              y: this.rootY,
              duration: 200,
              ease: 'Sine.InOut',
              onComplete: () => {
                this.showIdle(actor);
                actor.busy = false;
              },
            });
          },
        });
      },
    });
  }

  private makeActor(
    role: ThrowerRole,
    idleKey: string,
    throwKey: string,
    x: number,
  ): ThrowerActor {
    const sprite = this.scene.add
      .image(x, this.rootY, idleKey)
      .setDepth(Depth.CharactersTop)
      .setOrigin(0.5);

    this.applyDisplaySize(sprite, this.size);

    return {
      role,
      idleKey,
      throwKey,
      sprite,
      bobMs: Math.random() * 1000,
      busy: false,
    };
  }
}

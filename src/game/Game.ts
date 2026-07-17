import Phaser from 'phaser';
import { createGameConfig } from './config/GameConfig';
import { EventBus } from './events/EventBus';

/**
 * Owns the Phaser.Game lifecycle. React (or any host) constructs this
 * with a parent element and must call {@link Game.destroy} on teardown.
 */
export class Game {
  private readonly phaser: Phaser.Game;

  public constructor(parent: HTMLElement) {
    this.phaser = new Phaser.Game(createGameConfig(parent));
  }

  public get instance(): Phaser.Game {
    return this.phaser;
  }

  public destroy(): void {
    EventBus.removeAllListeners();
    this.phaser.destroy(true);
  }
}

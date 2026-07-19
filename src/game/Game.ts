import Phaser from 'phaser';
import { createGameConfig } from './config/GameConfig';
import { EventBus } from './events/EventBus';

/**
 * Owns the Phaser.Game lifecycle. React (or any host) constructs this
 * with a parent element and must call {@link Game.destroy} on teardown.
 */
export class Game {
  private readonly phaser: Phaser.Game;
  private readonly onViewportChange: () => void;

  public constructor(parent: HTMLElement) {
    this.phaser = new Phaser.Game(createGameConfig(parent));

    // iOS Safari URL-bar / rotation: keep canvas matched to the visible viewport.
    this.onViewportChange = () => {
      this.phaser.scale.refresh();
    };
    window.visualViewport?.addEventListener('resize', this.onViewportChange);
    window.visualViewport?.addEventListener('scroll', this.onViewportChange);
    window.addEventListener('orientationchange', this.onViewportChange);
  }

  public get instance(): Phaser.Game {
    return this.phaser;
  }

  public destroy(): void {
    window.visualViewport?.removeEventListener('resize', this.onViewportChange);
    window.visualViewport?.removeEventListener('scroll', this.onViewportChange);
    window.removeEventListener('orientationchange', this.onViewportChange);
    EventBus.removeAllListeners();
    this.phaser.destroy(true);
  }
}

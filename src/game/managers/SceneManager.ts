import type Phaser from 'phaser';
import { SceneKey } from '../types/SceneKey';

/**
 * Thin facade over Phaser's ScenePlugin for typed transitions.
 */
export class SceneManager {
  private readonly scenes: Phaser.Scenes.ScenePlugin;

  public constructor(scenes: Phaser.Scenes.ScenePlugin) {
    this.scenes = scenes;
  }

  public start(key: SceneKey): void {
    this.scenes.start(key);
  }

  public launch(key: SceneKey): void {
    this.scenes.launch(key);
  }

  public stop(key: SceneKey): void {
    this.scenes.stop(key);
  }

  public switch(from: SceneKey, to: SceneKey): void {
    this.scenes.stop(from);
    this.scenes.start(to);
  }

  public isActive(key: SceneKey): boolean {
    return this.scenes.isActive(key);
  }
}

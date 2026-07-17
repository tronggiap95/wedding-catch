import Phaser from 'phaser';
import { Colors } from '../constants/Colors';
import { RegistryKey } from '../constants/RegistryKey';
import type { ResponsiveManager } from '../managers/ResponsiveManager';
import { SceneKey } from '../types/SceneKey';

/**
 * Menu shell. Layout hooks into ResponsiveManager; no gameplay.
 */
export class MenuScene extends Phaser.Scene {
  private title: Phaser.GameObjects.Text | null = null;
  private unsubscribe: (() => void) | null = null;

  public constructor() {
    super({ key: SceneKey.Menu });
  }

  public create(): void {
    const responsive = this.registry.get(
      RegistryKey.ResponsiveManager,
    ) as ResponsiveManager;

    this.title = this.add
      .text(0, 0, 'Wedding Catch', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '36px',
        color: `#${Colors.Ink.toString(16).padStart(6, '0')}`,
      })
      .setOrigin(0.5);

    this.unsubscribe = responsive.subscribe(({ width, height }) => {
      this.title?.setPosition(width / 2, height / 2);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.title = null;
    });
  }
}

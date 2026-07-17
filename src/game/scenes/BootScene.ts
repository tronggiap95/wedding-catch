import Phaser from 'phaser';
import { getRuntimeConfig } from '../config/runtime';
import { RegistryKey } from '../constants/RegistryKey';
import { AssetManager } from '../managers/AssetManager';
import { AudioManager } from '../managers/AudioManager';
import { ResponsiveManager } from '../managers/ResponsiveManager';
import { SceneManager } from '../managers/SceneManager';
import { SceneKey } from '../types/SceneKey';

/**
 * Boots managers, queues assets, then enters the menu.
 * No gameplay.
 */
export class BootScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKey.Boot });
  }

  public init(): void {
    const assets = new AssetManager(this.load);
    assets.setBaseUrl(getRuntimeConfig().assetBaseUrl);
    this.registry.set(RegistryKey.AssetManager, assets);
  }

  public preload(): void {
    const assets = this.registry.get(RegistryKey.AssetManager) as AssetManager;
    assets.queueBootAssets();
  }

  public create(): void {
    const sceneManager = new SceneManager(this.scene);
    const audioManager = new AudioManager(this.sound);
    const responsiveManager = new ResponsiveManager(this.scale);

    responsiveManager.attach();

    this.registry.set(RegistryKey.SceneManager, sceneManager);
    this.registry.set(RegistryKey.AudioManager, audioManager);
    this.registry.set(RegistryKey.ResponsiveManager, responsiveManager);

    sceneManager.start(SceneKey.Menu);
  }
}

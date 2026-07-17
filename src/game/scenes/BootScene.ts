import Phaser from 'phaser';
import { ConfigStore } from '../config/ConfigStore';
import { RegistryKey } from '../constants/RegistryKey';
import { localeStore } from '../i18n';
import { AudioBridge } from '../managers/AudioBridge';
import { AudioManager } from '../managers/AudioManager';
import { AssetManager } from '../managers/AssetManager';
import { ResponsiveManager } from '../managers/ResponsiveManager';
import { SceneManager } from '../managers/SceneManager';
import { GameState } from '../state/GameState';
import { SceneKey } from '../types/SceneKey';

/**
 * Loads configs, wires shared managers, then enters Menu.
 */
export class BootScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKey.Boot });
  }

  public init(): void {
    const assets = new AssetManager(this.load);
    this.registry.set(RegistryKey.AssetManager, assets);
  }

  public preload(): void {
    const assets = this.registry.get(RegistryKey.AssetManager) as AssetManager;
    assets.queueBootAssets();
  }

  public create(): void {
    const configStore = ConfigStore.fromCache(this.cache);
    const gameState = new GameState();

    this.registry.set(RegistryKey.ConfigStore, configStore);
    this.registry.set(RegistryKey.GameState, gameState);
    this.registry.set(RegistryKey.LocaleStore, localeStore);

    const sceneManager = new SceneManager(this.scene);
    const audioManager = new AudioManager(this.sound);
    audioManager.hydrateFromCache(this.cache);
    const audioBridge = new AudioBridge(audioManager);
    const responsiveManager = new ResponsiveManager(this.scale);
    responsiveManager.attach();

    this.registry.set(RegistryKey.SceneManager, sceneManager);
    this.registry.set(RegistryKey.AudioManager, audioManager);
    this.registry.set(RegistryKey.ResponsiveManager, responsiveManager);
    this.registry.set('bridge:audio', audioBridge);

    sceneManager.start(SceneKey.Menu);
  }
}

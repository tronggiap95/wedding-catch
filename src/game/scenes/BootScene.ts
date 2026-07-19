import Phaser from 'phaser';
import { ConfigStore } from '../config/ConfigStore';
import { Colors } from '../constants/Colors';
import { RegistryKey } from '../constants/RegistryKey';
import { localeStore, t } from '../i18n';
import { AudioBridge } from '../managers/AudioBridge';
import { AudioManager } from '../managers/AudioManager';
import { AssetManager } from '../managers/AssetManager';
import { ResponsiveManager } from '../managers/ResponsiveManager';
import { SceneManager } from '../managers/SceneManager';
import { GameState } from '../state/GameState';
import { SceneKey } from '../types/SceneKey';
import { UiTheme } from '../ui/UiTheme';
import { setLoadingProgress } from '../ui/LoadingOverlay';

/**
 * Loads configs, wires shared managers, then enters Menu.
 * Shows an in-canvas progress UI while assets download (DOM splash is also updated).
 */
export class BootScene extends Phaser.Scene {
  private barTrack: Phaser.GameObjects.Rectangle | null = null;
  private barFill: Phaser.GameObjects.Rectangle | null = null;
  private percentText: Phaser.GameObjects.Text | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private loadProgress = 0;

  public constructor() {
    super({ key: SceneKey.Boot });
  }

  public init(): void {
    const assets = new AssetManager(this.load);
    this.registry.set(RegistryKey.AssetManager, assets);
  }

  public preload(): void {
    this.buildLoadingUi();

    setLoadingProgress(0.02, t('loading.assets'));

    this.load.on('progress', this.onLoadProgress, this);
    this.load.on('complete', this.onLoadComplete, this);

    const assets = this.registry.get(RegistryKey.AssetManager) as AssetManager;
    assets.queueBootAssets();
  }

  public create(): void {
    this.load.off('progress', this.onLoadProgress, this);
    this.load.off('complete', this.onLoadComplete, this);

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

    setLoadingProgress(1, t('loading.ready'));
    this.scale.off('resize', this.layoutLoadingUi, this);
    sceneManager.start(SceneKey.Menu);
  }

  private buildLoadingUi(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, Colors.Background);

    this.add
      .text(width / 2, height * 0.32, t('menu.title'), {
        fontFamily: UiTheme.font,
        fontSize: '36px',
        color: UiTheme.ink,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.39, t('menu.coupleNames'), {
        fontFamily: UiTheme.font,
        fontSize: '16px',
        color: UiTheme.rose,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const barW = Math.min(280, width * 0.72);
    const barH = 14;
    const barY = height * 0.58;

    this.barTrack = this.add
      .rectangle(width / 2, barY, barW, barH, 0xe8d0c0)
      .setOrigin(0.5);

    this.barFill = this.add
      .rectangle(width / 2 - barW / 2, barY, 0, barH - 4, Colors.Accent)
      .setOrigin(0, 0.5);

    this.percentText = this.add
      .text(width / 2, barY + 28, '0%', {
        fontFamily: UiTheme.font,
        fontSize: '18px',
        color: UiTheme.ink,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width / 2, barY + 54, t('loading.assets'), {
        fontFamily: UiTheme.font,
        fontSize: '14px',
        color: UiTheme.inkSoft,
      })
      .setOrigin(0.5);

    this.scale.on('resize', this.layoutLoadingUi, this);
  }

  private layoutLoadingUi = (gameSize: Phaser.Structs.Size): void => {
    const { width, height } = gameSize;
    const barW = Math.min(280, width * 0.72);
    const barY = height * 0.58;
    const fillW = Math.max(4, barW * this.loadProgress);

    this.barTrack?.setPosition(width / 2, barY).setSize(barW, 14);
    this.barFill
      ?.setPosition(width / 2 - barW / 2, barY)
      .setSize(fillW, 10);
    this.percentText?.setPosition(width / 2, barY + 28);
    this.statusText?.setPosition(width / 2, barY + 54);
  };

  private onLoadProgress = (value: number): void => {
    this.loadProgress = value;
    const barW = this.barTrack?.width ?? Math.min(280, this.scale.width * 0.72);
    const fillW = Math.max(4, barW * value);

    this.barFill?.setSize(fillW, 10);
    this.percentText?.setText(`${Math.round(value * 100)}%`);
    this.statusText?.setText(t('loading.assets'));
    setLoadingProgress(value, t('loading.assets'));
  };

  private onLoadComplete = (): void => {
    this.percentText?.setText('100%');
    this.statusText?.setText(t('loading.ready'));
    setLoadingProgress(1, t('loading.ready'));
  };
}

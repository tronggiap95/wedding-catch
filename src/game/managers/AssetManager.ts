import type Phaser from 'phaser';

/**
 * Queues game assets onto Phaser's loader.
 * Fill {@link AssetManager.queueBootAssets} when art/audio are ready.
 */
export class AssetManager {
  private readonly load: Phaser.Loader.LoaderPlugin;

  public constructor(load: Phaser.Loader.LoaderPlugin) {
    this.load = load;
  }

  public setBaseUrl(baseUrl: string): void {
    this.load.setBaseURL(baseUrl);
  }

  public queueBootAssets(): void {
    // public/assets/{images,audio,fonts,atlases}
  }
}

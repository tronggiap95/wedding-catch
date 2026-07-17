import Phaser from 'phaser';
import type { Size } from '../types/geometry';

type ResizeHandler = (size: Size) => void;

/**
 * Tracks scale size for mobile-first layouts.
 * Scenes subscribe instead of reading window metrics ad hoc.
 */
export class ResponsiveManager {
  private readonly scale: Phaser.Scale.ScaleManager;
  private readonly handlers = new Set<ResizeHandler>();

  private readonly onResize = (gameSize: Phaser.Structs.Size): void => {
    const size: Size = { width: gameSize.width, height: gameSize.height };
    for (const handler of this.handlers) {
      handler(size);
    }
  };

  public constructor(scale: Phaser.Scale.ScaleManager) {
    this.scale = scale;
  }

  public attach(): void {
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize);
  }

  public detach(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize);
    this.handlers.clear();
  }

  public subscribe(handler: ResizeHandler): () => void {
    this.handlers.add(handler);
    handler(this.getSize());
    return () => {
      this.handlers.delete(handler);
    };
  }

  public getSize(): Size {
    return {
      width: this.scale.width,
      height: this.scale.height,
    };
  }

  public get center(): { readonly x: number; readonly y: number } {
    const { width, height } = this.getSize();
    return { x: width / 2, y: height / 2 };
  }
}

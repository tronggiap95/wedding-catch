import Phaser from 'phaser';
import { getRuntimeConfig } from './runtime';
import { gameScenes } from '../scenes';

/**
 * Builds Phaser GameConfig for a DOM parent.
 * Mobile-first FIT scale, 60 FPS target, no React concerns.
 */
export function createGameConfig(
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig {
  const runtime = getRuntimeConfig();

  return {
    type: Phaser.AUTO,
    parent,
    width: runtime.width,
    height: runtime.height,
    backgroundColor: runtime.backgroundColor,
    scene: gameScenes,
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true,
      powerPreference: 'high-performance',
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      expandParent: true,
    },
    audio: {
      disableWebAudio: false,
    },
    banner: false,
  };
}

import Phaser from 'phaser';
import { getRuntimeConfig } from './runtime';
import { getViewportCssSize } from '../helpers/device';
import { gameScenes } from '../scenes';

/**
 * Builds Phaser GameConfig for a DOM parent.
 * RESIZE fills the phone viewport (iPhone 16 Pro Max first, then all devices).
 */
export function createGameConfig(
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig {
  const runtime = getRuntimeConfig();
  const viewport = getViewportCssSize();

  return {
    type: Phaser.AUTO,
    parent,
    width: viewport.width,
    height: viewport.height,
    backgroundColor: runtime.backgroundColor,
    scene: gameScenes,
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
    render: {
      antialias: true,
      antialiasGL: true,
      pixelArt: false,
      roundPixels: true,
      powerPreference: 'high-performance',
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      expandParent: true,
      width: '100%',
      height: '100%',
      autoRound: true,
    },
    audio: {
      disableWebAudio: false,
    },
    banner: false,
    disableContextMenu: true,
    autoFocus: true,
  };
}

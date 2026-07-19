import Phaser from 'phaser';
import { getRuntimeConfig } from './runtime';
import { getViewportCssSize } from '../helpers/device';
import { gameScenes } from '../scenes';

/**
 * Builds Phaser GameConfig for a DOM parent.
 * RESIZE fills the (max-width capped) parent — phone-first, fair on desktop.
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
      expandParent: false,
      width: '100%',
      height: '100%',
      // Width cap is enforced by CSS (.game-root max-width). Do not set
      // scale.max.width alone — Phaser would clamp maxHeight to 0.
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

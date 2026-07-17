import { BootScene } from './BootScene';
import { MenuScene } from './MenuScene';

/**
 * Ordered scene registry. Boot must remain first so the game
 * always starts from a known entry point.
 */
export const gameScenes = [BootScene, MenuScene];

export { BootScene, MenuScene };

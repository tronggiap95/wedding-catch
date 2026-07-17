/**
 * Runtime settings for the Phaser game.
 *
 * Values come from Vite `import.meta.env` today so the same surface
 * can later be wired to Cloudflare Pages / Workers bindings without
 * changing scene or Game code.
 */
export interface RuntimeConfig {
  readonly width: number;
  readonly height: number;
  readonly backgroundColor: string;
  readonly assetBaseUrl: string;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Resolves the active runtime config.
 * Default size is mobile-first portrait; FIT scale handles desktop.
 */
export function getRuntimeConfig(): RuntimeConfig {
  return {
    width: readPositiveInt(import.meta.env.VITE_GAME_WIDTH, 390),
    height: readPositiveInt(import.meta.env.VITE_GAME_HEIGHT, 844),
    backgroundColor: import.meta.env.VITE_GAME_BG ?? '#1a1a2e',
    assetBaseUrl: import.meta.env.VITE_ASSET_BASE_URL ?? '/assets/',
  };
}

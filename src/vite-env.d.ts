/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAME_WIDTH?: string;
  readonly VITE_GAME_HEIGHT?: string;
  readonly VITE_GAME_BG?: string;
  /** Base URL for game assets (local `/assets/` or future Cloudflare R2 / CDN). */
  readonly VITE_ASSET_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

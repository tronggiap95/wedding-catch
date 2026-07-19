/**
 * DOM loading splash shown before / during Phaser boot.
 * Markup lives in index.html (#boot-splash); this module drives progress + dismiss.
 */

const SPLASH_ID = 'boot-splash';
const BAR_ID = 'boot-splash-bar';
const PCT_ID = 'boot-splash-pct';
const STATUS_ID = 'boot-splash-status';

function el<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/** Updates the HTML splash progress (0–1). */
export function setLoadingProgress(progress: number, status?: string): void {
  const clamped = Math.max(0, Math.min(1, progress));
  const bar = el<HTMLElement>(BAR_ID);
  const pct = el<HTMLElement>(PCT_ID);
  const statusEl = el<HTMLElement>(STATUS_ID);

  if (bar !== null) {
    bar.style.transform = `scaleX(${clamped})`;
  }
  if (pct !== null) {
    pct.textContent = `${Math.round(clamped * 100)}%`;
  }
  if (status !== undefined && statusEl !== null) {
    statusEl.textContent = status;
  }
}

/** Fades out and removes the splash so the menu is visible. */
export function dismissLoadingOverlay(): void {
  const splash = el<HTMLElement>(SPLASH_ID);
  if (splash === null) {
    return;
  }

  splash.classList.add('boot-splash--done');
  window.setTimeout(() => {
    splash.remove();
  }, 420);
}

import { en } from './en';
import { vi } from './vi';
import { zh } from './zh';
import type { Dictionary, Locale, TranslationParams } from './types';
import { LOCALES } from './types';

export type { Locale, TranslationParams } from './types';
export { LOCALES, LOCALE_LABELS } from './types';

const STORAGE_KEY = 'wedding-catch.locale';

const DICTIONARIES: Record<Locale, Dictionary> = {
  vi,
  en,
  zh,
};

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

function readStoredLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null && isLocale(raw)) {
      return raw;
    }
  } catch {
    // private mode / SSR — ignore
  }
  return null;
}

function detectLocale(): Locale {
  try {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('zh')) {
      return 'zh';
    }
    if (lang.startsWith('en')) {
      return 'en';
    }
  } catch {
    // ignore
  }
  return 'vi';
}

function interpolate(
  template: string,
  params?: TranslationParams,
): string {
  if (params === undefined) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

/**
 * App-wide locale + translation helper.
 * Import `t` / `localeStore` from anywhere in the game.
 */
export class LocaleStore {
  private locale: Locale;
  private readonly listeners = new Set<(locale: Locale) => void>();

  public constructor() {
    this.locale = readStoredLocale() ?? detectLocale();
  }

  public getLocale(): Locale {
    return this.locale;
  }

  public setLocale(locale: Locale): void {
    if (this.locale === locale) {
      return;
    }
    this.locale = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
    for (const listener of this.listeners) {
      listener(locale);
    }
  }

  public subscribe(listener: (locale: Locale) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public t(key: string, params?: TranslationParams): string {
    const primary = DICTIONARIES[this.locale][key];
    const fallback = DICTIONARIES.vi[key] ?? DICTIONARIES.en[key] ?? key;
    return interpolate(primary ?? fallback, params);
  }

  public numberLocale(): string {
    if (this.locale === 'zh') {
      return 'zh-CN';
    }
    if (this.locale === 'en') {
      return 'en-US';
    }
    return 'vi-VN';
  }

  public formatNumber(value: number): string {
    return value.toLocaleString(this.numberLocale());
  }

  /** Pick a random funny game-over line for the active locale. */
  public funnyResultLine(): string {
    const index = Math.floor(Math.random() * 7);
    return this.t(`result.funny.${index}`);
  }

  public stageName(stageId: number, namedCount: number): string {
    if (stageId <= namedCount) {
      return this.t(`stage.${stageId}.name`);
    }
    return this.t('stage.endless.name');
  }

  public stageDescription(stageId: number, namedCount: number): string {
    if (stageId <= namedCount) {
      return this.t(`stage.${stageId}.description`);
    }
    return this.t('stage.endless.description');
  }
}

export const localeStore = new LocaleStore();

export function t(key: string, params?: TranslationParams): string {
  return localeStore.t(key, params);
}

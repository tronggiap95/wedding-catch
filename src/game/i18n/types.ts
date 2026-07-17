export type Locale = 'vi' | 'en' | 'zh';

export const LOCALES: readonly Locale[] = ['vi', 'en', 'zh'] as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
};

export type TranslationParams = Record<string, string | number>;

export type Dictionary = Record<string, string>;

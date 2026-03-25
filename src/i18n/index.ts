import { tr } from './tr';
import { en } from './en';
import { de } from './de';
import { fr } from './fr';
import { es } from './es';

export type Locale = 'tr' | 'en' | 'de' | 'fr' | 'es';

export type Translations = typeof tr;

const translations: Record<Locale, Translations> = {
  tr,
  en,
  de,
  fr,
  es,
};

const supportedLocales: Locale[] = ['tr', 'en', 'de', 'fr', 'es'];

function getSystemLocale(): Locale {
  const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  const languageCode = systemLocale.split('-')[0].toLowerCase();

  if (supportedLocales.includes(languageCode as Locale)) {
    return languageCode as Locale;
  }

  return 'en';
}

let currentLocale: Locale | null = null;

export function getLocale(): Locale {
  if (currentLocale) {
    return currentLocale;
  }
  return getSystemLocale();
}

export { getSystemLocale };

export function setLocale(locale: Locale): void {
  if (!supportedLocales.includes(locale)) {
    throw new Error(`Unsupported locale: ${locale}. Supported: ${supportedLocales.join(', ')}`);
  }
  currentLocale = locale;
}

export function resetLocale(): void {
  currentLocale = null;
}

export function getSupportedLocales(): Locale[] {
  return [...supportedLocales];
}

export function getLocaleDisplayName(locale: Locale): string {
  const displayNames: Record<Locale, string> = {
    tr: 'Türkçe',
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
  };
  return displayNames[locale];
}

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<Translations>;

function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.');
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }

  return typeof value === 'string' ? value : path;
}

export function t(key: TranslationKey): string {
  const locale = getLocale();
  const translation = translations[locale];
  const value = getNestedValue(translation, key);

  if (value === key && locale !== 'en') {
    return getNestedValue(translations.en, key);
  }

  return value;
}

export { tr, en, de, fr, es };

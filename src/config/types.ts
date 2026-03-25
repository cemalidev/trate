import type { Locale } from '../i18n';

export interface Config {
  baseCurrency: string;
  favorites: string[];
  locale?: Locale;
  clientId?: string;
  aliases: Record<string, string>;
}

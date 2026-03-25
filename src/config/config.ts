import Conf from 'conf';
import { Config } from './types';
import { Locale, getSystemLocale } from '../i18n';

const schema = {
  baseCurrency: {
    type: 'string' as const,
    default: 'TRY',
    description: 'Base currency for exchange rates',
  },
  favorites: {
    type: 'array' as const,
    default: ['USD', 'EUR', 'GBP', 'JPY'],
    description: 'Favorite currency pairs',
  },
  locale: {
    type: 'string' as const,
    default: getSystemLocale(),
    description: 'Language preference (tr, en, de, fr, es)',
  },
  aliases: {
    type: 'object' as const,
    default: {},
    description: 'Custom currency aliases',
  },
} as const;

export class ConfigService {
  private store: Conf<Config>;

  constructor() {
    this.store = new Conf<Config>({
      projectName: 'trate',
      schema: schema as any,
    });
  }

  get baseCurrency(): string {
    return this.store.get('baseCurrency');
  }

  set baseCurrency(value: string) {
    this.store.set('baseCurrency', value.toUpperCase());
  }

  get favorites(): string[] {
    return this.store.get('favorites');
  }

  set favorites(value: string[]) {
    this.store.set(
      'favorites',
      value.map(v => v.toUpperCase())
    );
  }

  get locale(): Locale {
    const stored = this.store.get('locale');
    return (stored as Locale) || getSystemLocale();
  }

  set locale(value: Locale) {
    this.store.set('locale', value);
  }

  get clientId(): string {
    const stored = this.store.get('clientId');
    if (!stored) {
      const newId = crypto.randomUUID();
      this.store.set('clientId', newId);
      return newId;
    }
    return stored;
  }

  get aliases(): Record<string, string> {
    return this.store.get('aliases') || {};
  }

  set aliases(value: Record<string, string>) {
    const normalized: Record<string, string> = {};
    for (const [key, val] of Object.entries(value)) {
      normalized[key.toLowerCase()] = val.toUpperCase();
    }
    this.store.set('aliases', normalized);
  }

  addAlias(alias: string, currency: string): void {
    const current = this.aliases;
    current[alias.toLowerCase()] = currency.toUpperCase();
    this.aliases = current;
  }

  removeAlias(alias: string): boolean {
    const current = this.aliases;
    if (current[alias.toLowerCase()]) {
      delete current[alias.toLowerCase()];
      this.aliases = current;
      return true;
    }
    return false;
  }

  addFavorite(currency: string): void {
    const current = this.favorites;
    if (!current.includes(currency.toUpperCase())) {
      this.favorites = [...current, currency.toUpperCase()];
    }
  }

  removeFavorite(currency: string): void {
    this.favorites = this.favorites.filter(f => f !== currency.toUpperCase());
  }

  getAll(): Config {
    return {
      baseCurrency: this.baseCurrency,
      favorites: this.favorites,
      locale: this.locale,
      clientId: this.clientId,
      aliases: this.aliases,
    };
  }

  reset(): void {
    this.store.clear();
  }
}

export const configService = new ConfigService();

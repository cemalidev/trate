import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '../src/config/config';
import { resetLocale } from '../src/i18n';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
    configService.reset();
    resetLocale();
  });

  describe('baseCurrency', () => {
    it('should have default base currency', () => {
      expect(configService.baseCurrency).toBeDefined();
      expect(typeof configService.baseCurrency).toBe('string');
    });

    it('should set base currency', () => {
      configService.baseCurrency = 'USD';
      expect(configService.baseCurrency).toBe('USD');
    });

    it('should uppercase the base currency', () => {
      configService.baseCurrency = 'usd';
      expect(configService.baseCurrency).toBe('USD');
    });
  });

  describe('favorites', () => {
    it('should have default favorites', () => {
      const favorites = configService.favorites;
      expect(Array.isArray(favorites)).toBe(true);
      expect(favorites.length).toBeGreaterThan(0);
    });

    it('should add a favorite', () => {
      configService.addFavorite('BTC');
      expect(configService.favorites).toContain('BTC');
    });

    it('should not add duplicate favorites', () => {
      configService.addFavorite('BTC');
      configService.addFavorite('btc');
      const count = configService.favorites.filter(f => f === 'BTC').length;
      expect(count).toBe(1);
    });

    it('should remove a favorite', () => {
      configService.addFavorite('BTC');
      configService.removeFavorite('BTC');
      expect(configService.favorites).not.toContain('BTC');
    });

    it('should handle case-insensitive operations', () => {
      configService.addFavorite('btc');
      configService.removeFavorite('BTC');
      expect(configService.favorites).not.toContain('BTC');
    });
  });

  describe('locale', () => {
    it('should have a locale property', () => {
      const locale = configService.locale;
      expect(locale).toBeDefined();
      expect(typeof locale).toBe('string');
    });

    it('should set locale', () => {
      configService.locale = 'tr';
      expect(configService.locale).toBe('tr');
    });
  });

  describe('getAll', () => {
    it('should return all config values', () => {
      const config = configService.getAll();
      expect(config).toHaveProperty('baseCurrency');
      expect(config).toHaveProperty('favorites');
      expect(config).toHaveProperty('locale');
    });
  });

  describe('reset', () => {
    it('should reset all settings', () => {
      configService.baseCurrency = 'USD';
      configService.addFavorite('BTC');
      configService.reset();

      expect(configService.baseCurrency).toBeDefined();
      expect(configService.favorites).toBeDefined();
    });
  });
});

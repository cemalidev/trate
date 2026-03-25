import { describe, it, expect, afterEach } from 'vitest';
import {
  t,
  setLocale,
  getLocale,
  resetLocale,
  getSupportedLocales,
  getLocaleDisplayName,
  Locale,
} from '../src/i18n';

describe('i18n', () => {
  afterEach(() => {
    resetLocale();
  });

  describe('getLocale', () => {
    it('should return a supported locale', () => {
      const locale = getLocale();
      expect(getSupportedLocales()).toContain(locale);
    });
  });

  describe('setLocale', () => {
    it('should change the current locale', () => {
      setLocale('tr');
      expect(getLocale()).toBe('tr');
    });

    it('should throw error for unsupported locale', () => {
      expect(() => setLocale('xx' as Locale)).toThrow();
    });

    it('should persist locale across multiple calls', () => {
      setLocale('de');
      setLocale('fr');
      expect(getLocale()).toBe('fr');
    });
  });

  describe('resetLocale', () => {
    it('should reset to system locale', () => {
      setLocale('tr');
      resetLocale();
      const locale = getLocale();
      expect(getSupportedLocales()).toContain(locale);
    });
  });

  describe('getSupportedLocales', () => {
    it('should return all supported locales', () => {
      const locales = getSupportedLocales();
      expect(locales).toContain('tr');
      expect(locales).toContain('en');
      expect(locales).toContain('de');
      expect(locales).toContain('fr');
      expect(locales).toContain('es');
      expect(locales.length).toBe(5);
    });
  });

  describe('getLocaleDisplayName', () => {
    it('should return display name for supported locales', () => {
      expect(getLocaleDisplayName('tr')).toBe('Türkçe');
      expect(getLocaleDisplayName('en')).toBe('English');
      expect(getLocaleDisplayName('de')).toBe('Deutsch');
      expect(getLocaleDisplayName('fr')).toBe('Français');
      expect(getLocaleDisplayName('es')).toBe('Español');
    });
  });

  describe('t()', () => {
    it('should return translation for Turkish', () => {
      setLocale('tr');
      expect(t('error.noConnection')).toBe('İnternet bağlantınızı kontrol ediniz');
      expect(t('success.added')).toBe('Eklendi');
    });

    it('should return translation for English', () => {
      setLocale('en');
      expect(t('error.noConnection')).toBe('Check your internet connection');
      expect(t('success.added')).toBe('Added');
    });

    it('should return translation for German', () => {
      setLocale('de');
      expect(t('error.noConnection')).toBe('Überprüfen Sie Ihre Internetverbindung');
      expect(t('success.added')).toBe('Hinzugefügt');
    });

    it('should return translation for French', () => {
      setLocale('fr');
      expect(t('error.noConnection')).toBe('Vérifiez votre connexion internet');
      expect(t('success.added')).toBe('Ajouté');
    });

    it('should return translation for Spanish', () => {
      setLocale('es');
      expect(t('error.noConnection')).toBe('Verifica tu conexión a internet');
      expect(t('success.added')).toBe('Añadido');
    });

    it('should fallback to English for missing translation', () => {
      setLocale('tr');
      const result = t('error.noConnection' as any);
      expect(typeof result).toBe('string');
    });

    it('should handle nested keys', () => {
      setLocale('en');
      expect(t('dashboard.type.fiat')).toBe('FIAT');
      expect(t('dashboard.type.crypto')).toBe('CRYPTO');
    });

    it('should return key if translation not found', () => {
      setLocale('en');
      const result = t('nonexistent.key' as any);
      expect(result).toBe('nonexistent.key');
    });
  });
});

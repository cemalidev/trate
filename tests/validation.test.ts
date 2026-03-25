import { describe, it, expect, afterEach } from 'vitest';
import {
  isCrypto,
  isMetal,
  isJewelry,
  isFiat,
  getCryptoList,
  getMetalList,
  getJewelryList,
  getFiatList,
  getDisplayName,
} from '../src/convert';
import { setLocale, resetLocale } from '../src/i18n';

describe('Currency Validation', () => {
  describe('isCrypto', () => {
    it('should identify crypto currencies', () => {
      expect(isCrypto('BTC')).toBe(true);
      expect(isCrypto('ETH')).toBe(true);
      expect(isCrypto('btc')).toBe(true);
      expect(isCrypto('Sol')).toBe(true);
    });

    it('should reject non-crypto currencies', () => {
      expect(isCrypto('USD')).toBe(false);
      expect(isCrypto('ONS')).toBe(false);
      expect(isCrypto('CEYREK_ALTIN')).toBe(false);
    });

    it('should reject invalid symbols', () => {
      expect(isCrypto('INVALID')).toBe(false);
      expect(isCrypto('')).toBe(false);
    });
  });

  describe('isMetal', () => {
    it('should identify metal symbols', () => {
      expect(isMetal('ONS')).toBe(true);
      expect(isMetal('GUMUS_OZ')).toBe(true);
      expect(isMetal('ons')).toBe(true);
    });

    it('should reject non-metal symbols', () => {
      expect(isMetal('BTC')).toBe(false);
      expect(isMetal('USD')).toBe(false);
      expect(isMetal('CEYREK_ALTIN')).toBe(false);
    });
  });

  describe('isJewelry', () => {
    it('should identify jewelry symbols', () => {
      expect(isJewelry('CEYREK_ALTIN')).toBe(true);
      expect(isJewelry('YARIM_ALTIN')).toBe(true);
      expect(isJewelry('TAM_ALTIN')).toBe(true);
      expect(isJewelry('ATA_ALTIN')).toBe(true);
      expect(isJewelry('ceyrek_altin')).toBe(true);
    });

    it('should reject non-jewelry symbols', () => {
      expect(isJewelry('BTC')).toBe(false);
      expect(isJewelry('USD')).toBe(false);
      expect(isJewelry('ONS')).toBe(false);
    });
  });

  describe('isFiat', () => {
    it('should identify fiat currencies', () => {
      expect(isFiat('USD')).toBe(true);
      expect(isFiat('EUR')).toBe(true);
      expect(isFiat('TRY')).toBe(true);
      expect(isFiat('usd')).toBe(true);
    });

    it('should reject non-fiat symbols', () => {
      expect(isFiat('BTC')).toBe(false);
      expect(isFiat('ONS')).toBe(false);
      expect(isFiat('CEYREK_ALTIN')).toBe(false);
    });
  });
});

describe('Currency Lists', () => {
  describe('getCryptoList', () => {
    it('should return array of crypto symbols', () => {
      const list = getCryptoList();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
      expect(list).toContain('BTC');
      expect(list).toContain('ETH');
    });
  });

  describe('getMetalList', () => {
    it('should return array of metal symbols', () => {
      const list = getMetalList();
      expect(Array.isArray(list)).toBe(true);
      expect(list).toContain('ONS');
      expect(list).toContain('GUMUS_OZ');
    });
  });

  describe('getJewelryList', () => {
    it('should return array of jewelry symbols', () => {
      const list = getJewelryList();
      expect(Array.isArray(list)).toBe(true);
      expect(list).toContain('CEYREK_ALTIN');
      expect(list).toContain('TAM_ALTIN');
    });
  });

  describe('getFiatList', () => {
    it('should return array of fiat symbols', () => {
      const list = getFiatList();
      expect(Array.isArray(list)).toBe(true);
      expect(list).toContain('USD');
      expect(list).toContain('EUR');
      expect(list).toContain('TRY');
    });
  });
});

describe('Display Names', () => {
  afterEach(() => {
    resetLocale();
  });

  it('should return Turkish display names when locale is TR', () => {
    setLocale('tr');
    expect(getDisplayName('ONS')).toBe('Altın Ons');
    expect(getDisplayName('CEYREK_ALTIN')).toBe('Çeyrek Altın');
  });

  it('should return English display names when locale is EN', () => {
    setLocale('en');
    expect(getDisplayName('ONS')).toBe('Gold Ounce');
    expect(getDisplayName('CEYREK_ALTIN')).toBe('Quarter Gold');
  });

  it('should return German display names when locale is DE', () => {
    setLocale('de');
    expect(getDisplayName('ONS')).toBe('Gold Unze');
    expect(getDisplayName('CEYREK_ALTIN')).toBe('Viertel Gold');
  });

  it('should return unknown symbol as-is', () => {
    setLocale('en');
    expect(getDisplayName('UNKNOWN')).toBe('UNKNOWN');
  });
});

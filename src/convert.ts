import fetch from 'node-fetch';
import { configService } from './config/config';
import { t } from './i18n';
import { logger } from './utils/logger';

const TRATE_API = 'https://trate-api.cemali.dev/v1';

const cache = new Map<string, { data: any; timestamp: number; base?: string }>();
const CACHE_TTL = 5 * 60 * 1000;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(endpoint: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(endpoint);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(endpoint, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    logger.warn(`Rate limit exceeded for ${endpoint}`, { resetIn: entry.resetTime - now });
    return false;
  }

  entry.count++;
  return true;
}

export const cacheApi = {
  clear: () => cache.clear(),
};

export const CRYPTO_SYMBOLS = [
  'BTC',
  'ETH',
  'SOL',
  'BNB',
  'XRP',
  'ADA',
  'DOGE',
  'DOT',
  'AVAX',
  'MATIC',
  'LINK',
  'UNI',
  'LTC',
  'ATOM',
];

export const METAL_SYMBOLS = ['ONS', 'GUMUS_OZ', 'GRAM_ALTIN'];

export const JEWELRY_SYMBOLS = ['CEYREK_ALTIN', 'YARIM_ALTIN', 'TAM_ALTIN', 'ATA_ALTIN'];

export const SUPPORTED_FIAT = [
  'EUR',
  'USD',
  'GBP',
  'JPY',
  'CHF',
  'CAD',
  'AUD',
  'NZD',
  'CNY',
  'HKD',
  'SGD',
  'INR',
  'RUB',
  'TRY',
  'BRL',
  'ZAR',
  'MXN',
];

export const JEWELRY_API_MAP: Record<string, string> = {
  CEYREK_ALTIN: 'ceyrek_altin',
  YARIM_ALTIN: 'yarim_altin',
  TAM_ALTIN: 'tam_altin',
  ATA_ALTIN: 'ata_altin',
};

export const METAL_API_MAP: Record<string, string> = {
  ONS: 'ons_altin',
  GUMUS_OZ: 'gumus_ons',
  GRAM_ALTIN: 'gram_altin',
};

export function isCrypto(symbol: string): boolean {
  return CRYPTO_SYMBOLS.includes(symbol.toUpperCase());
}

export function isMetal(symbol: string): boolean {
  return METAL_SYMBOLS.includes(symbol.toUpperCase());
}

export function isJewelry(symbol: string): boolean {
  return JEWELRY_SYMBOLS.includes(symbol.toUpperCase());
}

export function isFiat(symbol: string): boolean {
  return SUPPORTED_FIAT.includes(symbol.toUpperCase());
}

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any, base?: string): void {
  cache.set(key, { data, timestamp: Date.now(), base });
}

async function fetchWithTimeout(
  url: string,
  timeout = 8000
): Promise<import('node-fetch').Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = (await fetch(url, {
      signal: controller.signal,
      headers: {
        'X-Client-ID': configService.clientId,
        'User-Agent': 'trate-cli/1.0.0',
      },
    })) as import('node-fetch').Response;
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchFiatRates(): Promise<Record<string, number>> {
  const cacheKey = 'fiat-rates';
  const cached = getCached<Record<string, number>>(cacheKey);
  if (cached) return cached;

  if (!checkRateLimit('fiat')) {
    throw new Error(t('error.noConnection'));
  }

  try {
    const response = await fetchWithTimeout(`${TRATE_API}/latest`);
    if (!response.ok) throw new Error();
    const data = (await response.json()) as { rates: Record<string, number> };
    if (!data.rates || Object.keys(data.rates).length === 0) throw new Error('Empty rates');
    setCache(cacheKey, data.rates, 'USD');
    return data.rates;
  } catch {
    throw new Error(t('error.noConnection'));
  }
}

function getFiatRateBase(): string | undefined {
  const cached = cache.get('fiat-rates');
  return cached?.base;
}

async function fetchCryptoRates(): Promise<Record<string, number>> {
  const cacheKey = 'crypto-rates';
  const cached = getCached<Record<string, number>>(cacheKey);
  if (cached) return cached;

  if (!checkRateLimit('crypto')) {
    throw new Error(t('error.noConnection'));
  }

  try {
    const response = await fetchWithTimeout(`${TRATE_API}/crypto`);
    if (!response.ok) throw new Error();
    const data = (await response.json()) as { prices: Record<string, number> };
    setCache(cacheKey, data.prices);
    return data.prices;
  } catch {
    throw new Error(t('error.noConnection'));
  }
}

async function fetchMetalsPrices(): Promise<Record<string, { alis: number; satis: number }>> {
  const cacheKey = 'metals-prices';
  const cached = getCached<Record<string, { alis: number; satis: number }>>(cacheKey);
  if (cached) return cached;

  if (!checkRateLimit('metals')) {
    throw new Error(t('error.noConnection'));
  }

  try {
    const response = await fetchWithTimeout(`${TRATE_API}/metals`);
    if (!response.ok) throw new Error();
    const data = (await response.json()) as {
      prices: Record<string, { alis: number; satis: number }>;
    };
    if (!data.prices || Object.keys(data.prices).length === 0) {
      throw new Error(t('error.goldPricesUnavailable'));
    }
    setCache(cacheKey, data.prices);
    return data.prices;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(t('error.goldPricesUnavailable').replace('ş', 's').replace('ı', 'i'))
    ) {
      throw error;
    }
    throw new Error(t('error.goldPricesLoadFailed'), { cause: error });
  }
}

export interface ConversionResult {
  success: boolean;
  result?: number;
  rate?: number;
  base?: string;
  date?: string;
  error?: string;
}

export async function convert(amount: number, from: string, to: string): Promise<ConversionResult> {
  try {
    from = from.toUpperCase();
    to = to.toUpperCase();

    if (from === to) {
      return {
        success: true,
        result: amount,
        rate: 1,
        base: from,
        date: new Date().toISOString().split('T')[0],
      };
    }

    const fromIsCrypto = isCrypto(from);
    const toIsCrypto = isCrypto(to);
    const fromIsMetal = isMetal(from);
    const toIsMetal = isMetal(to);
    const fromIsJewelry = isJewelry(from);
    const toIsJewelry = isJewelry(to);
    const fromIsFiat = isFiat(from);
    const toIsFiat = isFiat(to);

    let result: number;
    let rate: number;

    if (fromIsJewelry && toIsJewelry) {
      const metalsPrices = await fetchMetalsPrices();
      const fromApiKey = JEWELRY_API_MAP[from];
      const toApiKey = JEWELRY_API_MAP[to];
      const fromPriceTRY = metalsPrices[fromApiKey].satis;
      const toPriceTRY = metalsPrices[toApiKey].satis;
      rate = fromPriceTRY / toPriceTRY;
      result = amount * rate;
    } else if (fromIsJewelry && toIsFiat) {
      const metalsPrices = await fetchMetalsPrices();
      const fiatRates = await fetchFiatRates();
      const fromApiKey = JEWELRY_API_MAP[from];
      const jewelryPriceTRY = metalsPrices[fromApiKey].satis;
      const jewelryPriceUSD = jewelryPriceTRY / fiatRates['TRY'];
      if (to === 'USD') {
        rate = jewelryPriceUSD;
      } else {
        const targetToUSD = fiatRates[to];
        if (!targetToUSD) {
          return { success: false, error: `${to} ${t('error.rateNotFound')}` };
        }
        rate = jewelryPriceUSD * targetToUSD;
      }
      result = amount * rate;
    } else if (fromIsFiat && toIsJewelry) {
      const metalsPrices = await fetchMetalsPrices();
      const fiatRates = await fetchFiatRates();
      const toApiKey = JEWELRY_API_MAP[to];
      const jewelryPriceTRY = metalsPrices[toApiKey].satis;
      const jewelryPriceUSD = jewelryPriceTRY / fiatRates['TRY'];
      if (from === 'USD') {
        rate = 1 / jewelryPriceUSD;
      } else {
        const fiatToUSD = fiatRates[from];
        if (!fiatToUSD) {
          return { success: false, error: `${from} ${t('error.rateNotFound')}` };
        }
        rate = fiatToUSD / jewelryPriceUSD;
      }
      result = amount * rate;
    } else if (fromIsJewelry && toIsCrypto) {
      const metalsPrices = await fetchMetalsPrices();
      const fiatRates = await fetchFiatRates();
      const cryptoRates = await fetchCryptoRates();
      const fromApiKey = JEWELRY_API_MAP[from];
      const jewelryPriceTRY = metalsPrices[fromApiKey].satis;
      const cryptoPriceUSD = cryptoRates[to];
      const usdToTry = fiatRates['TRY'];
      const jewelryPriceUSD = jewelryPriceTRY / usdToTry;
      rate = jewelryPriceUSD / cryptoPriceUSD;
      result = amount * rate;
    } else if (fromIsCrypto && toIsJewelry) {
      const metalsPrices = await fetchMetalsPrices();
      const fiatRates = await fetchFiatRates();
      const cryptoRates = await fetchCryptoRates();
      const toApiKey = JEWELRY_API_MAP[to];
      const jewelryPriceTRY = metalsPrices[toApiKey].satis;
      const cryptoPriceUSD = cryptoRates[from];
      const usdToTry = fiatRates['TRY'];
      const cryptoInTRY = cryptoPriceUSD * usdToTry;
      rate = cryptoInTRY / jewelryPriceTRY;
      result = amount * rate;
    } else if (fromIsMetal && toIsFiat) {
      const metalsPrices = await fetchMetalsPrices();
      const fiatRates = await fetchFiatRates();
      const apiKey = METAL_API_MAP[from];
      let metalPriceTRY: number;
      if (from === 'ONS') {
        metalPriceTRY = metalsPrices[apiKey].satis;
      } else if (from === 'ALTIN_KG') {
        metalPriceTRY = metalsPrices[apiKey].satis * 10.33;
      } else {
        metalPriceTRY = metalsPrices[apiKey].satis;
      }
      const metalPriceUSD = metalPriceTRY / fiatRates['TRY'];
      if (to === 'USD') {
        rate = metalPriceUSD;
      } else {
        const targetToUSD = fiatRates[to];
        if (!targetToUSD) {
          return { success: false, error: `${to} ${t('error.rateNotFound')}` };
        }
        rate = metalPriceUSD * targetToUSD;
      }
      result = amount * rate;
    } else if (fromIsFiat && toIsMetal) {
      const metalsPrices = await fetchMetalsPrices();
      const fiatRates = await fetchFiatRates();
      const apiKey = METAL_API_MAP[to];
      let metalPriceTRY: number;
      if (to === 'ONS') {
        metalPriceTRY = metalsPrices[apiKey].satis;
      } else if (to === 'ALTIN_KG') {
        metalPriceTRY = metalsPrices[apiKey].satis * 10.33;
      } else {
        metalPriceTRY = metalsPrices[apiKey].satis;
      }
      const metalPriceUSD = metalPriceTRY / fiatRates['TRY'];
      if (from === 'USD') {
        rate = 1 / metalPriceUSD;
      } else {
        const fiatToUSD = fiatRates[from];
        if (!fiatToUSD) {
          return { success: false, error: `${from} ${t('error.rateNotFound')}` };
        }
        rate = fiatToUSD / metalPriceUSD;
      }
      result = amount * rate;
    } else if (fromIsMetal && toIsCrypto) {
      const metalsPrices = await fetchMetalsPrices();
      const fiatRates = await fetchFiatRates();
      const cryptoRates = await fetchCryptoRates();
      const apiKey = METAL_API_MAP[from];
      let metalPriceTRY: number;
      if (from === 'ONS') {
        metalPriceTRY = metalsPrices[apiKey].satis;
      } else if (from === 'ALTIN_KG') {
        metalPriceTRY = metalsPrices[apiKey].satis * 10.33;
      } else {
        metalPriceTRY = metalsPrices[apiKey].satis;
      }
      const metalPriceUSD = metalPriceTRY / fiatRates['TRY'];
      const cryptoPriceUSD = cryptoRates[to];
      rate = metalPriceUSD / cryptoPriceUSD;
      result = amount * rate;
    } else if (fromIsCrypto && toIsMetal) {
      const metalsPrices = await fetchMetalsPrices();
      const fiatRates = await fetchFiatRates();
      const cryptoRates = await fetchCryptoRates();
      const apiKey = METAL_API_MAP[to];
      let metalPriceTRY: number;
      if (to === 'ONS') {
        metalPriceTRY = metalsPrices[apiKey].satis;
      } else if (to === 'ALTIN_KG') {
        metalPriceTRY = metalsPrices[apiKey].satis * 10.33;
      } else {
        metalPriceTRY = metalsPrices[apiKey].satis;
      }
      const cryptoPriceUSD = cryptoRates[from];
      const cryptoInTRY = cryptoPriceUSD * fiatRates['TRY'];
      rate = cryptoInTRY / metalPriceTRY;
      result = amount * rate;
    } else if (fromIsCrypto && toIsCrypto) {
      const cryptoRates = await fetchCryptoRates();
      const fromPrice = cryptoRates[from];
      const toPrice = cryptoRates[to];
      if (!fromPrice || !toPrice) {
        return { success: false, error: `${!fromPrice ? from : to} ${t('error.notFound')}` };
      }
      rate = fromPrice / toPrice;
      result = amount * rate;
    } else if (fromIsCrypto && toIsFiat) {
      const cryptoRates = await fetchCryptoRates();
      const fiatRates = await fetchFiatRates();
      const cryptoPriceUSD = cryptoRates[from];
      if (!cryptoPriceUSD) {
        return { success: false, error: `${from} ${t('error.notFound')}` };
      }
      if (to === 'USD') {
        rate = cryptoPriceUSD;
      } else {
        const targetToUSD = fiatRates[to];
        if (!targetToUSD) {
          return { success: false, error: `${to} ${t('error.rateNotFound')}` };
        }
        rate = cryptoPriceUSD * targetToUSD;
      }
      result = amount * rate;
    } else if (fromIsFiat && toIsCrypto) {
      const cryptoRates = await fetchCryptoRates();
      const fiatRates = await fetchFiatRates();
      const cryptoPriceUSD = cryptoRates[to];
      if (!cryptoPriceUSD) {
        return { success: false, error: `${to} ${t('error.notFound')}` };
      }
      if (from === 'USD') {
        rate = 1 / cryptoPriceUSD;
      } else {
        const fiatToUSD = fiatRates[from];
        if (!fiatToUSD) {
          return { success: false, error: `${from} ${t('error.rateNotFound')}` };
        }
        rate = fiatToUSD / cryptoPriceUSD;
      }
      result = amount * rate;
    } else {
      const fiatRates = await fetchFiatRates();
      const rateBase = getFiatRateBase();
      const fromRate = fiatRates[from];
      const toRate = fiatRates[to];
      if (!fromRate) {
        return { success: false, error: `${from} ${t('error.rateNotFound')}` };
      }
      if (!toRate) {
        return { success: false, error: `${to} ${t('error.rateNotFound')}` };
      }
      if (rateBase === 'USD') {
        rate = toRate / fromRate;
      } else {
        rate = fromRate / toRate;
      }
      result = amount * rate;
    }

    return {
      success: true,
      result: result < 0.01 ? parseFloat(result.toFixed(8)) : Math.round(result * 100) / 100,
      rate: result < 0.01 ? parseFloat(rate.toPrecision(6)) : Math.round(rate * 1000000) / 1000000,
      base: configService.baseCurrency,
      date: new Date().toISOString().split('T')[0],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : t('error.noConnection'),
    };
  }
}

export async function getLatestRates(
  _base: string
): Promise<{ base: string; date: string; rates: Record<string, number> }> {
  const data = await fetchFiatRates();
  const rateBase = getFiatRateBase() || configService.baseCurrency;
  return {
    base: rateBase,
    date: new Date().toISOString().split('T')[0],
    rates: data,
  };
}

export async function getRate(symbol: string): Promise<number | null> {
  try {
    symbol = symbol.toUpperCase();

    if (isCrypto(symbol)) {
      const rates = await fetchCryptoRates();
      return rates[symbol] || null;
    }

    if (isJewelry(symbol)) {
      const prices = await fetchMetalsPrices();
      const apiKey = JEWELRY_API_MAP[symbol];
      return prices[apiKey]?.satis || null;
    }

    if (isMetal(symbol)) {
      const prices = await fetchMetalsPrices();
      const apiKey = METAL_API_MAP[symbol];
      return prices[apiKey]?.satis || null;
    }

    const rates = await fetchFiatRates();
    return rates[symbol] || null;
  } catch {
    return null;
  }
}

export async function getFiatRate(from: string, to: string): Promise<number | null> {
  try {
    const rates = await fetchFiatRates();
    const fromRate = rates[from.toUpperCase()];
    const toRate = rates[to.toUpperCase()];
    if (!fromRate || !toRate) return null;
    return fromRate / toRate;
  } catch {
    return null;
  }
}

export async function getCryptoRate(symbol: string): Promise<number | null> {
  try {
    const rates = await fetchCryptoRates();
    return rates[symbol.toUpperCase()] || null;
  } catch {
    return null;
  }
}

export function getFiatList(): string[] {
  return SUPPORTED_FIAT;
}

export function getCryptoList(): string[] {
  return CRYPTO_SYMBOLS;
}

export function getMetalList(): string[] {
  return METAL_SYMBOLS;
}

export function getJewelryList(): string[] {
  return JEWELRY_SYMBOLS;
}

export function getDisplayName(symbol: string): string {
  const displayNames: Record<string, string> = {
    ONS: t('display.goldOunce'),
    GUMUS_OZ: t('display.silverOunce'),
    GRAM_ALTIN: t('display.goldKg'),
    CEYREK_ALTIN: t('display.quarterGold'),
    YARIM_ALTIN: t('display.halfGold'),
    TAM_ALTIN: t('display.fullGold'),
    ATA_ALTIN: t('display.ataGold'),
  };
  return displayNames[symbol.toUpperCase()] || symbol;
}

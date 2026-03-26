import {
  getFiatList,
  getCryptoList,
  getMetalList,
  getJewelryList,
  getDisplayName,
} from '../convert';
import { configService } from '../config/config';

export interface Suggestion {
  symbol: string;
  display: string;
  type: 'fiat' | 'crypto' | 'metal' | 'jewelry';
  score: number;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function findSimilarCurrencies(query: string): Suggestion[] {
  const normalizedQuery = query.toLowerCase().replace(/[_\s-]/g, '');
  const suggestions: Suggestion[] = [];

  const fiatList = getFiatList().map(s => ({ symbol: s, type: 'fiat' as const }));
  const cryptoList = getCryptoList().map(s => ({ symbol: s, type: 'crypto' as const }));
  const metalList = getMetalList().map(s => ({ symbol: s, type: 'metal' as const }));
  const jewelryList = getJewelryList().map(s => ({ symbol: s, type: 'jewelry' as const }));

  const allSymbols = [...fiatList, ...cryptoList, ...metalList, ...jewelryList];

  for (const item of allSymbols) {
    const normalizedSymbol = item.symbol.toLowerCase();
    const normalizedDisplay = getDisplayName(item.symbol)
      .toLowerCase()
      .replace(/[_\s-]/g, '');

    let score = 0;
    if (
      normalizedSymbol.includes(normalizedQuery) ||
      normalizedDisplay.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedSymbol) ||
      normalizedQuery.includes(normalizedDisplay)
    ) {
      score = 100;
    } else {
      const distance = levenshteinDistance(normalizedQuery, normalizedSymbol);
      const displayDistance = levenshteinDistance(normalizedQuery, normalizedDisplay);
      const minDistance = Math.min(distance, displayDistance);
      score = Math.max(0, 50 - minDistance * 10);
    }

    if (score > 0) {
      suggestions.push({
        symbol: item.symbol,
        display: getDisplayName(item.symbol),
        type: item.type,
        score,
      });
    }
  }

  const aliases = configService.aliases;
  for (const [alias, currency] of Object.entries(aliases)) {
    const normalizedAlias = alias.toLowerCase();
    const normalizedDisplay = getDisplayName(currency).toLowerCase();

    let score = 0;
    if (normalizedAlias.includes(normalizedQuery) || normalizedDisplay.includes(normalizedQuery)) {
      score = 100;
    } else {
      const distance = levenshteinDistance(normalizedQuery, normalizedAlias);
      const displayDistance = levenshteinDistance(normalizedQuery, normalizedDisplay);
      const minDistance = Math.min(distance, displayDistance);
      score = Math.max(0, 50 - minDistance * 10);
    }

    if (score > 0) {
      suggestions.push({
        symbol: alias,
        display: getDisplayName(currency),
        type: 'fiat',
        score,
      });
    }
  }

  return suggestions.sort((a, b) => b.score - a.score);
}

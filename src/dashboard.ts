import { configService } from './config/config';
import { convert, getDisplayName, isCrypto, isMetal, isJewelry } from './convert';
import { colors } from './ui';
import { t } from './i18n';

export async function displayFavoritesDashboard(): Promise<string> {
  const config = configService.getAll();
  const favorites = config.favorites;
  const base = config.baseCurrency;

  const lines: string[] = [];
  lines.push(`\n  ${colors.bold(t('dashboard.title'))}    ${t('ui.base')}: ${colors.cyan(base)}`);
  lines.push(colors.dim('  ' + '─'.repeat(70)));

  const header = `  ${colors.bold(t('ui.symbol'))}     ${colors.bold(t('ui.price'))}              ${colors.bold(t('ui.type'))}`;
  lines.push(header);
  lines.push(colors.dim('  ' + '─'.repeat(70)));

  const promises = favorites.map(async symbol => {
    const isCryptoSymbol = isCrypto(symbol);
    const isMetalSymbol = isMetal(symbol);
    const isJewelrySymbol = isJewelry(symbol);

    const rate = await convert(1, symbol, base);

    if (rate.success) {
      const displaySymbol = isMetalSymbol || isJewelrySymbol ? getDisplayName(symbol) : symbol;
      const resultStr =
        rate.result! < 0.01 ? rate.result!.toPrecision(6) : rate.result!.toLocaleString();

      let typeLabel = t('dashboard.type.fiat');
      let symbolColor = colors.cyan(symbol);

      if (isCryptoSymbol) {
        typeLabel = t('dashboard.type.crypto');
        symbolColor = colors.yellow(symbol);
      } else if (isMetalSymbol) {
        typeLabel = t('dashboard.type.metal');
        symbolColor = colors.magenta(symbol);
      } else if (isJewelrySymbol) {
        typeLabel = t('dashboard.type.gold');
        symbolColor = colors.magenta(symbol + ' 🏆');
      }

      return {
        symbol: displaySymbol,
        type: typeLabel,
        symbolColor,
        price: resultStr,
        rate: `1 ${symbol}`,
      };
    }

    return null;
  });

  const results = await Promise.all(promises);

  for (const result of results) {
    if (result) {
      lines.push(
        `  ${result.symbolColor.padEnd(14)} ${result.rate.padEnd(8)} ${base.padEnd(12)} ${colors.dim(result.type)}`
      );
    }
  }

  lines.push(colors.dim('  ' + '─'.repeat(70)));
  lines.push(
    `  ${colors.dim(t('ui.tip') + ':')} Use ${colors.cyan('trate <symbol>')} ${t('dashboard.usage').toLowerCase()}`
  );
  lines.push(
    `  ${colors.dim(t('ui.tip') + ':')} Use ${colors.cyan('trate add <currency>')} ${t('dashboard.usageAdd').toLowerCase()}`
  );

  return lines.join('\n');
}

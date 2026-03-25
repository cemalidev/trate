import { program } from 'commander';
import { configService } from './config/config';
import {
  convert,
  getFiatList,
  getCryptoList,
  getMetalList,
  getJewelryList,
  getDisplayName,
  isMetal,
  isJewelry,
  cacheApi,
} from './convert';
import { colors, divider } from './ui';
import { getLogo } from './logo';
import { displayFavoritesDashboard } from './dashboard';
import { t, setLocale, getSupportedLocales, getLocaleDisplayName, Locale } from './i18n';
import { logger } from './utils/logger';

const STATUS_WIDTH = 55;

const getSupportedCurrencies = () => {
  const fiat = getFiatList().join(', ');
  const crypto = getCryptoList().join(', ');
  const metals = getMetalList().join(', ');
  return { fiat, crypto, metals };
};

const helpText = async () => {
  const config = configService.getAll();
  const { crypto, metals } = getSupportedCurrencies();

  let statusLine = `${colors.yellow(t('ui.base') + ':')} ${colors.cyan(config.baseCurrency)}`;

  try {
    const usdResult = await convert(1, 'USD', config.baseCurrency);
    if (usdResult.success) {
      statusLine += ` | 1 USD = ${colors.green(usdResult.result!.toFixed(2))} ${config.baseCurrency}`;
    }
  } catch {
    statusLine += ` | ${colors.dim(t('ui.loading'))}`;
  }

  return `
${getLogo()}

${colors.dim(t('app.tagline'))}

${colors.bold(t('help.usage') + ':')}
  ${colors.cyan('trate <amount> <from> <to>')}    ${t('help.examples')} (${colors.dim('trate 100 usd try')})
  ${colors.cyan('trate <currency>')}              ${t('dashboard.usage')} (${colors.dim('trate btc')})

${colors.bold(t('help.examples') + ':')}
  ${colors.dim('$')} ${colors.yellow('trate 100 usd')}    100 USD → ${config.baseCurrency}
  ${colors.dim('$')} ${colors.yellow('trate btc')}        BTC → ${config.baseCurrency}
  ${colors.dim('$')} ${colors.yellow('trate ceyrek_altin')} Çeyrek Altın → ${config.baseCurrency}

${colors.bold(t('help.crypto') + ':')} ${colors.dim(crypto)}

${colors.bold(t('help.metals') + ':')} ${colors.yellow(metals)}

${colors.bold(t('help.jewelry') + ':')}
  ${colors.yellow('ceyrek_altin')} ${colors.yellow('yarim_altin')} ${colors.yellow('tam_altin')} ${colors.yellow('ata_altin')}

${colors.bold(t('help.config') + ':')}
  ${colors.yellow('set-base')} | ${colors.yellow('list')} | ${colors.yellow('add')} | ${colors.yellow('remove')} | ${colors.yellow('set-lang')} | ${colors.yellow('alias')} | ${colors.yellow('help')}

${colors.bold(t('help.alias') + ':')}
  ${colors.dim('$')} ${colors.cyan('trate alias add ceyrek CEYREK_ALTIN')} ${t('help.aliasCreate')}
  ${colors.dim('$')} ${colors.cyan('trate alias list')}                   ${t('help.aliasView')}

${divider(STATUS_WIDTH)}
${statusLine}
`;
};

const startScreen = () => {
  const config = configService.getAll();
  const examples = [
    { cmd: 'trate 100 usd', desc: `100 USD → ${config.baseCurrency}` },
    { cmd: 'trate btc', desc: `BTC → ${config.baseCurrency}` },
    { cmd: 'trate ceyrek_altin', desc: 'Çeyrek Altın' },
    { cmd: 'trate list', desc: 'Favorites' },
    { cmd: 'trate alias list', desc: 'View aliases' },
    { cmd: 'trate help', desc: 'help' },
  ];
  const maxCmdLen = Math.max(...examples.map(e => e.cmd.length));
  const lines = examples
    .map(
      e =>
        `${colors.dim('$')} ${colors.cyan(e.cmd.padEnd(maxCmdLen + 1))}${colors.dim('→')} ${e.desc}`
    )
    .join('\n');
  return `
${getLogo()}

${colors.dim(t('app.tagline'))}

${lines}
`;
};

const validateCurrency = (symbol: string): boolean => {
  const fiatList = getFiatList().map(s => s.toUpperCase());
  const cryptoList = getCryptoList().map(s => s.toUpperCase());
  const metalList = getMetalList().map(s => s.toUpperCase());
  const jewelryList = getJewelryList().map(s => s.toUpperCase());
  const upperSymbol = symbol.toUpperCase();
  const lowerSymbol = symbol.toLowerCase();
  const aliases = configService.aliases;
  return (
    fiatList.includes(upperSymbol) ||
    cryptoList.includes(upperSymbol) ||
    metalList.includes(upperSymbol) ||
    jewelryList.includes(upperSymbol) ||
    lowerSymbol in aliases ||
    Object.values(aliases).includes(upperSymbol)
  );
};

const resolveAlias = (symbol: string): string => {
  const aliases = configService.aliases;
  const lowerSymbol = symbol.toLowerCase();
  return aliases[lowerSymbol] || symbol.toUpperCase();
};

const convertCommand = async (args: string[]) => {
  const config = configService.getAll();

  let amount = 1;
  let from = '';
  let to = config.baseCurrency;

  if (args.length === 1) {
    from = resolveAlias(args[0]);
    to = config.baseCurrency;
    amount = 1;
  } else if (args.length === 2) {
    const first = args[0];
    const second = args[1];

    if (!isNaN(parseFloat(first))) {
      amount = parseFloat(first);
      from = resolveAlias(second);
      to = config.baseCurrency;
    } else {
      from = resolveAlias(first);
      to = resolveAlias(second);
    }
  } else if (args.length >= 3) {
    amount = parseFloat(args[0]);
    from = resolveAlias(args[1]);
    to = resolveAlias(args[2]);
  }

  if (from === to) {
    console.log(`\n  ${colors.dim(t('ui.info') + ':')} ${t('error.sameCurrency')}`);
    console.log(`  ${amount} ${from} = ${amount} ${to} ${colors.dim(t('ui.noConversionNeeded'))}`);
    return;
  }

  const result = await convert(amount, from, to);

  if (result.success) {
    const displayFrom = isMetal(from) || isJewelry(from) ? getDisplayName(from) : from;
    const displayTo = isMetal(to) || isJewelry(to) ? getDisplayName(to) : to;
    const resultStr =
      result.result! < 0.01 ? result.result!.toPrecision(6) : result.result!.toLocaleString();

    console.log(
      `\n  ${colors.bold(amount.toLocaleString())} ${displayFrom} = ${colors.green(resultStr)} ${displayTo}`
    );
    console.log(
      `  ${colors.dim(t('ui.rate') + ':')} 1 ${from} = ${result.rate! < 0.0001 ? result.rate!.toPrecision(6) : result.rate!.toFixed(6)} ${to}`
    );
    console.log(
      `  ${colors.dim(t('ui.base') + ':')} ${result.base} | ${colors.dim(t('ui.date') + ':')} ${result.date}`
    );
  } else {
    console.log(`\n  ${colors.red('Error:')} ${result.error}`);
  }
};

const listCommand = async () => {
  console.log(await displayFavoritesDashboard());
};

const moonCommand = async () => {
  console.log(`\n  ${colors.bold(t('moon.toTheMoon'))}\n`);
  console.log(`  ${colors.yellow('🚀')} ${colors.bold(t('moon.goingToMoon'))}`);
  console.log(
    `  ${colors.dim(t('moon.tip'))} ${colors.cyan('trate <crypto>')} ${colors.dim(t('ui.type') + ':')}`
  );
  console.log('');
};

function initLocale() {
  const configLocale = configService.locale;
  if (configLocale) {
    setLocale(configLocale);
  }
}

initLocale();

program.name('trate').description(t('app.tagline')).version('1.0.0');

program.argument('[args...]', 'Arguments for conversion or command').action(async args => {
  if (!args || args.length === 0) {
    console.log(startScreen());
    return;
  }

  const cmd = args[0].toLowerCase();

  if (cmd === 'set-base') {
    const newBase = args[1]?.toUpperCase();
    if (!newBase) {
      console.log(`  ${colors.red('Error:')} ${t('cli.specifyCurrency')}`);
      console.log(`  ${colors.dim(t('cli.usage') + ':')} trate set-base <currency>`);
      return;
    }
    if (!validateCurrency(newBase)) {
      console.log(`  ${colors.red('Error:')} ${t('error.invalidCurrency')}: ${newBase}`);
      console.log(`  ${colors.dim(t('help.crypto') + ':')} ${getFiatList().join(', ')}`);
      return;
    }
    configService.baseCurrency = newBase;
    console.log(`  ${colors.green('✓')} ${t('success.baseCurrencySet')}: ${newBase}`);
    return;
  }

  if (cmd === 'set-lang') {
    const newLocale = args[1]?.toLowerCase() as Locale;
    if (!newLocale) {
      console.log(`  ${colors.red('Error:')} ${t('cli.specifyCurrency')}`);
      console.log(`  ${colors.dim(t('cli.usage') + ':')} trate set-lang <locale>`);
      console.log(
        `  ${colors.dim('Available:')} ${getSupportedLocales()
          .map(l => colors.cyan(l))
          .join(', ')}`
      );
      return;
    }
    if (!getSupportedLocales().includes(newLocale)) {
      console.log(`  ${colors.red('Error:')} ${t('error.invalidCurrency')}: ${newLocale}`);
      console.log(
        `  ${colors.dim('Available:')} ${getSupportedLocales()
          .map(l => `${colors.cyan(l)} (${getLocaleDisplayName(l)})`)
          .join(', ')}`
      );
      return;
    }
    configService.locale = newLocale;
    setLocale(newLocale);
    console.log(`  ${colors.green('✓')} Language set to: ${getLocaleDisplayName(newLocale)}`);
    return;
  }

  if (cmd === 'add') {
    const cur = args[1]?.toUpperCase();
    if (!cur) {
      console.log(`  ${colors.red('Error:')} ${t('cli.specifyCurrency')}`);
      console.log(`  ${colors.dim(t('cli.usage') + ':')} trate add <currency>`);
      return;
    }
    if (!validateCurrency(cur)) {
      console.log(`  ${colors.red('Error:')} ${t('error.invalidCurrency')}: ${cur}`);
      return;
    }
    configService.addFavorite(cur);
    console.log(`  ${colors.green('✓')} ${t('success.added')}: ${cur}`);
    return;
  }

  if (cmd === 'remove') {
    const cur = args[1]?.toUpperCase();
    if (!cur) {
      console.log(`  ${colors.red('Error:')} ${t('cli.specifyCurrency')}`);
      console.log(`  ${colors.dim(t('cli.usage') + ':')} trate remove <currency>`);
      return;
    }
    configService.removeFavorite(cur);
    console.log(`  ${colors.green('✓')} ${t('success.removed')}: ${cur}`);
    return;
  }

  if (cmd === 'list' || cmd === 'favs') {
    await listCommand();
    return;
  }

  if (cmd === 'moon') {
    await moonCommand();
    return;
  }

  if (cmd === 'refresh') {
    cacheApi.clear();
    console.log(`  ${colors.green('✓')} ${t('success.cacheCleared')}`);
    return;
  }

  if (cmd === 'reset') {
    configService.reset();
    console.log(`  ${colors.green('✓')} ${t('success.settingsReset')}`);
    return;
  }

  if (cmd === 'help') {
    console.log(await helpText());
    return;
  }

  if (cmd === 'alias') {
    const subCmd = args[1]?.toLowerCase();
    const alias = args[2]?.toLowerCase();
    const currency = args[3]?.toUpperCase();

    if (subCmd === 'list') {
      const aliases = configService.aliases;
      const entries = Object.entries(aliases);
      if (entries.length === 0) {
        console.log(`\n  ${colors.dim('No aliases defined')}`);
      } else {
        console.log(`\n  ${colors.bold('Aliases:')}`);
        for (const [key, val] of entries) {
          console.log(`  ${colors.yellow(key)} → ${colors.cyan(val)}`);
        }
      }
      return;
    }

    if (subCmd === 'add') {
      if (!alias || !currency) {
        console.log(`  ${colors.red('Error:')} Specify alias and currency`);
        console.log(
          `  ${colors.dim('Usage:')} ${colors.cyan('trate alias add <alias> <currency>')}`
        );
        console.log(
          `  ${colors.dim('Example:')} ${colors.cyan('trate alias add ceyrek CEYREK_ALTIN')}`
        );
        return;
      }
      const resolvedCurrency = resolveAlias(currency);
      if (!validateCurrency(resolvedCurrency)) {
        console.log(`  ${colors.red('Error:')} Invalid currency: ${resolvedCurrency}`);
        return;
      }
      configService.addAlias(alias, resolvedCurrency);
      console.log(
        `  ${colors.green('✓')} Alias added: ${colors.yellow(alias)} → ${colors.cyan(resolvedCurrency)}`
      );
      return;
    }

    if (subCmd === 'remove') {
      if (!alias) {
        console.log(`  ${colors.red('Error:')} Specify alias to remove`);
        console.log(`  ${colors.dim('Usage:')} ${colors.cyan('trate alias remove <alias>')}`);
        return;
      }
      const removed = configService.removeAlias(alias);
      if (removed) {
        console.log(`  ${colors.green('✓')} Alias removed: ${colors.yellow(alias)}`);
      } else {
        console.log(`  ${colors.red('Error:')} Alias not found: ${colors.yellow(alias)}`);
      }
      return;
    }

    console.log(`  ${colors.bold('Alias Commands:')}`);
    console.log(`  ${colors.cyan('trate alias list')}          ${colors.dim('List all aliases')}`);
    console.log(
      `  ${colors.cyan('trate alias add <alias> <currency>')}  ${colors.dim('Add alias')}`
    );
    console.log(
      `  ${colors.cyan('trate alias remove <alias>')}         ${colors.dim('Remove alias')}`
    );
    return;
  }

  if (validateCurrency(cmd)) {
    await convertCommand(args);
  } else {
    await convertCommand(args.slice(1));
  }
});

program.parse();

process.on('SIGINT', () => {
  logger.debug('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.debug('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

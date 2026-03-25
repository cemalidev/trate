import figlet from 'figlet';

let cachedLogo: string | null = null;

export function getLogo(): string {
  if (cachedLogo) return cachedLogo;

  const dollarSign = figlet.textSync('$', {
    font: 'Slant',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  const trateText = figlet.textSync('trate', {
    font: 'Slant',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  const white = '\x1b[38;5;15m';
  const reset = '\x1b[0m';

  const dollarLines = dollarSign.split('\n');
  const trateLines = trateText.split('\n');

  const combined = dollarLines.map((line, i) => {
    const trateLine = trateLines[i] || '';
    return `${white}${line}${reset} ${white}${trateLine}${reset}`;
  });

  cachedLogo = combined.join('\n');
  return cachedLogo;
}

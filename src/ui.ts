const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

export const colors = {
  bold: (text: string) => `${COLORS.bold}${text}${COLORS.reset}`,
  dim: (text: string) => `${COLORS.dim}${text}${COLORS.reset}`,
  cyan: (text: string) => `${COLORS.cyan}${text}${COLORS.reset}`,
  green: (text: string) => `${COLORS.green}${text}${COLORS.reset}`,
  yellow: (text: string) => `${COLORS.yellow}${text}${COLORS.reset}`,
  red: (text: string) => `${COLORS.red}${text}${COLORS.reset}`,
  magenta: (text: string) => `${COLORS.magenta}${text}${COLORS.reset}`,
};

export function gradient(text: string): string {
  const gradientColors = [
    '\x1b[38;5;39m', // Cyan
    '\x1b[38;5;45m', // Light cyan
    '\x1b[38;5;50m', // Light green
    '\x1b[38;5;82m', // Green
  ];

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const colorIndex = Math.floor((i / text.length) * gradientColors.length);
    result += `${gradientColors[Math.min(colorIndex, gradientColors.length - 1)]}${text[i]}`;
  }
  return `${result}${COLORS.reset}`;
}

export function divider(width = 55): string {
  return colors.dim('─'.repeat(width));
}

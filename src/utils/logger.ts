export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

let currentLogLevel = LogLevel.INFO;
let isDebugMode = false;

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

export function setDebugMode(enabled: boolean): void {
  isDebugMode = enabled;
  if (enabled && currentLogLevel > LogLevel.DEBUG) {
    currentLogLevel = LogLevel.DEBUG;
  }
}

export function isDebugEnabled(): boolean {
  return isDebugMode;
}

function shouldLog(level: LogLevel): boolean {
  return level >= currentLogLevel;
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const levelName = LOG_LEVEL_NAMES[level];
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${levelName}] ${message}${metaStr}`;
}

export function debug(message: string, meta?: Record<string, unknown>): void {
  if (shouldLog(LogLevel.DEBUG)) {
    console.debug(formatMessage(LogLevel.DEBUG, message, meta));
  }
}

export function info(message: string, meta?: Record<string, unknown>): void {
  if (shouldLog(LogLevel.INFO)) {
    console.info(formatMessage(LogLevel.INFO, message, meta));
  }
}

export function warn(message: string, meta?: Record<string, unknown>): void {
  if (shouldLog(LogLevel.WARN)) {
    console.warn(formatMessage(LogLevel.WARN, message, meta));
  }
}

export function error(
  message: string,
  error?: Error | unknown,
  meta?: Record<string, unknown>
): void {
  if (shouldLog(LogLevel.ERROR)) {
    const errorMeta =
      error instanceof Error
        ? { ...meta, errorName: error.name, errorMessage: error.message }
        : { ...meta, error };
    console.error(formatMessage(LogLevel.ERROR, message, errorMeta));
  }
}

export const logger = {
  debug,
  info,
  warn,
  error,
  setLogLevel,
  setDebugMode,
  isDebugEnabled,
};

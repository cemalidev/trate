export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  CURRENCY_NOT_FOUND = 'CURRENCY_NOT_FOUND',
  RATE_NOT_FOUND = 'RATE_NOT_FOUND',
  CONFIG_ERROR = 'CONFIG_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class TrateError extends Error {
  public readonly code: ErrorCode;
  public readonly originalError?: Error;

  constructor(code: ErrorCode, message: string, originalError?: Error) {
    super(message);
    this.name = 'TrateError';
    this.code = code;
    this.originalError = originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TrateError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      stack: this.stack,
    };
  }
}

export function isTrateError(error: unknown): error is TrateError {
  return error instanceof TrateError;
}

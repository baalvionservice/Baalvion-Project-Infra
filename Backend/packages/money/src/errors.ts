/**
 * Money failures are always programmer errors or corrupt input — never something a caller
 * should paper over. Every one carries a stable `code` so services can audit-log the reason
 * without string-matching a message.
 */
export type MoneyErrorCode =
  | 'UNKNOWN_CURRENCY'
  | 'CURRENCY_MISMATCH'
  | 'INVALID_AMOUNT'
  | 'FLOAT_REJECTED'
  | 'PRECISION_LOSS'
  | 'UNSAFE_NUMBER'
  | 'DIVISION_BY_ZERO'
  | 'INVALID_WEIGHTS';

export class MoneyError extends Error {
  public readonly code: MoneyErrorCode;
  public readonly detail: Record<string, unknown>;

  constructor(code: MoneyErrorCode, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = 'MoneyError';
    this.code = code;
    this.detail = detail;
    Error.captureStackTrace?.(this, MoneyError);
  }
}

export class CurrencyMismatchError extends MoneyError {
  constructor(left: string, right: string) {
    super('CURRENCY_MISMATCH', `Cannot combine ${left} with ${right} — convert through fx-service first`, { left, right });
    this.name = 'CurrencyMismatchError';
  }
}

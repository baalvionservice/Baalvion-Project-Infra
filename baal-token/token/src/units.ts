// Integer-only token arithmetic. Nothing in this package may use floating
// point for token quantities: all amounts are BigInt base units or decimal
// strings parsed with strict regular expressions.

export const U64_MAX = 2n ** 64n - 1n;
export const BPS_DENOMINATOR = 10_000n;
export const MAX_SPL_DECIMALS = 9;

const UINT_RE = /^(0|[1-9][0-9]*)$/;
const PERCENT_RE = /^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$/;

/** Parses a canonical unsigned integer string (no sign, no leading zeros). */
export function parseUint(value: unknown): bigint | undefined {
  if (typeof value !== 'string' || !UINT_RE.test(value)) return undefined;
  return BigInt(value);
}

/** Parses "15" or "12.5" (max two decimals) into basis points (1500, 1250). */
export function parsePercentToBps(value: unknown): bigint | undefined {
  if (typeof value !== 'string' || !PERCENT_RE.test(value)) return undefined;
  const [whole = '0', fraction = ''] = value.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

export function isValidDecimals(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_SPL_DECIMALS;
}

export function tokensToBaseUnits(tokens: bigint, decimals: number): bigint {
  return tokens * 10n ** BigInt(decimals);
}

/** Floor of total * bps / 10_000. */
export function bpsOf(total: bigint, bps: bigint): bigint {
  return (total * bps) / BPS_DENOMINATOR;
}

export function groupDigits(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Renders base units as a decimal string, e.g. 1500000000n @ 9 -> "1.5". */
export function formatBaseUnits(baseUnits: bigint, decimals: number): string {
  const scale = 10n ** BigInt(decimals);
  const whole = baseUnits / scale;
  const fraction = (baseUnits % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
  return fraction === '' ? groupDigits(whole) : `${groupDigits(whole)}.${fraction}`;
}

/**
 * Markets data layer — the authoritative per-market currency / tax / FX registry.
 *
 * Sources GET /api/v1/commerce/markets (public, no auth) from commerce-service, which is the
 * single source of truth for each market's currencyCode, taxRate and fxRate (1 USD = fxRate CCY).
 * The static FE tables (mock-global-config COUNTRIES_CONFIG, mock-data FX_RATES) remain only as
 * an OFFLINE FALLBACK so the storefront still renders correct-ish pricing if the feed is down;
 * they are no longer the source of truth for checkout totals or price-filter ranges.
 *
 * Uses the PUBLIC storefront base (NEXT_PUBLIC_COMMERCE_URL, ends at /api/v1) — NOT the authed
 * api-client base. Reads are cached/revalidated (Next fetch revalidate; client memo).
 */
import type { CountryCode, TaxType } from './types';

const COMMERCE_URL = process.env.NEXT_PUBLIC_COMMERCE_URL || 'http://localhost:3012/api/v1';
const MARKETS_URL = `${COMMERCE_URL}/commerce/markets`;
const REVALIDATE_SECONDS = 300;

/** One market row, normalized to the FE CountryCode + TaxType vocabulary. */
export interface Market {
  country: CountryCode;
  name: string;
  currencyCode: string;
  locale: string;
  taxType: TaxType;
  taxRate: number;
  taxInclusive: boolean;
  /** 1 USD = fxRate of this market's currency. */
  fxRate: number;
  roundTo: number;
}

export interface MarketsRegistry {
  baseCurrency: string;
  defaultMarket: CountryCode;
  markets: Market[];
}

/** Raw backend market shape (config/markets.js → marketController.list). */
interface RawMarket {
  country?: string;
  name?: string;
  currency?: string;
  locale?: string;
  taxType?: string;
  taxRate?: number;
  taxInclusive?: boolean;
  fxRate?: number;
  roundTo?: number;
}
interface RawMarketsResponse {
  baseCurrency?: string;
  defaultMarket?: string;
  markets?: RawMarket[];
}

const SUPPORTED: CountryCode[] = ['us', 'uk', 'ae', 'in', 'sg'];
const TAX_TYPES: TaxType[] = ['GST', 'VAT', 'SALES_TAX'];

function asCountry(v: unknown): CountryCode | null {
  const c = typeof v === 'string' ? (v.trim().toLowerCase() as CountryCode) : null;
  return c && SUPPORTED.includes(c) ? c : null;
}
function asTaxType(v: unknown): TaxType {
  const t = typeof v === 'string' ? (v.trim().toUpperCase() as TaxType) : 'VAT';
  return TAX_TYPES.includes(t) ? t : 'VAT';
}
function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalize(raw: RawMarketsResponse): MarketsRegistry {
  const markets: Market[] = (raw.markets ?? [])
    .map((m): Market | null => {
      const country = asCountry(m.country);
      if (!country) return null;
      return {
        country,
        name: m.name ?? country.toUpperCase(),
        currencyCode: (m.currency ?? 'USD').toUpperCase(),
        locale: m.locale ?? 'en-US',
        taxType: asTaxType(m.taxType),
        taxRate: Number.isFinite(Number(m.taxRate)) ? Number(m.taxRate) : 0,
        taxInclusive: !!m.taxInclusive,
        fxRate: num(m.fxRate, 1),
        roundTo: num(m.roundTo, 1),
      };
    })
    .filter((m): m is Market => m !== null);

  return {
    baseCurrency: (raw.baseCurrency ?? 'USD').toUpperCase(),
    defaultMarket: asCountry(raw.defaultMarket) ?? 'us',
    markets,
  };
}

const EMPTY: MarketsRegistry = { baseCurrency: 'USD', defaultMarket: 'us', markets: [] };

/**
 * Fetch the authoritative markets registry. Returns an empty registry (markets:[]) on any
 * failure so callers transparently fall back to the static FE tables — never throws.
 */
export async function getMarkets(): Promise<MarketsRegistry> {
  try {
    const res = await fetch(MARKETS_URL, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return EMPTY;
    const json = (await res.json()) as { data?: RawMarketsResponse } | RawMarketsResponse;
    const payload =
      json && typeof json === 'object' && 'data' in json && json.data !== undefined
        ? (json as { data: RawMarketsResponse }).data
        : (json as RawMarketsResponse);
    return normalize(payload ?? {});
  } catch {
    return EMPTY;
  }
}

/** Convenience lookup of one market from a registry. */
export function getMarket(registry: MarketsRegistry, country: CountryCode): Market | undefined {
  return registry.markets.find((m) => m.country === country);
}

/**
 * @fileOverview Canonical multi-market country registry.
 *
 * Single source of truth for the 5 supported jurisdictions. Built on top of
 * COUNTRIES_CONFIG so the currency / tax / locale facts never drift. All helpers
 * here are PURE (no singleton state) so they are safe in Server Components,
 * middleware (edge), and Client Components alike.
 */
import { COUNTRIES_CONFIG } from "../mock-global-config";
import type { CountryCode, Product } from "../types";
import type { SupportedLanguage } from "./config";

/** The enabled jurisdictions, in display order. */
export const SUPPORTED_COUNTRIES: CountryCode[] = COUNTRIES_CONFIG.filter(
  (c) => c.enabled
).map((c) => c.code);

export const DEFAULT_COUNTRY: CountryCode = "us";

const CONFIG_BY_CODE = new Map(COUNTRIES_CONFIG.map((c) => [c.code, c]));

/** Country → default content language. AE leads in Arabic; the rest in English. */
const LANGUAGE_BY_COUNTRY: Record<CountryCode, SupportedLanguage> = {
  us: "en",
  uk: "en",
  ae: "ar",
  in: "en",
  sg: "en",
};

/** BCP-47 locale per country (used for <html lang>, hreflang, Intl). */
const LOCALE_BY_COUNTRY: Record<CountryCode, string> = {
  us: "en-US",
  uk: "en-GB",
  ae: "ar-AE",
  in: "en-IN",
  sg: "en-SG",
};

/** Currencies we actually support — guards against a malformed currencyCode reaching Intl. */
const SUPPORTED_CURRENCIES = new Set(COUNTRIES_CONFIG.map((c) => c.currency));

/** Case-insensitive: "UK", "uk", " Uk " all count as the supported market "uk". */
export function isSupportedCountry(value: unknown): value is CountryCode {
  return (
    typeof value === "string" &&
    SUPPORTED_COUNTRIES.includes(value.trim().toLowerCase() as CountryCode)
  );
}

/** Coerce any input to a valid supported country code (lower-cased), else the default. */
export function normalizeCountry(value: unknown): CountryCode {
  const lower = typeof value === "string" ? value.trim().toLowerCase() : "";
  return SUPPORTED_COUNTRIES.includes(lower as CountryCode)
    ? (lower as CountryCode)
    : DEFAULT_COUNTRY;
}

export function getCountryConfig(code: CountryCode) {
  return CONFIG_BY_CODE.get(code) ?? CONFIG_BY_CODE.get(DEFAULT_COUNTRY)!;
}

export function countryToLocale(code: CountryCode): string {
  return LOCALE_BY_COUNTRY[code] ?? LOCALE_BY_COUNTRY[DEFAULT_COUNTRY];
}

export function countryToLanguage(code: CountryCode): SupportedLanguage {
  return LANGUAGE_BY_COUNTRY[code] ?? "en";
}

export function directionForCountry(code: CountryCode): "ltr" | "rtl" {
  return countryToLanguage(code) === "ar" ? "rtl" : "ltr";
}

export function currencyForCountry(code: CountryCode): string {
  return getCountryConfig(code).currency;
}

/**
 * Pure, jurisdiction-aware money formatter. Uses the country's own locale +
 * currency so the SAME base amount renders as $, £, د.إ, ₹ or S$ correctly.
 * NOTE: this formats the amount as-given (no FX conversion) — pair with the
 * FX engine when converted hub pricing is required.
 */
export function formatMoney(
  amount: number,
  code: CountryCode,
  opts: { withDecimals?: boolean } = {}
): string {
  const cfg = getCountryConfig(code);
  const fractionDigits = opts.withDecimals ? 2 : 0;
  try {
    return new Intl.NumberFormat(countryToLocale(code), {
      style: "currency",
      currency: cfg.currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    // Defensive: never break the render over an exotic currency/locale combo.
    return `${cfg.symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Format an amount in an EXPLICIT currency (as returned by the storefront API),
 * rendered with the market's locale. Use this when the server already converted
 * the price; use `formatMoney` only for a raw base amount in the country's currency.
 */
export function formatAmount(
  amount: number,
  currencyCode: string,
  code: CountryCode = DEFAULT_COUNTRY,
  opts: { withDecimals?: boolean } = {}
): string {
  const safeAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
  const ccy = (currencyCode || "").trim().toUpperCase();
  // Reject anything outside the supported set before handing it to Intl, so a malformed
  // backend currency can never render as raw text to a shopper.
  if (!SUPPORTED_CURRENCIES.has(ccy)) {
    return formatMoney(safeAmount, code, opts);
  }
  const fractionDigits = opts.withDecimals ? 2 : 0;
  try {
    return new Intl.NumberFormat(countryToLocale(code), {
      style: "currency",
      currency: ccy,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(safeAmount);
  } catch {
    return formatMoney(safeAmount, code, opts);
  }
}

/**
 * Canonical price renderer for a catalog product in a given market.
 * Prefers the server-resolved `price` + `currencyCode` (real FX); falls back to
 * formatting `basePrice` in the country's currency when the API gave no country pricing.
 */
export function formatProductPrice(
  product: Pick<Product, "price" | "currencyCode" | "basePrice">,
  code: CountryCode,
  opts: { withDecimals?: boolean } = {}
): string {
  if (typeof product.price === "number" && product.currencyCode) {
    return formatAmount(product.price, product.currencyCode, code, opts);
  }
  return formatMoney(product.basePrice ?? 0, code, opts);
}

/** Per-market psychological rounding (mirrors commerce-service config/markets.js). */
const FILTER_ROUND_TO: Partial<Record<CountryCode, number>> = { in: 100, ae: 10 };

/** Convert a BASE (USD) amount to a market's currency for client-side display (e.g. price filters). */
export function convertFromUsd(amountUsd: number, code: CountryCode): number {
  const safe = Number.isFinite(amountUsd) && amountUsd >= 0 ? amountUsd : 0;
  const rate = getCountryConfig(code).fxRate ?? 1;
  const converted = safe * rate;
  const roundTo = FILTER_ROUND_TO[code] ?? 1;
  return roundTo > 1 ? Math.round(converted / roundTo) * roundTo : Math.round(converted);
}

/** Convert a market-currency amount back to BASE (USD) — used when a user types into a market-currency input. */
export function convertToUsd(amountMarket: number, code: CountryCode): number {
  const safe = Number.isFinite(amountMarket) && amountMarket >= 0 ? amountMarket : 0;
  const rate = getCountryConfig(code).fxRate ?? 1;
  return rate ? Math.round(safe / rate) : safe;
}

/**
 * Format a BASE (USD) amount for a price-filter label in the market's currency:
 * FX-converted, market symbol, market locale grouping (e.g. ₹65,30,000 for IN). No decimals.
 */
export function formatFilterPrice(amountUsd: number, code: CountryCode): string {
  const cfg = getCountryConfig(code);
  return `${cfg.symbol}${convertFromUsd(amountUsd, code).toLocaleString(countryToLocale(code))}`;
}

/**
 * Best-effort country detection from an `Accept-Language` header. Used by
 * middleware for the root redirect when no explicit country is in the URL.
 */
export function detectCountryFromAcceptLanguage(
  header: string | null | undefined
): CountryCode {
  if (!header) return DEFAULT_COUNTRY;
  const lower = header.toLowerCase();

  // Region hints first (most specific).
  const regionMatches: [RegExp, CountryCode][] = [
    [/\b[a-z]{2}-gb\b/, "uk"],
    [/\b[a-z]{2}-ae\b/, "ae"],
    [/\b[a-z]{2}-in\b/, "in"],
    [/\b[a-z]{2}-sg\b/, "sg"],
    [/\b[a-z]{2}-us\b/, "us"],
  ];
  for (const [re, code] of regionMatches) {
    if (re.test(lower)) return code;
  }

  // Language hints as a fallback.
  if (lower.startsWith("ar")) return "ae";
  if (lower.startsWith("hi")) return "in";

  return DEFAULT_COUNTRY;
}

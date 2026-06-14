'use strict';
/**
 * Canonical multi-market registry for ORDER pricing (US / UK / AE / IN / SG).
 *
 * ⚠️  MIRROR of commerce-service/config/markets.js — it MUST stay byte-for-byte
 * logically identical so that the price the storefront DISPLAYS (commerce-service
 * convertFromBase) equals the price the order PERSISTS (this module). Both services
 * read the SAME FX env vars (FX_USD_<CCY>) and the SAME live-feed Redis snapshot
 * (service/fxRateProvider.js, key commerce:fx:snapshot:usd), so the two are identical
 * in both static and live-feed modes. order-service and commerce-service are built and
 * deployed independently (turbo prune) and cannot share a relative require, hence the
 * mirror. FOLLOW-UP: extract to a shared @baalvion/markets package to remove the
 * duplication once the workspace contract review allows it.
 *
 * The store's catalog is authored once in a BASE currency (USD); the order is priced by
 * converting each line's base price to the order market's currency at create time (base
 * + FX, with per-market psychological rounding) and applying the market's tax rule
 * (inclusive VAT/GST vs exclusive sales tax).
 */

const fxRateProvider = require('../service/fxRateProvider');

const BASE_CURRENCY = 'USD';

const num = (envKey, fallback) => {
  const v = Number(process.env[envKey]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

// roundTo: nearest unit for psychological pricing per hub (matches the storefront FX engine).
const MARKETS = {
  us: { country: 'us', name: 'United States',        currency: 'USD', locale: 'en-US', taxType: 'SALES_TAX', taxRate: 8.5, taxInclusive: false, fxRate: num('FX_USD_USD', 1),     roundTo: 1 },
  uk: { country: 'uk', name: 'United Kingdom',       currency: 'GBP', locale: 'en-GB', taxType: 'VAT',       taxRate: 20,  taxInclusive: true,  fxRate: num('FX_USD_GBP', 0.79),  roundTo: 1 },
  ae: { country: 'ae', name: 'United Arab Emirates', currency: 'AED', locale: 'ar-AE', taxType: 'VAT',       taxRate: 5,   taxInclusive: true,  fxRate: num('FX_USD_AED', 3.67),  roundTo: 10 },
  in: { country: 'in', name: 'India',                currency: 'INR', locale: 'en-IN', taxType: 'GST',       taxRate: 18,  taxInclusive: true,  fxRate: num('FX_USD_INR', 83.3),  roundTo: 100 },
  sg: { country: 'sg', name: 'Singapore',           currency: 'SGD', locale: 'en-SG', taxType: 'GST',       taxRate: 7,   taxInclusive: true,  fxRate: num('FX_USD_SGD', 1.35),  roundTo: 1 },
};

const SUPPORTED_MARKETS = Object.keys(MARKETS);
const DEFAULT_MARKET = 'us';

function normalize(country) {
  return typeof country === 'string' ? country.trim().toLowerCase() : '';
}

function isSupportedMarket(country) {
  return SUPPORTED_MARKETS.includes(normalize(country));
}

function getMarket(country) {
  return MARKETS[normalize(country)] || null;
}

/** Public-safe market list (no internal-only fields today). */
function listMarkets() {
  return SUPPORTED_MARKETS.map((c) => ({ ...MARKETS[c] }));
}

function applyRounding(amount, roundTo) {
  if (!roundTo || roundTo <= 1) return Math.round(amount * 100) / 100; // 2dp
  return Math.round(amount / roundTo) * roundTo;
}

// Coerce any input to a safe, finite, non-negative amount. Money math must never emit
// NaN / Infinity / negative values.
function safeAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Convert a BASE-currency (USD) amount into a market's currency.
 * Returns the raw converted+rounded number (no formatting). Always finite & >= 0.
 */
function convertFromBase(amountBase, country, baseCurrency = BASE_CURRENCY) {
  const amt = safeAmount(amountBase);
  const m = getMarket(country);
  if (!m) return amt;
  // Only USD base is supported today (the Amarisé store is USD). If a non-USD base is
  // ever introduced, normalize to USD here before applying the market rate.
  if (baseCurrency !== BASE_CURRENCY) return amt;
  // Effective rate = the live-feed snapshot when one is enabled & fresh, else the static
  // m.fxRate (FX_USD_<CCY>/default). The provider guarantees a finite positive fallback.
  const fxRate = fxRateProvider.getEffectiveFxRate(m.currency, m.fxRate);
  const converted = applyRounding(amt * fxRate, m.roundTo);
  return Number.isFinite(converted) && converted >= 0 ? converted : 0;
}

/**
 * Resolve the full per-country price + tax envelope for a base (USD) amount.
 * Mirrors commerce-service's storefront serializer output so order line prices equal
 * the displayed prices.
 */
function priceFields(amountBase, country, baseCurrency = BASE_CURRENCY) {
  const amt = safeAmount(amountBase);
  const m = getMarket(country);
  if (!m) {
    return { price: amt, currencyCode: baseCurrency };
  }
  return {
    price: convertFromBase(amt, country, baseCurrency),
    currencyCode: m.currency,
    taxType: m.taxType,
    taxRate: m.taxRate,
    taxInclusive: m.taxInclusive,
  };
}

module.exports = {
  BASE_CURRENCY,
  MARKETS,
  SUPPORTED_MARKETS,
  DEFAULT_MARKET,
  isSupportedMarket,
  getMarket,
  listMarkets,
  convertFromBase,
  priceFields,
};

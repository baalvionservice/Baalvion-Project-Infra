'use strict';

/**
 * Jurisdiction-aware tax engine. The decision + computation core is PURE
 * (unit-tested): India GST (intra-state CGST+SGST split vs inter-state IGST),
 * EU VAT with B2B reverse-charge, US state sales tax, exemptions and tax-ID
 * validation. The async layer loads rates/exemptions from `tax_rates` /
 * `tax_exemptions` and calls the pure core, so taxation is correct + auditable.
 *
 * Supplier jurisdiction is the platform's place of supply (env-configured).
 */

const db = require('../models');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

const SUPPLIER_COUNTRY = (process.env.SUPPLIER_COUNTRY || 'in').toLowerCase();
const SUPPLIER_REGION = (process.env.SUPPLIER_STATE || 'ka').toLowerCase();

const EU = new Set(['at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se']);

// ── tax-id validation (format-level; real validation hits VIES/GSTIN APIs) ─────
const TAX_ID_PATTERNS = {
  in: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, // GSTIN
  us: /^[0-9]{2}-?[0-9]{7}$/,                                       // EIN
  eu: /^[A-Z]{2}[0-9A-Z]{2,12}$/,                                    // EU VAT (generic)
};

function validateTaxId(country, taxId) {
  if (!taxId) return false;
  const c = String(country || '').toLowerCase();
  const id = String(taxId).toUpperCase().replace(/\s/g, '');
  if (c === 'in') return TAX_ID_PATTERNS.in.test(id);
  if (c === 'us') return TAX_ID_PATTERNS.us.test(id);
  if (EU.has(c)) return TAX_ID_PATTERNS.eu.test(id);
  return id.length >= 5; // permissive for other jurisdictions
}

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

// ── pure regime computations ───────────────────────────────────────────────────

/** India GST: intra-state splits into CGST+SGST; inter-state is a single IGST. */
function indiaGst(amount, rate, intraState) {
  if (rate <= 0) return [];
  if (intraState) {
    const half = round2(amount * (rate / 2));
    return [
      { type: 'cgst', rate: rate / 2, amount: half },
      { type: 'sgst', rate: rate / 2, amount: half },
    ];
  }
  return [{ type: 'igst', rate, amount: round2(amount * rate) }];
}

/**
 * EU VAT. B2B cross-border with a valid VAT ID → reverse charge (0 tax, customer
 * self-accounts). Otherwise VAT at the applicable rate.
 */
function euVat(amount, rate, { b2b, validVatId, crossBorder }) {
  if (b2b && validVatId && crossBorder) {
    return { lines: [], reverseCharge: true };
  }
  return { lines: rate > 0 ? [{ type: 'vat', rate, amount: round2(amount * rate) }] : [], reverseCharge: false };
}

/** US sales tax: state rate; exempt resellers pay nothing. */
function usSalesTax(amount, rate, exempt) {
  if (exempt || rate <= 0) return [];
  return [{ type: 'sales', rate, amount: round2(amount * rate) }];
}

/** Decide which regime applies from supplier/customer jurisdictions. */
function resolveRegime(customerCountry) {
  const c = String(customerCountry || SUPPLIER_COUNTRY).toLowerCase();
  if (c === 'in') return 'gst';
  if (EU.has(c)) return 'vat';
  if (c === 'us') return 'sales';
  return 'none'; // exports / no-nexus jurisdictions: zero-rated
}

/**
 * Master PURE computation. Returns itemized tax lines + summary.
 * @param {object} i
 * @param {number} i.amount          taxable subtotal
 * @param {string} i.customerCountry ISO2
 * @param {string} [i.customerRegion] state/province
 * @param {boolean} [i.b2b]
 * @param {boolean} [i.validTaxId]
 * @param {boolean} [i.exempt]
 * @param {number} i.rate            applicable headline rate (fraction) for the regime
 */
function computeTax(i) {
  const amount = Math.max(0, Number(i.amount || 0));
  if (i.exempt) return { lines: [], totalTax: 0, regime: 'exempt', reverseCharge: false };

  const regime = resolveRegime(i.customerCountry);
  const rate = Number(i.rate || 0);
  let lines = [];
  let reverseCharge = false;

  if (regime === 'gst') {
    const intra = String(i.customerRegion || '').toLowerCase() === SUPPLIER_REGION && String(i.customerCountry).toLowerCase() === SUPPLIER_COUNTRY;
    lines = indiaGst(amount, rate, intra);
  } else if (regime === 'vat') {
    const crossBorder = String(i.customerCountry).toLowerCase() !== SUPPLIER_COUNTRY;
    const r = euVat(amount, rate, { b2b: !!i.b2b, validVatId: !!i.validTaxId, crossBorder });
    lines = r.lines; reverseCharge = r.reverseCharge;
  } else if (regime === 'sales') {
    lines = usSalesTax(amount, rate, !!i.exempt);
  }

  const totalTax = round2(lines.reduce((s, l) => s + l.amount, 0));
  return { lines, totalTax, regime, reverseCharge };
}

// ── async layer: load rates/exemptions, compute, return ─────────────────────────

async function rateFor(country, region, regime) {
  const typeByRegime = { gst: 'gst', vat: 'vat', sales: 'sales' };
  const rows = await db.sequelize.query(
    `SELECT rate FROM tax_rates
     WHERE country = :c AND (region = :r OR region = '') AND tax_type IN (:gst,'igst', :t)
     ORDER BY (region = :r) DESC, effective_from DESC LIMIT 1`,
    { replacements: { c: String(country || '').toLowerCase(), r: String(region || '').toLowerCase(), gst: 'gst', t: typeByRegime[regime] || regime }, type: Q.SELECT },
  ).catch(() => []);
  return rows.length ? Number(rows[0].rate) : 0;
}

async function getExemption(orgId) {
  const rows = await db.sequelize.query(
    `SELECT country, tax_id, exempt, reverse_charge FROM tax_exemptions WHERE org_id = :org`,
    { replacements: { org: orgId }, type: Q.SELECT },
  ).catch(() => []);
  return rows[0] || null;
}

/** Compute tax for an org's invoice subtotal using stored rates + exemptions. */
async function taxForInvoice({ orgId, amount, customerCountry, customerRegion, b2b = false }) {
  try {
    const ex = await getExemption(orgId);
    const country = customerCountry || ex?.country || SUPPLIER_COUNTRY;
    const regime = resolveRegime(country);
    const rate = await rateFor(country, customerRegion, regime);
    const validTaxId = ex ? validateTaxId(country, ex.tax_id) : false;
    return computeTax({
      amount, customerCountry: country, customerRegion, b2b: b2b || (ex?.reverse_charge ?? false),
      validTaxId, exempt: ex?.exempt ?? false, rate,
    });
  } catch (err) {
    logger.error('[tax] computation failed:', err.message);
    return { lines: [], totalTax: 0, regime: 'error', reverseCharge: false };
  }
}

module.exports = {
  validateTaxId, indiaGst, euVat, usSalesTax, resolveRegime, computeTax, taxForInvoice,
  EU, SUPPLIER_COUNTRY, SUPPLIER_REGION,
};

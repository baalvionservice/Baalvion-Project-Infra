'use strict';

/**
 * Pricing math — the deterministic core of the billing engine. Pure functions
 * (no I/O) so they are unit-testable and auditable. All money is computed in
 * integer "minor units" intent but represented as numbers rounded to cents;
 * GB is bytes / 1024^3.
 */

const BYTES_PER_GB = 1024 * 1024 * 1024;

// Per-plan billing config. includedGb is a fallback when the organization row
// has no explicit allowance; hardCeilingGb is the absolute cut-off that blocks
// traffic even when overage billing is enabled (runaway protection).
const PLAN_PRICING = {
  starter:      { includedGb: 5,    overagePerGb: 5.0, hardCeilingGb: 50,     requestPricePer1k: 0 },
  growth:       { includedGb: 100,  overagePerGb: 3.0, hardCeilingGb: 2000,   requestPricePer1k: 0 },
  professional: { includedGb: 100,  overagePerGb: 3.0, hardCeilingGb: 2000,   requestPricePer1k: 0 },
  enterprise:   { includedGb: 1000, overagePerGb: 1.5, hardCeilingGb: 200000, requestPricePer1k: 0 },
};

function planPricing(slug) {
  return PLAN_PRICING[slug] || PLAN_PRICING.starter;
}

// Premium geo multipliers applied to overage $/GB (residential exits in hard
// geos cost more upstream). Default 1.0.
const GEO_MULTIPLIERS = {
  us: 1.0, gb: 1.0, de: 1.0, fr: 1.0, ca: 1.0,
  // harder/more expensive markets:
  jp: 1.25, kr: 1.25, br: 1.2, in: 1.15, au: 1.2,
  // sanctioned-adjacent / scarce:
  ru: 1.5, cn: 1.6, ir: 1.8,
};

function bytesToGB(bytes) {
  return Number(bytes || 0) / BYTES_PER_GB;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function geoMultiplier(country) {
  if (!country) return 1.0;
  return GEO_MULTIPLIERS[String(country).toLowerCase()] ?? 1.0;
}

/**
 * Compute usage charges for a billing period.
 *
 * @param {object} input
 * @param {number} input.totalBytes          total billable bytes in the period
 * @param {object} input.geoBytes            { countryCode: bytes } for premium pricing
 * @param {number} input.includedGb          plan allowance (GB)
 * @param {number} input.overagePerGb        $/GB beyond the allowance
 * @param {number} [input.requests]          total requests
 * @param {number} [input.requestPricePer1k] $ per 1000 requests (0 = off)
 * @param {number} [input.taxRate]           e.g. 0.18 for 18% GST
 * @param {number} [input.prepaidCredits]    $ of prepaid credit to consume
 * @returns {object} itemized, immutable-friendly charge breakdown
 */
function computeCharges(input) {
  const includedGb = Number(input.includedGb || 0);
  const overagePerGb = Number(input.overagePerGb || 0);
  const totalGb = bytesToGB(input.totalBytes);
  const overageGb = Math.max(0, totalGb - includedGb);

  // Distribute overage GB across geos proportionally to weight by premium.
  const geoBytes = input.geoBytes || {};
  const geoTotal = Object.values(geoBytes).reduce((s, b) => s + Number(b || 0), 0);
  let overageAmount = 0;
  const lineItems = [];

  if (overageGb > 0 && overagePerGb > 0) {
    if (geoTotal > 0) {
      // Premium-weighted overage: the overage GB inherit the period's geo mix.
      let weightedRate = 0;
      for (const [cc, b] of Object.entries(geoBytes)) {
        const share = Number(b) / geoTotal;
        weightedRate += share * overagePerGb * geoMultiplier(cc);
      }
      overageAmount = overageGb * weightedRate;
      lineItems.push({
        kind: 'bandwidth_overage',
        description: `${round2(overageGb)} GB over allowance (geo-weighted)`,
        quantity: round2(overageGb),
        unitPrice: round2(weightedRate),
        amount: round2(overageAmount),
      });
    } else {
      overageAmount = overageGb * overagePerGb;
      lineItems.push({
        kind: 'bandwidth_overage',
        description: `${round2(overageGb)} GB over allowance`,
        quantity: round2(overageGb),
        unitPrice: round2(overagePerGb),
        amount: round2(overageAmount),
      });
    }
  }

  // Optional request-based billing.
  let requestAmount = 0;
  const reqPrice = Number(input.requestPricePer1k || 0);
  if (reqPrice > 0 && input.requests) {
    requestAmount = (Number(input.requests) / 1000) * reqPrice;
    lineItems.push({
      kind: 'requests',
      description: `${input.requests} requests`,
      quantity: input.requests,
      unitPrice: reqPrice,
      amount: round2(requestAmount),
    });
  }

  const subtotalBeforeCredits = overageAmount + requestAmount;

  // Consume prepaid credits against the subtotal.
  const credits = Math.max(0, Number(input.prepaidCredits || 0));
  const creditsApplied = Math.min(credits, subtotalBeforeCredits);
  if (creditsApplied > 0) {
    lineItems.push({
      kind: 'prepaid_credit',
      description: 'Prepaid credit applied',
      quantity: 1,
      unitPrice: -round2(creditsApplied),
      amount: -round2(creditsApplied),
    });
  }

  const taxable = Math.max(0, subtotalBeforeCredits - creditsApplied);
  const taxRate = Number(input.taxRate || 0);
  const tax = round2(taxable * taxRate);
  const total = round2(taxable + tax);

  return {
    totalGb: round2(totalGb),
    includedGb,
    overageGb: round2(overageGb),
    subtotal: round2(subtotalBeforeCredits),
    creditsApplied: round2(creditsApplied),
    taxRate,
    tax,
    total,
    lineItems,
  };
}

module.exports = { computeCharges, bytesToGB, round2, geoMultiplier, planPricing, BYTES_PER_GB, GEO_MULTIPLIERS, PLAN_PRICING };

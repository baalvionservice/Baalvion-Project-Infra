'use strict';

/**
 * Marketplace — product catalog, dynamic pricing (regional multipliers, volume
 * discounts, promotions), and enterprise quotes. The pricing core is PURE and
 * unit-tested; the async layer loads catalog/promotions/regional pricing and
 * persists quotes.
 */

const db = require('../models');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/** Highest applicable volume-discount tier. tiers = [{minQty, discountPct}]. */
function volumeDiscount(qty, tiers = []) {
  let best = 0;
  for (const t of tiers) if (qty >= Number(t.minQty)) best = Math.max(best, clamp(Number(t.discountPct) || 0, 0, 100));
  return best; // percent
}

/** Apply a promotion to an amount. Returns { amount, discount, bonusGb }. */
function applyPromotion(amount, promo) {
  if (!promo) return { amount: round2(amount), discount: 0, bonusGb: 0 };
  if (promo.kind === 'percent') {
    const d = round2(amount * clamp(Number(promo.value) / 100, 0, 1));
    return { amount: round2(amount - d), discount: d, bonusGb: 0 };
  }
  if (promo.kind === 'fixed') {
    const d = Math.min(amount, round2(Number(promo.value)));
    return { amount: round2(amount - d), discount: d, bonusGb: 0 };
  }
  if (promo.kind === 'bonus_gb') return { amount: round2(amount), discount: 0, bonusGb: Number(promo.value) || 0 };
  return { amount: round2(amount), discount: 0, bonusGb: 0 };
}

/**
 * Price a product line.
 * @param {object} i { basePrice, qty, regionMultiplier=1, volumeTiers=[], promo=null }
 */
function priceProduct(i) {
  const qty = Math.max(0, Number(i.qty) || 0);
  const regionMult = Number(i.regionMultiplier) || 1;
  const unitPrice = round2(Number(i.basePrice) * regionMult);
  const gross = round2(unitPrice * qty);

  const volPct = volumeDiscount(qty, i.volumeTiers || []);
  const afterVolume = round2(gross * (1 - volPct / 100));
  const volumeDiscountAmt = round2(gross - afterVolume);

  const promoResult = applyPromotion(afterVolume, i.promo);
  return {
    unitPrice, qty, gross,
    volumeDiscountPct: volPct, volumeDiscount: volumeDiscountAmt,
    promoDiscount: promoResult.discount, bonusGb: promoResult.bonusGb,
    total: promoResult.amount, discount: round2(volumeDiscountAmt + promoResult.discount),
  };
}

/** Build a quote from priced line items. */
function buildQuote(lineItems) {
  const subtotal = round2(lineItems.reduce((s, li) => s + li.gross, 0));
  const discount = round2(lineItems.reduce((s, li) => s + li.discount, 0));
  const total = round2(lineItems.reduce((s, li) => s + li.total, 0));
  return { subtotal, discount, total, items: lineItems };
}

// ── async ─────────────────────────────────────────────────────────────────────
async function listProducts({ category } = {}) {
  return db.sequelize.query(
    `SELECT sku, name, category, base_price, unit, currency, metadata FROM marketplace_products
     WHERE active = true ${category ? 'AND category = :cat' : ''} ORDER BY category, base_price`,
    { replacements: { cat: category }, type: Q.SELECT },
  ).catch(() => []);
}

async function regionMultiplier(sku, region) {
  if (!region) return 1;
  const [r] = await db.sequelize.query(
    `SELECT multiplier FROM regional_pricing WHERE sku = :sku AND region = :region`,
    { replacements: { sku, region: String(region).toLowerCase() }, type: Q.SELECT },
  ).catch(() => [null]);
  return r ? Number(r.multiplier) : 1;
}

async function activePromotion(code) {
  if (!code) return null;
  const [p] = await db.sequelize.query(
    `SELECT id, code, kind, value, applies_to, max_redemptions, redeemed FROM promotions
     WHERE code = :code AND active = true AND (ends_at IS NULL OR ends_at > now()) AND starts_at <= now()`,
    { replacements: { code }, type: Q.SELECT },
  ).catch(() => [null]);
  if (!p) return null;
  if (p.max_redemptions != null && p.redeemed >= p.max_redemptions) return null;
  return p;
}

/** Price a line item by SKU with region + promo applied. */
async function priceForSku({ sku, qty, region, promoCode }) {
  const [product] = await db.sequelize.query(`SELECT base_price, currency FROM marketplace_products WHERE sku = :sku AND active = true`, { replacements: { sku }, type: Q.SELECT });
  if (!product) throw new Error(`unknown sku ${sku}`);
  const [mult, promo] = await Promise.all([regionMultiplier(sku, region), activePromotion(promoCode)]);
  const priced = priceProduct({ basePrice: Number(product.base_price), qty, regionMultiplier: mult, promo });
  return { sku, currency: product.currency, ...priced };
}

/** Create + persist an enterprise quote. */
async function createQuote({ orgId, resellerId, items, region, promoCode, validDays = 30 }) {
  const priced = [];
  for (const it of items) priced.push(await priceForSku({ sku: it.sku, qty: it.qty, region, promoCode }));
  const quote = buildQuote(priced);
  const [row] = await db.sequelize.query(
    `INSERT INTO quotes (org_id, reseller_id, items, subtotal, discount, total, valid_until, status)
     VALUES (:org, :res, :items::jsonb, :sub, :disc, :total, now() + (:days || ' days')::interval, 'draft') RETURNING id`,
    { replacements: { org: orgId || null, res: resellerId || null, items: JSON.stringify(priced), sub: quote.subtotal, disc: quote.discount, total: quote.total, days: validDays }, type: Q.SELECT },
  ).catch((e) => { logger.error('[marketplace] quote:', e.message); return [{ id: null }]; });
  return { quoteId: row.id, ...quote };
}

module.exports = { volumeDiscount, applyPromotion, priceProduct, buildQuote, listProducts, regionMultiplier, activePromotion, priceForSku, createQuote };

'use strict';

// Marketplace / reseller / affiliate pure-logic tests — `npm test` (node --test).
// Exercises channel money math: wholesale/commission/hierarchical revenue split,
// reseller hierarchy + cascading quota, affiliate attribution + fraud, marketplace
// pricing (regional+promo+volume), payouts + holds.

const { test } = require('node:test');
const assert = require('node:assert');

const pb = require('../service/partnerBilling');
const reseller = require('../service/resellerService');
const affiliate = require('../service/affiliateService');
const mkt = require('../service/marketplaceService');
const payout = require('../service/payoutService');
const fraud = require('../service/partnerFraud');
const channel = require('../service/channelAnalytics');
const gov = require('../service/partnerGovernance');

// ── partner billing ──────────────────────────────────────────────────────────
test('partnerBilling: wholesale + channel margin', () => {
  assert.strictEqual(pb.wholesalePrice(100, 0.3), 70);
  const m = pb.computeChannelMargin({ listPrice: 100, wholesalePrice: 70 });
  assert.strictEqual(m.margin, 30);
  assert.strictEqual(m.ratio, 0.3);
});

test('partnerBilling: commission by basis', () => {
  assert.strictEqual(pb.computeCommission({ revenue: 100, basis: 'recurring', recurringPct: 0.1 }), 10);
  assert.strictEqual(pb.computeCommission({ revenue: 100, basis: 'usage', usagePct: 0.25 }), 25);
  assert.strictEqual(pb.computeCommission({ basis: 'signup', signupBonus: 15 }), 15);
});

test('partnerBilling: hierarchical revenue split caps at 100% + platform residual', () => {
  const r = pb.splitRevenueHierarchy({
    customerRevenue: 100,
    chain: [{ partyId: 'sub', tier: 'sub_reseller', marginPct: 0.2 }, { partyId: 'master', tier: 'master', marginPct: 0.1 }],
  });
  assert.strictEqual(r.splits[0].amount, 20);  // selling sub-reseller
  assert.strictEqual(r.splits[1].amount, 10);  // master override
  assert.strictEqual(r.platformShare, 70);
  assert.strictEqual(r.channelTotal, 30);
  // over-allocation is clamped: 0.7 + 0.6 → second capped to 0.3
  const capped = pb.splitRevenueHierarchy({ customerRevenue: 100, chain: [{ partyId: 'a', marginPct: 0.7 }, { partyId: 'b', marginPct: 0.6 }] });
  assert.strictEqual(capped.splits[1].amount, 30);
  assert.strictEqual(capped.platformShare, 0);
});

test('partnerBilling: partnerProfitability nets commissions + costs', () => {
  const p = pb.partnerProfitability({ channelRevenue: 100, providerCost: 20, infraCost: 5, commissionsPaid: 30 });
  assert.strictEqual(p.grossMargin, 45); // 100-30-20-5
  assert.strictEqual(p.marginRatio, 0.45);
});

// ── reseller hierarchy ─────────────────────────────────────────────────────────
test('reseller: resolveChain walks to root; subtree collects descendants', () => {
  const byId = {
    sub: { id: 'sub', parentResellerId: 'master', tier: 'sub_reseller', marginPct: 0.2 },
    master: { id: 'master', parentResellerId: null, tier: 'master', marginPct: 0.4 },
  };
  const chain = reseller.resolveChain('sub', byId);
  assert.deepStrictEqual(chain.map((c) => c.id), ['sub', 'master']);

  const children = { master: ['sub1', 'sub2'], sub1: ['c1'] };
  const tree = reseller.subtree('master', children).sort();
  assert.deepStrictEqual(tree, ['c1', 'master', 'sub1', 'sub2']);
});

test('reseller: cascading quota check', () => {
  const ok = reseller.cascadeQuotaCheck(1000, [400, 300]);
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(ok.available, 300);
  const over = reseller.cascadeQuotaCheck(1000, [800, 400]);
  assert.strictEqual(over.ok, false);
  assert.strictEqual(over.overBy, 200);
  assert.strictEqual(reseller.cascadeQuotaCheck(null, [9999]).ok, true); // unlimited parent
});

test('reseller: aggregateSubtree sums metrics', () => {
  const agg = reseller.aggregateSubtree(['a', 'b'], { a: { customers: 5, revenue: 100, gb: 10 }, b: { customers: 3, revenue: 50, gb: 5 } });
  assert.strictEqual(agg.customers, 8);
  assert.strictEqual(agg.revenue, 150);
});

// ── affiliate ──────────────────────────────────────────────────────────────────
test('affiliate: last-touch attribution within window', () => {
  const now = Date.now();
  const touches = [
    { id: 't1', affiliateId: 'a1', landedAt: new Date(now - 40 * 86400000) }, // outside 30d
    { id: 't2', affiliateId: 'a2', landedAt: new Date(now - 5 * 86400000) },
    { id: 't3', affiliateId: 'a3', landedAt: new Date(now - 1 * 86400000) },
  ];
  const win = affiliate.attributeReferral(touches, new Date(now), 30, 'last_touch');
  assert.strictEqual(win.id, 't3');
  const first = affiliate.attributeReferral(touches, new Date(now), 30, 'first_touch');
  assert.strictEqual(first.id, 't2'); // t1 is outside window
  assert.strictEqual(affiliate.attributeReferral([touches[0]], new Date(now), 30), null); // all outside
});

test('affiliate: commission (first payment = one-time + recurring)', () => {
  const first = affiliate.computeAffiliateCommission({ revenue: 100, commissionPct: 0.2, recurringPct: 0.1, isFirstPayment: true });
  assert.strictEqual(first, 30); // 20 one-time + 10 recurring
  const recur = affiliate.computeAffiliateCommission({ revenue: 100, commissionPct: 0.2, recurringPct: 0.1, isFirstPayment: false });
  assert.strictEqual(recur, 10);
});

test('affiliate: validateReferral rejects self-referral + duplicates', () => {
  assert.strictEqual(affiliate.validateReferral({ affiliateOrgId: 'o1', referredOrgId: 'o1' }).valid, false);
  assert.strictEqual(affiliate.validateReferral({ affiliateIpHash: 'x', referredIpHash: 'x' }).valid, false);
  assert.strictEqual(affiliate.validateReferral({ alreadyConverted: true }).valid, false);
  assert.strictEqual(affiliate.validateReferral({ affiliateOrgId: 'o1', referredOrgId: 'o2' }).valid, true);
});

// ── marketplace pricing ──────────────────────────────────────────────────────────
test('marketplace: regional + volume + promo pricing', () => {
  const p = mkt.priceProduct({
    basePrice: 10, qty: 100, regionMultiplier: 1.2,
    volumeTiers: [{ minQty: 50, discountPct: 10 }],
    promo: { kind: 'percent', value: 5 },
  });
  // unit 12, gross 1200, -10% volume = 1080, -5% promo = 1026
  assert.strictEqual(p.unitPrice, 12);
  assert.strictEqual(p.gross, 1200);
  assert.strictEqual(p.volumeDiscount, 120);
  assert.strictEqual(p.total, 1026);
});

test('marketplace: applyPromotion kinds + buildQuote', () => {
  assert.strictEqual(mkt.applyPromotion(100, { kind: 'fixed', value: 30 }).amount, 70);
  assert.strictEqual(mkt.applyPromotion(100, { kind: 'bonus_gb', value: 50 }).bonusGb, 50);
  assert.strictEqual(mkt.volumeDiscount(120, [{ minQty: 50, discountPct: 10 }, { minQty: 100, discountPct: 20 }]), 20);
  const q = mkt.buildQuote([{ gross: 100, discount: 10, total: 90 }, { gross: 50, discount: 0, total: 50 }]);
  assert.strictEqual(q.subtotal, 150);
  assert.strictEqual(q.total, 140);
});

// ── payouts ──────────────────────────────────────────────────────────────────────
test('payout: computePayout nets fees + holds + threshold', () => {
  const p = payout.computePayout({ accrued: 1000, heldAmount: 100, feePct: 0.02, minThreshold: 50 });
  assert.strictEqual(p.fees, 20);
  assert.strictEqual(p.net, 880); // 1000 - 20 - 100
  assert.strictEqual(p.eligible, true);
  assert.strictEqual(payout.computePayout({ accrued: 30, minThreshold: 50 }).eligible, false);
  assert.strictEqual(payout.shouldHold(60, 50), true);
  assert.strictEqual(payout.shouldHold(40, 50), false);
});

// ── fraud ──────────────────────────────────────────────────────────────────────
test('fraud: affiliate IP clustering + reseller nested billing', () => {
  const aff = fraud.affiliateFraudScore({ clicks: 100, conversions: 60, distinctIps: 10, churnedWithin7dPct: 0.8 });
  assert.strictEqual(aff.fraudulent, true);
  assert.ok(aff.reasons.includes('ip_clustering'));
  const res = fraud.resellerFraudScore({ quotaAllocatedRatio: 1.5, selfCustomer: true, kybApproved: false });
  assert.strictEqual(res.fraudulent, true);
  assert.ok(res.reasons.includes('nested_billing_self_customer'));
  assert.strictEqual(fraud.resellerFraudScore({ quotaAllocatedRatio: 0.5, kybApproved: true }).fraudulent, false);
});

// ── channel analytics + governance ───────────────────────────────────────────────
test('channel: leaderboard ranking + conversion rate', () => {
  const ranked = channel.rankLeaderboard([{ id: 'a', revenue: 50 }, { id: 'b', revenue: 200 }, { id: 'c', revenue: 100 }]);
  assert.strictEqual(ranked[0].id, 'b');
  assert.strictEqual(ranked[0].rank, 1);
  assert.strictEqual(channel.conversionRate(200, 50), 0.25);
});

test('governance: region allowlist + denylist', () => {
  assert.strictEqual(gov.isRegionAllowed([], 'us'), true);            // unrestricted
  assert.strictEqual(gov.isRegionAllowed(['us', 'ca'], 'us'), true);  // allowlist hit
  assert.strictEqual(gov.isRegionAllowed(['us', 'ca'], 'de'), false); // allowlist miss
  assert.strictEqual(gov.isRegionAllowed(['!ru'], 'ru'), false);      // denylist hit
  assert.strictEqual(gov.isRegionAllowed(['!ru'], 'us'), true);       // denylist miss
});

'use strict';

// Financial-operations pure-logic tests — `npm test` (node --test), no DB/Redis.
// Exercises the REAL money math: tax regimes, provider cost models + contracts,
// infra attribution, profitability, reconciliation, ledger, refunds, ERP journals.

const { test } = require('node:test');
const assert = require('node:assert');

const tax = require('../service/taxEngine');
const provider = require('../service/providerCostEngine');
const infra = require('../service/infraCostAttribution');
const profit = require('../service/profitabilityEngine');
const recon = require('../service/reconciliationEngine');
const provRecon = require('../service/providerReconciliation');
const ledger = require('../service/financeLedger');
const risk = require('../service/financeRiskEngine');
const erp = require('../service/erpExport');

// ── tax engine ──────────────────────────────────────────────────────────────
test('tax: India intra-state GST splits into CGST + SGST', () => {
  const lines = tax.indiaGst(100, 0.18, true);
  assert.strictEqual(lines.length, 2);
  assert.strictEqual(lines[0].type, 'cgst');
  assert.strictEqual(lines[1].type, 'sgst');
  assert.strictEqual(lines[0].amount + lines[1].amount, 18);
});

test('tax: India inter-state is single IGST', () => {
  const lines = tax.indiaGst(100, 0.18, false);
  assert.strictEqual(lines.length, 1);
  assert.strictEqual(lines[0].type, 'igst');
  assert.strictEqual(lines[0].amount, 18);
});

test('tax: EU B2B cross-border with valid VAT ID → reverse charge (0 tax)', () => {
  const r = tax.euVat(100, 0.2, { b2b: true, validVatId: true, crossBorder: true });
  assert.strictEqual(r.reverseCharge, true);
  assert.strictEqual(r.lines.length, 0);
  // B2C still charged
  const c = tax.euVat(100, 0.2, { b2b: false, validVatId: false, crossBorder: true });
  assert.strictEqual(c.reverseCharge, false);
  assert.strictEqual(c.lines[0].amount, 20);
});

test('tax: US sales tax exemption zeroes the line', () => {
  assert.strictEqual(tax.usSalesTax(100, 0.08, true).length, 0);
  assert.strictEqual(tax.usSalesTax(100, 0.08, false)[0].amount, 8);
});

test('tax: computeTax dispatches by regime + exemption short-circuits', () => {
  assert.strictEqual(tax.computeTax({ amount: 100, customerCountry: 'us', rate: 0.08 }).totalTax, 8);
  assert.strictEqual(tax.computeTax({ amount: 100, customerCountry: 'de', b2b: true, validTaxId: true, rate: 0.19 }).reverseCharge, true);
  assert.strictEqual(tax.computeTax({ amount: 100, customerCountry: 'us', exempt: true, rate: 0.08 }).totalTax, 0);
  assert.strictEqual(tax.resolveRegime('jp'), 'none'); // export / no nexus
});

test('tax: validateTaxId format checks', () => {
  assert.ok(tax.validateTaxId('in', '29ABCDE1234F1Z5'));
  assert.ok(!tax.validateTaxId('in', 'NOTAGSTIN'));
  assert.ok(tax.validateTaxId('de', 'DE123456789'));
});

// ── provider cost engine ──────────────────────────────────────────────────────
test('provider: tiered overage uses block (marginal) discounts', () => {
  // 0–100 @ $1, 100+ @ 20% off ($0.80). 150 GB → 100*1 + 50*0.8 = 140.
  const cost = provider.tieredOverageCost(150, 1, [{ thresholdGb: 100, discountPct: 20 }]);
  assert.strictEqual(cost, 140);
});

test('provider: contract = commit floor + discounted overage', () => {
  const r = provider.computeProviderCost(
    { gb: 1200 },
    {},
    { monthlyCommit: 1000, includedGb: 1000, overagePerGb: 2, minCharge: 0, volumeDiscounts: [] },
  );
  // 200 GB overage * $2 = 400, + 1000 commit = 1400
  assert.strictEqual(r.cost, 1400);
  assert.strictEqual(r.model, 'contract');
});

test('provider: usage model sums per-GB; geo premium overrides flat per-GB', () => {
  const flat = provider.computeProviderCost({ gb: 10 }, { perGb: 1 }, null);
  assert.strictEqual(flat.cost, 10);
  const geo = provider.computeProviderCost({ gb: 10, geoGb: { us: 6, jp: 4 } }, { perGb: 1, geo: { jp: 2 } }, null);
  // us 6*1 + jp 4*2 = 6 + 8 = 14 (flat per-GB replaced by geo)
  assert.strictEqual(geo.cost, 14);
});

test('provider: effectiveCostPerGb', () => {
  assert.strictEqual(provider.effectiveCostPerGb(140, 150), 0.93);
  assert.strictEqual(provider.effectiveCostPerGb(10, 0), 0);
});

// ── infra attribution ──────────────────────────────────────────────────────────
test('infra: proportional allocation by weight; even split fallback', () => {
  const a = infra.allocateProportional(100, { x: 3, y: 1 });
  assert.strictEqual(a.x, 75);
  assert.strictEqual(a.y, 25);
  const even = infra.allocateProportional(100, { a: 0, b: 0 });
  assert.strictEqual(even.a, 50);
});

test('infra: attributeInfraCosts uses the per-category driver', () => {
  const pools = [{ category: 'bandwidth', amount: 100 }, { category: 'k8s', amount: 60 }];
  const drivers = { o1: { gb: 80, requests: 100 }, o2: { gb: 20, requests: 200 } };
  const r = infra.attributeInfraCosts(pools, drivers);
  // bandwidth by gb: o1 80, o2 20; k8s by requests: o1 20, o2 40
  assert.strictEqual(r.o1.total, 100);
  assert.strictEqual(r.o2.total, 60);
  assert.strictEqual(r.o1.byCategory.bandwidth, 80);
  assert.strictEqual(r.o2.byCategory.k8s, 40);
});

// ── profitability ──────────────────────────────────────────────────────────────
test('profitability: margins computed ex-tax; classification', () => {
  const p = profit.computeProfitability({ revenue: 118, tax: 18, providerCost: 30, infraCost: 10 });
  // revenueExTax = 100; gross = 70; net = 60; ratio = 0.6
  assert.strictEqual(p.revenueExTax, 100);
  assert.strictEqual(p.grossMargin, 70);
  assert.strictEqual(p.netMargin, 60);
  assert.strictEqual(p.classification, 'strong');
  const neg = profit.computeProfitability({ revenue: 50, providerCost: 60, infraCost: 10 });
  assert.strictEqual(neg.classification, 'negative');
  assert.ok(neg.netMargin < 0);
});

test('profitability: classifyMargin thresholds', () => {
  assert.strictEqual(profit.classifyMargin(-0.1), 'negative');
  assert.strictEqual(profit.classifyMargin(0.1), 'thin');
  assert.strictEqual(profit.classifyMargin(0.3), 'healthy');
  assert.strictEqual(profit.classifyMargin(0.7), 'strong');
});

// ── reconciliation ──────────────────────────────────────────────────────────────
test('recon: within tolerance is ok; classifies lost events + overbilling', () => {
  assert.strictEqual(recon.classifyVariance(100, 100.5, 'usage', 1).classification, 'ok');
  // external > internal on usage → lost_events
  assert.strictEqual(recon.classifyVariance(90, 100, 'usage', 1).classification, 'lost_events');
  // external > internal on provider → overbilling
  assert.strictEqual(recon.classifyVariance(90, 100, 'provider', 1).classification, 'overbilling');
  // internal > external → underbilling (revenue leak)
  assert.strictEqual(recon.classifyVariance(110, 100, 'usage', 1).classification, 'underbilling');
});

test('recon: provider hidden surcharge detected when GB matches but $ is high', () => {
  const r = provRecon.detectOverbilling({ internalGb: 100, expectedCost: 100, billedGb: 100, billedAmount: 130 }, 2);
  assert.ok(r.findings.includes('hidden_surcharge'));
  assert.strictEqual(r.overbilledAmount, 30);
});

// ── ledger ──────────────────────────────────────────────────────────────────────
test('ledger: balance + FIFO consume + auto-recharge + expiry', () => {
  assert.strictEqual(ledger.computeBalance([{ amount: 100 }, { amount: -30 }, { amount: -10 }]), 60);

  const r = ledger.autoRechargeDecision(5, { enabled: true, threshold: 10, rechargeAmount: 50 });
  assert.strictEqual(r.shouldRecharge, true);
  assert.strictEqual(r.amount, 50);
  assert.strictEqual(ledger.autoRechargeDecision(50, { enabled: true, threshold: 10, rechargeAmount: 50 }).shouldRecharge, false);

  const lots = [
    { id: 1, amount: 30, createdAt: '2026-01-01' },
    { id: 2, amount: 30, createdAt: '2026-02-01' },
  ];
  const consume = ledger.fifoConsume(lots, 40);
  assert.strictEqual(consume.consumed[0].amount, 30); // oldest fully
  assert.strictEqual(consume.consumed[1].amount, 10);
  assert.strictEqual(consume.uncovered, 0);
  const over = ledger.fifoConsume(lots, 100);
  assert.strictEqual(over.uncovered, 40); // 60 covered, 40 postpaid

  const exp = ledger.expirationCandidates([{ id: 1, amount: 10, expiresAt: '2020-01-01' }, { id: 2, amount: 10, expiresAt: '2099-01-01' }]);
  assert.strictEqual(exp.length, 1);
  assert.strictEqual(exp[0].id, 1);
});

// ── refund / finance risk ────────────────────────────────────────────────────────
test('risk: refund approve/review/block decisions', () => {
  assert.strictEqual(risk.assessRefund({ refundAmount: 10, invoiceAmount: 100, accountAgeDays: 400, priorRefunds: 0 }).decision, 'approve');
  assert.strictEqual(risk.assessRefund({ refundAmount: 200, invoiceAmount: 100 }).decision, 'block'); // exceeds invoice
  const review = risk.assessRefund({ refundAmount: 80, invoiceAmount: 100, accountAgeDays: 5 });
  assert.ok(['review', 'block'].includes(review.decision));
});

test('risk: credit abuse score flags farming', () => {
  const clean = risk.creditAbuseScore({ creditsGranted: 100, creditsConsumed: 50, paidRevenue: 200 });
  assert.strictEqual(clean.abusive, false);
  const abusive = risk.creditAbuseScore({ creditsGranted: 100, creditsConsumed: 100, paidRevenue: 0, relatedSignups: 6, sharedPaymentMethods: 3 });
  assert.strictEqual(abusive.abusive, true);
});

// ── ERP export ────────────────────────────────────────────────────────────────
test('erp: invoice journal is balanced double-entry', () => {
  const lines = erp.invoiceJournal({ id: 1, orgId: 'o1', total: 118, tax: 18, issuedAt: '2026-05-01' });
  const s = erp.summarize(lines);
  assert.strictEqual(s.balanced, true);
  assert.strictEqual(s.totalDebits, 118);
  assert.strictEqual(s.totalCredits, 118); // 100 revenue + 18 tax
});

test('erp: provider cost accrual balances + CSV escapes', () => {
  const lines = erp.providerCostJournal({ provider: 'oxylabs', amount: 250, date: '2026-05-01', period: '2026-05' });
  assert.strictEqual(erp.summarize(lines).balanced, true);
  const csv = erp.toCsv(erp.invoiceJournal({ id: 2, orgId: 'o2', total: 100, tax: 0, issuedAt: '2026-05-01' }));
  assert.ok(csv.startsWith('Date,Account,'));
});

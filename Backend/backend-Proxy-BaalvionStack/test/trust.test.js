'use strict';

// Trust & Safety pure-logic tests — `npm test` (node --test), no DB/Redis.

const { test } = require('node:test');
const assert = require('node:assert');

const risk = require('../service/riskEngine');
const fraud = require('../service/paymentFraud');
const gdpr = require('../service/gdprService');

test('risk: clean org scores low', () => {
  const r = risk.computeRisk({ kycStatus: 'approved', asnReputation: 95 });
  assert.strictEqual(r.level, 'low');
  assert.deepStrictEqual(r.actions, []);
});

test('risk: sanctions hit → critical + suspend', () => {
  const r = risk.computeRisk({ sanctionsHit: true, kycStatus: 'approved' });
  assert.strictEqual(r.level, 'critical');
  assert.ok(r.actions.includes('suspend'));
  assert.ok(r.reasons.includes('sanctions_hit'));
});

test('risk: disposable email + failed payments + abuse → elevated', () => {
  const r = risk.computeRisk({ disposableEmail: true, failedPaymentVelocity: 3, abuseReports: 2, kycStatus: 'unverified' });
  assert.ok(r.score >= 30, `score ${r.score}`);
  assert.ok(['medium', 'high', 'critical'].includes(r.level));
});

test('risk: score is clamped 0..100', () => {
  const r = risk.computeRisk({ sanctionsHit: true, pepHit: true, kycStatus: 'rejected', disposableEmail: true, abuseReports: 10, failedPaymentVelocity: 10 });
  assert.ok(r.score <= 100 && r.score >= 0);
});

test('paymentFraud: clean → allow', () => {
  const r = fraud.assess({ failedPayments24h: 0, distinctCards24h: 1, amount: 20 });
  assert.strictEqual(r.decision, 'allow');
});

test('paymentFraud: card cycling + geo mismatch → review/block', () => {
  const r = fraud.assess({ distinctCards24h: 4, binCountry: 'ng', ipCountry: 'us', failedPayments24h: 3 });
  assert.ok(['review', 'block'].includes(r.decision));
  assert.ok(r.reasons.includes('card_cycling'));
});

test('paymentFraud: prior chargeback alone triggers review', () => {
  const r = fraud.assess({ chargebacksLifetime: 1 });
  assert.ok(r.score >= 40);
});

test('gdpr: anonymizeEmail is deterministic + non-identifying', () => {
  const a = gdpr.anonymizeEmail('alice@example.com');
  const b = gdpr.anonymizeEmail('alice@example.com');
  assert.strictEqual(a, b);
  assert.ok(a.endsWith('@anon.invalid'));
  assert.ok(!a.includes('alice'));
});

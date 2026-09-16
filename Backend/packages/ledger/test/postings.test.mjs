import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Money } from '@baalvion/money';
import {
  ACCOUNTS, increasesOnDebit, assertBalanced, trialBalance,
  postingsForPayment, postingsForRecognition, postingsForRefund, postingsForSettlement,
  LedgerError,
} from '../dist/index.mjs';

const INR = (s) => Money.fromDecimal(s, 'INR');
const AT = '2026-06-01T00:00:00.000Z';
const dims = { siteId: 'community', tenantId: 'community:founders-circle', partyId: 'party_1', legalEntityId: null };

const totalOf = (entry, side) =>
  entry.lines.filter((l) => l.side === side).reduce((s, l) => s.add(l.amount), Money.zero(entry.currency));

const assertBalances = (entry) =>
  assert.equal(totalOf(entry, 'DEBIT').toDecimalString(), totalOf(entry, 'CREDIT').toDecimalString(), `${entry.transactionRef} must balance`);

// ---------------------------------------------------------------- payments

test('a subscription payment creates a liability, not revenue', () => {
  const e = postingsForPayment({ ...dims, paymentId: 'p1', amount: INR('10000.55'), fee: INR('236.00'), earnedOnReceipt: false, occurredAt: AT });
  assertBalances(e);
  const by = Object.fromEntries(e.lines.map((l) => [l.account, l]));
  assert.equal(by.PSP_RECEIVABLE.amount.toDecimalString(), '9764.55'); // net of fees
  assert.equal(by.PROCESSOR_FEES.amount.toDecimalString(), '236.00');
  assert.equal(by.DEFERRED_REVENUE.amount.toDecimalString(), '10000.55'); // gross
  assert.equal(by.DEFERRED_REVENUE.side, 'CREDIT');
  // The whole point: cash in does not become revenue.
  assert.equal(by.REVENUE, undefined);
});

test('a one-off sale is earned on receipt', () => {
  const e = postingsForPayment({ ...dims, paymentId: 'p2', amount: INR('500.00'), fee: INR('12.00'), earnedOnReceipt: true, occurredAt: AT });
  assertBalances(e);
  const by = Object.fromEntries(e.lines.map((l) => [l.account, l]));
  assert.equal(by.REVENUE.amount.toDecimalString(), '500.00');
  assert.equal(by.DEFERRED_REVENUE, undefined);
});

test('an unknown fee posts no fee line rather than a zero one', () => {
  const e = postingsForPayment({ ...dims, paymentId: 'p3', amount: INR('1000.00'), earnedOnReceipt: false, occurredAt: AT });
  assertBalances(e);
  assert.equal(e.lines.find((l) => l.account === 'PROCESSOR_FEES'), undefined);
  assert.equal(e.lines.find((l) => l.account === 'PSP_RECEIVABLE').amount.toDecimalString(), '1000.00');
});

// ---------------------------------------------------------------- the full life of a subscription

test('a year of a subscription nets to revenue and leaves no liability', () => {
  const gross = INR('12000.00');
  const entries = [postingsForPayment({ ...dims, paymentId: 'sub1', amount: gross, fee: INR('283.20'), earnedOnReceipt: false, occurredAt: AT })];
  // Twelve monthly recognitions, split exactly so they sum to the gross.
  const monthly = gross.allocate(new Array(12).fill(1));
  monthly.forEach((amount, i) => {
    entries.push(postingsForRecognition({
      ...dims, obligationId: 'sub1', amount,
      periodStart: `2026-${String(i + 1).padStart(2, '0')}-01`,
      periodEnd: `2026-${String(i + 2).padStart(2, '0')}-01`,
      occurredAt: AT,
    }));
  });
  entries.forEach(assertBalances);

  const tb = trialBalance(entries, 'INR');
  assert.equal(tb.DEFERRED_REVENUE.net.toDecimalString(), '0.00', 'the liability must fully unwind');
  assert.equal(tb.REVENUE.net.toDecimalString(), '12000.00');
  assert.equal(tb.PROCESSOR_FEES.net.toDecimalString(), '283.20');
  // Net margin is answerable: revenue earned less what the processor kept.
  assert.equal(tb.REVENUE.net.subtract(tb.PROCESSOR_FEES.net).toDecimalString(), '11716.80');
});

// ---------------------------------------------------------------- refunds & settlement

test('a refund of undelivered service reduces the liability, not revenue', () => {
  const e = postingsForRefund({ ...dims, refundId: 'r1', amount: INR('3000.00'), fromDeferred: true, occurredAt: AT });
  assertBalances(e);
  assert.equal(e.lines.find((l) => l.account === 'DEFERRED_REVENUE').side, 'DEBIT');
  assert.equal(e.lines.find((l) => l.account === 'REFUNDS'), undefined);
});

test('a refund of earned revenue posts to contra-revenue, keeping gross visible', () => {
  const e = postingsForRefund({ ...dims, refundId: 'r2', amount: INR('500.00'), fromDeferred: false, occurredAt: AT });
  assertBalances(e);
  assert.equal(e.lines.find((l) => l.account === 'REFUNDS').side, 'DEBIT');
  // Revenue itself is untouched, so a heavy-refund month does not look like a quiet one.
  assert.equal(e.lines.find((l) => l.account === 'REVENUE'), undefined);
});

test('settlement turns a receivable into cash with no revenue effect', () => {
  const e = postingsForSettlement({ ...dims, settlementId: 's1', amount: INR('9764.55'), occurredAt: AT });
  assertBalances(e);
  assert.equal(e.lines.find((l) => l.account === 'BANK').side, 'DEBIT');
  assert.equal(e.lines.find((l) => l.account === 'PSP_RECEIVABLE').side, 'CREDIT');
  assert.equal(e.lines.find((l) => l.account === 'REVENUE'), undefined);
});

// ---------------------------------------------------------------- the guards

test('an unbalanced entry is refused, never posted', () => {
  const good = postingsForPayment({ ...dims, paymentId: 'p9', amount: INR('100.00'), earnedOnReceipt: true, occurredAt: AT });
  const broken = { ...good, lines: [{ ...good.lines[0], amount: INR('99.00') }, good.lines[1]] };
  assert.throws(() => assertBalanced(broken), (e) => e instanceof LedgerError && e.code === 'UNBALANCED');
});

test('direction is DEBIT/CREDIT, never a negative amount', () => {
  const good = postingsForPayment({ ...dims, paymentId: 'p10', amount: INR('100.00'), earnedOnReceipt: true, occurredAt: AT });
  const negative = { ...good, lines: [{ ...good.lines[0], amount: INR('-100.00') }, good.lines[1]] };
  assert.throws(() => assertBalanced(negative), (e) => e.code === 'NEGATIVE_LINE');
});

test('an entry cannot mix currencies', () => {
  const good = postingsForPayment({ ...dims, paymentId: 'p11', amount: INR('100.00'), earnedOnReceipt: true, occurredAt: AT });
  const mixed = { ...good, lines: [{ ...good.lines[0], amount: Money.fromDecimal('100.00', 'USD') }, good.lines[1]] };
  assert.throws(() => assertBalanced(mixed), (e) => e.code === 'CURRENCY_MISMATCH');
});

test('a fee larger than the payment is impossible', () => {
  assert.throws(
    () => postingsForPayment({ ...dims, paymentId: 'p12', amount: INR('100.00'), fee: INR('150.00'), earnedOnReceipt: true, occurredAt: AT }),
    (e) => e.code === 'INVALID_FEE',
  );
});

// ---------------------------------------------------------------- dimensions

test('every line carries its dimensions, legal entity included', () => {
  const e = postingsForPayment({ ...dims, legalEntityId: 'entity_in', paymentId: 'p13', amount: INR('100.00'), fee: INR('2.00'), earnedOnReceipt: false, occurredAt: AT });
  for (const l of e.lines) {
    assert.equal(l.legalEntityId, 'entity_in');
    assert.equal(l.siteId, 'community');
    assert.equal(l.tenantId, 'community:founders-circle');
    assert.equal(l.partyId, 'party_1');
    assert.ok(l.accountCode, 'every line needs an account code');
  }
});

test('legal entity is nullable today but present on every line', () => {
  // The column exists from the first commit on purpose: adding it later means re-posting
  // history, whereas assigning a real entity to an existing line is an update.
  const e = postingsForPayment({ ...dims, paymentId: 'p14', amount: INR('100.00'), earnedOnReceipt: true, occurredAt: AT });
  assert.ok(e.lines.every((l) => 'legalEntityId' in l));
  assert.equal(e.lines[0].legalEntityId, null);
});

test('the transaction reference is stable, so re-posting is idempotent', () => {
  const a = postingsForPayment({ ...dims, paymentId: 'p15', amount: INR('100.00'), earnedOnReceipt: true, occurredAt: AT });
  const b = postingsForPayment({ ...dims, paymentId: 'p15', amount: INR('100.00'), earnedOnReceipt: true, occurredAt: AT });
  assert.equal(a.transactionRef, b.transactionRef);
  assert.equal(a.transactionRef, 'pay:p15');
});

test('the chart follows the one rule it has', () => {
  assert.equal(increasesOnDebit(ACCOUNTS.PSP_RECEIVABLE.type), true);   // asset
  assert.equal(increasesOnDebit(ACCOUNTS.PROCESSOR_FEES.type), true);   // expense
  assert.equal(increasesOnDebit(ACCOUNTS.DEFERRED_REVENUE.type), false); // liability
  assert.equal(increasesOnDebit(ACCOUNTS.REVENUE.type), false);          // revenue
});

// ---------------------------------------------------------------- two-legged adapter

import { toTwoLeggedPostings, toLedgerServicePayload } from '../dist/index.mjs';

const sumPostings = (ps) => ps.reduce((s, p) => s.add(p.amount), INR('0.00'));

test('a three-leg payment becomes balanced pairs that sum to the original', () => {
  // The Java ledger-service stores one debit and one credit per row, so a payment with a fee
  // cannot go in as one entry.
  const e = postingsForPayment({ ...dims, paymentId: 'p1', amount: INR('10000.55'), fee: INR('236.00'), earnedOnReceipt: false, occurredAt: AT });
  const pairs = toTwoLeggedPostings(e);

  assert.equal(pairs.length, 2);
  assert.equal(sumPostings(pairs).toDecimalString(), '10000.55');
  // Each account's net movement must survive the split unchanged.
  const netFor = (account, side) => pairs
    .filter((p) => (side === 'DEBIT' ? p.debitAccount : p.creditAccount) === account)
    .reduce((s, p) => s.add(p.amount), INR('0.00'));
  assert.equal(netFor('PSP_RECEIVABLE', 'DEBIT').toDecimalString(), '9764.55');
  assert.equal(netFor('PROCESSOR_FEES', 'DEBIT').toDecimalString(), '236.00');
  assert.equal(netFor('DEFERRED_REVENUE', 'CREDIT').toDecimalString(), '10000.55');
});

test('a two-leg entry passes through as a single posting', () => {
  const e = postingsForRecognition({ ...dims, obligationId: 'ob1', amount: INR('1000.00'), periodStart: '2026-01-01', periodEnd: '2026-02-01', occurredAt: AT });
  const pairs = toTwoLeggedPostings(e);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].debitAccount, 'DEFERRED_REVENUE');
  assert.equal(pairs[0].creditAccount, 'REVENUE');
  assert.equal(pairs[0].amount.toDecimalString(), '1000.00');
});

test('the pairs stay identifiable as one economic event', () => {
  const e = postingsForPayment({ ...dims, paymentId: 'p2', amount: INR('100.00'), fee: INR('3.00'), earnedOnReceipt: true, occurredAt: AT });
  const refs = toTwoLeggedPostings(e).map((p) => p.transactionRef);
  assert.deepEqual(refs, ['pay:p2#1', 'pay:p2#2']);
  // Same input, same refs — so re-posting is still idempotent in a store keyed on the reference.
  assert.deepEqual(toTwoLeggedPostings(e).map((p) => p.transactionRef), refs);
});

test('every dimension survives the split', () => {
  const e = postingsForPayment({ ...dims, legalEntityId: 'entity_in', paymentId: 'p3', amount: INR('100.00'), fee: INR('3.00'), earnedOnReceipt: false, occurredAt: AT });
  for (const p of toTwoLeggedPostings(e)) {
    assert.equal(p.legalEntityId, 'entity_in');
    assert.equal(p.siteId, 'community');
    assert.equal(p.partyId, 'party_1');
  }
});

test('an unbalanced entry is refused before it can be split', () => {
  const good = postingsForPayment({ ...dims, paymentId: 'p4', amount: INR('100.00'), earnedOnReceipt: true, occurredAt: AT });
  const broken = { ...good, lines: [{ ...good.lines[0], amount: INR('99.00') }, good.lines[1]] };
  assert.throws(() => toTwoLeggedPostings(broken), (e) => e.code === 'UNBALANCED');
});

test('the ledger-service payload sends money as a string, never a float', () => {
  const e = postingsForPayment({ ...dims, paymentId: 'p5', amount: INR('10000.55'), fee: INR('236.00'), earnedOnReceipt: false, occurredAt: AT });
  const [first] = toTwoLeggedPostings(e);
  const payload = toLedgerServicePayload(first, (account, siteId) => `acct-${siteId}-${account}`);

  assert.equal(typeof payload.amount, 'string');
  assert.match(payload.amount, /^\d+\.\d{2}$/);
  assert.equal(payload.debitAccountId, 'acct-community-PSP_RECEIVABLE');
  // metadata is a JSON *string*: the receiving DTO field is `String metadata`, and Jackson
  // will not bind an object into it. An object here is a 400 on every posting.
  assert.equal(typeof payload.metadata, 'string');
  const meta = JSON.parse(payload.metadata);
  assert.equal(meta.siteId, 'community');
  assert.equal(meta.partyId, 'party_1');
});

test('a reference too long to be an idempotency key is rejected, never truncated', () => {
  // Two different postings truncated to the same ref would dedup against each other in a store
  // that keys on it, and one of them would silently disappear.
  const e = postingsForRecognition({
    ...dims,
    obligationId: 'ob'.padEnd(70, '0'),
    amount: INR('50.00'),
    periodStart: '2026-01-01',
    periodEnd: '2026-02-01',
    occurredAt: AT,
  });
  assert.throws(
    () => toLedgerServicePayload(toTwoLeggedPostings(e)[0], () => 'acct'),
    (err) => err.code === 'REF_TOO_LONG',
  );
});

test('entryType is one the ledger enum actually has', () => {
  const valid = new Set(['PAYMENT', 'FEE', 'REVERSAL', 'SETTLEMENT', 'ESCROW', 'REFUND', 'ADJUSTMENT']);
  const cases = [
    postingsForPayment({ ...dims, paymentId: 'p9', amount: INR('10.00'), earnedOnReceipt: true, occurredAt: AT }),
    postingsForRefund({ ...dims, refundId: 'r9', paymentId: 'p9', amount: INR('10.00'), occurredAt: AT }),
    postingsForRecognition({ ...dims, obligationId: 'o9', amount: INR('10.00'), periodStart: '2026-01-01', periodEnd: '2026-02-01', occurredAt: AT }),
  ];
  for (const entry of cases) {
    for (const posting of toTwoLeggedPostings(entry)) {
      // EntryType.valueOf() on the receiving side turns anything else into a 500.
      assert.ok(valid.has(toLedgerServicePayload(posting, () => 'acct').entryType));
    }
  }
});

test('a recognition maps to an entry type the ledger already knows', () => {
  const e = postingsForRecognition({ ...dims, obligationId: 'ob2', amount: INR('50.00'), periodStart: '2026-01-01', periodEnd: '2026-02-01', occurredAt: AT });
  const payload = toLedgerServicePayload(toTwoLeggedPostings(e)[0], () => 'acct');
  assert.equal(payload.entryType, 'ADJUSTMENT');
});

test('a full year splits without losing or inventing a single unit', () => {
  const gross = INR('12000.00');
  const entries = [postingsForPayment({ ...dims, paymentId: 'yr', amount: gross, fee: INR('283.20'), earnedOnReceipt: false, occurredAt: AT })];
  gross.allocate(new Array(12).fill(1)).forEach((amount, i) => {
    entries.push(postingsForRecognition({ ...dims, obligationId: 'yr', amount, periodStart: `2026-${String(i + 1).padStart(2, '0')}-01`, periodEnd: `2026-${String(i + 2).padStart(2, '0')}-01`, occurredAt: AT }));
  });
  const all = entries.flatMap(toTwoLeggedPostings);
  for (const p of all) assert.ok(p.amount.isPositive(), 'every posting must carry a positive amount');
  // Payment splits into 2, each of 12 recognitions into 1.
  assert.equal(all.length, 14);
});

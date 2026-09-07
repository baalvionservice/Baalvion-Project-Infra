import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { recordPayment, buildPaymentRecordedEvent, derivePaymentIdempotencyKey } from '../dist/index.mjs';
import { Money } from '@baalvion/money';

const base = {
  paymentId: 'pay_01J8',
  siteId: 'community',
  tenantId: 'community:founders-circle',
  state: 'CAPTURED',
  provider: 'crypto',
  rail: 'crypto',
  providerPaymentId: '0xabc',
  money: { amountMinor: '1000055', currency: 'INR' },
};

test('records a payment with its site and tenant', () => {
  const r = recordPayment(base);
  assert.equal(r.siteId, 'community');
  assert.equal(r.tenantId, 'community:founders-circle');
  assert.equal(r.amountMinor, 1000055n);
  assert.equal(r.currency, 'INR');
  assert.equal(r.money.toDecimalString(), '10000.55');
  assert.equal(r.partyId, null);
  assert.equal(r.state, 'CAPTURED');
});

test('accepts a Money directly', () => {
  const r = recordPayment({ ...base, money: Money.fromDecimal('10000.55', 'INR') });
  assert.equal(r.amountMinor, 1000055n);
});

test('refuses an unregistered site', () => {
  assert.throws(() => recordPayment({ ...base, siteId: 'not-a-site' }), (e) => e.code === 'UNKNOWN_SITE_ID');
});

test('refuses a rail the site was never granted', () => {
  assert.throws(
    () => recordPayment({ ...base, siteId: 'ctm', rail: 'crypto', provider: 'crypto' }),
    (e) => e.code === 'RAIL_NOT_PERMITTED',
  );
  assert.doesNotThrow(() => recordPayment({ ...base, siteId: 'ctm', rail: 'razorpay', provider: 'razorpay' }));
});

test('refuses a site with no rails configured', () => {
  for (const siteId of ['law', 'imperialpedia', 'signal', 'jobs']) {
    assert.throws(
      () => recordPayment({ ...base, siteId, rail: 'razorpay', provider: 'razorpay' }),
      (e) => e.code === 'NO_RAILS_CONFIGURED',
      `${siteId} must not be able to take money until rails are set`,
    );
  }
});

test('refuses a float amount instead of rounding it', () => {
  assert.throws(
    () => recordPayment({ ...base, money: { amountMinor: 1000055.4, currency: 'INR' } }),
    (e) => e.code === 'FLOAT_AMOUNT',
  );
});

test('refuses a missing site or payment id', () => {
  assert.throws(() => recordPayment({ ...base, paymentId: '  ' }), (e) => e.code === 'MISSING_FIELD');
  assert.throws(() => recordPayment({ ...base, siteId: undefined }), (e) => e.code === 'MISSING_FIELD');
});

test('refuses an unknown state', () => {
  assert.throws(() => recordPayment({ ...base, state: 'REFUNDED' }), (e) => e.code === 'INVALID_STATE');
});

test('refuses a negative capture and a failureReason on a success', () => {
  assert.throws(
    () => recordPayment({ ...base, money: { amountMinor: '-1000055', currency: 'INR' } }),
    (e) => e.code === 'NEGATIVE_AMOUNT',
  );
  assert.throws(() => recordPayment({ ...base, failureReason: 'declined' }), (e) => e.code === 'INVALID_FIELD');
  assert.doesNotThrow(() => recordPayment({ ...base, state: 'FAILED', failureReason: 'declined' }));
});

test('the same transition twice derives the same key', () => {
  assert.equal(recordPayment(base).idempotencyKey, recordPayment(base).idempotencyKey);
  assert.equal(derivePaymentIdempotencyKey('pay_01J8', 'CAPTURED', '0xabc'), 'pay_01J8:CAPTURED:0xabc');
  assert.notEqual(recordPayment(base).idempotencyKey, recordPayment({ ...base, state: 'SETTLED' }).idempotencyKey);
});

test('the event carries money as an integer string, never a number', () => {
  const ev = buildPaymentRecordedEvent(recordPayment(base));
  assert.equal(typeof ev.payload.money.amount, 'string');
  assert.equal(ev.payload.money.amount, '1000055');
  assert.equal(ev.payload.money.exponent, 2);
  const wire = JSON.parse(JSON.stringify(ev));
  assert.equal(wire.payload.money.amount, '1000055');
  assert.equal(Money.fromJSON(wire.payload.money).toDecimalString(), '10000.55');
});

test('the event carries the site at both envelope and payload level', () => {
  const ev = buildPaymentRecordedEvent(recordPayment(base), { traceId: 't1' });
  assert.equal(ev.type, 'payment.recorded');
  assert.equal(ev.siteId, 'community');
  assert.equal(ev.payload.siteId, 'community');
  assert.equal(ev.traceId, 't1');
  assert.match(ev.id, /^[0-9a-f-]{36}$/);
});

test('the built event validates against the published JSON Schema', async () => {
  let Ajv, addFormats;
  try {
    Ajv = (await import('ajv')).default;
    addFormats = (await import('ajv-formats')).default;
  } catch {
    return; // soft-skip when ajv is absent locally, as contracts/scripts/validate-events.mjs does
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const eventsDir = join(here, '..', '..', 'contracts', 'events');
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const f of ['_envelope.json', 'payment.recorded.v1.json']) {
    const schema = JSON.parse(readFileSync(join(eventsDir, f), 'utf8'));
    ajv.addSchema(schema, schema.$id);
  }
  const validate = ajv.getSchema('baalvion://events/payment.recorded.v1.json');
  const ev = buildPaymentRecordedEvent(recordPayment(base));
  assert.ok(validate(ev), `event must match the contract: ${JSON.stringify(validate.errors)}`);

  const failed = buildPaymentRecordedEvent(recordPayment({ ...base, state: 'FAILED', failureReason: 'insufficient_funds' }));
  assert.ok(validate(failed), `failed event must match the contract: ${JSON.stringify(validate.errors)}`);
});

// ---------------------------------------------------------------- envelope -> canonical event

import { toPaymentEvent, paymentRecordedFromEnvelope } from '../dist/index.mjs';

const envelope = {
  id: '9f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f',
  type: 'PAYMENT_CAPTURED',
  paymentId: 'pay_01J8',
  provider: 'crypto',
  transactionId: '0xabc',
  amountMinor: 1000055,
  currency: 'INR',
  fromState: 'INITIATED',
  toState: 'CAPTURED',
  orgId: 'community:founders-circle',
  siteId: 'community',
  tenantId: 'community:founders-circle',
  rail: 'crypto',
  partyId: null,
  occurredAt: '2026-09-06T10:00:00.000Z',
  metadata: { orderRef: 'community:founders-circle:u1' },
};

test('an outbox envelope maps to the canonical payment.recorded event', () => {
  const ev = paymentRecordedFromEnvelope(envelope);
  assert.equal(ev.type, 'payment.recorded');
  assert.equal(ev.siteId, 'community');
  assert.equal(ev.payload.state, 'CAPTURED');
  assert.equal(ev.payload.money.amount, '1000055');
  assert.equal(ev.payload.rail, 'crypto');
  assert.equal(ev.payload.tenantId, 'community:founders-circle');
  assert.equal(ev.payload.orderRef, 'community:founders-circle:u1');
  assert.equal(ev.payload.idempotencyKey, 'pay_01J8:CAPTURED:0xabc');
});

test('a conflict envelope is not published as a payment', () => {
  // PAYMENT_CONFLICT is an alert about a contradictory observation, not money moving.
  assert.equal(paymentRecordedFromEnvelope({ ...envelope, type: 'PAYMENT_CONFLICT' }), null);
  assert.equal(paymentRecordedFromEnvelope({ ...envelope, toState: undefined }), null);
});

test('an envelope with no siteId refuses to enter the read model', () => {
  const { siteId, ...orphan } = envelope;
  assert.throws(() => paymentRecordedFromEnvelope(orphan), (e) => e.code === 'MISSING_FIELD');
});

test('a record round-trips through the state machine event shape', () => {
  const r = recordPayment(base);
  const ev = toPaymentEvent(r, 'WEBHOOK_PAYMENT_SUCCESS');
  assert.equal(ev.siteId, 'community');
  assert.equal(ev.rail, 'crypto');
  assert.equal(ev.amount, 1000055);
  assert.equal(ev.currency, 'INR');
  assert.equal(ev.tenantId, 'community:founders-circle');
});

test('the mapped event validates against the published JSON Schema', async () => {
  let Ajv, addFormats;
  try {
    Ajv = (await import('ajv')).default;
    addFormats = (await import('ajv-formats')).default;
  } catch { return; }
  const here2 = dirname(fileURLToPath(import.meta.url));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const f of ['_envelope.json', 'payment.recorded.v1.json']) {
    const schema = JSON.parse(readFileSync(join(here2, '..', '..', 'contracts', 'events', f), 'utf8'));
    ajv.addSchema(schema, schema.$id);
  }
  const validate = ajv.getSchema('baalvion://events/payment.recorded.v1.json');
  const ev = paymentRecordedFromEnvelope(envelope);
  assert.ok(validate(ev), `mapped event must match the contract: ${JSON.stringify(validate.errors)}`);
});

test('an envelope with no rail refuses to enter the read model', () => {
  const { rail, ...noRail } = envelope;
  assert.throws(() => paymentRecordedFromEnvelope(noRail), (e) => e.code === 'MISSING_FIELD');
});

// ---------------------------------------------------------------- processor fees

test('a reported fee gives a true net; an unreported one stays null', () => {
  const withFee = recordPayment({ ...base, fee: { amountMinor: '23600', currency: 'INR' } });
  assert.equal(withFee.fee.toDecimalString(), '236.00');
  assert.equal(withFee.net.toDecimalString(), '9764.55');

  // Unknown is not zero. Recording zero would overstate margin on every payment.
  const noFee = recordPayment(base);
  assert.equal(noFee.fee, null);
  assert.equal(noFee.net, null);
});

test('rejects a fee that cannot be true', () => {
  assert.throws(() => recordPayment({ ...base, fee: { amountMinor: '-100', currency: 'INR' } }), (e) => e.code === 'INVALID_MONEY');
  assert.throws(() => recordPayment({ ...base, fee: { amountMinor: '9999999', currency: 'INR' } }), (e) => e.code === 'INVALID_MONEY');
  assert.throws(() => recordPayment({ ...base, fee: { amountMinor: '100', currency: 'USD' } }), (e) => e.code === 'INVALID_MONEY');
});

test('the event carries fee and net as integer strings', () => {
  const ev = buildPaymentRecordedEvent(recordPayment({ ...base, fee: { amountMinor: '23600', currency: 'INR' } }));
  assert.equal(ev.payload.fee.amount, '23600');
  assert.equal(ev.payload.net.amount, '976455');
  const bare = buildPaymentRecordedEvent(recordPayment(base));
  assert.equal(bare.payload.fee, null);
  assert.equal(bare.payload.net, null);
});

test('an envelope with a fee maps through to net', () => {
  const ev = paymentRecordedFromEnvelope({ ...envelope, feeMinor: 23600 });
  assert.equal(ev.payload.fee.amount, '23600');
  assert.equal(ev.payload.net.amount, '976455');
});

// ---------------------------------------------------------------- customer identity

test('a customer signal travels with the payment for the party graph', () => {
  const r = recordPayment({
    ...base,
    customer: { email: 'Buyer@Example.com ', emailVerified: true, siteCustomerId: 'u1', name: ' A Buyer ' },
  });
  assert.equal(r.customer.email, 'Buyer@Example.com'); // trimmed here; normalised by @baalvion/party
  assert.equal(r.customer.emailVerified, true);
  assert.equal(r.customer.name, 'A Buyer');
  assert.equal(r.customer.phoneVerified, false); // absent means unverified, never assumed true
});

test('a signal with nothing identifying is null, not an empty husk', () => {
  // A consumer must be able to tell "no identity reported" from "identity reported and blank".
  assert.equal(recordPayment({ ...base, customer: { name: 'Someone' } }).customer, null);
  assert.equal(recordPayment({ ...base, customer: {} }).customer, null);
  assert.equal(recordPayment(base).customer, null);
});

test('verification defaults to false rather than being inferred', () => {
  const r = recordPayment({ ...base, customer: { email: 'a@b.com' } });
  assert.equal(r.customer.emailVerified, false);
  const ev = buildPaymentRecordedEvent(r);
  assert.equal(ev.payload.customer.emailVerified, false);
});

test('the customer reaches the event and the mapped envelope', () => {
  const ev = buildPaymentRecordedEvent(recordPayment({ ...base, customer: { email: 'a@b.com', emailVerified: true } }));
  assert.equal(ev.payload.customer.email, 'a@b.com');
  const mapped = paymentRecordedFromEnvelope({ ...envelope, customer: { email: 'a@b.com', emailVerified: true } });
  assert.equal(mapped.payload.customer.email, 'a@b.com');
  assert.equal(paymentRecordedFromEnvelope(envelope).payload.customer, null);
});

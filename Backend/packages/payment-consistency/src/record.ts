/**
 * The canonical payment record — the single way any service reports that money moved.
 *
 * This is the enforcement point for the rule that makes one cross-estate admin panel
 * possible: a payment cannot be recorded without a registered site, a rail that site is
 * actually granted, and an exact amount. A service that cannot answer "which property and
 * which rail" gets an error instead of an unattributable row, because an unattributable
 * payment is one that no panel can ever show correctly and no ledger can ever reconcile.
 *
 * It deliberately does no I/O. Callers hand the result to the state machine (which persists
 * and enqueues the outbox row in one transaction); this module only validates and shapes.
 */
import { randomUUID } from 'node:crypto';
import { Money } from '@baalvion/money';
import { assertSiteById, assertRailAllowed, type PaymentRail } from '@baalvion/sites';
import { PAYMENT_STATES, type PaymentState } from './states';
import type { CustomerSignal } from './events';

export class PaymentRecordError extends Error {
  public readonly code: string;
  public readonly detail: Record<string, unknown>;
  constructor(code: string, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = 'PaymentRecordError';
    this.code = code;
    this.detail = detail;
  }
}

/** Money may arrive as a Money instance or as minor units plus a currency. Never as a float. */
export type MoneyInput = Money | { amountMinor: string | number | bigint; currency: string };

export interface PaymentRecordInput {
  paymentId: string;
  /** Site id from @baalvion/sites. Not a hostname — resolve the host before calling. */
  siteId: string;
  /** The earner within the site: a store, a paid community, a firm. */
  tenantId?: string | null;
  /** Group-wide customer id. Null until the party graph resolves one. */
  partyId?: string | null;
  /** Who paid, for the party graph to resolve. */
  customer?: CustomerSignal | null;
  state: PaymentState;
  provider: string;
  rail: PaymentRail;
  providerPaymentId?: string | null;
  money: MoneyInput;
  /**
   * What the processor kept. Omit when the provider has not reported it — an unknown fee must
   * not be recorded as zero, or every margin figure derived from it is overstated.
   */
  fee?: MoneyInput | null;
  /** The producing service's own reference, for support and disputes. */
  orderRef?: string | null;
  failureReason?: string | null;
  occurredAt?: Date | string;
  /** Supply to make the key match an upstream one; otherwise it is derived deterministically. */
  idempotencyKey?: string;
}

export interface CanonicalPayment {
  paymentId: string;
  siteId: string;
  tenantId: string | null;
  partyId: string | null;
  customer: CustomerSignal | null;
  state: PaymentState;
  provider: string;
  rail: PaymentRail;
  providerPaymentId: string | null;
  money: Money;
  amountMinor: bigint;
  currency: string;
  /** Processor fee, when reported. */
  fee: Money | null;
  /** money - fee. Null while the fee is unknown, so "net" never quietly means "gross". */
  net: Money | null;
  orderRef: string | null;
  failureReason: string | null;
  idempotencyKey: string;
  occurredAt: string;
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new PaymentRecordError('MISSING_FIELD', `${field} is required and must be a non-empty string`, { field });
  }
  return value.trim();
}

function optionalText(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    throw new PaymentRecordError('INVALID_FIELD', `${field} must be a string or null`, { field });
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function toMoney(input: MoneyInput): Money {
  if (input instanceof Money) return input;
  if (!input || typeof input !== 'object') {
    throw new PaymentRecordError('INVALID_MONEY', 'money must be a Money, or { amountMinor, currency }', {});
  }
  const { amountMinor, currency } = input;
  if (typeof amountMinor === 'number' && !Number.isInteger(amountMinor)) {
    throw new PaymentRecordError(
      'FLOAT_AMOUNT',
      `amountMinor must be an integer count of minor units, got ${amountMinor}. Build a Money from the decimal string instead of converting through a float.`,
      { amountMinor },
    );
  }
  return Money.of(amountMinor, currency);
}

function normalizeCustomer(input: CustomerSignal | null | undefined): CustomerSignal | null {
  if (!input || typeof input !== 'object') return null;
  const signal: CustomerSignal = {
    authUserId: optionalText(input.authUserId, 'customer.authUserId'),
    email: optionalText(input.email, 'customer.email'),
    emailVerified: input.emailVerified === true,
    phone: optionalText(input.phone, 'customer.phone'),
    phoneVerified: input.phoneVerified === true,
    name: optionalText(input.name, 'customer.name'),
    siteCustomerId: optionalText(input.siteCustomerId, 'customer.siteCustomerId'),
  };
  // Nothing identifying means nothing to resolve — carry null rather than an empty object, so a
  // consumer can tell "no identity was reported" from "identity was reported and was blank".
  const identifying = signal.authUserId || signal.email || signal.phone || signal.siteCustomerId;
  return identifying ? signal : null;
}

function toIsoTimestamp(value: Date | string | undefined): string {
  if (value === undefined) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new PaymentRecordError('INVALID_FIELD', `occurredAt is not a valid date: ${String(value)}`, { occurredAt: value });
  }
  return date.toISOString();
}

/**
 * Derived so the same transition reported twice — a webhook and a reconciliation sweep
 * observing the same capture — produces the same key and is applied once.
 */
export function derivePaymentIdempotencyKey(paymentId: string, state: PaymentState, providerPaymentId: string | null): string {
  return `${paymentId}:${state}:${providerPaymentId ?? 'none'}`;
}

/** Validate and normalise a payment observation. Throws rather than recording something unattributable. */
export function recordPayment(input: PaymentRecordInput): CanonicalPayment {
  if (!input || typeof input !== 'object') {
    throw new PaymentRecordError('INVALID_INPUT', 'recordPayment expects an object', {});
  }

  const paymentId = requireText(input.paymentId, 'paymentId');
  const siteId = requireText(input.siteId, 'siteId');
  const provider = requireText(input.provider, 'provider');

  // Fails closed on an unregistered site, and on a rail the site was never granted —
  // including a site with no rails configured at all.
  assertSiteById(siteId);
  assertRailAllowed(siteId, input.rail);

  if (!PAYMENT_STATES.includes(input.state)) {
    throw new PaymentRecordError('INVALID_STATE', `state must be one of ${PAYMENT_STATES.join(', ')}, got ${String(input.state)}`, { state: input.state });
  }

  const money = toMoney(input.money);
  if (input.state !== 'FAILED' && money.isNegative()) {
    throw new PaymentRecordError('NEGATIVE_AMOUNT', `A ${input.state} payment cannot be negative (${money.toString()}). Record a refund as its own payment, not as a negative capture.`, { state: input.state });
  }

  const failureReason = optionalText(input.failureReason, 'failureReason');
  if (failureReason && input.state !== 'FAILED') {
    throw new PaymentRecordError('INVALID_FIELD', `failureReason is only valid on a FAILED payment, not ${input.state}`, { state: input.state });
  }

  const providerPaymentId = optionalText(input.providerPaymentId, 'providerPaymentId');

  let fee: Money | null = null;
  if (input.fee !== undefined && input.fee !== null) {
    fee = toMoney(input.fee);
    if (fee.currency !== money.currency) {
      throw new PaymentRecordError('INVALID_MONEY', `Fee is ${fee.currency} but the payment is ${money.currency}`, { paymentId });
    }
    if (fee.isNegative()) {
      throw new PaymentRecordError('INVALID_MONEY', `Fee cannot be negative (${fee.toString()})`, { paymentId });
    }
    if (fee.greaterThan(money.abs())) {
      throw new PaymentRecordError('INVALID_MONEY', `Fee ${fee.toString()} exceeds the payment ${money.toString()}`, { paymentId });
    }
  }
  const net = fee ? money.subtract(fee) : null;

  return {
    paymentId,
    siteId,
    tenantId: optionalText(input.tenantId, 'tenantId'),
    partyId: optionalText(input.partyId, 'partyId'),
    customer: normalizeCustomer(input.customer),
    state: input.state,
    provider,
    rail: input.rail,
    providerPaymentId,
    money,
    amountMinor: money.minor,
    currency: money.currency,
    fee,
    net,
    orderRef: optionalText(input.orderRef, 'orderRef'),
    failureReason,
    idempotencyKey: input.idempotencyKey
      ? requireText(input.idempotencyKey, 'idempotencyKey')
      : derivePaymentIdempotencyKey(paymentId, input.state, providerPaymentId),
    occurredAt: toIsoTimestamp(input.occurredAt),
  };
}

export interface EventEnvelopeMeta {
  traceId?: string;
  /** The tenant/org the event belongs to on the bus. Defaults to the record's tenantId. */
  orgId?: string | null;
  userId?: string | null;
  id?: string;
}

export interface PaymentRecordedEvent {
  id: string;
  type: 'payment.recorded';
  siteId: string;
  orgId: string | null;
  userId: string | null;
  timestamp: string;
  traceId: string;
  payload: {
    paymentId: string;
    siteId: string;
    tenantId: string | null;
    partyId: string | null;
    customer: CustomerSignal | null;
    state: PaymentState;
    provider: string;
    rail: PaymentRail;
    providerPaymentId: string | null;
    money: { amount: string; currency: string; exponent: number };
    fee: { amount: string; currency: string; exponent: number } | null;
    net: { amount: string; currency: string; exponent: number } | null;
    idempotencyKey: string;
    orderRef: string | null;
    failureReason: string | null;
    occurredAt: string;
  };
}

/**
 * Shape a validated record as the canonical `payment.recorded` event.
 * Matches contracts/events/payment.recorded.v1.json exactly — money crosses the bus as an
 * integer string so no consumer can parse it into a float.
 */
export function buildPaymentRecordedEvent(record: CanonicalPayment, meta: EventEnvelopeMeta = {}): PaymentRecordedEvent {
  return {
    id: meta.id ?? randomUUID(),
    type: 'payment.recorded',
    siteId: record.siteId,
    orgId: meta.orgId !== undefined ? meta.orgId : record.tenantId,
    userId: meta.userId ?? null,
    timestamp: new Date().toISOString(),
    traceId: meta.traceId ?? randomUUID(),
    payload: {
      paymentId: record.paymentId,
      siteId: record.siteId,
      tenantId: record.tenantId,
      partyId: record.partyId,
      customer: record.customer,
      state: record.state,
      provider: record.provider,
      rail: record.rail,
      providerPaymentId: record.providerPaymentId,
      money: record.money.toJSON(),
      fee: record.fee ? record.fee.toJSON() : null,
      net: record.net ? record.net.toJSON() : null,
      idempotencyKey: record.idempotencyKey,
      orderRef: record.orderRef,
      failureReason: record.failureReason,
      occurredAt: record.occurredAt,
    },
  };
}

/**
 * Turn a validated record into the PaymentEvent the state machine consumes, so a service goes
 * `recordPayment() -> toPaymentEvent() -> stateMachine.apply()` and the attribution it validated
 * is the same attribution that gets persisted and emitted.
 */
export function toPaymentEvent(record: CanonicalPayment, eventType: string): Record<string, unknown> {
  return {
    type: eventType,
    paymentId: record.paymentId,
    provider: record.provider,
    transactionId: record.providerPaymentId ?? record.paymentId,
    amount: Number(record.amountMinor),
    currency: record.currency,
    orgId: record.tenantId ?? undefined,
    siteId: record.siteId,
    tenantId: record.tenantId ?? undefined,
    rail: record.rail,
    partyId: record.partyId ?? undefined,
    feeMinor: record.fee ? Number(record.fee.minor) : undefined,
    customer: record.customer ?? undefined,
    occurredAt: record.occurredAt,
    ...(record.orderRef ? { metadata: { orderRef: record.orderRef } } : {}),
  };
}

/**
 * Map an outbox envelope drained by the relay into the canonical `payment.recorded` event.
 *
 * Returns null for envelopes that are not a payment state change — PAYMENT_CONFLICT is an
 * alert about a contradictory observation, not a record of money moving, and publishing it as
 * one would put a phantom payment in front of everyone reading the panel.
 */
export function paymentRecordedFromEnvelope(
  envelope: Record<string, unknown>,
  meta: EventEnvelopeMeta = {},
): PaymentRecordedEvent | null {
  const toState = envelope?.toState as PaymentState | undefined;
  if (!toState || !PAYMENT_STATES.includes(toState)) return null;
  if (String(envelope.type ?? '').endsWith('CONFLICT')) return null;

  const siteId = envelope.siteId == null ? null : String(envelope.siteId);
  if (!siteId) {
    // An unattributable payment must not reach the read model as if it belonged nowhere.
    throw new PaymentRecordError(
      'MISSING_FIELD',
      `Outbox envelope ${String(envelope.id)} has no siteId. It predates the site dimension, or its producer has not been migrated to recordPayment().`,
      { envelopeId: envelope.id, paymentId: envelope.paymentId },
    );
  }

  if (!envelope.rail) {
    // Same principle as siteId: defaulting a rail files the payment under a method it did not
    // use, which is a wrong number that looks right.
    throw new PaymentRecordError(
      'MISSING_FIELD',
      `Outbox envelope ${String(envelope.id)} has no rail. Its producer has not been migrated to carry attribution.`,
      { envelopeId: envelope.id, paymentId: envelope.paymentId },
    );
  }

  const money = Money.of(BigInt(String(envelope.amountMinor ?? '0')), String(envelope.currency));
  const providerPaymentId = envelope.transactionId == null ? null : String(envelope.transactionId);
  const paymentId = String(envelope.paymentId);

  return {
    id: meta.id ?? String(envelope.id ?? randomUUID()),
    type: 'payment.recorded',
    siteId,
    orgId: meta.orgId !== undefined ? meta.orgId : (envelope.orgId == null ? null : String(envelope.orgId)),
    userId: meta.userId ?? null,
    timestamp: new Date().toISOString(),
    traceId: meta.traceId ?? randomUUID(),
    payload: {
      paymentId,
      siteId,
      tenantId: envelope.tenantId == null ? null : String(envelope.tenantId),
      partyId: envelope.partyId == null ? null : String(envelope.partyId),
      customer: (envelope.customer as CustomerSignal | undefined) ?? null,
      state: toState,
      provider: String(envelope.provider),
      rail: String(envelope.rail) as PaymentRail,
      providerPaymentId,
      money: money.toJSON(),
      fee: envelope.feeMinor == null ? null : Money.of(BigInt(String(envelope.feeMinor)), String(envelope.currency)).toJSON(),
      net: envelope.feeMinor == null
        ? null
        : money.subtract(Money.of(BigInt(String(envelope.feeMinor)), String(envelope.currency))).toJSON(),
      idempotencyKey: derivePaymentIdempotencyKey(paymentId, toState, providerPaymentId),
      orderRef: (envelope.metadata as Record<string, unknown> | undefined)?.orderRef as string ?? null,
      failureReason: toState === 'FAILED'
        ? ((envelope.metadata as Record<string, unknown> | undefined)?.reason as string ?? null)
        : null,
      occurredAt: String(envelope.occurredAt ?? new Date().toISOString()),
    },
  };
}

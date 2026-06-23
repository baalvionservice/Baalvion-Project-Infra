/**
 * The normalization layer — the ONLY place native statuses become canonical events.
 *
 * Adapters call these AFTER they have verified the source (HMAC signature, Kafka topic
 * trust, internal-service auth). Normalization is pure mapping: it never does I/O and
 * never mutates state. If a native status maps to nothing actionable (e.g. a provider
 * `pending`), the normalizer returns `null` and the adapter simply ACKs without touching
 * the state machine.
 */
import {
  PaymentEventSchema,
  type PaymentEvent,
  type PaymentEventType,
} from './events';

/** Money in the currency's minor unit — adapters must hand us integers, not floats. */
export interface NormalizedMoney {
  amountMinor: number;
  currency: string;
}

/** Map a provider's native charge status to a canonical event type (or null = ignore). */
function webhookTypeForStatus(status: string): PaymentEventType | null {
  switch (status.toLowerCase()) {
    case 'authorized':
    case 'requires_capture':
      return 'WEBHOOK_PAYMENT_AUTHORIZED';
    case 'captured':
    case 'succeeded':
    case 'success':
    case 'paid':
    case 'completed':
      return 'WEBHOOK_PAYMENT_SUCCESS';
    case 'settled':
    case 'settlement':
      return 'GATEWAY_SETTLED';
    case 'failed':
    case 'declined':
    case 'cancelled':
    case 'canceled':
    case 'voided':
      return 'WEBHOOK_PAYMENT_FAILED';
    default:
      return null; // pending / created / unknown — not actionable
  }
}

export interface WebhookInput {
  provider: string;
  /** The verified provider status string (already extracted from the signed body). */
  status: string;
  paymentId: string;
  transactionId: string;
  money: NormalizedMoney;
  orgId?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

/** Stripe / Razorpay / PayU webhook → PaymentEvent (call only after signature verification). */
export function normalizeWebhook(input: WebhookInput): PaymentEvent | null {
  const type = webhookTypeForStatus(input.status);
  if (!type) return null;
  return PaymentEventSchema.parse({
    type,
    paymentId: input.paymentId,
    provider: input.provider,
    transactionId: input.transactionId,
    amount: input.money.amountMinor,
    currency: input.money.currency,
    orgId: input.orgId,
    occurredAt: input.occurredAt,
    metadata: { source: 'webhook', nativeStatus: input.status, ...input.metadata },
  });
}

export interface SagaInput {
  /** Java topic, e.g. payments.transaction.completed / .failed / settlement.processed */
  topic: string;
  paymentId: string;
  provider: string;
  transactionId: string;
  money: NormalizedMoney;
  orgId?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

const SAGA_TOPIC_TYPE: Record<string, PaymentEventType> = {
  'payments.transaction.completed': 'SAGA_CONFIRMED',
  'payments.transaction.failed': 'PAYMENT_FAILED',
  'payments.transaction.reversed': 'PAYMENT_FAILED',
  'payments.settlement.processed': 'SETTLEMENT_PROCESSED',
};

/** JVM Kafka saga event → PaymentEvent (call from the Node-side bridge consumer). */
export function normalizeSagaEvent(input: SagaInput): PaymentEvent | null {
  const type = SAGA_TOPIC_TYPE[input.topic];
  if (!type) return null;
  return PaymentEventSchema.parse({
    type,
    paymentId: input.paymentId,
    provider: input.provider,
    transactionId: input.transactionId,
    amount: input.money.amountMinor,
    currency: input.money.currency,
    orgId: input.orgId,
    occurredAt: input.occurredAt,
    metadata: { source: 'saga', topic: input.topic, ...input.metadata },
  });
}

export interface ReconInput {
  /** What the gateway-of-record reports right now. */
  gatewayStatus: 'captured' | 'settled' | 'failed' | string;
  paymentId: string;
  provider: string;
  transactionId: string;
  money: NormalizedMoney;
  orgId?: string;
  metadata?: Record<string, unknown>;
}

/** Reconciliation / gateway-sweep result → PaymentEvent (call from the recon worker). */
export function normalizeReconciliation(input: ReconInput): PaymentEvent | null {
  let type: PaymentEventType | null;
  switch (input.gatewayStatus.toLowerCase()) {
    case 'captured':
    case 'succeeded':
    case 'paid':
      type = 'RECON_CAPTURED';
      break;
    case 'settled':
      type = 'SETTLEMENT_PROCESSED';
      break;
    case 'failed':
    case 'declined':
      type = 'RECON_FAILED';
      break;
    default:
      type = null;
  }
  if (!type) return null;
  return PaymentEventSchema.parse({
    type,
    paymentId: input.paymentId,
    provider: input.provider,
    transactionId: input.transactionId,
    amount: input.money.amountMinor,
    currency: input.money.currency,
    orgId: input.orgId,
    metadata: { source: 'reconciliation', gatewayStatus: input.gatewayStatus, ...input.metadata },
  });
}

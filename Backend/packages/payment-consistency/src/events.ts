/**
 * The unified payment event model.
 *
 * Webhooks (Stripe / Razorpay / PayU), the JVM Kafka saga, order-service reconciliation
 * sweeps and retry workers ALL collapse into this one shape before reaching the state
 * machine. An adapter's only job is: verify the source, then build a `PaymentEvent`.
 *
 * `type` carries *intent* (what the source is asserting happened). The state machine —
 * not the adapter — decides whether that intent is allowed to move state.
 */
import { z } from 'zod';
import type { PaymentState } from './states';

/** What an adapter can assert. Multiple types can share one intent (defence in depth). */
export const PAYMENT_EVENT_TYPES = [
  'PAYMENT_INITIATED',
  'WEBHOOK_PAYMENT_AUTHORIZED',
  'GATEWAY_AUTHORIZED',
  'WEBHOOK_PAYMENT_SUCCESS',
  'GATEWAY_CAPTURED',
  'SAGA_CONFIRMED',
  'RECON_CAPTURED',
  'GATEWAY_SETTLED',
  'SETTLEMENT_PROCESSED',
  'WEBHOOK_PAYMENT_FAILED',
  'PAYMENT_FAILED',
  'RECON_FAILED',
] as const;

export type PaymentEventType = (typeof PAYMENT_EVENT_TYPES)[number];

/** The intent each event type expresses — the bridge from "type" to "target state". */
export type PaymentIntent = 'INITIATE' | 'AUTHORIZE' | 'CAPTURE' | 'SETTLE' | 'FAIL';

export const EVENT_INTENT: Record<PaymentEventType, PaymentIntent> = {
  PAYMENT_INITIATED: 'INITIATE',
  WEBHOOK_PAYMENT_AUTHORIZED: 'AUTHORIZE',
  GATEWAY_AUTHORIZED: 'AUTHORIZE',
  WEBHOOK_PAYMENT_SUCCESS: 'CAPTURE',
  GATEWAY_CAPTURED: 'CAPTURE',
  SAGA_CONFIRMED: 'CAPTURE',
  RECON_CAPTURED: 'CAPTURE',
  GATEWAY_SETTLED: 'SETTLE',
  SETTLEMENT_PROCESSED: 'SETTLE',
  WEBHOOK_PAYMENT_FAILED: 'FAIL',
  PAYMENT_FAILED: 'FAIL',
  RECON_FAILED: 'FAIL',
};

export const INTENT_TARGET: Record<PaymentIntent, PaymentState> = {
  INITIATE: 'INITIATED',
  AUTHORIZE: 'AUTHORIZED',
  CAPTURE: 'CAPTURED',
  SETTLE: 'SETTLED',
  FAIL: 'FAILED',
};

/**
 * The canonical event. `amount` is an INTEGER in the currency's minor unit (paise/cents)
 * to keep money exact — adapters must convert before constructing the event.
 */
export const PaymentEventSchema = z.object({
  type: z.enum(PAYMENT_EVENT_TYPES),
  /** The charge/intent identifier — the grain the state machine is keyed by. */
  paymentId: z.string().min(1).max(190),
  provider: z.string().min(1).max(40),
  /** Gateway transaction / event id. Part of the idempotency key; MUST come from signed data. */
  transactionId: z.string().min(1).max(190),
  amount: z.number().int().nonnegative(),
  currency: z.string().length(3),
  /** Optional tenant scope (website slug, org id) and free-form provenance. */
  orgId: z.string().max(190).optional(),
  occurredAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type PaymentEvent = z.infer<typeof PaymentEventSchema>;

/**
 * The idempotency key: `(paymentId, eventType, transactionId)`. This is the dedupe
 * grain the inbox enforces with a UNIQUE constraint, so the SAME event delivered twice
 * (duplicate webhook, redelivered Kafka message, repeated poll) is applied exactly once.
 */
export function dedupeKey(event: Pick<PaymentEvent, 'paymentId' | 'type' | 'transactionId'>): string {
  return `${event.paymentId}::${event.type}::${event.transactionId}`;
}

export function intentOf(event: Pick<PaymentEvent, 'type'>): PaymentIntent {
  return EVENT_INTENT[event.type];
}

export function targetStateOf(event: Pick<PaymentEvent, 'type'>): PaymentState {
  return INTENT_TARGET[intentOf(event)];
}

/**
 * @baalvion/payment-consistency — the Payment Consistency Layer (PCL).
 *
 * The single deterministic state machine + transactional outbox that owns every payment
 * state transition across the platform. Adapters normalize their source into a
 * `PaymentEvent` and call `PaymentStateMachine.apply(event)`; nothing else writes final
 * payment state. See README.md for architecture, the migration plan, and adapter refactors.
 */

// State vocabulary
export {
  PAYMENT_STATES,
  STATE_RANK,
  TERMINAL_STATES,
  isTerminal,
  rankOf,
  type PaymentState,
} from './states';

// Unified event model
export {
  PAYMENT_EVENT_TYPES,
  EVENT_INTENT,
  INTENT_TARGET,
  PaymentEventSchema,
  dedupeKey,
  intentOf,
  targetStateOf,
  type PaymentEvent,
  type PaymentEventType,
  type PaymentIntent,
} from './events';

// Pure decision core
export { decide, type Decision, type PaymentEffect } from './decide';

// Normalization (adapters -> PaymentEvent)
export {
  normalizeWebhook,
  normalizeSagaEvent,
  normalizeReconciliation,
  type NormalizedMoney,
  type WebhookInput,
  type SagaInput,
  type ReconInput,
} from './normalize';

// Engine
export {
  PaymentStateMachine,
  type ApplyOutcome,
  type ApplyResult,
  type PaymentStateMachineDeps,
  type PclLogger,
} from './stateMachine';

// Ports (for custom storage) + PostgreSQL implementation
export type {
  TxRunner,
  Tx,
  PaymentRecord,
  PaymentStateStore,
  InboxStore,
  OutboxWriter,
  OutboxEnvelope,
} from './ports';
export {
  createPgTxRunner,
  createPgPaymentStateStore,
  createPgInboxStore,
  createPgOutboxWriter,
  createSequelizeTxRunner,
  sequelizeQueryRunner,
  type PgPool,
  type PgClient,
  type PgQueryRunner,
  type PgQueryResult,
  type PclPgOptions,
  type SequelizeLike,
} from './pgStore';

// Errors
export { PclError, PclValidationError } from './errors';

// Canonical payment record — the one way a service reports that money moved, and the
// enforcement point for "no payment without a registered site and a permitted rail".
export { recordPayment, buildPaymentRecordedEvent, derivePaymentIdempotencyKey, toPaymentEvent, paymentRecordedFromEnvelope, PaymentRecordError } from './record';
export type { PaymentRecordInput, CanonicalPayment, PaymentRecordedEvent, MoneyInput, EventEnvelopeMeta } from './record';

// One-call wiring so a new property joins the spine in a few lines, not a project.
export { createPaymentSpine } from './spine';
export type { PaymentSpine, PaymentSpineOptions, SpinePaymentInput } from './spine';
export type { CustomerSignal } from './events';

// One relay wiring, used by every service that drains its own payment outbox.
export { createPaymentOutboxRelay, readOutboxHealth } from './relay';
export type { OutboxHealth } from './relay';
export type { PaymentOutboxRelay, PaymentOutboxRelayOptions, EventBus, RelayLogger } from './relay';

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
  type PgPool,
  type PgClient,
  type PgQueryRunner,
  type PgQueryResult,
  type PclPgOptions,
} from './pgStore';

// Errors
export { PclError, PclValidationError } from './errors';

/**
 * Persistence ports. The state machine depends ONLY on these interfaces, so the engine
 * is storage-agnostic and unit-testable with in-memory fakes. `pgStore.ts` is the
 * production PostgreSQL implementation; tests supply trivial in-memory ones.
 *
 * All three ports operate inside a single transaction handle (`tx`) supplied by the
 * `TxRunner`, so the inbox claim, the state mutation and the outbox enqueue commit
 * atomically — that atomicity is the transactional-outbox guarantee (no lost events,
 * no dual-write drift).
 */
import type { PaymentEvent } from './events';
import type { PaymentState } from './states';

/** Opaque transaction handle threaded through the ports (a pg client, a Sequelize tx, …). */
export type Tx = unknown;

export interface TxRunner {
  /** Run `fn` inside a DB transaction, committing on resolve and rolling back on throw. */
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
}

export interface PaymentRecord {
  paymentId: string;
  state: PaymentState;
  version: number;
  provider: string;
  transactionId: string;
  amountMinor: number;
  currency: string;
}

export interface PaymentStateStore {
  /**
   * Ensure a row exists for `event.paymentId` (seeding it at INITIATED from the event if
   * absent) and return it WITH a row lock held for the rest of the transaction. The lock
   * serializes concurrent events for the same payment, so transitions never interleave.
   */
  ensureAndLock(tx: Tx, event: PaymentEvent): Promise<PaymentRecord>;
  /** Advance an existing row to `toState`, bumping version and recording provenance. */
  advance(tx: Tx, paymentId: string, toState: PaymentState, event: PaymentEvent): Promise<void>;
}

export interface InboxStore {
  /**
   * Atomically claim the idempotency key. Returns `true` the FIRST time the key is seen
   * and `false` on every repeat (INSERT … ON CONFLICT DO NOTHING). This is the hard
   * dedupe that makes duplicate webhooks / Kafka redeliveries / repeated polls exactly-once.
   */
  claim(tx: Tx, dedupeKey: string, event: PaymentEvent): Promise<boolean>;
}

/** The side-effect envelope written to the outbox (relay-publishable, see outbox table). */
export interface OutboxEnvelope {
  id: string;
  type: string; // PAYMENT_CAPTURED | PAYMENT_FAILED | PAYMENT_SETTLED | PAYMENT_AUTHORIZED | PAYMENT_CONFLICT
  paymentId: string;
  provider: string;
  transactionId: string;
  amountMinor: number;
  currency: string;
  fromState: PaymentState | null;
  toState: PaymentState;
  orgId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface OutboxWriter {
  /** Persist a side-effect row inside the SAME tx as the state mutation (atomic emit). */
  enqueue(tx: Tx, envelope: OutboxEnvelope): Promise<void>;
}

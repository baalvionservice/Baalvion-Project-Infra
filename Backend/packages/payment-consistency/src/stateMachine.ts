/**
 * PaymentStateMachine — the single entry point for EVERY payment state transition.
 *
 *     PaymentStateMachine.apply(event)
 *
 * No service is allowed to mutate final payment state outside this function. It is pure
 * transactional plumbing around the pure `decide()` core:
 *
 *   BEGIN
 *     1. inbox.claim(dedupeKey)   — exactly-once guard. Duplicate? COMMIT, return 'duplicate'.
 *     2. store.ensureAndLock()    — create-if-absent (INITIATED) + row lock (serializes the payment).
 *     3. decide(current, event)   — pure decision: apply | noop | conflict.
 *     4. apply    → store.advance + outbox.enqueue(side-effects)   (all in this tx)
 *        conflict → outbox.enqueue(PAYMENT_CONFLICT)               (alert; state unchanged)
 *        noop     → nothing                                        (inbox row still recorded)
 *   COMMIT
 *
 * Because the inbox claim, the state write and the outbox write share ONE transaction, a
 * side effect is emitted iff its state change committed — the transactional-outbox
 * guarantee. Side effects are NEVER published from here; the relay drains the outbox.
 */
import { randomUUID } from 'node:crypto';
import { decide, type Decision, type PaymentEffect } from './decide';
import { dedupeKey, PaymentEventSchema, type PaymentEvent } from './events';
import { PclValidationError } from './errors';
import type { PaymentState } from './states';
import type {
  InboxStore,
  OutboxEnvelope,
  OutboxWriter,
  PaymentStateStore,
  Tx,
  TxRunner,
} from './ports';

export type ApplyResult = 'applied' | 'duplicate' | 'ignored' | 'conflict';

export interface ApplyOutcome {
  result: ApplyResult;
  paymentId: string;
  from: PaymentState | null;
  to: PaymentState | null;
  emitted: PaymentEffect[];
  reason: string;
}

export interface PclLogger {
  info?(o: object, m: string): void;
  warn?(o: object, m: string): void;
  error?(o: object, m: string): void;
}

export interface PaymentStateMachineDeps {
  db: TxRunner;
  store: PaymentStateStore;
  inbox: InboxStore;
  outbox: OutboxWriter;
  /** Injectable for tests; defaults to crypto.randomUUID. */
  idGen?: () => string;
  /** Injectable for tests; defaults to () => new Date(). */
  clock?: () => Date;
  logger?: PclLogger;
}

function defaultIdGen(): string {
  return randomUUID();
}

export class PaymentStateMachine {
  private readonly db: TxRunner;
  private readonly store: PaymentStateStore;
  private readonly inbox: InboxStore;
  private readonly outbox: OutboxWriter;
  private readonly idGen: () => string;
  private readonly clock: () => Date;
  private readonly log?: PclLogger;

  constructor(deps: PaymentStateMachineDeps) {
    this.db = deps.db;
    this.store = deps.store;
    this.inbox = deps.inbox;
    this.outbox = deps.outbox;
    this.idGen = deps.idGen ?? defaultIdGen;
    this.clock = deps.clock ?? (() => new Date());
    this.log = deps.logger;
  }

  /** Apply one event. Safe to call with duplicate, stale, or out-of-order events. */
  async apply(rawEvent: PaymentEvent): Promise<ApplyOutcome> {
    const parsed = PaymentEventSchema.safeParse(rawEvent);
    if (!parsed.success) {
      throw new PclValidationError('invalid PaymentEvent', parsed.error.flatten());
    }
    const event = parsed.data;
    const key = dedupeKey(event);

    return this.db.transaction(async (tx: Tx) => {
      // 1. Exactly-once guard.
      const fresh = await this.inbox.claim(tx, key, event);
      if (!fresh) {
        this.log?.info?.({ key }, 'pcl: duplicate event ignored');
        return outcome('duplicate', event.paymentId, null, null, [], `duplicate ${key}`);
      }

      // 2. Lock the payment (create at INITIATED if first seen).
      const record = await this.store.ensureAndLock(tx, event);
      const from = record.state;

      // 3. Pure decision.
      const decision: Decision = decide(from, event);

      if (decision.action === 'noop') {
        this.log?.info?.({ key, from, reason: decision.reason }, 'pcl: event ignored (safe no-op)');
        return outcome('ignored', event.paymentId, from, from, [], decision.reason);
      }

      if (decision.action === 'conflict') {
        await this.emit(tx, decision.emit, event, from, from);
        this.log?.warn?.({ key, from, reason: decision.reason }, 'pcl: CONFLICT surfaced for reconciliation');
        return outcome('conflict', event.paymentId, from, from, decision.emit, decision.reason);
      }

      // apply
      await this.store.advance(tx, event.paymentId, decision.to, event);
      await this.emit(tx, decision.emit, event, from, decision.to);
      this.log?.info?.({ key, from, to: decision.to, emit: decision.emit }, 'pcl: transition applied');
      return outcome('applied', event.paymentId, from, decision.to, decision.emit, decision.reason);
    });
  }

  private async emit(
    tx: Tx,
    effects: PaymentEffect[],
    event: PaymentEvent,
    fromState: PaymentState | null,
    toState: PaymentState,
  ): Promise<void> {
    const occurredAt = (this.clock().toISOString());
    for (const type of effects) {
      const envelope: OutboxEnvelope = {
        id: this.idGen(),
        type,
        paymentId: event.paymentId,
        provider: event.provider,
        transactionId: event.transactionId,
        amountMinor: event.amount,
        currency: event.currency,
        fromState,
        toState,
        orgId: event.orgId,
        occurredAt,
        metadata: { sourceEventType: event.type, ...event.metadata },
      };
      await this.outbox.enqueue(tx, envelope);
    }
  }
}

function outcome(
  result: ApplyResult,
  paymentId: string,
  from: PaymentState | null,
  to: PaymentState | null,
  emitted: PaymentEffect[],
  reason: string,
): ApplyOutcome {
  return { result, paymentId, from, to, emitted, reason };
}

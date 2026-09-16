/**
 * One-call payment spine setup for a service.
 *
 * Every property needs the same five things wired together — a transaction runner, the state
 * store, the inbox, the outbox and the state machine — and then a validated, attributed record
 * on top. Hand-writing that per service is how five subtly different integrations appear.
 * This is the single wiring, so onboarding a new property is a few lines rather than a project.
 *
 *   const spine = createPaymentSpine({ pool, siteId: 'proxy', railFor });
 *   await spine.recordCapture({ paymentId, provider, transactionId, amountMinor, currency, tenantId });
 *
 * Everything the site emits is validated first: an unregistered site, a rail the site was never
 * granted, or a non-integer amount throws before anything is written. Calls are safe to repeat —
 * the state machine is idempotent — so a webhook redelivery converges instead of double-applying.
 */
import { PaymentStateMachine } from './stateMachine';
import {
  createPgTxRunner, createSequelizeTxRunner, sequelizeQueryRunner,
  createPgPaymentStateStore, createPgInboxStore, createPgOutboxWriter,
  type PgPool, type SequelizeLike,
} from './pgStore';
import { recordPayment, type CanonicalPayment } from './record';
import { normalizeWebhook } from './normalize';
import type { CustomerSignal } from './events';
import type { PaymentRail } from '@baalvion/sites';
import type { PclLogger } from './stateMachine';

export interface PaymentSpineOptions {
  /**
   * A real node-postgres Pool. Supply this OR `sequelize`.
   *
   * It must be a genuine Pool: transactions call `pool.connect()`, so a `{ query }` adapter
   * type-checks and then throws on the first capture. Services holding a Sequelize instance
   * pass `sequelize` instead.
   */
  pool?: PgPool;
  /** A Sequelize instance — the shape most services in this platform actually hold. */
  sequelize?: SequelizeLike;
  /** The property this service takes money for — a site id from @baalvion/sites. */
  siteId: string;
  /** Maps this service's provider names to platform rails. */
  railFor?: (provider: string) => PaymentRail | undefined;
  schema?: string;
  logger?: PclLogger;
}

export interface SpinePaymentInput {
  paymentId: string;
  provider: string;
  transactionId: string;
  /** Integer count of minor units. A float throws rather than being rounded. */
  amountMinor: string | number | bigint;
  currency: string;
  /** Who within the site earned it — a store, a community, a firm. */
  tenantId?: string | null;
  partyId?: string | null;
  rail?: PaymentRail;
  /** Processor fee in minor units, when the provider reports it. */
  feeMinor?: string | number | bigint | null;
  /** Who paid, for the party graph to resolve a group-wide identity from. */
  customer?: CustomerSignal | null;
  orderRef?: string | null;
  failureReason?: string | null;
  occurredAt?: string | Date;
}

export interface PaymentSpine {
  machine: PaymentStateMachine;
  /** Report a provider-confirmed capture. Idempotent; safe on webhook redelivery. */
  recordCapture(input: SpinePaymentInput): Promise<unknown>;
  /** Report an authorization that has not yet captured. */
  recordAuthorization(input: SpinePaymentInput): Promise<unknown>;
  /** Report a failure. Only meaningful pre-capture; the ladder refuses to undo a capture. */
  recordFailure(input: SpinePaymentInput): Promise<unknown>;
  /** Validate and shape without writing — useful in tests and dry runs. */
  validate(input: SpinePaymentInput, state: 'CAPTURED' | 'AUTHORIZED' | 'FAILED'): CanonicalPayment;
}

const STATE_STATUS = {
  CAPTURED: 'captured',
  AUTHORIZED: 'authorized',
  FAILED: 'failed',
} as const;

export function createPaymentSpine(options: PaymentSpineOptions): PaymentSpine {
  const { siteId, railFor, logger } = options;
  const schema = options.schema ?? 'pcl';
  if (!options.pool && !options.sequelize) {
    throw new Error('[pcl] createPaymentSpine needs either a pg Pool or a Sequelize instance');
  }
  // Stores run outside a transaction through this; inside one they use the tx's own runner.
  const pool = options.pool ?? sequelizeQueryRunner(options.sequelize!);
  const pgOpts = { pool, schema };

  const machine = new PaymentStateMachine({
    db: options.sequelize ? createSequelizeTxRunner(options.sequelize) : createPgTxRunner(options.pool!),
    store: createPgPaymentStateStore(pgOpts),
    inbox: createPgInboxStore(pgOpts),
    outbox: createPgOutboxWriter(pgOpts),
    ...(logger ? { logger } : {}),
  });

  function resolveRail(input: SpinePaymentInput): PaymentRail {
    const rail = input.rail ?? (railFor ? railFor(input.provider) : undefined);
    if (!rail) {
      // Guessing a rail files the payment under a method it did not use — a wrong number that
      // looks right on the panel. Refuse instead.
      throw new Error(`[pcl] cannot determine the payment rail for provider "${input.provider}" on site "${siteId}". Pass 'rail' explicitly or extend railFor().`);
    }
    return rail;
  }

  function validate(input: SpinePaymentInput, state: 'CAPTURED' | 'AUTHORIZED' | 'FAILED'): CanonicalPayment {
    return recordPayment({
      paymentId: input.paymentId,
      siteId,
      tenantId: input.tenantId ?? null,
      partyId: input.partyId ?? null,
      customer: input.customer ?? null,
      state,
      provider: input.provider,
      rail: resolveRail(input),
      providerPaymentId: input.transactionId,
      money: { amountMinor: input.amountMinor, currency: input.currency },
      fee: input.feeMinor == null ? null : { amountMinor: input.feeMinor, currency: input.currency },
      orderRef: input.orderRef ?? null,
      failureReason: input.failureReason ?? null,
      occurredAt: input.occurredAt instanceof Date ? input.occurredAt.toISOString() : input.occurredAt,
    });
  }

  async function apply(input: SpinePaymentInput, state: 'CAPTURED' | 'AUTHORIZED' | 'FAILED') {
    const record = validate(input, state);
    const event = normalizeWebhook({
      provider: record.provider,
      status: STATE_STATUS[state],
      paymentId: record.paymentId,
      transactionId: record.providerPaymentId ?? record.paymentId,
      money: { amountMinor: Number(record.amountMinor), currency: record.currency },
      orgId: record.tenantId ?? undefined,
      siteId: record.siteId,
      tenantId: record.tenantId ?? undefined,
      rail: record.rail,
      partyId: record.partyId ?? undefined,
      feeMinor: record.fee ? Number(record.fee.minor) : undefined,
      customer: record.customer ?? undefined,
      occurredAt: record.occurredAt,
      metadata: record.orderRef ? { orderRef: record.orderRef } : undefined,
    });
    if (!event) return null; // status mapped to nothing actionable
    return machine.apply(event);
  }

  return {
    machine,
    validate,
    recordCapture: (input) => apply(input, 'CAPTURED'),
    recordAuthorization: (input) => apply(input, 'AUTHORIZED'),
    recordFailure: (input) => apply(input, 'FAILED'),
  };
}

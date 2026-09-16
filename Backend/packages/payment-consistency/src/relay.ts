/**
 * Payment outbox relay — one wiring, used by every service that reports payments.
 *
 * Each service keeps its own `pcl` schema in its own database (the platform's "one service =
 * one DB" rule), so each needs its own relay to drain it. Hand-writing that per service is how
 * five subtly different relays appear; this is the single implementation.
 *
 *   const relay = createPaymentOutboxRelay({ pool, bus, logger });
 *   relay.start();
 *
 * Delivery contract, so retries behave correctly:
 *   - published ok               → resolve (ack, mark SENT)
 *   - not a payment state change → resolve (PAYMENT_CONFLICT is an alert, not a record)
 *   - unattributable envelope    → THROW   (dead-letters loudly rather than entering the read
 *                                           model as a payment belonging nowhere)
 *   - bus failure                → THROW   (relay backs off and retries)
 */
import { paymentRecordedFromEnvelope } from './record';
import type { PgPool } from './pgStore';

export interface RelayLogger {
  error(obj: object, msg: string): void;
  warn(obj: object, msg: string): void;
  info(obj: object, msg: string): void;
  debug?(obj: object, msg: string): void;
}

export interface EventBus {
  publish(event: unknown): Promise<void>;
}

export interface PaymentOutboxRelayOptions {
  /** A pg Pool, or anything with the same `query(text, params) => { rows }` shape. */
  pool: PgPool;
  /**
   * Where canonical events go. Supply either this or `redis`.
   *
   * If you build it yourself, `rethrow: true` is mandatory — without it the relay cannot see a
   * publish failure and would ack payments it never delivered.
   */
  bus?: EventBus;
  /**
   * An ioredis-compatible client. The relay builds the bus from it with `rethrow: true`, which
   * is the common case and removes the chance of a service forgetting that flag.
   */
  redis?: { publish(channel: string, message: string): Promise<number>; xadd(...args: never[]): Promise<string | null> };
  logger: RelayLogger;
  schema?: string;
  outboxTable?: string;
  pollMs?: number;
  /**
   * How long a payment may sit undelivered before the relay calls it stalled. The relay retries
   * forever and never loses a row, so the danger is not loss — it is silence: payments record
   * locally, the panel stays empty, and nothing says why. Default 5 minutes.
   */
  lagWarnAfterSeconds?: number;
  /** How often to check the backlog. Default 60s. Set 0 to disable the periodic check. */
  healthCheckMs?: number;
}

/** What the outbox looks like right now — the answer to "are payments reaching the panel?". */
export interface OutboxHealth {
  pending: number;
  failed: number;
  /** Age of the oldest undelivered row. Null when nothing is pending. */
  oldestPendingAgeSeconds: number | null;
  /** Pending work older than `lagWarnAfterSeconds` — delivery is not keeping up. */
  stalled: boolean;
  checkedAt: string;
}

export interface PaymentOutboxRelay {
  start(): unknown;
  stop(): Promise<void>;
  /** Current backlog. Safe to call from a health endpoint. */
  health(): Promise<OutboxHealth>;
  /** Drain one batch synchronously — for tests and manual triggers. */
  drainOnce(): Promise<unknown>;
  /** The adapter the relay publishes through; exposed so it can be tested in isolation. */
  publisher: { publish(event: unknown): Promise<void>; publishMany(events: unknown[]): Promise<void> };
}

function loadEvents(): Record<string, (...args: never[]) => unknown> {
  try {
    // Lazily required: @baalvion/events is an optional peer, so a service that does not relay
    // never has to install it.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    return require('@baalvion/events');
  } catch {
    throw new Error('[pcl] @baalvion/events is required to run the payment outbox relay — add it to this service.');
  }
}

/**
 * Read the outbox backlog without needing a relay instance — for a health endpoint, a probe, or
 * an operator checking a service that is not currently relaying.
 *
 * One query, three numbers. `attempts` is deliberately not surfaced as a failure signal: a row
 * retried twenty times and delivered is fine, whereas one pending for an hour is not.
 */
export async function readOutboxHealth(
  pool: PgPool,
  options: { schema?: string; table?: string; lagWarnAfterSeconds?: number } = {},
): Promise<OutboxHealth> {
  const schema = options.schema ?? 'pcl';
  const table = options.table ?? 'payment_outbox';
  const warnAfter = options.lagWarnAfterSeconds ?? 300;

  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
       COUNT(*) FILTER (WHERE status = 'failed')::int  AS failed,
       EXTRACT(EPOCH FROM (NOW() - MIN(created_at) FILTER (WHERE status = 'pending')))::float8 AS oldest_age
     FROM ${schema}.${table}`,
    [],
  );
  const row = (rows[0] ?? {}) as { pending?: number; failed?: number; oldest_age?: number | null };
  const oldest = row.oldest_age === null || row.oldest_age === undefined ? null : Number(row.oldest_age);

  return {
    pending: Number(row.pending ?? 0),
    failed: Number(row.failed ?? 0),
    oldestPendingAgeSeconds: oldest,
    stalled: oldest !== null && oldest > warnAfter,
    checkedAt: new Date().toISOString(),
  };
}

export function createPaymentOutboxRelay(options: PaymentOutboxRelayOptions): PaymentOutboxRelay {
  const { pool, logger } = options;
  const schema = options.schema ?? 'pcl';
  const outboxTable = options.outboxTable ?? 'payment_outbox';
  const pollMs = options.pollMs ?? 2000;
  const lagWarnAfterSeconds = options.lagWarnAfterSeconds ?? 300;
  const healthCheckMs = options.healthCheckMs ?? 60_000;

  if (!options.bus && !options.redis) {
    throw new Error('[pcl] createPaymentOutboxRelay needs either a bus or a redis client');
  }

  /**
   * @baalvion/events is resolved on first use rather than at construction, so a service can
   * build a relay and read `health()` — the thing an ops probe actually calls — without the
   * optional peer installed. Anything that genuinely delivers still fails loudly and early,
   * because `start()` is called immediately after construction everywhere.
   */
  interface Wiring {
    store: unknown;
    bus: EventBus;
    startOutboxRelay: (...a: unknown[]) => { stop(): Promise<void> };
    relayOutbox: (...a: unknown[]) => Promise<unknown>;
  }
  let wiring: Wiring | null = null;
  function wire(): Wiring {
    if (wiring) return wiring;
    const events = loadEvents();
    const createPgOutboxStore = events.createPgOutboxStore as (o: unknown) => unknown;
    const createRedisPublisher = events.createRedisPublisher as (c: unknown, l: unknown, o: unknown) => EventBus;
    wiring = {
      store: createPgOutboxStore({ runner: pool, schema, table: outboxTable }),
      // rethrow is not optional here: the relay must observe a publish failure to retry it.
      bus: options.bus ?? createRedisPublisher(options.redis, logger, { rethrow: true }),
      startOutboxRelay: events.startOutboxRelay as (...a: unknown[]) => { stop(): Promise<void> },
      relayOutbox: events.relayOutbox as (...a: unknown[]) => Promise<unknown>,
    };
    return wiring;
  }

  const publisher = {
    async publish(event: unknown): Promise<void> {
      const row = event as { payload?: unknown } | undefined;
      const envelope = (row && row.payload ? row.payload : event) as Record<string, unknown>;
      const recorded = paymentRecordedFromEnvelope(envelope);
      if (!recorded) {
        logger.info({ id: envelope?.id, type: envelope?.type }, 'not a payment state change — acked without publishing');
        return;
      }
      await wire().bus.publish(recorded);
    },
    async publishMany(list: unknown[]): Promise<void> {
      for (const e of list) await publisher.publish(e);
    },
  };

  let handle: { stop(): Promise<void> } | null = null;
  let healthTimer: ReturnType<typeof setInterval> | null = null;
  // Only log the transition, not every check — a stalled outbox should page once, not every
  // minute until someone silences it.
  let wasStalled = false;

  const health = () => readOutboxHealth(pool, { schema, table: outboxTable, lagWarnAfterSeconds });

  async function checkLag(): Promise<void> {
    try {
      const h = await health();
      if (h.stalled && !wasStalled) {
        logger.error(
          { pending: h.pending, failed: h.failed, oldestPendingAgeSeconds: h.oldestPendingAgeSeconds, schema },
          'payment outbox is stalled — payments are recording but not reaching the panel',
        );
      } else if (!h.stalled && wasStalled) {
        logger.info({ pending: h.pending, schema }, 'payment outbox recovered');
      }
      wasStalled = h.stalled;
    } catch (err) {
      // A health check must never take the relay down with it.
      logger.warn({ err: (err as Error).message, schema }, 'payment outbox health check failed');
    }
  }

  return {
    publisher,
    health,
    start() {
      if (handle) return handle;
      const w = wire();
      handle = w.startOutboxRelay(w.store, publisher, logger, { pollMs });
      if (healthCheckMs > 0) {
        healthTimer = setInterval(() => { void checkLag(); }, healthCheckMs);
        if (typeof healthTimer.unref === 'function') healthTimer.unref();
      }
      logger.info({ schema, table: outboxTable, pollMs, lagWarnAfterSeconds }, 'payment outbox relay started');
      return handle;
    },
    async stop() {
      if (healthTimer) { clearInterval(healthTimer); healthTimer = null; }
      if (handle) { await handle.stop(); handle = null; }
    },
    drainOnce() {
      const w = wire();
      return w.relayOutbox(w.store, publisher, logger, {});
    },
  };
}

/**
 * Transactional outbox + safe relay + idempotent consumer — the no-event-loss
 * delivery primitives for the event bus.
 *
 * Outbox pattern: a domain mutation and its event are written in the SAME DB
 * transaction (the event goes to an `event_outbox` table). A relay then publishes
 * unsent rows to the bus and marks them sent. This guarantees an event is emitted
 * iff its mutation committed — no dual-write inconsistency, no fire-and-forget loss.
 *
 * The relay is the canonical lock-free, per-row design (the same one ledger-service
 * uses in the Java finance suite):
 *   1. CLAIM   — `claimBatch` selects due PENDING rows with `FOR UPDATE SKIP LOCKED`
 *                and LEASES them (pushes `available_at` past a lease window) in one
 *                short statement, so the row locks are released before any broker I/O
 *                and a concurrent relay/tick can't double-claim them.
 *   2. PUBLISH — each row is published OUTSIDE any transaction; the publisher MUST
 *                throw on failure so the failure is observed, never swallowed.
 *   3. PERSIST — each row's outcome is recorded independently: SENT on success, or
 *                attempts++ + bounded-exponential backoff (`recordFailure`), or
 *                FAILED (dead-letter) after `maxAttempts`. One poison row can NEVER
 *                block the rest of the batch and is never silently retried forever.
 *
 * Delivery is at-least-once: if the relay crashes after a broker ack but before
 * marking SENT, the lease elapses and the row is re-published — so consumers must
 * dedupe (see `idempotent` / `SeenStore` below).
 *
 * The store is abstract so any service plugs in its own DB; `createPgOutboxStore`
 * (./pgOutboxStore) is a ready-to-use PostgreSQL implementation.
 */
import type { PlatformEvent } from '@baalvion/types';
import type { EventPublisher } from './index';

// Minimal ambient timer globals — this package intentionally has no @types/node dependency
// (mirrors broker.ts). The relay uses setInterval/clearInterval for its poll loop.
declare function setInterval(handler: (...args: any[]) => void, ms: number): unknown;
declare function clearInterval(timer: unknown): void;
declare function setTimeout(handler: (...args: any[]) => void, ms: number): unknown;

export type OutboxStatus = 'pending' | 'sent' | 'failed';

export interface OutboxRow {
  id: string;          // = event.id
  type: string;
  payload: string;     // serialized PlatformEvent (text, so JSON.parse below is unambiguous)
  attempts: number;    // failed-publish count so far
  createdAt: string;
}

export interface OutboxStore {
  /** Persist an event row inside the caller's open transaction (so it commits with the mutation). */
  enqueue(event: PlatformEvent, tx?: unknown): Promise<void>;
  /**
   * Atomically claim up to `limit` due (`status='pending'`, `available_at<=now`) rows with
   * `FOR UPDATE SKIP LOCKED` and lease them to `leaseUntil` so no other tick/instance re-claims
   * them mid-publish. Returns the claimed rows (oldest-available first).
   */
  claimBatch(limit: number, now: Date, leaseUntil: Date): Promise<OutboxRow[]>;
  /** Mark rows SENT after a successful publish. */
  markSent(ids: string[]): Promise<void>;
  /**
   * Record a failed publish for ONE row: bump attempts, store `error`, and either defer it to
   * `nextAvailableAt` (backoff) or mark it FAILED when `dead` (retries exhausted / un-publishable).
   */
  recordFailure(id: string, error: string, nextAvailableAt: Date, dead: boolean): Promise<void>;
}

export interface RelayLogger {
  error(o: object, m: string): void;
  warn?(o: object, m: string): void;
  debug?(o: object, m: string): void;
  info?(o: object, m: string): void;
}

export interface RelayOptions {
  /** Max rows claimed per tick. */
  batch?: number;
  /** Mark a row FAILED (dead-letter) after this many failed attempts. */
  maxAttempts?: number;
  /** How long a claimed-but-not-yet-resolved row is hidden from other ticks/instances (ms). */
  leaseMs?: number;
  /** Backoff base for the n-th retry: base * 2^(n-1), capped at backoffMaxMs (ms). */
  backoffBaseMs?: number;
  backoffMaxMs?: number;
  /** Injectable clock (tests). Defaults to `() => new Date()`. */
  now?: () => Date;
}

export interface RelayResult {
  claimed: number;
  sent: number;
  failed: number; // deferred for retry this tick
  dead: number;   // dead-lettered (FAILED) this tick
}

const DEFAULTS = {
  batch: 200,
  maxAttempts: 10,
  leaseMs: 60_000,
  backoffBaseMs: 2_000,
  backoffMaxMs: 300_000,
};

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Bounded exponential backoff: base * 2^(attempts-1), capped at max (ms). */
export function backoffMillis(attempts: number, base: number, max: number): number {
  const shift = Math.min(Math.max(attempts - 1, 0), 30); // guard the shift from overflow
  const delay = base * Math.pow(2, shift);
  if (!Number.isFinite(delay) || delay <= 0 || delay > max) return max;
  return delay;
}

/**
 * Drain one batch of the outbox to the bus. Call on an interval (see `startOutboxRelay`) or
 * directly from a worker. `publisher.publish` MUST reject on failure — a swallowing publisher
 * (e.g. the legacy `createRedisPublisher` without `rethrow`) would make every send look like a
 * success and re-introduce silent loss. Use a broker bus (`createRedisStreamsBus` etc.) or
 * `createRedisPublisher(client, log, { rethrow: true })`.
 */
export async function relayOutbox(
  store: OutboxStore,
  publisher: EventPublisher,
  log: RelayLogger,
  opts: RelayOptions = {},
): Promise<RelayResult> {
  const batch = opts.batch ?? DEFAULTS.batch;
  const maxAttempts = opts.maxAttempts ?? DEFAULTS.maxAttempts;
  const leaseMs = opts.leaseMs ?? DEFAULTS.leaseMs;
  const backoffBaseMs = opts.backoffBaseMs ?? DEFAULTS.backoffBaseMs;
  const backoffMaxMs = opts.backoffMaxMs ?? DEFAULTS.backoffMaxMs;
  const now = opts.now ?? (() => new Date());

  const claimAt = now();
  const rows = await store.claimBatch(batch, claimAt, new Date(claimAt.getTime() + leaseMs));
  const result: RelayResult = { claimed: rows.length, sent: 0, failed: 0, dead: 0 };
  if (!rows.length) return result;

  const sentIds: string[] = [];
  for (const r of rows) {
    let event: PlatformEvent;
    try {
      event = JSON.parse(r.payload) as PlatformEvent;
    } catch (err) {
      // A permanently un-parseable row would fail forever; dead-letter it so it can't wedge the queue.
      await store.recordFailure(r.id, 'unparseable payload: ' + errMsg(err), now(), true);
      result.dead++;
      log.error({ id: r.id, type: r.type }, 'outbox row payload unparseable — marked FAILED');
      continue;
    }

    try {
      await publisher.publish(event);
      sentIds.push(r.id);
      result.sent++;
    } catch (err) {
      // Per-row outcome: never break, so one poison row cannot block the rest of the batch.
      const attempts = r.attempts + 1;
      const dead = attempts >= maxAttempts;
      const nextAt = dead
        ? now()
        : new Date(now().getTime() + backoffMillis(attempts, backoffBaseMs, backoffMaxMs));
      await store.recordFailure(r.id, errMsg(err), nextAt, dead);
      if (dead) {
        result.dead++;
        log.error(
          { id: r.id, type: r.type, attempts, maxAttempts, err: errMsg(err) },
          'outbox event exhausted retries — marked FAILED (dead-letter)',
        );
      } else {
        result.failed++;
        (log.warn ?? log.error).call(
          log,
          { id: r.id, type: r.type, attempts, err: errMsg(err) },
          'outbox publish failed — will retry after backoff',
        );
      }
    }
  }
  if (sentIds.length) await store.markSent(sentIds);
  return result;
}

export interface OutboxRelayHandle {
  /** Stop the interval and resolve once any in-flight tick settles. */
  stop(): Promise<void>;
}

/**
 * Run `relayOutbox` on a fixed interval. Ticks never overlap (a slow tick skips the next timer
 * fire). Errors from a tick are logged, never thrown, so the loop survives a transient DB outage.
 */
export function startOutboxRelay(
  store: OutboxStore,
  publisher: EventPublisher,
  log: RelayLogger,
  opts: RelayOptions & { pollMs?: number } = {},
): OutboxRelayHandle {
  const pollMs = opts.pollMs ?? 2_000;
  let running = true;
  let ticking = false;

  const tick = async () => {
    if (!running || ticking) return;
    ticking = true;
    try {
      const r = await relayOutbox(store, publisher, log, opts);
      if (r.sent || r.dead) {
        log.info?.({ ...r }, 'outbox relay tick');
      }
    } catch (err) {
      log.error({ err: errMsg(err) }, 'outbox relay tick crashed — continuing');
    } finally {
      ticking = false;
    }
  };

  const timer = setInterval(tick, pollMs);
  // Don't keep the event loop alive solely for the relay (matches platform worker convention).
  (timer as { unref?: () => void }).unref?.();

  return {
    async stop() {
      running = false;
      clearInterval(timer);
      // Let an in-flight tick finish so we don't cut a publish mid-flight.
      while (ticking) await new Promise((res) => setTimeout(res, 10));
    },
  };
}

// ─── Idempotent consumer ──────────────────────────────────────────────────────

export interface SeenStore {
  /** Returns true the FIRST time an id is seen, false on repeats (atomic). */
  firstSeen(id: string, ttlSeconds?: number): Promise<boolean>;
}

/** In-memory seen store (single-process; use the Redis one in production). */
export function memorySeenStore(max = 100_000): SeenStore {
  const seen = new Set<string>();
  return {
    async firstSeen(id: string) {
      if (seen.has(id)) return false;
      seen.add(id);
      if (seen.size > max) seen.delete(seen.values().next().value as string);
      return true;
    },
  };
}

/** Redis-backed seen store (SET NX EX) for multi-replica consumers. */
export interface RedisSetNx { set(key: string, val: string, mode: string, flag: string, ttl: number): Promise<unknown>; }
export function redisSeenStore(redis: RedisSetNx, prefix = 'evt:seen:'): SeenStore {
  return {
    async firstSeen(id: string, ttlSeconds = 86400) {
      const res = await redis.set(prefix + id, '1', 'EX', 'NX', ttlSeconds).catch(() => null);
      return res != null;
    },
  };
}

/** Wrap a handler so duplicate deliveries (same event.id) are skipped exactly once. */
export function idempotent<T>(
  handler: (e: PlatformEvent<T>) => Promise<void> | void,
  seen: SeenStore,
) {
  return async (e: PlatformEvent<T>): Promise<void> => {
    if (!(await seen.firstSeen(e.id))) return; // duplicate — already processed
    await handler(e);
  };
}

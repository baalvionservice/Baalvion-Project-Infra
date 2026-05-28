/**
 * Transactional outbox + idempotent consumer — the exactly-once-ish delivery
 * primitives for the event bus.
 *
 * Outbox pattern: a domain mutation and its event are written in the SAME DB
 * transaction (the event goes to an `event_outbox` table). A relay then publishes
 * unsent rows to the bus and marks them sent. This guarantees an event is emitted
 * iff its mutation committed — no dual-write inconsistency.
 *
 * The store is abstract so any service plugs in its own DB (Sequelize/pg/Knex).
 */
import type { PlatformEvent } from '@baalvion/types';
import type { EventPublisher } from './index';

export interface OutboxRow {
  id: string;          // = event.id
  type: string;
  payload: string;     // serialized PlatformEvent
  createdAt: string;
}

export interface OutboxStore {
  /** Persist an event row inside the caller's open transaction. */
  enqueue(event: PlatformEvent, tx?: unknown): Promise<void>;
  /** Fetch up to `limit` unsent rows (oldest first). */
  fetchUnsent(limit: number): Promise<OutboxRow[]>;
  /** Mark rows as sent (or delete them). */
  markSent(ids: string[]): Promise<void>;
}

export interface RelayLogger { error(o: object, m: string): void; debug(o: object, m: string): void; }

/**
 * Relay unsent outbox rows to the bus. Call on an interval (e.g. every 1–2s) from
 * a worker. Returns the number relayed. Safe to run multiple replicas if the
 * store uses `FOR UPDATE SKIP LOCKED` in fetchUnsent.
 */
export async function relayOutbox(
  store: OutboxStore,
  publisher: EventPublisher,
  log: RelayLogger,
  batch = 200,
): Promise<number> {
  const rows = await store.fetchUnsent(batch);
  if (!rows.length) return 0;
  const sent: string[] = [];
  for (const r of rows) {
    try {
      await publisher.publish(JSON.parse(r.payload) as PlatformEvent);
      sent.push(r.id);
    } catch (err) {
      log.error({ err, id: r.id, type: r.type }, 'outbox relay publish failed — will retry');
      break; // preserve ordering: stop at first failure, retry next tick
    }
  }
  if (sent.length) await store.markSent(sent);
  return sent.length;
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

/**
 * Durable event-bus transports for the enterprise backbone. Both NATS JetStream
 * and Kafka implement the SAME `EventPublisher` interface as the Redis publisher,
 * so a service upgrades transport with one line — no call-site changes.
 *
 * Optional deps (`nats`, `kafkajs`) are loaded lazily so this package builds and
 * imports cleanly without them; the transport activates when the dep is installed
 * and the broker is configured. This mirrors the platform's optional-lib pattern.
 *
 * Choice (ADR-0002): NATS JetStream is the default DOMAIN-EVENT bus (low-latency,
 * subject wildcards, replay, lightweight ops); Kafka/Redpanda remains the
 * HIGH-VOLUME telemetry log. The adapter supports both.
 */
import type { PlatformEvent } from '@baalvion/types';
import type { EventPublisher } from './index';
import { subjectFor } from './domain';

// Minimal ambient Node globals — this package intentionally has no @types/node
// dependency; the redis transport reads REDIS_* env and uses setTimeout for backoff.
declare const process: { env: Record<string, string | undefined> };
declare function setTimeout(handler: (...args: any[]) => void, ms: number): unknown;

export type Transport = 'nats' | 'kafka' | 'redis' | 'noop';

export interface BrokerLogger {
  error(obj: object, msg: string): void;
  debug(obj: object, msg: string): void;
  info?(obj: object, msg: string): void;
}

const noopLog: BrokerLogger = { error() {}, debug() {}, info() {} };

/**
 * Load an optional peer dependency. The specifier is a runtime variable so the
 * TypeScript compiler does NOT statically resolve it — the package builds and
 * type-checks without `nats`/`kafkajs` installed, and activates when they are.
 */
async function loadOptional(name: string): Promise<any> {
  try { return await import(name); } catch { return null; }
}

export interface MessageHandler<T = unknown> {
  (event: PlatformEvent<T>): Promise<void> | void;
}

export interface Subscription {
  unsubscribe(): Promise<void>;
}

export interface EventBus extends EventPublisher {
  transport: Transport;
  /** Subscribe a durable consumer. `pattern` may use NATS wildcards (e.g. `proxy.>`). */
  subscribe<T = unknown>(pattern: string, durable: string, handler: MessageHandler<T>): Promise<Subscription>;
  start(): Promise<void>;
  close(): Promise<void>;
}

// ─── NATS JetStream ─────────────────────────────────────────────────────────────

export interface NatsConfig {
  servers: string | string[];
  stream?: string;        // JetStream stream name (default BAALVION)
  subjects?: string[];    // subjects bound to the stream (default ['>'] under prefix)
  logger?: BrokerLogger;
}

export async function createNatsBus(cfg: NatsConfig): Promise<EventBus> {
  const log = cfg.logger ?? noopLog;
  const stream = cfg.stream ?? 'BAALVION';
  let nc: any = null;
  let js: any = null;
  let jsm: any = null;
  let codec: any = null;

  async function start() {
    // Lazy import — package builds without `nats` installed.
    const nats = await loadOptional('nats');
    if (!nats) { log.error({}, 'nats package not installed — bus disabled'); return; }
    nc = await nats.connect({ servers: cfg.servers });
    codec = nats.JSONCodec();
    js = nc.jetstream();
    jsm = await nc.jetstreamManager();
    // Idempotent stream creation (replay-capable, dedup window).
    await jsm.streams.add({
      name: stream,
      subjects: cfg.subjects ?? ['auth.>', 'org.>', 'proxy.>', 'billing.>', 'provider.>', 'abuse.>', 'security.>'],
      duplicate_window: 2 * 60 * 1_000_000_000, // 2 min dedup (ns)
      max_age: 7 * 24 * 60 * 60 * 1_000_000_000, // 7d retention (ns)
    }).catch((e: any) => {
      if (!String(e?.message).includes('already in use')) throw e;
    });
    log.info?.({ stream }, 'NATS JetStream connected');
  }

  async function publishOne<T>(event: PlatformEvent<T>): Promise<void> {
    if (!js) return;
    try {
      // msgID = event.id → JetStream dedups within duplicate_window (exactly-once publish).
      await js.publish(subjectFor(event.type), codec.encode(event), { msgID: event.id });
      log.debug({ eventId: event.id, type: event.type }, 'event published (nats)');
    } catch (err) {
      log.error({ err, eventId: event.id, type: event.type }, 'nats publish failed');
      throw err;
    }
  }

  return {
    transport: 'nats',
    start,
    publish: publishOne,
    publishMany: async (events) => { for (const e of events) await publishOne(e); },
    async subscribe<T>(pattern: string, durable: string, handler: MessageHandler<T>): Promise<Subscription> {
      if (!js) { await start(); }
      if (!js) return { async unsubscribe() {} };
      const nats = await loadOptional('nats');
      const opts = nats.consumerOpts();
      opts.durable(durable);
      opts.manualAck();
      opts.ackExplicit();
      opts.deliverTo(nats.createInbox());
      opts.filterSubject(pattern);
      const sub = await js.subscribe(pattern, opts);
      (async () => {
        for await (const m of sub) {
          try {
            await handler(codec.decode(m.data) as PlatformEvent<T>);
            m.ack();
          } catch (err) {
            log.error({ err, durable, pattern }, 'consumer handler failed — nak for redelivery');
            m.nak();
          }
        }
      })().catch((err) => log.error({ err, durable }, 'consumer loop crashed'));
      return { async unsubscribe() { await sub.unsubscribe(); } };
    },
    async close() { if (nc) await nc.drain(); },
  };
}

// ─── Kafka ───────────────────────────────────────────────────────────────────────

export interface KafkaConfig {
  brokers: string[];
  clientId?: string;
  groupId?: string;
  logger?: BrokerLogger;
}

export async function createKafkaBus(cfg: KafkaConfig): Promise<EventBus> {
  const log = cfg.logger ?? noopLog;
  let kafka: any = null;
  let producer: any = null;
  const consumers: any[] = [];

  async function start() {
    const lib = await loadOptional('kafkajs');
    if (!lib) { log.error({}, 'kafkajs not installed — bus disabled'); return; }
    kafka = new lib.Kafka({ clientId: cfg.clientId ?? 'baalvion', brokers: cfg.brokers });
    producer = kafka.producer({ idempotent: true });
    await producer.connect();
    log.info?.({ brokers: cfg.brokers }, 'Kafka connected');
  }

  async function publishOne<T>(event: PlatformEvent<T>): Promise<void> {
    if (!producer) return;
    try {
      await producer.send({
        topic: subjectFor(event.type),
        messages: [{ key: event.orgId ?? event.id, value: JSON.stringify(event), headers: { 'event-id': event.id } }],
      });
      log.debug({ eventId: event.id, type: event.type }, 'event published (kafka)');
    } catch (err) {
      log.error({ err, eventId: event.id, type: event.type }, 'kafka publish failed');
      throw err;
    }
  }

  return {
    transport: 'kafka',
    start,
    publish: publishOne,
    publishMany: async (events) => { if (!producer) return; await Promise.all(events.map(publishOne)); },
    async subscribe<T>(pattern: string, durable: string, handler: MessageHandler<T>): Promise<Subscription> {
      if (!kafka) await start();
      if (!kafka) return { async unsubscribe() {} };
      const consumer = kafka.consumer({ groupId: durable });
      await consumer.connect();
      // Kafka has no subject wildcards; a `ctx.>` pattern maps to a topic-prefix regex.
      const topic = pattern.includes('>') ? new RegExp('^' + pattern.replace('.>', '\\..*')) : pattern;
      await consumer.subscribe({ topic, fromBeginning: false });
      await consumer.run({
        eachMessage: async ({ message }: any) => {
          try { await handler(JSON.parse(message.value.toString()) as PlatformEvent<T>); }
          catch (err) { log.error({ err, durable }, 'kafka handler failed'); throw err; }
        },
      });
      consumers.push(consumer);
      return { async unsubscribe() { await consumer.disconnect(); } };
    },
    async close() {
      if (producer) await producer.disconnect();
      await Promise.all(consumers.map((c) => c.disconnect().catch(() => {})));
    },
  };
}

// ─── Redis Streams ──────────────────────────────────────────────────────────────
// The platform's existing live event backbone: a single Redis Stream
// (`baalvion:events`) consumed by notification-service and audit-service via
// XREADGROUP consumer groups. This transport makes the SAME stream the delivery
// target for sdk.events — no SDK API change, no consumer change.
//
// WIRE FORMAT (must stay byte-compatible with the existing consumers, which read
// `_type`, `_payload`, `_correlationId`):
//   XADD baalvion:events * _type <type> _payload <JSON payload> _correlationId <traceId>
//        _orgId <tenant> _userId <user> _eventId <id> _timestamp <ts> _event <full PlatformEvent JSON>
// `_event` carries the whole PlatformEvent so SDK subscribers reconstruct it exactly
// (traceId + tenantId intact); the extra fields are ignored by the legacy consumers.

export interface RedisStreamsConfig {
  host?:     string;
  port?:     number;
  password?: string;
  stream?:   string;   // default 'baalvion:events'
  logger?:   BrokerLogger;
  /** Throw on unavailable transport instead of degrading (set true in production). */
  failFast?: boolean;
}

export async function createRedisStreamsBus(cfg: RedisStreamsConfig): Promise<EventBus> {
  const log = cfg.logger ?? noopLog;
  const stream = cfg.stream ?? 'baalvion:events';
  const host = cfg.host ?? process.env.REDIS_HOST ?? 'localhost';
  const port = cfg.port ?? Number(process.env.REDIS_PORT ?? 6379);
  const password = cfg.password ?? process.env.REDIS_PASSWORD ?? undefined;

  const IORedis = await loadOptional('ioredis');
  let pub: any = null;
  const subs: Array<{ conn: any; running: boolean }> = [];
  // durable group → pattern, to reject reusing one group with two patterns
  // (which would make the group ACK messages meant for the other pattern).
  const registered = new Map<string, string>();

  function makeClient(): any {
    // Prefer the stable named export (.Redis works across ioredis v4/v5); .default
    // is a module-interop artifact that varies by CJS/ESM. Fail loudly if neither.
    const Ctor = IORedis?.Redis ?? IORedis?.default ?? IORedis;
    if (typeof Ctor !== 'function') throw new Error('[event-bus] ioredis loaded but Redis constructor not found');
    return new Ctor({ host, port, password: password || undefined, maxRetriesPerRequest: null, lazyConnect: false });
  }

  async function start(): Promise<void> {
    if (!IORedis) {
      const msg = 'ioredis not installed — redis-streams bus unavailable';
      if (cfg.failFast) throw new Error(`[event-bus] ${msg}`);
      log.error({}, msg);
      return;
    }
    if (!pub) pub = makeClient();
    try {
      await pub.ping();
      log.info?.({ stream, host, port }, 'redis-streams transport ACTIVE (baalvion:events)');
    } catch (err) {
      if (cfg.failFast) throw new Error(`[event-bus] redis unavailable at ${host}:${port}: ${(err as any)?.message}`);
      log.error({ err: String(err), host, port }, 'redis ping failed — events will not deliver');
    }
  }

  async function publishOne<T>(event: PlatformEvent<T>): Promise<void> {
    if (!pub) {
      // Redis was unavailable at start() in non-failFast mode — make every drop visible.
      log.error({ eventId: event.id, type: event.type }, 'redis pub unavailable — event dropped');
      return;
    }
    try {
      await pub.xadd(
        // MAXLEN ~ approximate-trims the shared stream so it can't grow unbounded
        // under sustained load (matches the audit-service retention budget).
        stream, 'MAXLEN', '~', '100000', '*',
        '_type',          event.type,
        '_payload',       JSON.stringify(event.payload ?? {}),
        '_correlationId', event.traceId ?? '',
        '_orgId',         event.orgId ?? '',
        '_userId',        event.userId ?? '',
        '_eventId',       event.id ?? '',
        '_timestamp',     event.timestamp ?? '',
        '_source',        'sdk.events',
        '_event',         JSON.stringify(event),
      );
      log.debug({ eventId: event.id, type: event.type, stream }, 'event published (redis streams)');
    } catch (err) {
      log.error({ err: String(err), eventId: event.id, type: event.type }, 'redis xadd failed');
      throw err;
    }
  }

  // NATS-style pattern match over a single stream of mixed event types.
  function matches(pattern: string, type: string): boolean {
    if (!pattern || pattern === '>' || pattern === '*' || pattern === type) return true;
    if (pattern.endsWith('.>')) return type.startsWith(pattern.slice(0, -1));        // 'cms.>' → 'cms.'
    if (pattern.endsWith('.*')) {
      const p = pattern.slice(0, -1);                                                 // 'cms.*' → 'cms.'
      return type.startsWith(p) && !type.slice(p.length).includes('.');
    }
    return false;
  }

  function reconstruct<T>(data: Record<string, string>): PlatformEvent<T> {
    if (data._event) {
      try { return JSON.parse(data._event) as PlatformEvent<T>; } catch { /* fall through */ }
    }
    return {
      id: data._eventId ?? '', type: (data._type ?? '') as any,
      payload: (() => { try { return JSON.parse(data._payload || '{}'); } catch { return {}; } })() as T,
      orgId: data._orgId || null, userId: data._userId || null,
      timestamp: data._timestamp ?? '', traceId: data._correlationId ?? '',
    };
  }

  return {
    transport: 'redis',
    start,
    publish: publishOne,
    publishMany: async (events) => { for (const e of events) await publishOne(e); },
    async subscribe<T>(pattern: string, durable: string, handler: MessageHandler<T>): Promise<Subscription> {
      if (!IORedis) return { async unsubscribe() {} };
      // One durable group per pattern: consuming a single group with two different
      // patterns makes it ACK the other pattern's messages (silent loss). Reject it.
      const prev = registered.get(durable);
      if (prev && prev !== pattern) {
        throw new Error(`[event-bus] durable group "${durable}" already subscribed with pattern "${prev}" — use a distinct group name per pattern`);
      }
      registered.set(durable, pattern);

      const conn = makeClient();
      try { await conn.xgroup('CREATE', stream, durable, '$', 'MKSTREAM'); }
      catch (e: any) { if (!String(e?.message).includes('BUSYGROUP')) throw e; }
      const state = { conn, running: true };
      subs.push(state);
      const consumerName = `${durable}-${process.env.POD_NAME || 'local'}`;

      async function handleMsg(msg: any): Promise<void> {
        const [msgId, fields] = msg;
        const data: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) data[fields[i]] = fields[i + 1];
        if (!data._type || !matches(pattern, data._type)) {
          // This group only handles its pattern; ACK the rest so the PEL stays clean.
          log.debug({ msgId, type: data._type, pattern, durable }, 'event skipped — pattern mismatch (acked)');
          await conn.xack(stream, durable, msgId);
          return;
        }
        try {
          await handler(reconstruct<T>(data));
          await conn.xack(stream, durable, msgId);
        } catch (err) {
          log.error({ err: String(err), durable, type: data._type }, 'redis handler failed — left pending for reclaim');
        }
      }

      // Reclaim entries a crashed/previous consumer was delivered but never ACKed,
      // so a pod restart (new consumer name) doesn't strand them in the PEL forever.
      async function reclaim(): Promise<void> {
        try {
          const res: any = await conn.xautoclaim(stream, durable, consumerName, 30_000, '0-0', 'COUNT', 20);
          const msgs = (res && res[1]) || [];
          for (const m of msgs) await handleMsg(m);
          if (msgs.length) log.info?.({ durable, count: msgs.length }, 'redis reclaimed pending events');
        } catch (err) { log.error({ err: String(err), durable }, 'redis reclaim failed'); }
      }

      (async () => {
        await reclaim();
        while (state.running) {
          try {
            const res = await conn.xreadgroup('GROUP', durable, consumerName, 'COUNT', 20, 'BLOCK', 2000, 'STREAMS', stream, '>');
            if (!res) continue;
            for (const [, messages] of res) {
              for (const msg of messages) await handleMsg(msg);
            }
          } catch (err) {
            if (!state.running) break;
            log.error({ err: String(err), durable }, 'redis consumer loop error — retry in 2s');
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      })().catch((err) => log.error({ err: String(err), durable }, 'redis consumer crashed'));
      return { async unsubscribe() { state.running = false; registered.delete(durable); try { conn.disconnect(); } catch { /* noop */ } } };
    },
    async close() {
      for (const s of subs) { s.running = false; try { s.conn.disconnect(); } catch { /* noop */ } }
      if (pub) { try { pub.disconnect(); } catch { /* noop */ } }
    },
  };
}

// ─── Unified factory ──────────────────────────────────────────────────────────────

export interface EventBusConfig {
  transport: Transport;
  nats?: NatsConfig;
  kafka?: KafkaConfig;
  redis?: RedisStreamsConfig;
  logger?: BrokerLogger;
}

/**
 * Build the configured event bus. Returns a no-op bus for `noop` (or when the
 * chosen transport's dep is missing) so services boot regardless. For `redis`,
 * the connection defaults from REDIS_* env when no explicit config is supplied —
 * so the frozen SDK (which passes only `transport`) activates real delivery via
 * EVENT_TRANSPORT=redis with zero API change. Fails fast in production.
 */
export async function createEventBus(cfg: EventBusConfig): Promise<EventBus> {
  if (cfg.transport === 'nats' && cfg.nats) {
    const bus = await createNatsBus({ ...cfg.nats, logger: cfg.logger });
    await bus.start();
    return bus;
  }
  if (cfg.transport === 'kafka' && cfg.kafka) {
    const bus = await createKafkaBus({ ...cfg.kafka, logger: cfg.logger });
    await bus.start();
    return bus;
  }
  if (cfg.transport === 'redis') {
    const bus = await createRedisStreamsBus({
      ...(cfg.redis ?? {}),
      logger: cfg.logger,
      failFast: cfg.redis?.failFast ?? process.env.NODE_ENV === 'production',
    });
    await bus.start();
    return bus;
  }
  return {
    transport: 'noop',
    async start() {},
    async publish() {},
    async publishMany() {},
    async subscribe() { return { async unsubscribe() {} }; },
    async close() {},
  };
}

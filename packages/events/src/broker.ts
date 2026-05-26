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

// ─── Unified factory ──────────────────────────────────────────────────────────────

export interface EventBusConfig {
  transport: Transport;
  nats?: NatsConfig;
  kafka?: KafkaConfig;
  logger?: BrokerLogger;
}

/**
 * Build the configured event bus. Returns a no-op bus for `noop` (or when the
 * chosen transport's dep is missing) so services boot regardless.
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
  return {
    transport: 'noop',
    async start() {},
    async publish() {},
    async publishMany() {},
    async subscribe() { return { async unsubscribe() {} }; },
    async close() {},
  };
}

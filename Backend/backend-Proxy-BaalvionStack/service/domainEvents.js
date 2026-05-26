'use strict';

/**
 * Domain-event publisher — the proxy division's OUTBOUND integration surface on
 * the enterprise event bus (Prompt 11). This is the strangler-fig adoption point:
 * the existing monolith starts emitting the platform's cross-division domain
 * events WITHOUT changing how it works internally, so other contexts (billing,
 * analytics, notifications, audit) can consume them as we extract services.
 *
 * Transport precedence (all optional, never throws to the caller):
 *   1. NATS JetStream  (EVENT_BUS_TRANSPORT=nats + `nats` installed + NATS_URL)
 *   2. Redis           (existing redisClient) — publishes to the SAME channel +
 *                       stream the @baalvion/events Redis publisher uses, so
 *                       platform consumers work today.
 *   3. no-op           (nothing configured — emit() is a safe no-op)
 *
 * Subjects/types match @baalvion/contracts (events/*.v1.json) exactly.
 */

const crypto = require('crypto');
const { getRedis } = require('./redisClient');
const logger = require('./logger');

const STREAM_KEY = 'baalvion:event_stream';
const TRANSPORT = (process.env.EVENT_BUS_TRANSPORT || 'redis').toLowerCase();

let nats = null;
let natsReady = false;

async function ensureNats() {
  if (TRANSPORT !== 'nats' || natsReady) return;
  natsReady = true; // attempt once
  try {
    const lib = require('nats'); // optional dep
    const nc = await lib.connect({ servers: process.env.NATS_URL || 'nats://127.0.0.1:4222' });
    nats = { nc, js: nc.jetstream(), codec: lib.JSONCodec() };
    logger.info('[events] NATS JetStream connected for domain events');
  } catch (err) {
    nats = null;
    logger.warn('[events] NATS unavailable, using Redis transport:', err.message);
  }
}

function envelope(type, payload, meta = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    payload,
    orgId: meta.orgId ?? payload.orgId ?? null,
    userId: meta.userId ?? null,
    timestamp: new Date().toISOString(),
    traceId: meta.traceId || crypto.randomUUID(),
  };
}

/** Publish one envelope. Best-effort; never throws (telemetry must not break flow). */
async function publish(event) {
  try {
    await ensureNats();
    if (nats) {
      await nats.js.publish(event.type, nats.codec.encode(event), { msgID: event.id });
      return;
    }
    const redis = getRedis();
    if (!redis) return; // no-op transport
    const serialized = JSON.stringify(event);
    await Promise.all([
      redis.publish(`baalvion:events:${event.type}`, serialized),
      redis.xadd(STREAM_KEY, '*', 'type', event.type, 'payload', serialized),
    ]);
  } catch (err) {
    logger.error('[events] publish failed:', err.message);
  }
}

// ─── Typed emitters (mirror @baalvion/events DomainEvents + contracts schemas) ──
const emit = {
  organizationCreated: (p, m) => publish(envelope('org.created', p, m)),
  proxySessionStarted: (p, m) => publish(envelope('proxy.session.started', p, m)),
  proxySessionEnded: (p, m) => publish(envelope('proxy.session.ended', p, m)),
  billingInvoiceGenerated: (p, m) => publish(envelope('billing.invoice.generated', p, m)),
  paymentSucceeded: (p, m) => publish(envelope('billing.payment.succeeded', p, m)),
  paymentFailed: (p, m) => publish(envelope('billing.payment.failed', p, m)),
  providerHealthChanged: (p, m) => publish(envelope('provider.health.changed', p, m)),
  abuseActionTriggered: (p, m) => publish(envelope('abuse.action.triggered', p, m)),
};

module.exports = { publish, emit, envelope };

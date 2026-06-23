'use strict';
/**
 * Payment Consistency Layer (PCL) — SHADOW-MODE adapter for order-service.
 *
 * Phase 1 of the PCL rollout (see Backend/packages/payment-consistency/README.md §4). The legacy
 * capture/fail path stays AUTHORITATIVE and completely unchanged. In ADDITION, after the legacy
 * transaction commits, we normalize the same payment event and feed it to the shared
 * PaymentStateMachine so `pcl.payment_state` is populated in parallel and any divergence between the
 * legacy status and the PCL state is LOGGED (drift telemetry). Nothing is published downstream in
 * shadow mode (no relay is started) — PCL emits to nobody.
 *
 * Hard guarantees this module upholds (so it can never regress a real checkout):
 *   • Gated by PCL_SHADOW (read at call-time). Disabled ⇒ a cheap no-op, no PCL require, no DB I/O.
 *   • NEVER throws. Every entry point swallows its own errors and resolves to a (possibly null)
 *     outcome, so a fire-and-forget call site cannot break or slow the legacy path.
 *   • Its own Sequelize transaction, opened AFTER the legacy commit. It shares the connection pool
 *     but NOT the legacy transaction, so a PCL failure can never roll back a captured payment.
 *   • The PCL package is required LAZILY inside the enabled branch, so a missing/al-built dist can
 *     never crash service startup.
 *
 * Grain: paymentId = orderId (one active charge per order in this flow), so a late "failed" after a
 * webhook "captured" for the same order surfaces as a PCL CONFLICT (state stays CAPTURED) — exactly
 * the no-double-charge / no-payment-wipe property we want to validate before enforcement.
 */

const PCL_SCHEMA = 'pcl';

let _machinePromise = null; // lazy singleton PaymentStateMachine (or null while uninitialized)
let _factoryOverride = null; // test seam: () => (machine | Promise<machine>)

function isEnabled() {
  return process.env.PCL_SHADOW === 'true';
}

const shadowLog = {
  info: (o, m) => console.info(JSON.stringify({ evt: 'pcl_shadow', msg: m, ...o })),
  warn: (o, m) => console.warn(JSON.stringify({ evt: 'pcl_shadow.warn', msg: m, ...o })),
  error: (o, m) => console.error(JSON.stringify({ evt: 'pcl_shadow.error', msg: m, ...o })),
};

/**
 * Adapt a Sequelize connection (or an open transaction) to the @baalvion/payment-consistency
 * PgQueryRunner shape `{ query(sql, params) => { rows } }`. Mirrors service/ledgerOutbox.js so PCL
 * reuses the exact same DB plumbing the events outbox already relies on (no second pool).
 */
function makeRunner(sequelize, t) {
  return {
    query: async (text, params) => {
      const [rows] = await sequelize.query(text, { bind: params, ...(t ? { transaction: t } : {}) });
      return { rows: Array.isArray(rows) ? rows : [] };
    },
  };
}

async function buildMachine() {
  if (_factoryOverride) return _factoryOverride();
  const { sequelize } = require('../models');
  const {
    PaymentStateMachine,
    createPgPaymentStateStore,
    createPgInboxStore,
    createPgOutboxWriter,
  } = require('@baalvion/payment-consistency');
  const opts = { pool: makeRunner(sequelize), schema: PCL_SCHEMA };
  const db = { transaction: (fn) => sequelize.transaction((t) => fn(makeRunner(sequelize, t))) };
  return new PaymentStateMachine({
    db,
    store: createPgPaymentStateStore(opts),
    inbox: createPgInboxStore(opts),
    outbox: createPgOutboxWriter(opts),
    logger: shadowLog,
  });
}

function machine() {
  if (!_machinePromise) {
    _machinePromise = Promise.resolve()
      .then(buildMachine)
      .catch((err) => {
        _machinePromise = null; // allow a later event to retry init
        shadowLog.error({ msg: err.message }, 'pcl shadow init failed');
        return null;
      });
  }
  return _machinePromise;
}

/** Legacy capture/fail context → canonical PaymentEvent (or null when not actionable). */
function normalize(status, ctx) {
  let normalizeWebhook;
  try {
    ({ normalizeWebhook } = require('@baalvion/payment-consistency'));
  } catch (err) {
    shadowLog.error({ msg: err.message }, 'pcl require failed');
    return null;
  }
  return normalizeWebhook({
    provider: ctx.provider || 'unknown',
    status,
    paymentId: ctx.paymentId,
    transactionId: ctx.transactionId,
    money: { amountMinor: ctx.amountMinor, currency: ctx.currency },
    orgId: ctx.orgId,
    metadata: { service: 'order-service', via: ctx.via || 'webhook' },
  });
}

// Legacy status → the PCL state(s) that agree with it. Anything else (or a CONFLICT) is drift.
const EXPECTED = { captured: ['CAPTURED', 'SETTLED'], failed: ['FAILED'] };

function logOutcome(outcome, legacyStatus, ctx) {
  const expected = EXPECTED[legacyStatus] || [];
  const drift =
    outcome.result === 'conflict' ||
    (outcome.to != null && expected.length > 0 && !expected.includes(outcome.to));
  const line = {
    paymentId: outcome.paymentId,
    provider: ctx.provider || 'unknown',
    legacy: legacyStatus,
    pclResult: outcome.result,
    pclFrom: outcome.from,
    pclState: outcome.to,
  };
  if (drift) shadowLog.warn({ ...line, drift: true }, 'PCL/legacy drift detected');
  else shadowLog.info(line, 'pcl shadow apply');
  return drift;
}

async function applyShadow(legacyStatus, ctx) {
  if (!isEnabled()) return null;
  const event = normalize(legacyStatus, ctx);
  if (!event) return null;
  try {
    const m = await machine();
    if (!m) return null;
    const outcome = await m.apply(event);
    logOutcome(outcome, legacyStatus, ctx);
    return outcome;
  } catch (err) {
    // NEVER propagate: the legacy path is authoritative and must be unaffected by a shadow failure
    // (e.g. the pcl.* migration not yet applied → relation does not exist → logged, not thrown).
    shadowLog.error({ msg: err.message, paymentId: ctx.paymentId }, 'pcl shadow apply error');
    return null;
  }
}

/** Shadow a provider-confirmed capture. Fire-and-forget at the call site (never blocks/throws). */
function recordCapture(ctx) {
  return applyShadow('captured', { ...ctx, via: ctx.via || 'webhook' });
}

/** Shadow a provider-driven payment failure/cancellation. */
function recordFailure(ctx) {
  return applyShadow('failed', { ...ctx, via: ctx.via || 'webhook' });
}

// ── Test seam (lets tests inject a fake PaymentStateMachine without a database) ──────────────────
function __setMachineFactory(fn) {
  _factoryOverride = fn;
  _machinePromise = null;
}
function __reset() {
  _factoryOverride = null;
  _machinePromise = null;
}

module.exports = {
  recordCapture,
  recordFailure,
  isEnabled,
  __setMachineFactory,
  __reset,
  _internals: { normalize, makeRunner, logOutcome, applyShadow },
};

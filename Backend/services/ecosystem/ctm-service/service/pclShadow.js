'use strict';
/**
 * Payment Consistency Layer (PCL) — SHADOW-MODE adapter for ctm-service.
 *
 * Phase 1 of the PCL rollout (see Backend/packages/payment-consistency/README.md §4). The legacy
 * webhook/PayU-return path stays AUTHORITATIVE and unchanged — it still marks ctm.payments
 * succeeded, the invoice Paid and the subscription active. In ADDITION, after that legacy work, we
 * normalize the same event and feed it to the shared PaymentStateMachine so `pcl.payment_state` is
 * populated in parallel and any divergence is LOGGED. Nothing is published downstream in shadow mode.
 *
 * Hard guarantees (so a real subscription activation can never regress):
 *   • Gated by PCL_SHADOW (read at call-time). Disabled ⇒ a cheap no-op.
 *   • NEVER throws. Every entry point swallows its own errors and resolves to a (possibly null)
 *     outcome, so a fire-and-forget call site cannot break or slow the webhook response.
 *   • Its own Sequelize transaction (shares the pool, not the legacy work).
 *   • The PCL package is required LAZILY so a missing dist can never crash service startup.
 *
 * Grain: paymentId = ctm.payments.id (the stable charge identity across checkout → webhook).
 */

const PCL_SCHEMA = 'pcl';

let _machinePromise = null;
let _factoryOverride = null;

function isEnabled() {
  return process.env.PCL_SHADOW === 'true';
}

const shadowLog = {
  info: (o, m) => console.info(JSON.stringify({ evt: 'pcl_shadow', msg: m, ...o })),
  warn: (o, m) => console.warn(JSON.stringify({ evt: 'pcl_shadow.warn', msg: m, ...o })),
  error: (o, m) => console.error(JSON.stringify({ evt: 'pcl_shadow.error', msg: m, ...o })),
};

/** Adapt a Sequelize connection / open transaction to the PCL PgQueryRunner shape. */
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
        _machinePromise = null;
        shadowLog.error({ msg: err.message }, 'pcl shadow init failed');
        return null;
      });
  }
  return _machinePromise;
}

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
    metadata: { service: 'ctm-service', via: ctx.via || 'webhook' },
  });
}

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
    shadowLog.error({ msg: err.message, paymentId: ctx.paymentId }, 'pcl shadow apply error');
    return null;
  }
}

/** Shadow a provider-confirmed success ("succeeded" → CAPTURED). Fire-and-forget at the call site. */
function recordCapture(ctx) {
  return applyShadow('captured', { ...ctx, via: ctx.via || 'webhook' });
}

/** Shadow a payment failure (reserved for future webhook failure events). */
function recordFailure(ctx) {
  return applyShadow('failed', { ...ctx, via: ctx.via || 'webhook' });
}

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

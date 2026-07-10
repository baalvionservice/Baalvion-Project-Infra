'use strict';
/**
 * Logistics Core Foundation (Phase 4) — cross-service domain events for the
 * logistics entities, via @baalvion/events' transactional outbox
 * (packages/events/src/outbox.js + pgOutboxStore.js) rather than a bespoke
 * pub/sub mechanism: the event row commits in the SAME transaction as the
 * business mutation (no dual-write loss), and a relay drains it to the bus.
 *
 * DEGRADES GRACEFULLY: @baalvion/events is a new dependency added to
 * package.json in this same change but is NOT yet installed/built in this
 * environment (see the "Phase 4 follow-up" note in the Phase 4 summary) — the
 * require is wrapped so every exported function silently no-ops (logged
 * once) until `pnpm install` + the package's `tsup` build have run. This
 * mirrors the codebase's existing "safe when infra absent" pattern (e.g.
 * config.finance.enabled in insuranceController.js, the heuristic AI provider
 * fallback in service/hscode/aiSuggester.js).
 */
const db = require('../../models');
const logger = require('../logger');

let eventsPkg = null;
let warnedMissing = false;
try {
    // eslint-disable-next-line global-require
    eventsPkg = require('@baalvion/events');
} catch {
    eventsPkg = null;
}

function warnOnceIfMissing() {
    if (eventsPkg || warnedMissing) return;
    warnedMissing = true;
    logger.warn('@baalvion/events not installed — logistics domain events are no-ops until `pnpm install` + package build run');
}

// Adapts a Sequelize connection/transaction to the { query(text, params) => {rows} }
// shape createPgOutboxStore expects (see pgOutboxStore.ts's PgQueryRunner).
function pgRunner(sequelizeOrTx) {
    return {
        async query(text, params = []) {
            const [rows] = await sequelizeOrTx.query(text, {
                bind: params,
                type: db.Sequelize.QueryTypes.RAW,
            });
            return { rows: Array.isArray(rows) ? rows : [] };
        },
    };
}

let outboxStore = null;
function getOutboxStore() {
    if (!eventsPkg) return null;
    if (!outboxStore) {
        outboxStore = eventsPkg.createPgOutboxStore({
            runner: pgRunner(db.sequelize),
            schema: 'tradeops',
            table: 'event_outbox',
        });
    }
    return outboxStore;
}

/**
 * Build a logistics domain event via @baalvion/events' DomainEvents builders
 * and enqueue it on the transactional outbox. No-ops (logged once) if the
 * package isn't installed yet. Never throws — a failed event enqueue must
 * never roll back or fail the business mutation it's attached to.
 *
 * @param {keyof typeof import('@baalvion/events').DomainEvents} builderName
 * @param {object} payload
 * @param {object} [meta]
 * @param {import('sequelize').Transaction} [transaction] - enqueue inside the
 *   caller's open transaction so the event commits atomically with the mutation.
 */
async function emitLogisticsEvent(builderName, payload, meta = {}, transaction) {
    warnOnceIfMissing();
    if (!eventsPkg) return;
    try {
        const builder = eventsPkg.DomainEvents[builderName];
        if (!builder) {
            logger.error('Unknown logistics event builder', { builderName });
            return;
        }
        const event = builder(payload, meta);
        const store = getOutboxStore();
        const runner = transaction ? pgRunner(transaction) : undefined;
        await store.enqueue(event, runner);
    } catch (err) {
        // Best-effort: an event-enqueue failure must never break the caller's
        // business action (same posture as utils/audit.js's recordAudit).
        logger.error('Failed to enqueue logistics domain event', { builderName, error: err.message });
    }
}

let relayHandle = null;
/**
 * Start the outbox relay (drains tradeops.event_outbox to the configured
 * event bus). Transport defaults to 'noop' (rows are marked sent but nothing
 * is actually published) unless EVENT_TRANSPORT=redis is set — matching
 * @baalvion/events' own "zero API change to activate" design. Safe to call
 * even when @baalvion/events isn't installed (no-ops).
 */
async function startLogisticsEventRelay() {
    warnOnceIfMissing();
    if (!eventsPkg || relayHandle) return relayHandle;
    try {
        const bus = await eventsPkg.createEventBus({ transport: process.env.EVENT_TRANSPORT || 'noop' });
        const store = getOutboxStore();
        relayHandle = eventsPkg.startOutboxRelay(store, bus, {
            error: (o, m) => logger.error(m, o),
            warn: (o, m) => logger.warn(m, o),
            info: (o, m) => logger.info && logger.info(m, o),
        });
    } catch (err) {
        logger.error('Failed to start logistics event outbox relay', { error: err.message });
    }
    return relayHandle;
}

async function stopLogisticsEventRelay() {
    if (relayHandle) { await relayHandle.stop(); relayHandle = null; }
}

module.exports = { emitLogisticsEvent, startLogisticsEventRelay, stopLogisticsEventRelay };

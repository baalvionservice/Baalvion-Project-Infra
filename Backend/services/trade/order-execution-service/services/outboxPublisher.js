'use strict';
/**
 * Transactional-outbox relay (R3). Drains PENDING rows → sdk.events → marks SENT.
 * Runs under tenant bypass (system writer). Exponential backoff; FAILED after 10 attempts.
 */
const db = require('../models');
const { runWithTenant } = require('@baalvion/tenancy');
const config = require('../config/appConfig');

const POLL_MS = Number(process.env.OUTBOX_POLL_MS || 2000);
const BATCH = Number(process.env.OUTBOX_BATCH || 50);

async function drainOnce(publish) {
    // The DB work MUST run inside a sequelize transaction so the tenant-bypass GUC is
    // applied: models/index.js patches sequelize.transaction to emit SET LOCAL
    // app.tenant_bypass from the ALS context (set here by runWithTenant). Without the
    // transaction, SET LOCAL never fires and FORCE RLS on oms.outbox_events returns
    // ZERO rows on the pooled connection — the relay would silently drain nothing.
    return runWithTenant({ tenantId: null, bypass: true }, () =>
        db.sequelize.transaction(async (t) => {
            const rows = await db.OutboxEvent.findAll({ where: { status: 'PENDING' }, order: [['available_at', 'ASC']], limit: BATCH, transaction: t });
            for (const ev of rows) {
                try {
                    await publish(ev.event_type, { ...ev.payload, _eventId: ev.id }, { tenantId: ev.tenant_id });
                    await ev.update({ status: 'SENT', sent_at: new Date() }, { transaction: t });
                } catch (e) {
                    const attempts = ev.attempts + 1;
                    await ev.update({
                        attempts,
                        available_at: new Date(Date.now() + 1000 * 2 ** Math.min(attempts, 6)),
                        status: attempts >= 10 ? 'FAILED' : 'PENDING',
                    }, { transaction: t });
                }
            }
            return rows.length;
        }));
}

function startOutboxPublisher(sdk) {
    const publish = (type, payload, meta) => sdk.events.publish(type, payload, meta);
    const timer = setInterval(() => drainOnce(publish).catch((e) => console.error(`[${config.service}] outbox:`, e.message)), POLL_MS);
    timer.unref();
    return () => clearInterval(timer);
}

module.exports = { startOutboxPublisher, drainOnce };

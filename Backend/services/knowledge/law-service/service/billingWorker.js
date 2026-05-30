'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Recurring-subscription billing worker.
// Periodically scans for subscriptions whose period has ended and either:
//   • cancels them (cancel_at_period_end), or
//   • renews them: records a payment + extends the period.
//
// Until Razorpay subscription keys are wired in production the charge is
// SIMULATED (a succeeded Payment row), so the full lifecycle is testable now.
//
// Safe across multiple instances: each cycle takes a Postgres advisory lock, so
// only one worker bills at a time (no double-charging).
// ─────────────────────────────────────────────────────────────────────────────
const { Op } = require('sequelize');
const db = require('../models');

const LOCK_KEY = 728193; // arbitrary, stable advisory-lock id for billing
const ENABLED = String(process.env.BILLING_WORKER_ENABLED || 'true').toLowerCase() === 'true';
const INTERVAL_MS = Math.max(1, Number(process.env.BILLING_INTERVAL_MINUTES || 60)) * 60 * 1000;

let timer = null;

async function withLock(fn) {
    const [[{ locked }]] = await db.sequelize.query(
        `SELECT pg_try_advisory_lock(${LOCK_KEY}) AS locked`,
    );
    if (!locked) return { skipped: true };
    try {
        return await fn();
    } finally {
        await db.sequelize.query(`SELECT pg_advisory_unlock(${LOCK_KEY})`);
    }
}

/** Process all due subscriptions once. Returns counters. Safe to call manually. */
async function runBillingCycle(now = new Date()) {
    return withLock(async () => {
        const due = await db.Subscription.findAll({
            where: { status: 'active', expires_at: { [Op.ne]: null, [Op.lte]: now } },
            limit: 500,
        });
        let renewed = 0, cancelled = 0, failed = 0;

        for (const sub of due) {
            const t = await db.sequelize.transaction();
            try {
                if (sub.cancel_at_period_end) {
                    await sub.update({ status: 'cancelled' }, { transaction: t });
                    await db.Client.update({ subscription_tier: 'BASIC' }, { where: { id: sub.client_id }, transaction: t });
                    cancelled++;
                } else if (Number(sub.price) > 0) {
                    // Record the renewal charge (simulated success until Razorpay subscriptions).
                    await db.Payment.create({
                        client_id: sub.client_id,
                        amount: sub.price,
                        currency: sub.currency || 'USD',
                        status: 'succeeded',
                        provider: 'subscription',
                        provider_tx_id: `sub_${sub.id}_${Date.now()}`,
                    }, { transaction: t });
                    const next = new Date((sub.expires_at || now).getTime() + (sub.interval_days || 30) * 86400000);
                    await sub.update({
                        expires_at: next,
                        last_payment_at: now,
                        renewal_count: (sub.renewal_count || 0) + 1,
                    }, { transaction: t });
                    renewed++;
                } else {
                    // Free tier — just roll the period forward.
                    const next = new Date((sub.expires_at || now).getTime() + (sub.interval_days || 30) * 86400000);
                    await sub.update({ expires_at: next, last_payment_at: now }, { transaction: t });
                    renewed++;
                }
                await t.commit();
            } catch (err) {
                await t.rollback();
                failed++;
                // eslint-disable-next-line no-console
                console.error(`[billing] subscription ${sub.id} failed: ${err.message}`);
            }
        }
        if (due.length) {
            // eslint-disable-next-line no-console
            console.log(`[billing] cycle: ${renewed} renewed, ${cancelled} cancelled, ${failed} failed`);
        }
        return { due: due.length, renewed, cancelled, failed };
    });
}

function startBillingWorker() {
    if (!ENABLED) {
        // eslint-disable-next-line no-console
        console.log('[billing] worker disabled (BILLING_WORKER_ENABLED=false)');
        return;
    }
    // First run shortly after boot, then on the configured interval.
    setTimeout(() => { runBillingCycle().catch((e) => console.error('[billing]', e.message)); }, 15_000);
    timer = setInterval(() => { runBillingCycle().catch((e) => console.error('[billing]', e.message)); }, INTERVAL_MS);
    if (timer.unref) timer.unref();
    // eslint-disable-next-line no-console
    console.log(`[billing] worker started (every ${INTERVAL_MS / 60000} min)`);
}

function stopBillingWorker() { if (timer) clearInterval(timer); timer = null; }

module.exports = { runBillingCycle, startBillingWorker, stopBillingWorker };

'use strict';
/**
 * Periodic re-engagement scan. Finds users inactive past a threshold and publishes one
 * 'user.reengagement_due' event per user — notification-service's eventConsumer.js picks it
 * up and sends the branded re-engagement email (templates/premium's renderReengagement).
 *
 * No new dependency: this is a plain setInterval, not a cron-expression library or BullMQ
 * (that lives in notification-service, not here). auth-service's pm2 config runs exactly one
 * instance (see deploy/consolidated/pm2/identity.config.js), so there's no multi-instance
 * double-run risk to guard against with a distributed lock.
 */
const userRepo = require('../repositories/UserRepository');
const eventBus = require('../utils/eventBus');
const logger = console; // matches this service's existing console.log/error convention (index.js)

const INACTIVE_SINCE_DAYS = Number(process.env.REENGAGEMENT_INACTIVE_DAYS || 30);
const COOLDOWN_DAYS       = Number(process.env.REENGAGEMENT_COOLDOWN_DAYS || 30);
const BATCH_LIMIT         = Number(process.env.REENGAGEMENT_BATCH_LIMIT   || 200);
const INTERVAL_MS         = Number(process.env.REENGAGEMENT_INTERVAL_MS   || 24 * 60 * 60 * 1000);
// First run shortly after boot (not immediately — let DB/Redis connections settle), not on
// every deploy's restart cycle piling up right at 0s.
const INITIAL_DELAY_MS    = Number(process.env.REENGAGEMENT_INITIAL_DELAY_MS || 5 * 60 * 1000);
const ENABLED             = process.env.REENGAGEMENT_CRON_ENABLED !== 'false';

let running = false;

async function runOnce() {
    if (running) {
        logger.warn('[reengagement] previous run still in progress — skipping this tick');
        return;
    }
    running = true;
    try {
        const users = await userRepo.findInactiveForReengagement({
            inactiveSinceDays: INACTIVE_SINCE_DAYS,
            cooldownDays: COOLDOWN_DAYS,
            limit: BATCH_LIMIT,
        });

        let sent = 0;
        for (const user of users) {
            try {
                await eventBus.publish('user.reengagement_due', {
                    userId: String(user.id),
                    email: user.email,
                    fullName: user.full_name || null,
                    brand: user.signup_brand || null,
                });
                await userRepo.markReengagementSent(user.id);
                sent++;
            } catch (err) {
                // One user's failure must not stop the batch — logged and skipped, picked up
                // again next run (reengagement_sent_at only advances on success).
                logger.error('[reengagement] failed for user', user.id, err && err.message);
            }
        }
        logger.log(`[reengagement] scan complete: ${sent}/${users.length} events published`);
    } catch (err) {
        logger.error('[reengagement] scan failed:', err && err.message);
    } finally {
        running = false;
    }
}

function startReengagementCron() {
    if (!ENABLED) {
        logger.log('[reengagement] cron disabled (REENGAGEMENT_CRON_ENABLED=false)');
        return { stop: () => {} };
    }
    const initialTimer = setTimeout(() => {
        runOnce();
    }, INITIAL_DELAY_MS);
    const interval = setInterval(runOnce, INTERVAL_MS);
    logger.log(`[reengagement] cron started — first run in ${Math.round(INITIAL_DELAY_MS / 1000)}s, then every ${Math.round(INTERVAL_MS / 3_600_000)}h`);
    return {
        stop: () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        },
    };
}

module.exports = { startReengagementCron, runOnce };

'use strict';
/**
 * Continuous Monitoring — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 19). Admin-only on-demand trigger for the same cycle the
 * verification_monitor BullMQ repeatable job (queue/workers.js) runs every 6h.
 */
const { sendSuccess } = require('../utils/response');
const { recordAudit } = require('../utils/audit');
const { actorOf } = require('../service/verification/access');
const monitor = require('../service/verification/monitor');

const runMonitoringCycle = async (req, res, next) => {
    try {
        const result = await monitor.runCycle();
        await recordAudit({
            actorId: actorOf(req), action: 'monitoring.cycle_run', resourceType: 'system',
            resourceId: 'verification_monitor', tenantId: 'GLOBAL', metadata: result,
        });
        return sendSuccess(req, res, result);
    } catch (err) {
        return next(err);
    }
};

module.exports = { runMonitoringCycle };

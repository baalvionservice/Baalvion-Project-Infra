'use strict';

/**
 * Worker boot entrypoint.  Run independently from the API server:
 *   node workers/index.js
 *
 * Hosts:
 *   - notificationWorker, emailWorker (BullMQ)
 *   - meteringWorker (Redis Streams → TimescaleDB + quota)
 *   - billing scheduler (idempotent monthly run + daily provider reconciliation)
 */

const notificationWorker = require('./notificationWorker');
const emailWorker = require('./emailWorker');
const meteringWorker = require('./meteringWorker');
const intelligenceWorker = require('./intelligenceWorker');
const billingEngine = require('../service/billingEngine');
const providerCost = require('../service/providerCostService');
const infraCostAttribution = require('../service/infraCostAttribution');
const profitabilityEngine = require('../service/profitabilityEngine');
const reconciliationEngine = require('../service/reconciliationEngine');
const financeLedger = require('../service/financeLedger');
const payoutService = require('../service/payoutService');
const destinationIntel = require('../service/destinationIntel');
const gdprService = require('../service/gdprService');
const moderationService = require('../service/moderationService');
const slaService = require('../service/slaService');
const auditExportService = require('../service/auditExportService');
const asnIntelService = require('../service/asnIntelService');
const edgeMetrics = require('../observability/edgeMetrics');
const db = require('../models');
const trustMetrics = require('../observability/trustMetrics');
const logger = require('../service/logger');

// Start metering ingestion.
meteringWorker.start().catch((err) => logger.error('[workers] metering start failed:', err.message));

// Start the AI network-intelligence control loop (feature pipeline + scheduler).
intelligenceWorker.start().catch((err) => logger.error('[workers] intelligence start failed:', err.message));

// Trust & Safety cadence: refresh threat-intel feeds on boot + every 6h;
// retention sweep daily; publish moderation queue size every minute.
destinationIntel.refresh().catch((err) => logger.error('[workers] dest-intel refresh failed:', err.message));
const SIX_H = 6 * 60 * 60 * 1000;
setInterval(() => destinationIntel.refresh().catch((e) => logger.error('[workers] dest-intel:', e.message)), SIX_H);
setInterval(async () => {
  try { trustMetrics.setModQueue(await moderationService.queueSize()); } catch (_) {}
}, 60 * 1000);

// Publish owned-IP inventory gauges (available/allocated/quarantined) for alerting.
async function publishDedicatedIpGauges() {
  const rows = await db.sequelize.query(
    `SELECT status, COUNT(*)::int AS n FROM dedicated_ips GROUP BY status`,
    { type: db.Sequelize.QueryTypes.SELECT },
  ).catch(() => []);
  for (const r of rows) edgeMetrics.setDedicatedIps(r.status, r.n);
}

// Billing scheduler: check hourly; run the previous-month billing once it rolls
// over (idempotent via billing_runs). Daily provider-cost reconciliation.
let lastReconcileDay = -1;
const HOUR = 60 * 60 * 1000;
const scheduler = setInterval(async () => {
  const now = new Date();
  try {
    // Bill the prior month early on the 1st (UTC).
    if (now.getUTCDate() === 1 && now.getUTCHours() === 2) {
      await billingEngine.runMonthlyBilling();
    }
    // Reconcile margins + GDPR retention + enterprise SLA periods + SIEM push (daily).
    if (now.getUTCDate() !== lastReconcileDay) {
      lastReconcileDay = now.getUTCDate();
      const { start, end } = billingEngine.currentPeriod();
      await providerCost.reconcile(start, end);
      await gdprService.retentionSweep();

      // Financial operations (daily): attribute infra cost → snapshot profitability
      // → reconcile usage vs invoices → expire credits → auto-recharge intents.
      const ps = start.toISOString().slice(0, 10);
      const pe = end.toISOString().slice(0, 10);
      await infraCostAttribution.attributeForPeriod(ps, pe).catch((e) => logger.error('[workers] infra-attr:', e.message));
      await profitabilityEngine.snapshotOrgProfitability(ps, pe).catch((e) => logger.error('[workers] profitability:', e.message));
      await profitabilityEngine.snapshotProviderProfitability(start, end).catch((e) => logger.error('[workers] provider-profit:', e.message));
      await reconciliationEngine.reconcileUsageVsInvoices(start, end).catch((e) => logger.error('[workers] usage-recon:', e.message));
      await financeLedger.expireCredits().catch((e) => logger.error('[workers] credit-expire:', e.message));

      // Channel: process approved reseller/affiliate payouts (idempotent batch).
      await payoutService.processApproved().catch((e) => logger.error('[workers] payouts:', e.message));

      // Edge network: recompute ASN reputation from accumulated ban/success stats
      // and republish to Redis (`asn:rep:*` / `asn:banned`) for routing decisions.
      await asnIntelService.refresh().catch((e) => logger.error('[workers] asn-refresh:', e.message));
      await publishDedicatedIpGauges().catch((e) => logger.error('[workers] dedicated-ip gauges:', e.message));

      // SLA period compute + audit-export SIEM push for enterprise orgs.
      const orgs = await db.sequelize.query(
        `SELECT id FROM organizations WHERE tier = 'enterprise'`, { type: db.Sequelize.QueryTypes.SELECT }
      ).catch(() => []);
      for (const o of orgs) {
        await slaService.computePeriod(o.id, start, end).catch((e) => logger.error('[workers] sla:', e.message));
        await auditExportService.pushToSiem(o.id).catch((e) => logger.error('[workers] siem:', e.message));
      }
    }
  } catch (err) {
    logger.error('[workers] scheduler tick failed:', err.message);
  }
}, HOUR);

logger.info('[workers] started — notification, email, metering + billing scheduler active');

function shutdown() {
  clearInterval(scheduler);
  meteringWorker.stop();
  intelligenceWorker.stop();
  logger.info('[workers] shutting down');
  setTimeout(() => process.exit(0), 1500);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { notificationWorker, emailWorker, meteringWorker };

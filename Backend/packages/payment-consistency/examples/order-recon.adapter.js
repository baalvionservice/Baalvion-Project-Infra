/**
 * EXAMPLE — order-service reconciliation sweep as a PCL healing source.
 *
 * Refactor target: Backend/services/commerce/order-service/queues/reconciliationQueue.js
 * + service/reconciliationService.js (today: diffs legacy payments vs ledger, backfills ledger,
 * but leaves payment-status drift unresolved).
 *
 * After: the sweep asks the gateway for the authoritative status and feeds it as an EVENT.
 * PCL converges idempotently — reconciliation stops being a second writer and becomes a
 * self-healing event source. If PCL is already correct, apply() returns 'ignored' (cheap).
 */
'use strict';

const { normalizeReconciliation } = require('@baalvion/payment-consistency');

/**
 * @param {object} deps { gateway, pcl, logger }  gateway = provider client; pcl = PaymentStateMachine
 */
function makeReconcileSweep({ gateway, pcl, logger }) {
  return async function reconcileStore(storeId) {
    const charges = await gateway.listRecentCharges(storeId); // provider-of-record query
    const summary = { applied: 0, ignored: 0, conflict: 0, skipped: 0 };

    for (const charge of charges) {
      const event = normalizeReconciliation({
        gatewayStatus: charge.status, // 'captured' | 'settled' | 'failed'
        paymentId: charge.paymentId,
        provider: charge.provider,
        transactionId: charge.id,
        money: { amountMinor: charge.amountMinor, currency: charge.currency },
        metadata: { storeId, sweep: true },
      });
      if (!event) {
        summary.skipped++;
        continue;
      }
      const outcome = await pcl.apply(event); // idempotent convergence
      summary[outcome.result === 'duplicate' ? 'ignored' : outcome.result] ??= 0;
      summary[outcome.result === 'duplicate' ? 'ignored' : outcome.result]++;
      if (outcome.result === 'conflict') {
        logger.warn({ paymentId: event.paymentId, storeId }, 'recon found a state conflict — ops follow-up');
      }
    }

    logger.info({ storeId, ...summary }, 'pcl reconciliation sweep complete');
    return summary;
  };
}

module.exports = { makeReconcileSweep };

/**
 * EXAMPLE — CTM webhook handler as a THIN PCL adapter.
 *
 * Refactor target: Backend/services/ecosystem/ctm-service/controller/paymentsController.js
 * (currently mutates ctm.payments.status, invoices.status, subscriptions.status inline).
 *
 * After: the handler ONLY verifies the signature and submits a PaymentEvent. Invoice-paid /
 * subscription-active become downstream consumers of the PAYMENT_CAPTURED outbox event.
 */
'use strict';

const { normalizeWebhook } = require('@baalvion/payment-consistency');

/**
 * @param {object} deps  { pay, pcl, logger }  — pay = existing provider-agnostic verifier; pcl = PaymentStateMachine
 */
function makeWebhookHandler({ pay, pcl, logger }) {
  return async function paymentsWebhook(req, res) {
    // 1. VERIFY — unchanged. Signature is computed over the exact raw bytes.
    let verified;
    try {
      verified = await pay.verifyWebhook({ rawBody: req.rawBody, headers: req.headers });
    } catch (err) {
      logger.warn({ err: err.message }, 'ctm webhook signature verification failed');
      return res.status(400).json({ received: false });
    }

    // 2. NORMALIZE — native provider status → canonical PaymentEvent.
    const event = normalizeWebhook({
      provider: verified.provider,
      status: verified.status, // 'captured' | 'succeeded' | 'failed' | ...
      paymentId: verified.paymentId, // ctm.payments.id resolved at checkout
      transactionId: verified.eventId, // signed-body event id — NEVER a header value
      money: { amountMinor: verified.amountMinor, currency: verified.currency },
      orgId: req.query.site || undefined,
      metadata: { companyId: verified.companyId, invoiceId: verified.invoiceId },
    });
    if (!event) return res.json({ received: true, ignored: true }); // pending/unknown → ACK, no-op

    // 3. APPLY — the ONLY payment-state write. No inline DB mutation here anymore.
    const outcome = await pcl.apply(event);

    // 4. ACK. (Duplicate/ignored/applied/conflict are all 200 — the work is durable.)
    logger.info({ paymentId: event.paymentId, result: outcome.result, to: outcome.to }, 'ctm webhook → pcl');
    return res.json({ received: true, result: outcome.result });
  };
}

module.exports = { makeWebhookHandler };

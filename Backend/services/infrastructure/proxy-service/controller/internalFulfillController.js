'use strict';
/**
 * Internal fulfillment endpoint — POST /v1/billing/fulfill.
 *
 * The canonical PSP gateway (the JVM payment-service) calls this server-to-server
 * AFTER it has signature-verified a CAPTURED provider webhook. The JVM is the trust
 * anchor (it did the HMAC/SHA-512 check); authenticity here is established by the
 * shared internal secret, NOT a user session. It maps the captured charge back to a
 * tenant + plan from the server-trusted order metadata (orgId/userId/planSlug — set
 * at checkout from the verified JWT, never the browser) and runs the SAME fulfillment
 * the Node-native webhook controllers use:
 *
 *   verify internal secret → durable idempotency claim → activate subscription
 *   (or top up PAYG credit) → sync org plan/limits → record a paid invoice →
 *   in-app notification + event-bus fan-out.
 *
 * Idempotency is DURABLE (public.payment_webhook_events) + shared with the Node
 * webhook path, so a provider redelivery, a JVM retry, AND the browser's optimistic
 * /billing/activate call together net EXACTLY ONE activation + ONE invoice.
 *
 * Reliability contract with the JVM caller: 2xx = applied/duplicate/terminal-skip
 * (do not retry); 503 = transient (the JVM rolls its webhook tx back so the PROVIDER
 * re-delivers → at-least-once). The idempotency claim is RELEASED on transient
 * failure so the retry can re-apply.
 */
const billingService = require('../service/billingService');
const store = require('../service/platformStore');
const authService = require('../service/authService');
const dedup = require('../service/webhookDedup');
const logger = require('../service/logger');

const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

// Constant-time-ish header comparison (avoid leaking secret length via early-exit).
function secretMatches(provided) {
  if (!INTERNAL_SECRET) return false;
  const a = Buffer.from(String(provided || ''));
  const b = Buffer.from(INTERNAL_SECRET);
  if (a.length !== b.length) return false;
  try { return require('crypto').timingSafeEqual(a, b); } catch (_) { return false; }
}

async function fulfill(req, res) {
  if (!secretMatches(req.headers['x-internal-secret'])) {
    return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'internal secret required' } });
  }

  const b = req.body || {};
  const provider = String(b.provider || 'gateway').toLowerCase();
  const providerRef = b.providerRef || b.provider_ref || null;
  const eventId = String(b.eventId || b.providerEventId || providerRef || '');
  const md = b.metadata || {};
  const orgId = md.orgId || null;
  const userId = md.userId || null;
  const planSlug = md.planSlug || null;
  const interval = md.interval === 'yearly' ? 'yearly' : 'monthly';
  const kind = md.kind || (planSlug === 'pay-as-you-go' ? 'credit' : 'subscription');
  const currency = b.currency ? String(b.currency).toUpperCase() : null;
  const amountMajor = md.amountMajor != null
    ? Number(md.amountMajor)
    : (b.amountMinor != null ? Number(b.amountMinor) / 100 : undefined);

  // No tenant mapping → not a billing charge we own. Ack so the JVM commits (no retry).
  if (!orgId) return res.status(200).json({ ok: true, skipped: 'no-org' });

  let claimed = false;
  try {
    // Durable, instance-shared idempotency claim (public.payment_webhook_events).
    if (eventId) {
      const claim = await dedup.claimEvent(provider, eventId, { eventType: 'gateway.captured', orgId, amount: amountMajor, currency });
      if (!claim.fresh) return res.status(200).json({ ok: true, deduped: true });
      claimed = true;
    }

    const auth = { orgId, userId };

    if (kind === 'credit') {
      if (!(amountMajor > 0)) { if (claimed) await dedup.releaseEvent(provider, eventId); return res.status(200).json({ ok: true, skipped: 'no-amount' }); }
      const bal = await billingService.purchaseCredit(auth, amountMajor, { ref: providerRef });
      if (eventId) await dedup.markApplied(provider, eventId, { status: 'applied', orgId, amount: amountMajor, currency });
      // Immutable money-event trail (best-effort; the dedup row is the integrity guarantee, this is the audit).
      try { await store.createAuditLog({ orgId, actorUserId: userId, action: 'billing.credit.purchased', entityType: 'credit', entityId: orgId, details: { provider, providerRef, amountMajor, currency, eventId } }); } catch (_) { /* best-effort */ }
      logger.info(`[billing-fulfill] credited org=${orgId} amount=${amountMajor} ref=${providerRef}`);
      return res.status(200).json({ ok: true, credited: true, balanceUsd: bal && bal.balanceUsd });
    }

    if (!planSlug) { if (claimed) await dedup.releaseEvent(provider, eventId); return res.status(200).json({ ok: true, skipped: 'no-plan' }); }

    const sub = await billingService.activateSubscription(auth, planSlug, { amount: amountMajor, interval, paymentRef: providerRef });
    if (eventId) await dedup.markApplied(provider, eventId, { status: 'applied', orgId, amount: amountMajor, currency });

    // Immutable money-event trail (best-effort; the dedup row is the integrity guarantee, this is the audit).
    try { await store.createAuditLog({ orgId, actorUserId: userId, action: 'billing.subscription.activated', entityType: 'subscription', entityId: sub && sub.id, details: { provider, providerRef, planSlug, interval, amountMajor, currency, eventId } }); } catch (_) { /* best-effort */ }

    // Notification: in-app (durable) + event-bus fan-out (notification-service consumes).
    try {
      await store.createNotification({ orgId, title: 'Subscription activated', body: `Your ${planSlug} plan is now active.`, read: false, createdAt: new Date().toISOString() });
    } catch (e) { logger.warn('[billing-fulfill] notification persist failed:', e.message); }
    try { authService.issueEvent('payment.fulfilled', orgId, { planSlug, provider, providerRef, amountMajor, interval }); } catch (_) { /* best-effort */ }

    logger.info(`[billing-fulfill] activated org=${orgId} plan=${planSlug} ref=${providerRef} status=${sub && sub.status}`);
    return res.status(200).json({ ok: true, activated: true, status: sub && sub.status, subscriptionId: sub && sub.id });
  } catch (e) {
    // Release the claim so the JVM's provider-retry can re-apply; 503 → retry.
    if (claimed && eventId) { try { await dedup.releaseEvent(provider, eventId); } catch (_) {} }
    logger.error('[billing-fulfill] error:', e && e.message);
    return res.status(503).json({ ok: false, error: { code: 'FULFILL_TRANSIENT', message: 'fulfillment failed; retry' } });
  }
}

module.exports = { fulfill };

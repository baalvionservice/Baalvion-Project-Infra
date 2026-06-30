'use strict';
/**
 * Durable, instance-shared idempotency for billing webhooks.
 *
 * Replaces the per-process in-memory `Set` the Stripe/PayU handlers used (which lost all
 * dedup state on restart and could not coordinate across instances, so a redelivered or
 * concurrent webhook was applied twice → double credit / double activation). Uses an
 * atomic `INSERT ... ON CONFLICT DO NOTHING` claim against public.payment_webhook_events
 * (UNIQUE(provider, provider_event_id)) — the same gate the Java payment-service uses
 * (gateway_webhook_events) and the order-execution-service processed_webhooks pattern.
 *
 * provider_event_id is the SIGNATURE-VERIFIED, body-derived id (Stripe event.id, PayU
 * txnid) — never an attacker-settable header.
 */
const db = require('../models');
const logger = require('./logger');

/**
 * Atomically claim an event. Returns { fresh: true } when THIS call inserted the row
 * (caller should proceed to apply), or { fresh: false } when the event was already
 * recorded (replay/concurrent → caller MUST no-op). Throws on DB error so the handler
 * fails closed (5xx → provider retries) rather than applying a money mutation unguarded.
 *
 * @param {string} provider  'stripe' | 'payu' | 'cashfree'
 * @param {string} eventId   body-derived, signature-verified event id
 * @param {{eventType?:string, orgId?:string, amount?:number, currency?:string}} [meta]
 * @returns {Promise<{fresh: boolean, reason?: string}>}
 */
async function claimEvent(provider, eventId, meta = {}) {
  if (!eventId) return { fresh: false, reason: 'no_event_id' };
  const [rows] = await db.sequelize.query(
    `INSERT INTO public.payment_webhook_events
       (provider, provider_event_id, event_type, org_id, amount, currency, status, applied)
     VALUES (:provider, :eventId, :eventType, :orgId, :amount, :currency, 'claimed', FALSE)
     ON CONFLICT (provider, provider_event_id) DO NOTHING
     RETURNING id`,
    {
      replacements: {
        provider,
        eventId: String(eventId),
        eventType: meta.eventType || null,
        orgId: meta.orgId || null,
        amount: meta.amount != null && Number.isFinite(Number(meta.amount)) ? Number(meta.amount) : null,
        currency: meta.currency || null,
      },
    },
  );
  return { fresh: Array.isArray(rows) && rows.length > 0 };
}

/**
 * Mark a previously-claimed event applied (best-effort audit write; never throws into the
 * caller — the claim row is what guarantees dedup, this only enriches the audit trail).
 */
async function markApplied(provider, eventId, patch = {}) {
  try {
    await db.sequelize.query(
      `UPDATE public.payment_webhook_events
          SET applied = TRUE, applied_at = now(), status = :status,
              amount = COALESCE(:amount, amount),
              currency = COALESCE(:currency, currency),
              org_id = COALESCE(:orgId, org_id)
        WHERE provider = :provider AND provider_event_id = :eventId`,
      {
        replacements: {
          provider,
          eventId: String(eventId),
          status: patch.status || 'applied',
          amount: patch.amount != null && Number.isFinite(Number(patch.amount)) ? Number(patch.amount) : null,
          currency: patch.currency || null,
          orgId: patch.orgId || null,
        },
      },
    );
  } catch (e) {
    logger.error('[webhookDedup] markApplied failed (dedup row already prevents reprocessing):', e.message);
  }
}

/**
 * Release an UNAPPLIED claim so a retry can re-claim and re-apply. Called when an
 * apply step fails AFTER a fresh claim (e.g. a transient DB error between the claim
 * and the activation): without this the orphaned claim would dedup the provider's
 * retry and the payment would never fulfill. Only deletes rows still applied=FALSE,
 * so it can never undo a completed fulfillment. Best-effort; never throws.
 */
async function releaseEvent(provider, eventId) {
  if (!eventId) return;
  try {
    await db.sequelize.query(
      `DELETE FROM public.payment_webhook_events
        WHERE provider = :provider AND provider_event_id = :eventId AND applied = FALSE`,
      { replacements: { provider, eventId: String(eventId) } },
    );
  } catch (e) {
    logger.error('[webhookDedup] releaseEvent failed:', e.message);
  }
}

module.exports = { claimEvent, markApplied, releaseEvent };

'use strict';
/**
 * Tells trade-service to open the order journey for a new order, so the buyer, seller and (later)
 * their forwarder, broker and bank share one view of it.
 *
 * Signed with JOURNEY_INTERNAL_SECRET (HMAC over `${timestamp}.${body}`, five-minute window) and
 * sent to JOURNEY_TRADE_URL, e.g. http://app-commerce:3025. Both must be set; with either missing the
 * hand-off is off and orders are created exactly as before.
 *
 * The call happens AFTER the order has been saved and never decides whether the order exists: a
 * failure is retried a few times and then logged, and `scripts/backfill-journeys.js` opens any journey
 * that is still missing. Opening is idempotent (the service answers 409 when one already exists, which
 * counts as success here).
 */
const crypto = require('crypto');

const sign = (secret, ts, body) => `sha256=${crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const enabled = (env = process.env) => !!(env.JOURNEY_TRADE_URL && env.JOURNEY_INTERNAL_SECRET);

/** The request trade-service expects, from an order row (plus what the placement request knew). */
function toJourneyRequest(order, extra = {}) {
    const lines = Array.isArray(order.lines) ? order.lines : [];
    const hs = lines.find((l) => l && l.hs_code);
    return {
        orderId: String(order.id),
        buyerOrgId: order.buyer_org_id,
        sellerOrgId: order.seller_org_id,
        destinationCountry: order.destination_country || undefined,
        originCountry: extra.originCountry || undefined,
        hsCode: hs ? hs.hs_code : undefined,
    };
}

/** True when an order has the two different organisations a journey needs. */
const hasBothParties = (o) => !!(o && o.buyer_org_id && o.seller_org_id && String(o.buyer_org_id) !== String(o.seller_org_id));

/**
 * @returns {Promise<{ok:boolean, status?:string, attempts?:number, error?:string}>} never throws
 */
async function openJourney(request, opts = {}) {
    const env = opts.env || process.env;
    if (!enabled(env)) return { ok: false, status: 'disabled' };
    const fetchImpl = opts.fetchImpl || globalThis.fetch;
    const retries = opts.retries ?? 3;
    const baseDelay = opts.baseDelayMs ?? 500;
    const url = `${env.JOURNEY_TRADE_URL.replace(/\/+$/, '')}/v1/internal/order-journeys`;
    let lastError = 'unknown';
    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            const body = JSON.stringify(request);
            const ts = String(Math.floor(Date.now() / 1000));
            const res = await fetchImpl(url, {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-journey-timestamp': ts, 'x-journey-signature': sign(env.JOURNEY_INTERNAL_SECRET, ts, body) },
                body,
                signal: AbortSignal.timeout(opts.timeoutMs ?? 5000),
            });
            if (res.status === 201) return { ok: true, status: 'opened', attempts: attempt };
            if (res.status === 409) return { ok: true, status: 'already_open', attempts: attempt };
            lastError = `HTTP ${res.status}`;
            // Anything the service refuses as invalid or unauthorised will not get better by asking again.
            if (res.status >= 400 && res.status < 500) return { ok: false, status: 'rejected', attempts: attempt, error: lastError };
        } catch (e) {
            lastError = e && e.message ? e.message : String(e);
        }
        if (attempt < retries) await sleep(baseDelay * 2 ** (attempt - 1));
    }
    return { ok: false, status: 'failed', attempts: retries, error: lastError };
}

/** Fire after an order is saved. Logs and moves on; never throws and never delays the response. */
function handOffNewOrder(order, extra = {}, opts = {}) {
    if (!enabled(opts.env) || !hasBothParties(order)) return Promise.resolve({ ok: false, status: 'skipped' });
    return openJourney(toJourneyRequest(order, extra), opts).then((r) => {
        if (!r.ok) console.warn(`[journey] could not open the journey for order ${order.id}: ${r.status} ${r.error || ''} (run scripts/backfill-journeys.js)`);
        return r;
    });
}

module.exports = { openJourney, handOffNewOrder, toJourneyRequest, hasBothParties, enabled, sign };

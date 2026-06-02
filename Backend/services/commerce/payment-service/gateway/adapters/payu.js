'use strict';
/**
 * PayU (India) adapter.
 *
 * PayU verifies via a SHA-512 field hash (not a raw-body HMAC) and posts webhooks
 * as form fields. Secrets: merchantKey + merchantSalt (from the CMS vault).
 *
 * - createOrder: mock → deterministic txnid + a valid request hash; live → returns
 *   the same signed form params (PayU is a redirect/post flow, no server API call).
 * - verifyWebhook: REAL SHA-512 reverse-hash check over the posted fields.
 * - parseWebhook: maps PayU response fields to our canonical shape.
 * - signWebhook: produces the response hash (E2E / clients).
 */
const { sha512Hex, timingSafeEqual } = require('./base');

function mapStatus(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'success') return 'captured';
    if (s === 'failure' || s === 'failed') return 'failed';
    if (s === 'refunded') return 'refunded';
    return 'failed';
}

/** PayU request hash: sha512(key|txnid|amount|productinfo|firstname|email|||||||||||salt) */
function requestHash({ key, txnid, amount, productinfo, firstname, email, salt }) {
    return sha512Hex(`${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`);
}

/** PayU response (reverse) hash: sha512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key) */
function responseHash({ salt, status, email, firstname, productinfo, amount, txnid, key }) {
    return sha512Hex(`${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`);
}

async function createOrder({ amount, currency, receipt, notes, secrets, mode }) {
    const key = secrets.merchantKey;
    const salt = secrets.merchantSalt;
    const amountStr = (Number(amount) / 100).toFixed(2); // PayU uses major units
    const txnid = 'txn_' + (mode === 'live' ? '' : 'mock_') + sha512Hex(`${receipt}:${amount}:${currency}`).slice(0, 16);
    const firstname = (notes && notes.firstname) || 'customer';
    const email = (notes && notes.email) || 'customer@baalvion.test';
    const productinfo = receipt || 'baalvion-order';
    const hash = requestHash({ key, txnid, amount: amountStr, productinfo, firstname, email, salt });
    return {
        providerOrderId: txnid,
        clientParams: { key, txnid, amount: amountStr, productinfo, firstname, email, hash, currency },
        raw: { mocked: mode !== 'live' },
    };
}

function verifyWebhook({ body, secrets }) {
    if (!body || !body.hash || !secrets || !secrets.merchantKey || !secrets.merchantSalt) return false;
    const expected = responseHash({
        salt: secrets.merchantSalt,
        status: body.status,
        email: body.email,
        firstname: body.firstname,
        productinfo: body.productinfo,
        amount: body.amount,
        txnid: body.txnid,
        key: secrets.merchantKey,
    });
    return timingSafeEqual(body.hash, expected);
}

function parseWebhook({ body }) {
    const status = mapStatus(body.status);
    // Guard against malformed/locale-formatted amounts → null (not NaN, which a
    // NUMERIC NOT NULL column would reject mid-transaction).
    const rawAmt = body.amount != null ? Number(body.amount) : NaN;
    const amount = Number.isFinite(rawAmt) ? Math.round(rawAmt * 100) : null; // back to minor units
    return {
        // mihpayid is PayU's unique payment id; fall back to txnid:status so two
        // distinct lifecycle notifications for one order aren't deduped together.
        providerEventId: body.mihpayid || (body.txnid ? `${body.txnid}:${String(body.status || '')}` : null),
        eventType: `payment.${status}`,
        providerOrderId: body.txnid || null,
        providerPaymentId: body.mihpayid || null,
        amount,
        currency: body.currency || 'INR',
        status,
        raw: body,
    };
}

/** Test/helper: response hash for a PayU webhook body (set as body.hash). */
function signWebhook({ body, secrets }) {
    return responseHash({
        salt: secrets.merchantSalt,
        status: body.status,
        email: body.email,
        firstname: body.firstname,
        productinfo: body.productinfo,
        amount: body.amount,
        txnid: body.txnid,
        key: secrets.merchantKey,
    });
}

module.exports = { name: 'payu', createOrder, verifyWebhook, parseWebhook, signWebhook };

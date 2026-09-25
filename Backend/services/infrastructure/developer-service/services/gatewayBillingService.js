'use strict';
// PayU + Cashfree self-serve billing for baalvion-intelligence — added alongside the existing
// direct Razorpay integration (razorpayBillingService.js), same plans/PLANS table and launch
// offer, same CMS-vault-first credential resolution (service/cmsVault.js). Faithful port of the
// proven adapter in ctm-service/service/payments.js (PayU hash flow, Cashfree order+HMAC flow).
const crypto = require('crypto');
const cmsVault = require('../service/cmsVault');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const { PLANS, launchOfferRemaining, claimLaunchOfferSlot, upgradeOrgKeys } = require('./razorpayBillingService');

const CASHFREE_API_VERSION = '2023-08-01';
const PAYU_UDF = '|||||||||||';
const sha512Hex = (s) => crypto.createHash('sha512').update(String(s)).digest('hex');

function constantTimeEqual(a, b) {
    const ba = Buffer.from(String(a || ''), 'utf8');
    const bb = Buffer.from(String(b || ''), 'utf8');
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

const PAYU_BASES = ['https://secure.payu.in', 'https://test.payu.in', 'https://secure.payu.com', 'https://sandbox.payu.in'];
const CASHFREE_BASES = ['https://api.cashfree.com', 'https://sandbox.cashfree.com'];
function safeProviderBase(baseUrl, allowed, fallback) {
    const b = String(baseUrl || '').replace(/\/+$/, '');
    if (!b) return fallback;
    return allowed.includes(b) ? b : fallback;
}

const payuRequestHash = ({ key, txnid, amount, productinfo, firstname, email, salt }) =>
    sha512Hex(`${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}${PAYU_UDF}${salt}`);
const payuResponseHash = ({ salt, status, email, firstname, productinfo, amount, txnid, key }) =>
    sha512Hex(`${salt}|${status}${PAYU_UDF}${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`);

async function payuCreds() {
    const vault = await cmsVault.getPaymentCreds('payu').catch(() => null);
    if (vault && vault.secrets.merchantKey && vault.secrets.merchantSalt) {
        return { merchantKey: vault.secrets.merchantKey, merchantSalt: vault.secrets.merchantSalt, baseUrl: vault.config.baseUrl || '', mode: vault.mode };
    }
    if (process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT) {
        return { merchantKey: process.env.PAYU_MERCHANT_KEY, merchantSalt: process.env.PAYU_MERCHANT_SALT, baseUrl: process.env.PAYU_BASE_URL || '', mode: 'env' };
    }
    return null;
}

async function cashfreeCreds() {
    const vault = await cmsVault.getPaymentCreds('cashfree').catch(() => null);
    if (vault && vault.secrets.clientId && vault.secrets.clientSecret) {
        return { clientId: vault.secrets.clientId, clientSecret: vault.secrets.clientSecret, baseUrl: vault.config.baseUrl || '', mode: vault.mode };
    }
    if (process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET) {
        return { clientId: process.env.CASHFREE_CLIENT_ID, clientSecret: process.env.CASHFREE_CLIENT_SECRET, baseUrl: process.env.CASHFREE_BASE_URL || '', mode: 'env' };
    }
    return null;
}

function pricedAmount(plan, offerAvailable) {
    return offerAvailable ? Math.round(plan.amount * 0.5) : plan.amount;
}

async function createPayuCheckoutOrder({ orgId, planSlug, customerEmail }) {
    const plan = PLANS[planSlug];
    if (!plan) throw new AppError('PLAN_NOT_FOUND', `Unknown plan "${planSlug}"`, 404);
    const cfg = await payuCreds();
    if (!cfg) throw new AppError('BILLING_NOT_CONFIGURED', 'Billing is not configured yet', 503);

    const offerAvailable = (await launchOfferRemaining()) > 0;
    const amountMinor = pricedAmount(plan, offerAvailable);
    const base = safeProviderBase(cfg.baseUrl, PAYU_BASES, cfg.mode === 'test' ? 'https://test.payu.in' : 'https://secure.payu.in');
    const amountStr = (amountMinor / 100).toFixed(2);
    const txnid = `dev_${crypto.randomBytes(12).toString('hex')}`.slice(0, 25);
    const productinfo = `baalvion-intelligence:${planSlug}`;
    const firstname = (customerEmail ? customerEmail.split('@')[0] : 'customer').slice(0, 60) || 'customer';
    const email = customerEmail || 'billing@baalvion.com';
    const hash = payuRequestHash({ key: cfg.merchantKey, txnid, amount: amountStr, productinfo, firstname, email, salt: cfg.merchantSalt });
    const ret = process.env.PAYU_RETURN_URL || 'https://developer-api.baalvion.com/v1/billing/payu-webhook';

    return {
        provider: 'payu', orderId: txnid,
        action: `${base}/_payment`,
        fields: {
            key: cfg.merchantKey, txnid, amount: amountStr, productinfo, firstname, email,
            phone: process.env.PAYU_DEFAULT_PHONE || '9999999999', surl: ret, furl: ret, hash,
            // udf1/udf2 carry the fulfillment key back through PayU's return POST, same role
            // Razorpay's order.notes plays — PayU has no free-form notes field.
            udf1: orgId, udf2: planSlug, udf3: offerAvailable ? 'true' : 'false',
        },
        amount: amountMinor, currency: 'USD', planSlug, discounted: offerAvailable, prefillEmail: customerEmail || '',
    };
}

async function createCashfreeCheckoutOrder({ orgId, planSlug, customerEmail }) {
    const plan = PLANS[planSlug];
    if (!plan) throw new AppError('PLAN_NOT_FOUND', `Unknown plan "${planSlug}"`, 404);
    const cfg = await cashfreeCreds();
    if (!cfg) throw new AppError('BILLING_NOT_CONFIGURED', 'Billing is not configured yet', 503);

    const offerAvailable = (await launchOfferRemaining()) > 0;
    const amountMinor = pricedAmount(plan, offerAvailable);
    const base = safeProviderBase(cfg.baseUrl, CASHFREE_BASES, cfg.mode === 'test' ? 'https://sandbox.cashfree.com' : 'https://api.cashfree.com');
    const cfOrderId = `dev_${crypto.randomBytes(12).toString('hex')}`;
    const amountMajor = Number((amountMinor / 100).toFixed(2));
    const notifyUrl = process.env.CASHFREE_NOTIFY_URL || 'https://developer-api.baalvion.com/v1/billing/cashfree-webhook';

    const res = await fetch(`${base}/pg/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-client-id': cfg.clientId, 'x-client-secret': cfg.clientSecret, 'x-api-version': CASHFREE_API_VERSION },
        body: JSON.stringify({
            order_id: cfOrderId,
            order_amount: amountMajor,
            order_currency: 'USD',
            customer_details: {
                customer_id: `cust_${crypto.createHash('sha256').update(String(orgId)).digest('hex').slice(0, 24)}`,
                customer_email: customerEmail || 'billing@baalvion.com',
                customer_phone: process.env.CASHFREE_DEFAULT_PHONE || '9999999999',
            },
            order_meta: { notify_url: notifyUrl },
            order_tags: { orgId: String(orgId || ''), planSlug, discounted: offerAvailable ? 'true' : 'false' },
        }),
    });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
    if (!res.ok) {
        logger.warn({ status: res.status, code: data && (data.code || data.type) }, '[cashfree-billing] order creation failed');
        throw new AppError('PAYMENT_UPSTREAM', 'Cashfree order creation failed', 502);
    }
    const cfRef = data.order_id || cfOrderId;
    const mode = base.includes('sandbox') ? 'sandbox' : 'production';
    return {
        provider: 'cashfree', orderId: cfRef, paymentSessionId: data.payment_session_id, mode,
        amount: amountMinor, currency: 'USD', planSlug, discounted: offerAvailable, prefillEmail: customerEmail || '',
    };
}

// PayU return is a form-POST with no signature header — verified with the REVERSE SHA-512 hash.
async function verifyAndHandlePayuReturn(body) {
    if (!body || !body.hash) throw new AppError('UNAUTHORIZED', 'Missing PayU hash', 401);
    const cfg = await payuCreds();
    if (!cfg) throw new AppError('WEBHOOK_NOT_CONFIGURED', 'PayU is not configured', 401);
    const expected = payuResponseHash({
        salt: cfg.merchantSalt, status: body.status, email: body.email, firstname: body.firstname,
        productinfo: body.productinfo, amount: body.amount, txnid: body.txnid, key: cfg.merchantKey,
    });
    if (!constantTimeEqual(body.hash, expected)) throw new AppError('UNAUTHORIZED', 'Invalid PayU signature', 401);

    const paid = String(body.status || '').toLowerCase() === 'success';
    if (!paid) return { handled: false };
    const orgId = body.udf1;
    const planSlug = body.udf2;
    const discounted = body.udf3;
    if (!orgId || !planSlug) {
        logger.warn({ txnid: body.txnid }, '[payu-billing] return missing orgId/planSlug in udf1/udf2');
        return { handled: false };
    }
    await upgradeOrgKeys(orgId, planSlug);
    if (discounted === 'true') await claimLaunchOfferSlot();
    await require('./paymentSpine').reportPlanPayment(
        { id: body.txnid, amount: Math.round(Number(body.amount || 0) * 100), currency: 'USD', notes: { orgId, planSlug } },
        { orgId, planSlug, provider: 'payu' },
    ).catch((err) => logger.warn({ msg: err.message }, '[payu-billing] spine report failed'));
    return { handled: true };
}

// Cashfree webhook: signature = base64(HMAC-SHA256(timestamp + rawBody, clientSecret)).
async function verifyAndHandleCashfreeWebhook({ rawBody, headers }) {
    const secret = (await cashfreeCreds())?.clientSecret;
    if (!secret) throw new AppError('WEBHOOK_NOT_CONFIGURED', 'Cashfree is not configured', 401);
    const signature = headers['x-webhook-signature'];
    const timestamp = headers['x-webhook-timestamp'];
    if (!signature || !timestamp) throw new AppError('UNAUTHORIZED', 'Missing Cashfree webhook signature', 401);
    const tsSeconds = Number.parseInt(String(timestamp), 10);
    if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > 300) {
        throw new AppError('UNAUTHORIZED', 'Cashfree webhook timestamp is missing or stale', 401);
    }
    const expected = crypto.createHmac('sha256', secret).update(String(timestamp) + rawBody.toString('utf8')).digest('base64');
    if (!constantTimeEqual(String(signature), expected)) throw new AppError('UNAUTHORIZED', 'Invalid Cashfree signature', 401);

    const evt = JSON.parse(rawBody.toString('utf8'));
    const type = String(evt.type || '');
    const paid = type.toUpperCase().startsWith('PAYMENT_SUCCESS');
    if (!paid) return { handled: false };
    const order = (evt.data && evt.data.order) || {};
    const payment = (evt.data && evt.data.payment) || {};
    const tags = order.order_tags || {};
    const { orgId, planSlug, discounted } = tags;
    if (!orgId || !planSlug) {
        logger.warn({ orderId: order.order_id }, '[cashfree-billing] webhook missing orgId/planSlug in order_tags');
        return { handled: false };
    }
    await upgradeOrgKeys(orgId, planSlug);
    if (discounted === 'true') await claimLaunchOfferSlot();
    const amountMinor = order.order_amount != null ? Math.round(Number(order.order_amount) * 100) : null;
    await require('./paymentSpine').reportPlanPayment(
        { id: payment.cf_payment_id || order.order_id, amount: amountMinor, currency: (order.order_currency || 'USD').toUpperCase(), notes: { orgId, planSlug } },
        { orgId, planSlug, provider: 'cashfree' },
    ).catch((err) => logger.warn({ msg: err.message }, '[cashfree-billing] spine report failed'));
    return { handled: true };
}

module.exports = { createPayuCheckoutOrder, createCashfreeCheckoutOrder, verifyAndHandlePayuReturn, verifyAndHandleCashfreeWebhook };

const crypto = require('crypto');
const https = require('https');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const PAYU_KEY = process.env.PAYU_KEY;
const PAYU_SALT = process.env.PAYU_SALT;
const PAYU_BASE_URL = process.env.PAYU_BASE_URL || 'https://test.payu.in';

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
let failureCount = 0;
let cooldownUntil = null;
const MAX_FAILURES = 3;
const COOLDOWN_MS = 60_000;

function assertNotCooling() {
    if (cooldownUntil && Date.now() < cooldownUntil) {
        const err = new Error('PayU in cooldown — circuit breaker open');
        err.code = 'CIRCUIT_BREAKER';
        throw err;
    }
}

function recordFailure() {
    failureCount++;
    if (failureCount >= MAX_FAILURES) cooldownUntil = Date.now() + COOLDOWN_MS;
}

// CSPRNG transaction id (≤25 chars for PayU). Math.random() gave only ~4 chars of
// predictable entropy → collision/prediction risk on a financial identifier.
function generateTxnId() { return 'payu_' + Date.now().toString(36) + '_' + crypto.randomBytes(5).toString('hex'); }

function generateHash({ key, txnid, amount, productinfo, firstname, email, salt }) {
    const str = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
    return crypto.createHash('sha512').update(str).digest('hex');
}

function generateApiHash(key, command, var1, salt) {
    return crypto.createHash('sha512').update(`${key}|${command}|${var1}|${salt}`).digest('hex');
}

function postToPayU(path, params) {
    return new Promise((resolve, reject) => {
        const body = new URLSearchParams(params).toString();
        const url = new URL(path, PAYU_BASE_URL);
        const req = https.request(
            { hostname: url.hostname, path: url.pathname + url.search, method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } },
            (res) => {
                let data = '';
                res.on('data', c => (data += c));
                res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
            }
        );
        req.on('error', reject);
        req.setTimeout(8000, () => req.destroy(new Error('PayU request timed out')));
        req.write(body);
        req.end();
    });
}

// ─── Create Order ─────────────────────────────────────────────────────────────
async function createOrder(amount, currency, receipt, customer = {}) {
    assertNotCooling();
    try {
        const txnid = generateTxnId();
        const productinfo = customer.productinfo || 'Subscription';
        const firstname = customer.firstname || customer.name?.split(' ')[0] || 'Customer';
        const email = customer.email || 'customer@baalvion.com';
        const phone = customer.phone || '9999999999';
        const surl = process.env.PAYU_SUCCESS_URL || `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/v1/payment/webhook/payu`;
        const furl = process.env.PAYU_FAILURE_URL || `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/v1/payment/payu/failure`;
        const hash = generateHash({ key: PAYU_KEY, txnid, amount, productinfo, firstname, email, salt: PAYU_SALT });

        failureCount = 0;
        return { key: PAYU_KEY, txnid, amount, productinfo, firstname, email, phone, surl, furl, hash, service_provider: 'payu_paisa', action: `${PAYU_BASE_URL}/_payment`, currency, receipt };
    } catch (err) {
        recordFailure();
        throw err;
    }
}

// ─── Verify Payment (signature) ───────────────────────────────────────────────
function verifyPayment(paymentData) {
    const { status, firstname, lastname = '', email, amount, productinfo, txnid, key, hash: receivedHash,
        udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '',
        udf6 = '', udf7 = '', udf8 = '', udf9 = '', udf10 = '' } = paymentData;

    const reverseStr = [PAYU_SALT, status, udf10, udf9, udf8, udf7, udf6, udf5, udf4, udf3, udf2, udf1, email, firstname, productinfo, amount, txnid, key].join('|');
    const expected = crypto.createHash('sha512').update(reverseStr).digest('hex');

    if (expected !== receivedHash) return { verified: false, reason: 'Hash mismatch — possible tampered response' };
    if (status !== 'success') return { verified: false, reason: `Payment not successful — status: ${status}` };
    return { verified: true, txnid, amount };
}

// ─── Verify Webhook ───────────────────────────────────────────────────────────
async function verifyWebhook(body) {
    const result = verifyPayment(body);
    if (!result.verified) return { valid: false, reason: result.reason };

    const models = require('../../models');
    const status = body.status === 'success' ? 'captured' : 'failed';

    await models.transactions.update(
        { status },
        { where: { gateway_order_id: body.txnid, gateway: 'payu' } }
    ).catch(() => {});

    if (body.status === 'success') {
        await models.subscriptions.update(
            { status: 'active' },
            { where: { gateway_order_id: body.txnid } }
        ).catch(() => {});
    }

    return { valid: true, txnid: body.txnid, status };
}

// ─── Transaction Details ──────────────────────────────────────────────────────
async function getTransactionDetails(txnId) {
    assertNotCooling();
    try {
        const hash = generateApiHash(PAYU_KEY, 'verify_payment', txnId, PAYU_SALT);
        const res = await postToPayU('/merchant/postservice.php?form=2', { key: PAYU_KEY, command: 'verify_payment', var1: txnId, hash });
        failureCount = 0;
        try { return JSON.parse(res.body); } catch { return { raw: res.body }; }
    } catch (err) {
        recordFailure();
        throw err;
    }
}

// ─── Refund ───────────────────────────────────────────────────────────────────
async function createRefund(txnId, amount, reason = '') {
    assertNotCooling();
    try {
        const var1 = txnId;
        const var2 = amount;
        const var3 = reason;
        const hashStr = `${PAYU_KEY}|cancel_refund_transaction|${var1}|${var2}|${var3}|${PAYU_SALT}`;
        const hash = crypto.createHash('sha512').update(hashStr).digest('hex');
        const res = await postToPayU('/merchant/postservice.php?form=2', { key: PAYU_KEY, command: 'cancel_refund_transaction', var1, var2, var3, hash });
        failureCount = 0;
        try { return JSON.parse(res.body); } catch { return { raw: res.body }; }
    } catch (err) {
        recordFailure();
        throw err;
    }
}

// ─── Subscriptions (Standing Instructions) ────────────────────────────────────
async function createSubscription({ amount, currency, customer, productinfo, frequency = 'monthly' }) {
    // PayU SI: create the initial order with SI parameters
    assertNotCooling();
    try {
        const txnid = generateTxnId();
        const firstname = customer.firstname || customer.name?.split(' ')[0] || 'Customer';
        const email = customer.email;
        const phone = customer.phone || '9999999999';
        const surl = process.env.PAYU_SUCCESS_URL || `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/v1/payment/webhook/payu`;
        const furl = process.env.PAYU_FAILURE_URL || `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/v1/payment/payu/failure`;
        const hash = generateHash({ key: PAYU_KEY, txnid, amount, productinfo: productinfo || 'Subscription', firstname, email, salt: PAYU_SALT });

        failureCount = 0;
        return { key: PAYU_KEY, txnid, amount, productinfo: productinfo || 'Subscription', firstname, email, phone, surl, furl, hash, service_provider: 'payu_paisa', action: `${PAYU_BASE_URL}/_payment`, si: 1, si_details: { billingAmount: amount, billingCurrency: currency || 'INR', billingCycle: frequency, billingInterval: 1, paymentStartDate: new Date().toISOString().split('T')[0] } };
    } catch (err) {
        recordFailure();
        throw err;
    }
}

async function cancelSubscription(siToken) {
    assertNotCooling();
    try {
        const hashStr = `${PAYU_KEY}|si_modify|${siToken}|cancel|${PAYU_SALT}`;
        const hash = crypto.createHash('sha512').update(hashStr).digest('hex');
        const res = await postToPayU('/merchant/postservice.php?form=2', { key: PAYU_KEY, command: 'si_modify', var1: siToken, var2: 'cancel', hash });
        failureCount = 0;
        try { return JSON.parse(res.body); } catch { return { raw: res.body }; }
    } catch (err) {
        recordFailure();
        throw err;
    }
}

// ─── Health Check ─────────────────────────────────────────────────────────────
async function healthCheck() {
    const start = Date.now();
    if (cooldownUntil && Date.now() < cooldownUntil) {
        return { status: 'circuit_open', latency: 0, message: `Circuit breaker active until ${new Date(cooldownUntil).toISOString()}`, failureCount, cooldownUntil };
    }
    try {
        const hash = generateApiHash(PAYU_KEY, 'verify_payment', 'health_check_probe_' + Date.now(), PAYU_SALT);
        const res = await postToPayU('/merchant/postservice.php?form=2', { key: PAYU_KEY, command: 'verify_payment', var1: 'health_check_probe_' + Date.now(), hash });
        let parsed = null;
        try { parsed = JSON.parse(res.body); } catch (_) {}
        if (parsed && 'status' in parsed) return { status: 'active', latency: Date.now() - start, message: 'PayU is healthy', failureCount, cooldownUntil };
        return { status: 'degraded', latency: Date.now() - start, message: 'PayU returned unexpected format', failureCount };
    } catch (err) {
        recordFailure();
        return { status: err.message === 'PayU request timed out' ? 'timeout' : 'inactive', latency: Date.now() - start, message: err.message, failureCount, cooldownUntil };
    }
}

module.exports = {
    createOrder, verifyPayment, verifyWebhook,
    getTransactionDetails, createRefund,
    createSubscription, cancelSubscription,
    healthCheck,
    getFailureCount: () => failureCount,
    getCooldownUntil: () => cooldownUntil,
    resetFailures: () => { failureCount = 0; cooldownUntil = null; },
};

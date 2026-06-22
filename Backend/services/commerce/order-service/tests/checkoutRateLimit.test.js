'use strict';
// Dedicated checkout/payment rate limiter (middleware/checkoutRateLimit). Drives the REAL
// express-rate-limit middleware with a fake req/res to prove it admits up to `max` requests per IP
// per window, then blocks further ones with a 429 RATE_LIMITED envelope — and that the window is
// keyed per-IP (a different IP is unaffected).
const { test } = require('node:test');
const assert = require('node:assert');

const createCheckoutRateLimit = require('../middleware/checkoutRateLimit');

function mockRes() {
    const headers = {};
    return {
        statusCode: 200,
        finished: false,
        body: undefined,
        setHeader(k, v) { headers[k] = v; },
        getHeader(k) { return headers[k]; },
        removeHeader(k) { delete headers[k]; },
        set(k, v) { headers[k] = v; return this; },
        status(c) { this.statusCode = c; return this; },
        send(b) { this.body = b; this.finished = true; return this; },
        json(b) { this.body = b; this.finished = true; return this; },
        end() { this.finished = true; return this; },
    };
}

function makeReq(ip) {
    return { ip, method: 'POST', headers: {}, app: { get: () => false } };
}

// Invoke the async middleware once; resolve whether it called next() (allowed) or blocked.
async function hit(limiter, ip) {
    const req = makeReq(ip);
    const res = mockRes();
    let allowed = false;
    await limiter(req, res, () => { allowed = true; });
    return { allowed, res };
}

test('checkout limiter admits up to max per IP, then blocks with a 429 RATE_LIMITED envelope', async () => {
    // validate:false silences express-rate-limit's proxy/IP validation warnings in this bare harness.
    const limiter = createCheckoutRateLimit({ max: 3, windowMs: 60_000, validate: false });
    const ip = '203.0.113.7';

    const results = [];
    for (let i = 0; i < 5; i++) results.push(await hit(limiter, ip));

    const allowed = results.filter((r) => r.allowed).length;
    const blocked = results.filter((r) => !r.allowed);
    assert.equal(allowed, 3, 'first 3 requests pass');
    assert.equal(blocked.length, 2, 'the next 2 are blocked');
    // Blocked responses carry the 429 + the standard error envelope.
    for (const r of blocked) {
        assert.equal(r.res.statusCode, 429);
        assert.equal(r.res.body && r.res.body.error && r.res.body.error.code, 'RATE_LIMITED');
    }
});

test('checkout limiter is keyed per-IP — a different IP is unaffected by another IP hitting the cap', async () => {
    const limiter = createCheckoutRateLimit({ max: 2, windowMs: 60_000, validate: false });
    // Exhaust IP A.
    await hit(limiter, '198.51.100.1');
    await hit(limiter, '198.51.100.1');
    const aBlocked = await hit(limiter, '198.51.100.1');
    assert.equal(aBlocked.allowed, false, 'IP A is now blocked');
    // IP B still has its full allowance.
    const bFirst = await hit(limiter, '198.51.100.2');
    assert.equal(bFirst.allowed, true, 'IP B is unaffected');
});

test('checkout limiter honours the CHECKOUT_RL_MAX env override', async () => {
    const prev = process.env.CHECKOUT_RL_MAX;
    process.env.CHECKOUT_RL_MAX = '1';
    try {
        const limiter = createCheckoutRateLimit({ windowMs: 60_000, validate: false });
        const ip = '192.0.2.50';
        const first = await hit(limiter, ip);
        const second = await hit(limiter, ip);
        assert.equal(first.allowed, true);
        assert.equal(second.allowed, false, 'max=1 blocks the second request');
    } finally {
        if (prev === undefined) delete process.env.CHECKOUT_RL_MAX; else process.env.CHECKOUT_RL_MAX = prev;
    }
});

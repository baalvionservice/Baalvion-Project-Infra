'use strict';
/**
 * AfterShip carrier adapter unit tests — NO live network.
 * A fake `http` (matching the shared httpClient return shape
 * { status, headers, json, text }) feeds REAL AfterShip v4 tracking JSON shapes.
 *
 * Asserts: tag -> TRACKING_STATUS mapping for every tag (incl. customs ->
 * CUSTOMS_HOLD), checkpoints -> events, eta mapping, and FAIL-OPEN behavior
 * (timeout / 5xx -> degraded:true UNKNOWN, never throws). Plus base64 HMAC
 * webhook verify true/false.
 */
const assert = require('assert');
const { TRACKING_STATUS } = require('./contract');
const { createRealCarrierProvider } = require('./realAdapter');
const { createAftershipProvider, mapTag, TAG_MAP } = require('./providers/aftership');
const { verifyAftershipWebhook, verifyAftershipWebhookFromHeaders, parseAftershipEvent } = require('./webhook');
const { hmacSha256Base64 } = require('../_shared/signature');
const { IntegrationTimeoutError, IntegrationHttpError } = require('../_shared/httpClient');

const ENV = { AFTERSHIP_API_KEY: 'as_test_key' };
const envOf = (src) => (name) => src[name];

/** Build a fake http that returns a single AfterShip `tracking` object on GET. */
function httpReturningTracking(tracking) {
    return async ({ method }) => {
        if (method === 'POST') return { status: 201, headers: new Map(), json: { data: { tracking } }, text: '' };
        return { status: 200, headers: new Map(), json: { data: { tracking } }, text: '' };
    };
}

/** A realistic AfterShip v4 tracking object. */
function trackingFixture(overrides = {}) {
    return {
        tracking_number: '1Z999AA10123456784',
        slug: 'ups',
        tag: 'InTransit',
        expected_delivery: '2026-06-12',
        checkpoints: [
            {
                checkpoint_time: '2026-06-09T08:00:00+00:00',
                tag: 'InfoReceived',
                city: 'Shenzhen',
                country_name: 'China',
                message: 'Shipment information received',
            },
            {
                checkpoint_time: '2026-06-10T12:00:00+00:00',
                tag: 'InTransit',
                city: 'Singapore',
                country_name: 'Singapore',
                message: 'Departed facility',
            },
        ],
        ...overrides,
    };
}

describe('carrier/aftership tag -> TRACKING_STATUS mapping', () => {
    const cases = [
        ['Pending', TRACKING_STATUS.BOOKED],
        ['InfoReceived', TRACKING_STATUS.BOOKED],
        ['InTransit', TRACKING_STATUS.IN_TRANSIT],
        ['OutForDelivery', TRACKING_STATUS.OUT_FOR_DELIVERY],
        ['AvailableForPickup', TRACKING_STATUS.OUT_FOR_DELIVERY],
        ['AttemptFail', TRACKING_STATUS.EXCEPTION],
        ['Exception', TRACKING_STATUS.EXCEPTION],
        ['Expired', TRACKING_STATUS.EXCEPTION],
        ['Delivered', TRACKING_STATUS.DELIVERED],
    ];

    test.each(cases)('tag %s -> %s', (tag, expected) => {
        assert.strictEqual(mapTag(tag), expected);
    });

    test('unknown / blank tag -> UNKNOWN', () => {
        assert.strictEqual(mapTag('SomethingNew'), TRACKING_STATUS.UNKNOWN);
        assert.strictEqual(mapTag(''), TRACKING_STATUS.UNKNOWN);
        assert.strictEqual(mapTag(undefined), TRACKING_STATUS.UNKNOWN);
    });

    test('every mapped tag yields a valid contract status', () => {
        const VALID = new Set(Object.values(TRACKING_STATUS));
        for (const status of Object.values(TAG_MAP)) {
            assert.ok(VALID.has(status), `invalid mapped status ${status}`);
        }
    });
});

describe('carrier/aftership track() — success parsing', () => {
    test('maps tag, checkpoints->events, eta, degraded:false', async () => {
        const provider = createAftershipProvider({
            env: envOf(ENV),
            http: httpReturningTracking(trackingFixture()),
        });
        const res = await provider.track({ trackingNumber: '1Z999AA10123456784', carrier: 'ups' });

        assert.strictEqual(res.degraded, false);
        assert.strictEqual(res.status, TRACKING_STATUS.IN_TRANSIT);
        assert.strictEqual(res.carrier, 'ups');
        assert.strictEqual(res.eta, '2026-06-12');
        assert.strictEqual(res.events.length, 2);
        assert.strictEqual(res.events[0].status, TRACKING_STATUS.BOOKED);
        assert.strictEqual(res.events[0].timestamp, '2026-06-09T08:00:00+00:00');
        assert.strictEqual(res.events[0].location, 'Shenzhen, China');
        assert.strictEqual(res.events[1].status, TRACKING_STATUS.IN_TRANSIT);
    });

    test('Delivered tag -> DELIVERED', async () => {
        const provider = createAftershipProvider({
            env: envOf(ENV),
            http: httpReturningTracking(trackingFixture({ tag: 'Delivered' })),
        });
        const res = await provider.track({ trackingNumber: 'X', carrier: 'ups' });
        assert.strictEqual(res.status, TRACKING_STATUS.DELIVERED);
        assert.strictEqual(res.degraded, false);
    });

    test('customs checkpoint -> CUSTOMS_HOLD (event + overrides current status)', async () => {
        const tracking = trackingFixture({
            tag: 'InTransit',
            checkpoints: [
                { checkpoint_time: '2026-06-09T08:00:00Z', tag: 'InTransit', city: 'Shenzhen', message: 'Departed' },
                {
                    checkpoint_time: '2026-06-10T12:00:00Z',
                    tag: 'InTransit',
                    subtag: 'InTransit_002',
                    city: 'Rotterdam',
                    country_name: 'Netherlands',
                    message: 'Held by customs for inspection',
                },
            ],
        });
        const provider = createAftershipProvider({ env: envOf(ENV), http: httpReturningTracking(tracking) });
        const res = await provider.track({ trackingNumber: 'X', carrier: 'ups' });

        assert.strictEqual(res.status, TRACKING_STATUS.CUSTOMS_HOLD, 'latest customs checkpoint overrides status');
        const customsEvent = res.events[res.events.length - 1];
        assert.strictEqual(customsEvent.status, TRACKING_STATUS.CUSTOMS_HOLD);
        assert.strictEqual(customsEvent.location, 'Rotterdam, Netherlands');
    });

    test('customs hold does NOT override a Delivered shipment', async () => {
        const tracking = trackingFixture({
            tag: 'Delivered',
            checkpoints: [{ checkpoint_time: '2026-06-10T12:00:00Z', tag: 'InTransit', message: 'customs clearance' }],
        });
        const provider = createAftershipProvider({ env: envOf(ENV), http: httpReturningTracking(tracking) });
        const res = await provider.track({ trackingNumber: 'X', carrier: 'ups' });
        assert.strictEqual(res.status, TRACKING_STATUS.DELIVERED);
    });

    test('registers then reads when GET 404s (register-if-needed)', async () => {
        const tracking = trackingFixture({ tag: 'Pending', checkpoints: [] });
        let getCalls = 0;
        const http = async ({ method }) => {
            if (method === 'POST') return { status: 201, headers: new Map(), json: { data: { tracking } }, text: '' };
            getCalls += 1;
            if (getCalls === 1) throw new IntegrationHttpError('HTTP 404', { status: 404 });
            return { status: 200, headers: new Map(), json: { data: { tracking } }, text: '' };
        };
        const provider = createAftershipProvider({ env: envOf(ENV), http });
        const res = await provider.track({ trackingNumber: 'NEW-1', carrier: 'ups' });
        assert.strictEqual(res.status, TRACKING_STATUS.BOOKED);
        assert.strictEqual(res.degraded, false);
        assert.strictEqual(getCalls, 2);
    });
});

describe('carrier/aftership track() — FAIL-OPEN (never throws)', () => {
    test('timeout -> degraded:true UNKNOWN, does not throw', async () => {
        const http = async () => { throw new IntegrationTimeoutError('timeout after 5000ms'); };
        const provider = createAftershipProvider({ env: envOf(ENV), http });
        let threw = false;
        let res;
        try { res = await provider.track({ trackingNumber: 'X', carrier: 'ups' }); }
        catch { threw = true; }
        assert.strictEqual(threw, false, 'track must never throw (fail-open)');
        assert.strictEqual(res.degraded, true);
        assert.strictEqual(res.status, TRACKING_STATUS.UNKNOWN);
        assert.deepStrictEqual(res.events, []);
        assert.strictEqual(res.reason, 'TIMEOUT');
    });

    test('5xx -> degraded:true UNKNOWN, does not throw', async () => {
        const http = async () => { throw new IntegrationHttpError('HTTP 503', { status: 503, retriable: true }); };
        const provider = createAftershipProvider({ env: envOf(ENV), http });
        const res = await provider.track({ trackingNumber: 'X', carrier: 'ups' });
        assert.strictEqual(res.degraded, true);
        assert.strictEqual(res.status, TRACKING_STATUS.UNKNOWN);
        assert.strictEqual(res.reason, 'HTTP_503');
    });

    test('arbitrary network error -> degraded:true UNKNOWN', async () => {
        const http = async () => { throw new TypeError('fetch failed'); };
        const provider = createAftershipProvider({ env: envOf(ENV), http });
        const res = await provider.track({ trackingNumber: 'X', carrier: 'ups' });
        assert.strictEqual(res.degraded, true);
        assert.strictEqual(res.status, TRACKING_STATUS.UNKNOWN);
    });

    test('NOT configured (no api key) -> degraded:true UNKNOWN, never throws', async () => {
        const provider = createRealCarrierProvider({ env: envOf({}) });
        const res = await provider.track({ trackingNumber: 'X', carrier: 'ups' });
        assert.strictEqual(res.degraded, true);
        assert.strictEqual(res.status, TRACKING_STATUS.UNKNOWN);
        assert.strictEqual(res.reason, 'NOT_CONFIGURED');
    });

    test('missing trackingNumber -> degraded, never throws', async () => {
        const provider = createAftershipProvider({ env: envOf(ENV), http: httpReturningTracking(trackingFixture()) });
        const res = await provider.track({});
        assert.strictEqual(res.degraded, true);
        assert.strictEqual(res.status, TRACKING_STATUS.UNKNOWN);
    });

    test('SSRF: non-aftership base URL with flag unset -> degraded, key never sent', async () => {
        let called = false;
        const http = async () => { called = true; return { status: 200, headers: new Map(), json: { data: { tracking: trackingFixture() } }, text: '' }; };
        const provider = createAftershipProvider({
            env: envOf({ ...ENV, AFTERSHIP_BASE_URL: 'https://evil.example.com/v4' }),
            http,
        });
        const res = await provider.track({ trackingNumber: 'X', carrier: 'ups' });
        assert.strictEqual(res.degraded, true);
        assert.strictEqual(res.status, TRACKING_STATUS.UNKNOWN);
        assert.strictEqual(res.reason, 'BASE_URL_HOST_NOT_ALLOWED');
        assert.strictEqual(called, false, 'must not send the API key to an unexpected host');
    });

    test('SSRF: custom host allowed when AFTERSHIP_ALLOW_CUSTOM_HOST=true', async () => {
        const provider = createAftershipProvider({
            env: envOf({ ...ENV, AFTERSHIP_BASE_URL: 'https://aftership.internal.corp/v4', AFTERSHIP_ALLOW_CUSTOM_HOST: 'true' }),
            http: httpReturningTracking(trackingFixture()),
        });
        const res = await provider.track({ trackingNumber: 'X', carrier: 'ups' });
        assert.strictEqual(res.degraded, false);
        assert.strictEqual(res.status, TRACKING_STATUS.IN_TRANSIT);
    });

    test('SSRF: a non-URL base URL -> degraded (fail-open), never throws', async () => {
        const provider = createAftershipProvider({
            env: envOf({ ...ENV, AFTERSHIP_BASE_URL: 'not a url' }),
            http: httpReturningTracking(trackingFixture()),
        });
        const res = await provider.track({ trackingNumber: 'X', carrier: 'ups' });
        assert.strictEqual(res.degraded, true);
        assert.strictEqual(res.status, TRACKING_STATUS.UNKNOWN);
    });

    test('over-long tracking number -> degraded UNKNOWN (fail-open), never sends', async () => {
        let called = false;
        const http = async () => { called = true; return { status: 200, headers: new Map(), json: { data: { tracking: trackingFixture() } }, text: '' }; };
        const provider = createAftershipProvider({ env: envOf(ENV), http });
        const res = await provider.track({ trackingNumber: 'A'.repeat(65), carrier: 'ups' });
        assert.strictEqual(res.degraded, true);
        assert.strictEqual(res.status, TRACKING_STATUS.UNKNOWN);
        assert.strictEqual(res.reason, 'TRACKING_NUMBER_TOO_LONG');
        assert.strictEqual(called, false);
    });

    test('registered but no data yet -> degraded (does not block)', async () => {
        // GET returns null tracking, POST returns null -> NO_DATA_YET
        const http = async ({ method }) => {
            if (method === 'POST') return { status: 201, headers: new Map(), json: { data: {} }, text: '' };
            return { status: 200, headers: new Map(), json: { data: {} }, text: '' };
        };
        const provider = createAftershipProvider({ env: envOf(ENV), http });
        const res = await provider.track({ trackingNumber: 'X', carrier: 'ups' });
        assert.strictEqual(res.degraded, true);
        assert.strictEqual(res.status, TRACKING_STATUS.UNKNOWN);
    });
});

describe('carrier/aftership webhook', () => {
    const secret = 'whsec_aftership';
    const body = JSON.stringify({
        msg: { tracking_number: '1Z999', tag: 'Delivered', updated_at: '2026-06-11T10:00:00Z' },
    });

    test('verifies a correct base64 HMAC and rejects a tampered one', () => {
        const sig = hmacSha256Base64(secret, body);
        assert.strictEqual(verifyAftershipWebhook({ rawBody: body, signatureHeader: sig, secret }), true);
        assert.strictEqual(verifyAftershipWebhook({ rawBody: body + ' ', signatureHeader: sig, secret }), false);
        assert.strictEqual(verifyAftershipWebhook({ rawBody: body, signatureHeader: sig, secret: 'wrong' }), false);
    });

    test('missing signature/secret verifies false (fail-closed)', () => {
        assert.strictEqual(verifyAftershipWebhook({ rawBody: body, signatureHeader: '', secret }), false);
        assert.strictEqual(verifyAftershipWebhook({ rawBody: body, signatureHeader: 'x', secret: '' }), false);
    });

    test('parseAftershipEvent extracts trackingNumber/status/ts', () => {
        const evt = parseAftershipEvent(body);
        assert.strictEqual(evt.trackingNumber, '1Z999');
        assert.strictEqual(evt.status, TRACKING_STATUS.DELIVERED);
        assert.strictEqual(evt.ts, '2026-06-11T10:00:00Z');
    });

    test('verifies a webhook delivered under either v3 or v4 header name', () => {
        const sig = hmacSha256Base64(secret, body);
        // v4 header name
        assert.strictEqual(
            verifyAftershipWebhookFromHeaders({ 'hmac-sha256': sig }, body, secret),
            true,
        );
        // v3 header name
        assert.strictEqual(
            verifyAftershipWebhookFromHeaders({ 'aftership-hmac-sha256': sig }, body, secret),
            true,
        );
        // case-insensitive header lookup
        assert.strictEqual(
            verifyAftershipWebhookFromHeaders({ 'HMAC-SHA256': sig }, body, secret),
            true,
        );
        // tampered -> false; missing -> false
        assert.strictEqual(verifyAftershipWebhookFromHeaders({ 'hmac-sha256': sig + 'x' }, body, secret), false);
        assert.strictEqual(verifyAftershipWebhookFromHeaders({}, body, secret), false);
    });

    test('parseAftershipEvent tolerates data.tracking shape and bad JSON', () => {
        const evt = parseAftershipEvent({ data: { tracking: { tracking_number: 'A', tag: 'InTransit' } } });
        assert.strictEqual(evt.trackingNumber, 'A');
        assert.strictEqual(evt.status, TRACKING_STATUS.IN_TRANSIT);
        const bad = parseAftershipEvent('{not json');
        assert.strictEqual(bad.trackingNumber, undefined);
        assert.strictEqual(bad.status, TRACKING_STATUS.UNKNOWN);
    });
});

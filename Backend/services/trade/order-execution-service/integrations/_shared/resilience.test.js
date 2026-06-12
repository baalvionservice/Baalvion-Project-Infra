'use strict';
/**
 * Circuit-breaker + bulkhead wiring on the shared vendor HTTP client.
 * Proves a struggling vendor fails fast (no timeout/retry burn) and that
 * client-side problems (4xx) never trip the breaker.
 */
const {
    request,
    IntegrationHttpError,
    IntegrationTimeoutError,
    CircuitOpenError,
    __resetResilience,
    resilienceSnapshot,
} = require('./httpClient');

const res = (status, bodyObj, headers = new Map()) => ({
    ok: status >= 200 && status < 300,
    status,
    headers,
    text: async () => JSON.stringify(bodyObj),
});

// Each test gets a unique host so module-level breaker state never bleeds across tests.
let n = 0;
const freshHost = () => `https://vendor-${++n}.example.com/x`;

describe('_shared/httpClient resilience (circuit breaker + bulkhead)', () => {
    beforeEach(() => __resetResilience());

    test('opens the circuit after the failure threshold, then fails fast', async () => {
        const url = freshHost();
        let calls = 0;
        const fetchImpl = async () => { calls += 1; return res(503, { error: 'down' }); };

        // Default threshold is 5 consecutive vendor failures.
        for (let i = 0; i < 5; i += 1) {
            await expect(request({ url, fetchImpl })).rejects.toBeInstanceOf(IntegrationHttpError);
        }
        const callsBeforeOpen = calls;

        // 6th call: circuit is open → fail fast WITHOUT touching fetch.
        await expect(request({ url, fetchImpl })).rejects.toBeInstanceOf(CircuitOpenError);
        expect(calls).toBe(callsBeforeOpen); // fetch was not invoked
        expect(resilienceSnapshot()[new URL(url).host]).toBe('open');
    });

    test('timeouts (vendor unreachable) trip the breaker', async () => {
        const url = freshHost();
        const fetchImpl = async () => { const e = new Error('aborted'); e.name = 'AbortError'; throw e; };
        for (let i = 0; i < 5; i += 1) {
            await expect(request({ url, timeoutMs: 5, fetchImpl })).rejects.toBeInstanceOf(IntegrationTimeoutError);
        }
        await expect(request({ url, timeoutMs: 5, fetchImpl })).rejects.toBeInstanceOf(CircuitOpenError);
    });

    test('4xx client errors do NOT trip the breaker (vendor is up)', async () => {
        const url = freshHost();
        let calls = 0;
        const fetchImpl = async () => { calls += 1; return res(400, { error: 'bad request' }); };
        for (let i = 0; i < 8; i += 1) {
            await expect(request({ url, fetchImpl })).rejects.toBeInstanceOf(IntegrationHttpError);
        }
        expect(calls).toBe(8); // every call reached the vendor; circuit stayed closed
        expect(resilienceSnapshot()[new URL(url).host]).toBe('closed');
    });

    test('429 throttling does NOT trip the breaker', async () => {
        const url = freshHost();
        let calls = 0;
        const fetchImpl = async () => { calls += 1; return res(429, { error: 'slow down' }); };
        for (let i = 0; i < 8; i += 1) {
            await expect(request({ url, fetchImpl })).rejects.toBeInstanceOf(IntegrationHttpError);
        }
        expect(calls).toBe(8);
    });

    test('circuitBreaker:false bypasses the breaker entirely', async () => {
        const url = freshHost();
        let calls = 0;
        const fetchImpl = async () => { calls += 1; return res(503, {}); };
        for (let i = 0; i < 10; i += 1) {
            await expect(request({ url, fetchImpl, circuitBreaker: false }))
                .rejects.toBeInstanceOf(IntegrationHttpError);
        }
        expect(calls).toBe(10); // no fast-fail; every call reached fetch
    });
});

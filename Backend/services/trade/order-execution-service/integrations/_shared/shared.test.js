'use strict';
const { request, backoffMs, IntegrationHttpError, IntegrationTimeoutError } = require('./httpClient');
const { hmacSha256Hex, hmacSha256Base64, verifyHmac, timingSafeEqualStr } = require('./signature');
const { env, isConfigured, requireEnv, parseHttpUrl } = require('./config');

const res = (status, bodyObj, headers = new Map()) => ({
    ok: status >= 200 && status < 300,
    status,
    headers,
    text: async () => JSON.stringify(bodyObj),
});

describe('_shared/httpClient', () => {
    test('returns parsed JSON on 2xx', async () => {
        const fetchImpl = async () => res(200, { hello: 'world' });
        const out = await request({ url: 'https://api.example.com/x', fetchImpl });
        expect(out.status).toBe(200);
        expect(out.json).toEqual({ hello: 'world' });
    });

    test('throws typed IntegrationHttpError on non-retriable 4xx and does NOT retry', async () => {
        let calls = 0;
        const fetchImpl = async () => { calls += 1; return res(400, { error: 'bad' }); };
        await expect(request({ url: 'https://api.example.com/x', retries: 3, fetchImpl }))
            .rejects.toBeInstanceOf(IntegrationHttpError);
        expect(calls).toBe(1); // 400 is not retriable
    });

    test('retries on 503 up to the bound, then throws', async () => {
        let calls = 0;
        const fetchImpl = async () => { calls += 1; return res(503, { error: 'down' }); };
        await expect(request({ url: 'https://api.example.com/x', retries: 2, baseMs: 1, maxMs: 2, rng: () => 0, fetchImpl }))
            .rejects.toBeInstanceOf(IntegrationHttpError);
        expect(calls).toBe(3); // 1 + 2 retries
    });

    test('succeeds after a transient 503 then 200', async () => {
        const seq = [() => res(503, {}), () => res(200, { ok: true })];
        let i = 0;
        const fetchImpl = async () => seq[i++]();
        const out = await request({ url: 'https://api.example.com/x', retries: 2, baseMs: 1, maxMs: 1, rng: () => 0, fetchImpl });
        expect(out.json).toEqual({ ok: true });
    });

    test('maps an AbortError to IntegrationTimeoutError', async () => {
        const fetchImpl = async () => { const e = new Error('aborted'); e.name = 'AbortError'; throw e; };
        await expect(request({ url: 'https://api.example.com/x', timeoutMs: 5, fetchImpl }))
            .rejects.toBeInstanceOf(IntegrationTimeoutError);
    });

    test('throws RESPONSE_TOO_LARGE when content-length exceeds the cap', async () => {
        const headers = new Map([['content-length', String(3_000_000)]]);
        const fetchImpl = async () => res(200, { big: true }, headers);
        await expect(request({ url: 'https://api.example.com/x', fetchImpl, maxResponseBytes: 2_000_000 }))
            .rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
    });

    test('throws RESPONSE_TOO_LARGE when decoded body exceeds the cap (backstop)', async () => {
        const fetchImpl = async () => ({ ok: true, status: 200, headers: new Map(), text: async () => 'x'.repeat(50) });
        await expect(request({ url: 'https://api.example.com/x', fetchImpl, maxResponseBytes: 10 }))
            .rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
    });

    test('IntegrationHttpError.body is non-enumerable but readable; toSafeLog omits it', () => {
        const err = new IntegrationHttpError('HTTP 400 from api', { status: 400, code: 'X', body: { secret: 'pii' } });
        expect(err.body).toEqual({ secret: 'pii' }); // programmatically readable
        expect(JSON.stringify(err)).not.toContain('pii'); // not serialized
        expect(Object.keys(err)).not.toContain('body');
        expect(err.toSafeLog()).toEqual({ name: 'IntegrationHttpError', message: 'HTTP 400 from api', status: 400, code: 'X' });
        expect(JSON.stringify(err.toSafeLog())).not.toContain('pii');
    });

    test('backoffMs stays within [0, ceiling] and grows with attempt', () => {
        expect(backoffMs(1, { baseMs: 100, maxMs: 10000, rng: () => 0.999999 })).toBeLessThanOrEqual(100);
        expect(backoffMs(3, { baseMs: 100, maxMs: 10000, rng: () => 0.999999 })).toBeLessThanOrEqual(400);
        expect(backoffMs(3, { baseMs: 100, maxMs: 10000, rng: () => 0 })).toBe(0);
    });
});

describe('_shared/signature', () => {
    const secret = 'whsec_test';
    const body = JSON.stringify({ event: 'paid', id: 'evt_1' });

    test('verifies a correct hex HMAC and rejects a tampered one', () => {
        const sig = hmacSha256Hex(secret, body);
        expect(verifyHmac({ secret, rawBody: body, signatureHeader: sig, encoding: 'hex' })).toBe(true);
        expect(verifyHmac({ secret, rawBody: body + ' ', signatureHeader: sig, encoding: 'hex' })).toBe(false);
        expect(verifyHmac({ secret: 'wrong', rawBody: body, signatureHeader: sig, encoding: 'hex' })).toBe(false);
    });

    test('verifies a base64 HMAC (AfterShip style)', () => {
        const sig = hmacSha256Base64(secret, body);
        expect(verifyHmac({ secret, rawBody: body, signatureHeader: sig, encoding: 'base64' })).toBe(true);
    });

    test('timingSafeEqualStr is false on mismatch / bad input, never throws', () => {
        expect(timingSafeEqualStr('a', 'b')).toBe(false);
        expect(timingSafeEqualStr('abc', 'ab')).toBe(false);
        expect(timingSafeEqualStr(undefined, 'x')).toBe(false);
        expect(timingSafeEqualStr('same', 'same')).toBe(true);
    });

    test('missing inputs verify as false (fail-closed)', () => {
        expect(verifyHmac({ secret: '', rawBody: body, signatureHeader: 'x' })).toBe(false);
        expect(verifyHmac({ secret, rawBody: null, signatureHeader: 'x' })).toBe(false);
        expect(verifyHmac({ secret, rawBody: body, signatureHeader: '' })).toBe(false);
    });
});

describe('_shared/config', () => {
    const src = { A: 'x', B: ' ', C: 'y' };
    test('env trims and treats blank as undefined', () => {
        expect(env('A', src)).toBe('x');
        expect(env('B', src)).toBeUndefined();
        expect(env('MISSING', src)).toBeUndefined();
    });
    test('isConfigured requires all present', () => {
        expect(isConfigured(['A', 'C'], src)).toBe(true);
        expect(isConfigured(['A', 'B'], src)).toBe(false);
    });
    test('requireEnv throws listing missing names', () => {
        expect(() => requireEnv(['A', 'B', 'Z'], src)).toThrow(/B, Z/);
        expect(requireEnv(['A', 'C'], src)).toEqual({ A: 'x', C: 'y' });
    });

    test('parseHttpUrl validates protocol, optional host-lock', () => {
        expect(parseHttpUrl('https://api.aftership.com/v4').hostname).toBe('api.aftership.com');
        expect(() => parseHttpUrl('not a url')).toThrow(/invalid url/i);
        expect(() => parseHttpUrl('file:///etc/passwd')).toThrow(/protocol/i);
        // host-lock
        expect(parseHttpUrl('https://api.aftership.com/v4', { allowHosts: ['api.aftership.com'] })).toBeTruthy();
        expect(() => parseHttpUrl('https://evil.example.com', { allowHosts: ['api.aftership.com'] }))
            .toThrow(/not in allowed/i);
    });
});

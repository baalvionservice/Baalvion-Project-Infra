'use strict';
/**
 * Unit tests for the yente / OpenSanctions provider. NO live network — a fake
 * `http` client is injected returning REAL yente /match response JSON shapes.
 *
 * Asserts the FAIL-CLOSED posture and the score->status threshold mapping.
 */
const provider = require('./openSanctions');
const { SCREENING_STATUS } = require('../contract');
const { IntegrationTimeoutError, IntegrationHttpError } = require('../../_shared/httpClient');

const BASE_ENV = Object.freeze({ YENTE_BASE_URL: 'http://yente:8000' });

/** A fake httpClient whose request() resolves with a canned `json`. */
function okHttp(json, capture) {
    return {
        async request(opts) {
            if (capture) Object.assign(capture, opts);
            return { status: 200, headers: new Map(), json, text: JSON.stringify(json) };
        },
    };
}

/** A fake httpClient whose request() rejects with the given error. */
function failHttp(err) {
    return { async request() { throw err; } };
}

/** Real yente /match response: a high-score OFAC SDN hit. */
function ofacHit(score = 0.94) {
    return {
        responses: {
            q: {
                status: 200,
                results: [
                    {
                        id: 'NK-abc123',
                        caption: 'VLADIMIR PUTIN',
                        score,
                        match: true,
                        schema: 'Person',
                        datasets: ['us_ofac_sdn', 'eu_fsf'],
                        properties: { name: ['Vladimir Putin'], topics: ['sanction'] },
                    },
                    {
                        id: 'NK-def456',
                        caption: 'Vladimir Putin (alias)',
                        score: 0.71,
                        datasets: ['un_sc_sanctions'],
                        properties: {},
                    },
                ],
            },
        },
    };
}

describe('openSanctions provider — status/threshold mapping', () => {
    test('high-score OFAC hit -> CONFIRMED_MATCH with listName from datasets[0]', async () => {
        const res = await provider.screen(
            { name: 'Vladimir Putin', country: 'RU' },
            { http: okHttp(ofacHit(0.94)), env: BASE_ENV },
        );
        expect(res.status).toBe(SCREENING_STATUS.CONFIRMED_MATCH);
        expect(res.confidence).toBeCloseTo(0.94, 5);
        expect(res.matches.length).toBeGreaterThan(0);
        expect(res.matches[0].listName).toBe('us_ofac_sdn');
        expect(res.matches[0].matchedName).toBe('VLADIMIR PUTIN');
        expect(res.matches[0].entityId).toBe('NK-abc123');
        expect(res.matches[0].score).toBeCloseTo(0.94, 5);
    });

    test('mid-score hit -> POTENTIAL_MATCH', async () => {
        // Single mid-score result so the top score is unambiguous.
        const mid = {
            responses: { q: { results: [{ id: 'm1', caption: 'Acme', score: 0.7, datasets: ['eu_fsf'] }] } },
        };
        const res = await provider.screen({ name: 'Acme Trading Co' }, { http: okHttp(mid), env: BASE_ENV });
        // 0.7 is >= potential (0.60) but < confirm (0.85)
        expect(res.status).toBe(SCREENING_STATUS.POTENTIAL_MATCH);
        expect(res.confidence).toBeCloseTo(0.7, 5);
    });

    test('empty results -> CLEAR with confidence 0 and no matches', async () => {
        const empty = { responses: { q: { status: 200, results: [] } } };
        const res = await provider.screen({ name: 'Totally Clean Ltd' }, { http: okHttp(empty), env: BASE_ENV });
        expect(res.status).toBe(SCREENING_STATUS.CLEAR);
        expect(res.confidence).toBe(0);
        expect(res.matches).toEqual([]);
    });

    test('low-score-only results -> CLEAR (below potential threshold)', async () => {
        const low = {
            responses: { q: { results: [{ id: 'x', caption: 'Faint Match', score: 0.4, datasets: ['us_ofac_sdn'] }] } },
        };
        const res = await provider.screen({ name: 'Faint Match' }, { http: okHttp(low), env: BASE_ENV });
        expect(res.status).toBe(SCREENING_STATUS.CLEAR);
        expect(res.confidence).toBeCloseTo(0.4, 5);
    });
});

describe('openSanctions provider — FAIL-CLOSED (never CLEAR on error)', () => {
    test('timeout THROWS (does not resolve to CLEAR)', async () => {
        const http = failHttp(new IntegrationTimeoutError('timeout after 5000ms calling yente:8000'));
        await expect(provider.screen({ name: 'Anyone' }, { http, env: BASE_ENV })).rejects.toBeInstanceOf(
            IntegrationTimeoutError,
        );
    });

    test('5xx (exhausted retries) THROWS', async () => {
        const http = failHttp(new IntegrationHttpError('HTTP 503 from yente:8000', { status: 503, retriable: true }));
        await expect(provider.screen({ name: 'Anyone' }, { http, env: BASE_ENV })).rejects.toBeInstanceOf(
            IntegrationHttpError,
        );
    });

    test('network error THROWS', async () => {
        const http = failHttp(new TypeError('fetch failed'));
        await expect(provider.screen({ name: 'Anyone' }, { http, env: BASE_ENV })).rejects.toBeTruthy();
    });

    test('malformed 2xx body (no responses object) THROWS, not CLEAR', async () => {
        const http = okHttp({ garbage: true });
        await expect(provider.screen({ name: 'Anyone' }, { http, env: BASE_ENV })).rejects.toThrow(/malformed/i);
    });

    test('blank name THROWS at the boundary', async () => {
        await expect(provider.screen({ name: '  ' }, { http: okHttp({}), env: BASE_ENV })).rejects.toThrow(
            /non-empty name/i,
        );
    });

    test('non-URL YENTE_BASE_URL THROWS IntegrationRequiredError (fail-closed config)', async () => {
        const { IntegrationRequiredError } = require('../../IntegrationRequiredError');
        const env = { YENTE_BASE_URL: 'not a url' };
        await expect(provider.screen({ name: 'Anyone' }, { http: okHttp(ofacHit()), env })).rejects.toBeInstanceOf(
            IntegrationRequiredError,
        );
    });

    test('non-http(s) YENTE_BASE_URL THROWS IntegrationRequiredError', async () => {
        const { IntegrationRequiredError } = require('../../IntegrationRequiredError');
        const env = { YENTE_BASE_URL: 'file:///etc/passwd' };
        await expect(provider.screen({ name: 'Anyone' }, { http: okHttp(ofacHit()), env })).rejects.toBeInstanceOf(
            IntegrationRequiredError,
        );
    });
});

describe('openSanctions provider — configurable thresholds + request shaping', () => {
    test('thresholds are configurable via injected env', async () => {
        // Lower confirm threshold so 0.7 becomes a CONFIRMED_MATCH.
        const env = { ...BASE_ENV, SANCTIONS_CONFIRM_THRESHOLD: '0.65', SANCTIONS_POTENTIAL_THRESHOLD: '0.50' };
        const res = await provider.screen({ name: 'Acme' }, { http: okHttp(ofacHit(0.7)), env });
        expect(res.status).toBe(SCREENING_STATUS.CONFIRMED_MATCH);
    });

    test('country is forwarded into the yente query properties', async () => {
        const capture = {};
        await provider.screen({ name: 'Acme', country: 'DE' }, { http: okHttp(ofacHit(), capture), env: BASE_ENV });
        const body = JSON.parse(capture.body);
        expect(body.queries.q.properties.name).toEqual(['Acme']);
        expect(body.queries.q.properties.country).toEqual(['DE']);
        expect(capture.url).toContain('/match/default');
        expect(capture.method).toBe('POST');
    });

    test('omits country when not provided', async () => {
        const capture = {};
        await provider.screen({ name: 'Acme' }, { http: okHttp(ofacHit(), capture), env: BASE_ENV });
        const body = JSON.parse(capture.body);
        expect(body.queries.q.properties.country).toBeUndefined();
    });

    test('schema defaults to LegalEntity, honors person/individual hint', async () => {
        const capPerson = {};
        await provider.screen(
            { name: 'Jane Doe', entityType: 'individual' },
            { http: okHttp(ofacHit(), capPerson), env: BASE_ENV },
        );
        expect(JSON.parse(capPerson.body).queries.q.schema).toBe('Person');

        const capDefault = {};
        await provider.screen({ name: 'Acme Co' }, { http: okHttp(ofacHit(), capDefault), env: BASE_ENV });
        expect(JSON.parse(capDefault.body).queries.q.schema).toBe('LegalEntity');
    });

    test('dataset + API key are applied (hosted-API path)', async () => {
        const capture = {};
        const env = { ...BASE_ENV, SANCTIONS_DATASET: 'sanctions', OPENSANCTIONS_API_KEY: 'secret-key' };
        await provider.screen({ name: 'Acme' }, { http: okHttp(ofacHit(), capture), env });
        expect(capture.url).toContain('/match/sanctions');
        expect(capture.headers.authorization).toBe('ApiKey secret-key');
    });

    test('tenantId forwarded as X-Tenant-ID', async () => {
        const capture = {};
        await provider.screen(
            { name: 'Acme', tenantId: 'tenant-123' },
            { http: okHttp(ofacHit(), capture), env: BASE_ENV },
        );
        expect(capture.headers['x-tenant-id']).toBe('tenant-123');
    });

    test('invalid numeric env config THROWS (fail loud)', async () => {
        const env = { ...BASE_ENV, SANCTIONS_CONFIRM_THRESHOLD: 'not-a-number' };
        await expect(provider.screen({ name: 'Acme' }, { http: okHttp(ofacHit()), env })).rejects.toThrow(
            /invalid numeric config/i,
        );
    });
});

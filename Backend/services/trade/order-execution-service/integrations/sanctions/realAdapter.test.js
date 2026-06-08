'use strict';
/**
 * Unit tests for the real OpenSanctions/yente adapter. NO live network — a fake
 * `http` is injected returning REAL yente /match response shapes, and `env` is
 * injected so we never touch process.env.
 */
const { createRealSanctionsProvider } = require('./realAdapter');
const { SCREENING_STATUS } = require('./contract');
const { IntegrationRequiredError } = require('../IntegrationRequiredError');
const { IntegrationTimeoutError, IntegrationHttpError } = require('../_shared/httpClient');

const CONFIGURED = Object.freeze({ YENTE_BASE_URL: 'http://yente:8000' });

function okHttp(json) {
    return { async request() { return { status: 200, headers: new Map(), json, text: JSON.stringify(json) }; } };
}
function failHttp(err) {
    return { async request() { throw err; } };
}

function ofacHit(score) {
    return {
        responses: {
            q: {
                results: [
                    { id: 'NK-1', caption: 'BLOCKED PERSON', score, datasets: ['us_ofac_sdn'], properties: {} },
                ],
            },
        },
    };
}

describe('createRealSanctionsProvider — interface', () => {
    test('is production-safe and exposes the contract interface', () => {
        const a = createRealSanctionsProvider({ env: {} });
        expect(typeof a.name).toBe('string');
        expect(a.name).toBe('opensanctions-yente');
        expect(a.IS_PRODUCTION_SAFE).toBe(true);
        expect(typeof a.screen).toBe('function');
    });
});

describe('createRealSanctionsProvider — fail-closed when unconfigured', () => {
    test('throws IntegrationRequiredError (NOT a CLEAR) when YENTE_BASE_URL absent', async () => {
        const a = createRealSanctionsProvider({ env: {} });
        await expect(a.screen({ name: 'Acme Trading Co', country: 'DE' })).rejects.toBeInstanceOf(
            IntegrationRequiredError,
        );
    });

    test('the thrown error carries the sanctions domain', async () => {
        const a = createRealSanctionsProvider({ env: {} });
        await a.screen({ name: 'Acme' }).catch((err) => {
            expect(err.code).toBe('INTEGRATION_REQUIRED');
            expect(err.domain).toBe('sanctions');
        });
    });
});

describe('createRealSanctionsProvider — configured delegates to yente', () => {
    test('high-score hit -> CONFIRMED_MATCH', async () => {
        const a = createRealSanctionsProvider({ env: CONFIGURED, http: okHttp(ofacHit(0.97)) });
        const res = await a.screen({ name: 'Blocked Person', country: 'RU' });
        expect(res.status).toBe(SCREENING_STATUS.CONFIRMED_MATCH);
        expect(res.matches[0].listName).toBe('us_ofac_sdn');
    });

    test('mid-score hit -> POTENTIAL_MATCH', async () => {
        const a = createRealSanctionsProvider({ env: CONFIGURED, http: okHttp(ofacHit(0.7)) });
        const res = await a.screen({ name: 'Maybe Co' });
        expect(res.status).toBe(SCREENING_STATUS.POTENTIAL_MATCH);
    });

    test('empty results -> CLEAR confidence 0', async () => {
        const a = createRealSanctionsProvider({ env: CONFIGURED, http: okHttp({ responses: { q: { results: [] } } }) });
        const res = await a.screen({ name: 'Clean Ltd' });
        expect(res.status).toBe(SCREENING_STATUS.CLEAR);
        expect(res.confidence).toBe(0);
        expect(res.matches).toEqual([]);
    });

    test('timeout THROWS, never CLEAR (fail-closed)', async () => {
        const a = createRealSanctionsProvider({ env: CONFIGURED, http: failHttp(new IntegrationTimeoutError('t')) });
        await expect(a.screen({ name: 'Anyone' })).rejects.toBeInstanceOf(IntegrationTimeoutError);
    });

    test('5xx THROWS, never CLEAR (fail-closed)', async () => {
        const a = createRealSanctionsProvider({
            env: CONFIGURED,
            http: failHttp(new IntegrationHttpError('HTTP 503', { status: 503 })),
        });
        await expect(a.screen({ name: 'Anyone' })).rejects.toBeInstanceOf(IntegrationHttpError);
    });
});

'use strict';
/**
 * LIVE integration test — gated on YENTE_BASE_URL. Skipped by default so CI/local
 * runs never hit the network. To exercise it against a real yente instance:
 *
 *   docker run -p 8000:8000 ghcr.io/opensanctions/yente:latest   (+ its ES backend)
 *   YENTE_BASE_URL=http://localhost:8000 npx jest openSanctions.live
 *
 * Screens a well-known, persistently-listed name (Vladimir Putin appears on
 * OFAC/EU/UK lists) and asserts a blocking verdict, plus a CLEAR for an obviously
 * unlisted synthetic name. Real consolidated lists, no commercial license.
 */
const { createRealSanctionsProvider } = require('./realAdapter');
const { SCREENING_STATUS, BLOCKING_STATUSES } = require('./contract');

const gate = process.env.YENTE_BASE_URL ? describe : describe.skip;

gate('OpenSanctions/yente LIVE', () => {
    const provider = createRealSanctionsProvider();

    test('a listed person yields a blocking verdict with match detail', async () => {
        const res = await provider.screen({ name: 'Vladimir Putin', country: 'RU', entityType: 'person' });
        expect(BLOCKING_STATUSES).toContain(res.status);
        expect(res.confidence).toBeGreaterThan(0);
        expect(res.matches.length).toBeGreaterThan(0);
        expect(typeof res.matches[0].listName).toBe('string');
    }, 20000);

    test('an obviously unlisted synthetic name is CLEAR', async () => {
        const res = await provider.screen({ name: 'Zzqx Nonexistent Synthetic Entity 9981', country: 'DE' });
        expect(res.status).toBe(SCREENING_STATUS.CLEAR);
        expect(res.confidence).toBe(0);
    }, 20000);
});

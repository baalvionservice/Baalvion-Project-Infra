'use strict';
/**
 * R8 live integration probe — runs the counterparty guard against a REAL running
 * risk-service. Skips automatically if RISK_SERVICE_URL is unreachable so unit CI
 * stays green; run with the engine up to prove end-to-end blocking:
 *
 *   RISK_SERVICE_URL=http://127.0.0.1:13035 npx jest counterpartyScreening.live
 *
 * Requires a seeded watchlist (the suite ships OFAC/EU/UN/UK seed entities incl.
 * "Viktor Bout"). Uses the screen client directly (no DB/auth needed).
 */
const { screen } = require('./sanctionsClient');
const { screenCounterparties } = require('./counterpartyScreening');

const URL = process.env.RISK_SERVICE_URL || 'http://127.0.0.1:13035';
let reachable = false;

beforeAll(async () => {
    try {
        const r = await screen({ name: 'Acme Trading Co', country: 'US' }, { url: URL, timeoutMs: 4000 });
        reachable = !!r && typeof r.status === 'string';
    } catch { reachable = false; }
});

const itLive = (name, fn) => test(name, async () => {
    if (!reachable) { console.warn(`[skip] risk-service not reachable at ${URL}`); return; }
    await fn();
});

describe('R8 counterparty screening (live risk-service)', () => {
    itLive('clean counterparties -> ALLOW', async () => {
        const r = await screenCounterparties({
            parties: [
                { role: 'buyer', name: 'Acme Trading Co', country: 'US' },
                { role: 'seller', name: 'Globex Industries', country: 'DE' },
            ],
        }, { screenFn: (a) => screen(a, { url: URL }) });
        expect(r.decision).toBe('ALLOW');
    });

    itLive('sanctioned seller (Viktor Bout) -> BLOCK', async () => {
        const r = await screenCounterparties({
            parties: [
                { role: 'buyer', name: 'Acme Trading Co', country: 'US' },
                { role: 'seller', name: 'Viktor Bout', country: 'RU' },
            ],
        }, { screenFn: (a) => screen(a, { url: URL }) });
        expect(r.decision).toBe('BLOCK');
        expect(r.blocked.some((b) => b.party.role === 'seller')).toBe(true);
    });
});

'use strict';
const crypto = require('crypto');
const { openJourney, handOffNewOrder, toJourneyRequest, hasBothParties, sign } = require('./journeyClient');

const ENV = { JOURNEY_TRADE_URL: 'http://trade.test/', JOURNEY_INTERNAL_SECRET: 's3cret' };
const ORDER = { id: '11111111-1111-4111-8111-111111111111', buyer_org_id: 'org-b', seller_org_id: 'org-s', destination_country: 'AE', lines: [{ product_id: 'p', hs_code: '520100' }] };
const reply = (status) => jest.fn(async () => ({ status }));

describe('journeyClient', () => {
    test('signs the exact body it sends, to the internal path', async () => {
        const fetchImpl = reply(201);
        const out = await openJourney(toJourneyRequest(ORDER, { originCountry: 'IN' }), { env: ENV, fetchImpl });
        expect(out).toMatchObject({ ok: true, status: 'opened' });
        const [url, init] = fetchImpl.mock.calls[0];
        expect(url).toBe('http://trade.test/v1/internal/order-journeys');
        const ts = init.headers['x-journey-timestamp'];
        expect(init.headers['x-journey-signature']).toBe(sign('s3cret', ts, init.body));
        expect(JSON.parse(init.body)).toMatchObject({ orderId: ORDER.id, buyerOrgId: 'org-b', sellerOrgId: 'org-s', destinationCountry: 'AE', originCountry: 'IN', hsCode: '520100' });
    });
    test('an existing journey (409) counts as success', async () => {
        expect(await openJourney({}, { env: ENV, fetchImpl: reply(409) })).toMatchObject({ ok: true, status: 'already_open' });
    });
    test('retries a server error, then gives up with the reason', async () => {
        const fetchImpl = reply(503);
        const out = await openJourney({}, { env: ENV, fetchImpl, retries: 3, baseDelayMs: 1 });
        expect(fetchImpl).toHaveBeenCalledTimes(3);
        expect(out).toMatchObject({ ok: false, status: 'failed', error: 'HTTP 503' });
    });
    test('does not retry a refusal (4xx)', async () => {
        const fetchImpl = reply(401);
        expect(await openJourney({}, { env: ENV, fetchImpl, baseDelayMs: 1 })).toMatchObject({ ok: false, status: 'rejected' });
        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });
    test('a network error is retried and never thrown', async () => {
        const fetchImpl = jest.fn()
            .mockRejectedValueOnce(new Error('ECONNREFUSED')).mockResolvedValueOnce({ status: 201 });
        expect(await openJourney({}, { env: ENV, fetchImpl, baseDelayMs: 1 })).toMatchObject({ ok: true, attempts: 2 });
    });
    test('is off without both settings', async () => {
        const fetchImpl = reply(201);
        expect((await openJourney({}, { env: { JOURNEY_TRADE_URL: 'http://x' }, fetchImpl })).status).toBe('disabled');
        expect(fetchImpl).not.toHaveBeenCalled();
    });
    test('only an order with two different organisations gets a journey', async () => {
        expect(hasBothParties(ORDER)).toBe(true);
        expect(hasBothParties({ ...ORDER, seller_org_id: 'org-b' })).toBe(false);
        expect(hasBothParties({ ...ORDER, seller_org_id: null })).toBe(false);
        const fetchImpl = reply(201);
        expect((await handOffNewOrder({ ...ORDER, seller_org_id: null }, {}, { env: ENV, fetchImpl })).status).toBe('skipped');
        expect(fetchImpl).not.toHaveBeenCalled();
    });
    test('the signature is accepted by trade-service\'s own verifier', () => {
        const body = '{"a":1}'; const ts = String(Math.floor(Date.now() / 1000));
        const expected = `sha256=${crypto.createHmac('sha256', 's3cret').update(`${ts}.${body}`).digest('hex')}`;
        expect(sign('s3cret', ts, body)).toBe(expected);
    });
});

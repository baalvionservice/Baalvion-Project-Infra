'use strict';

// Mock the registry + verifier so the Express wrapper test exercises ONLY the fail-closed
// raw-body posture without touching the DB or the real HMAC util.
const mockApply = jest.fn(async () => ({ updated: true, tenantId: 't1', subjectRef: 'org-9' }));
const mockVerify = jest.fn(() => true);
jest.mock('../services/kycRegistry', () => ({ applyWebhookUpdate: (...a) => mockApply(...a) }));
jest.mock('../integrations/kyc/webhook', () => ({
    verifyOnfidoWebhook: (...a) => mockVerify(...a),
    parseOnfidoEvent: (body) => body,
}));

const { handleOnfidoWebhook, mappedStatus, onfidoWebhook } = require('./kycWebhookController');

describe('mappedStatus', () => {
    test('passes through a valid KYC_STATUS; rejects anything else', () => {
        expect(mappedStatus('APPROVED')).toBe('APPROVED');
        expect(mappedStatus('REVIEW')).toBe('REVIEW');
        expect(mappedStatus('clear')).toBeNull();
        expect(mappedStatus(null)).toBeNull();
        expect(mappedStatus(undefined)).toBeNull();
    });
});

describe('handleOnfidoWebhook', () => {
    let apply;
    beforeEach(() => { apply = jest.fn(async () => ({ updated: true, tenantId: 't1', subjectRef: 'org-9' })); });

    test('401 on bad signature; never applies', async () => {
        const out = await handleOnfidoWebhook({}, { verify: () => false, parse: () => ({}), apply });
        expect(out.status).toBe(401);
        expect(apply).not.toHaveBeenCalled();
    });

    test('400 on unparseable body; never applies', async () => {
        const out = await handleOnfidoWebhook({}, { verify: () => true, parse: () => { throw new Error('bad'); }, apply });
        expect(out.status).toBe(400);
        expect(apply).not.toHaveBeenCalled();
    });

    test('200 + apply called with { providerVerificationId, status } on a mapped event', async () => {
        const out = await handleOnfidoWebhook(
            {},
            { verify: () => true, parse: () => ({ objectId: 'wr_1', status: 'APPROVED', reasons: ['clear'] }), apply },
        );
        expect(apply).toHaveBeenCalledWith({ providerVerificationId: 'wr_1', status: 'APPROVED', reasons: ['clear'] });
        expect(out.status).toBe(200);
        expect(out.json).toEqual({ ok: true, status: 'APPROVED', updated: true });
    });

    test('ignored (200, no apply) on a non-mapped status', async () => {
        const out = await handleOnfidoWebhook(
            {},
            { verify: () => true, parse: () => ({ objectId: 'wr_1', status: 'in_progress' }), apply },
        );
        expect(apply).not.toHaveBeenCalled();
        expect(out.status).toBe(200);
        expect(out.json.ignored).toBe(true);
    });

    test('ignored (200, no apply) when objectId is absent', async () => {
        const out = await handleOnfidoWebhook(
            {},
            { verify: () => true, parse: () => ({ objectId: null, status: 'APPROVED' }), apply },
        );
        expect(apply).not.toHaveBeenCalled();
        expect(out.status).toBe(200);
        expect(out.json.ignored).toBe(true);
    });

    test('500 on apply failure so the sender retries (at-least-once)', async () => {
        const applyErr = jest.fn(async () => { throw new Error('db down'); });
        const out = await handleOnfidoWebhook(
            {},
            { verify: () => true, parse: () => ({ objectId: 'wr_1', status: 'APPROVED' }), apply: applyErr },
        );
        expect(out.status).toBe(500);
    });
});

// Fix #1: the Express wrapper must FAIL CLOSED (401) when the raw body is absent — it must never
// fabricate a body via JSON.stringify and verify against it (that would never match Onfido's HMAC).
describe('onfidoWebhook (Express wrapper) — raw-body fail-closed', () => {
    const makeRes = () => {
        const res = {};
        res.status = jest.fn(() => res);
        res.json = jest.fn(() => res);
        return res;
    };

    beforeEach(() => { mockApply.mockClear(); mockVerify.mockClear(); mockVerify.mockReturnValue(true); });

    test('401 + verifier never called when req.rawBody is missing (no fabricated body)', async () => {
        const req = { headers: { 'x-sha2-signature': 'deadbeef' }, body: { payload: { object: { id: 'wr_1', status: 'clear' } } } };
        const res = makeRes();

        await onfidoWebhook(req, res);

        expect(mockVerify).not.toHaveBeenCalled(); // short-circuited before re-serializing a body
        expect(mockApply).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('with a raw body present, verification runs over the EXACT bytes captured', async () => {
        const raw = Buffer.from('{"payload":{"object":{"id":"wr_1","status":"clear"}}}');
        const req = { rawBody: raw, headers: { 'x-sha2-signature': 'sig' }, body: { foo: 1 } };
        await onfidoWebhook(req, makeRes());
        expect(mockVerify).toHaveBeenCalledWith(expect.objectContaining({ rawBody: raw }));
    });
});

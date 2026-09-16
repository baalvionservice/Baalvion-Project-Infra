'use strict';
// KYC/KYB vendor adapter layer (service/verification/kycProviders + providerCheck).
//
// The interface and registry existed but nothing imported them: KYC_PROVIDER=<vendor>
// changed no behaviour and every decision stayed human. These pin the wiring that
// makes a vendor swap real, and the two safety rules that must never bend — no
// provider means MANUAL (never skipped), and a vendor failure is not a verdict.

const crypto = require('crypto');

jest.mock('../models', () => ({
    IdentityVerification: { findOne: jest.fn() },
    CompanyVerification: { findOne: jest.fn() },
}));
jest.mock('../service/verification/identity', () => ({ review: jest.fn(async () => ({})) }));
jest.mock('../service/verification/company', () => ({ reviewCompanyVerification: jest.fn(async () => ({})) }));

const db = require('../models');
const identityService = require('../service/verification/identity');
const registry = require('../service/verification/kycProviders');
const { KycProvider } = registry;
const providerCheck = require('../service/verification/providerCheck');

/** A stand-in vendor. Test-only: shipping one of these would fabricate verdicts. */
class StubProvider extends KycProvider {
    constructor(opts = {}) {
        super({ name: 'stub' });
        this.failSubmit = opts.failSubmit || false;
        this.verdict = opts.verdict || null;
        this.calls = [];
    }
    async submitIdentity(a) {
        this.calls.push(['identity', a]);
        if (this.failSubmit) throw new Error('vendor unreachable');
        return { externalRef: 'VENDOR-ID-1' };
    }
    async submitCompany(c) {
        this.calls.push(['company', c]);
        if (this.failSubmit) throw new Error('vendor unreachable');
        return { externalRef: 'VENDOR-CO-1' };
    }
    parseWebhookVerdict(payload, headers) {
        if (headers && headers['x-bad-signature']) throw new Error('signature mismatch');
        return this.verdict;
    }
}

/** A record double that behaves like a Sequelize instance for update(). */
const rec = (over = {}) => {
    const r = { id: 'REC-1', status: 'submitted', provider_result: {}, ...over };
    r.update = jest.fn(async (fields) => { Object.assign(r, fields); return r; });
    return r;
};

afterEach(() => { delete process.env.KYC_PROVIDER; jest.clearAllMocks(); });

describe('registry / vendor swap', () => {
    test('no KYC_PROVIDER means no active provider — the manual path', () => {
        expect(registry.getActiveProvider()).toBeNull();
    });

    test('an unregistered name is not silently accepted', () => {
        process.env.KYC_PROVIDER = 'a-vendor-nobody-registered';
        expect(registry.getActiveProvider()).toBeNull();
    });

    test('registering an adapter and naming it is the whole swap', () => {
        registry.registerProvider('stub', () => new StubProvider());
        process.env.KYC_PROVIDER = 'stub';
        const p = registry.getActiveProvider();
        expect(p).toBeInstanceOf(KycProvider);
        expect(p.name).toBe('stub');
        expect(registry.supportedProviders()).toContain('stub');
    });

    test('the base interface cannot itself be used as a provider', () => {
        expect(() => new KycProvider({})).toThrow(/abstract/i);
    });
});

describe('submission dispatch', () => {
    test('with no provider the record is untouched and stays in the human queue', async () => {
        const r = rec();
        const out = await providerCheck.dispatch('identity', r, { recordId: 'REC-1' });
        expect(out.dispatched).toBe(false);
        expect(r.update).not.toHaveBeenCalled();
        expect(r.status).toBe('submitted');
    });

    test('with a provider the case is handed over and the vendor reference stored', async () => {
        const stub = new StubProvider();
        registry.registerProvider('stub', stub);
        process.env.KYC_PROVIDER = 'stub';

        const r = rec();
        const out = await providerCheck.dispatch('identity', r, { recordId: 'REC-1', fullName: 'Ada Lovelace' });
        expect(out).toMatchObject({ dispatched: true, provider: 'stub', externalRef: 'VENDOR-ID-1' });
        expect(r.provider_name).toBe('stub');
        expect(r.provider_ref).toBe('VENDOR-ID-1');
        expect(r.status).toBe('under_review');
        expect(stub.calls[0][0]).toBe('identity');
    });

    test('a vendor failure falls back to manual and is NEVER a pass', async () => {
        registry.registerProvider('stub', new StubProvider({ failSubmit: true }));
        process.env.KYC_PROVIDER = 'stub';

        const r = rec();
        const out = await providerCheck.dispatch('company', r, { recordId: 'REC-1' });
        expect(out.dispatched).toBe(false);
        expect(out.error).toMatch(/unreachable/);
        expect(r.status).toBe('submitted');          // still the human queue
        expect(r.provider_ref).toBeUndefined();      // nothing to poll, nothing claimed
        expect(r.provider_result).toMatchObject({ submitted: false });
    });
});

describe('webhook verdicts', () => {
    beforeEach(() => { process.env.KYC_PROVIDER = 'stub'; });

    test('a forged callback throws so the route can answer 401', async () => {
        registry.registerProvider('stub', new StubProvider({ verdict: { externalRef: 'X', kind: 'identity', decision: 'approved' } }));
        await expect(providerCheck.applyWebhook({
            providerName: 'stub', payload: {}, headers: { 'x-bad-signature': '1' }, db,
        })).rejects.toThrow(/signature/i);
    });

    test('a progress event is not a decision', async () => {
        registry.registerProvider('stub', new StubProvider({ verdict: { externalRef: 'VENDOR-ID-1', kind: 'identity', decision: 'pending' } }));
        const out = await providerCheck.applyWebhook({ providerName: 'stub', payload: {}, headers: {}, db });
        expect(out.applied).toBe(false);
        expect(identityService.review).not.toHaveBeenCalled();
    });

    test('an approval routes through the real state machine, not a direct write', async () => {
        registry.registerProvider('stub', new StubProvider({ verdict: { externalRef: 'VENDOR-ID-1', kind: 'identity', decision: 'approved', reason: null } }));
        const r = rec({ status: 'under_review' });
        db.IdentityVerification.findOne.mockResolvedValue(r);

        const out = await providerCheck.applyWebhook({ providerName: 'stub', payload: {}, headers: {}, db });
        expect(out).toMatchObject({ applied: true, kind: 'identity', decision: 'approved' });
        // Going through review() is what makes expiry, checklist rollup and the badge fire.
        expect(identityService.review).toHaveBeenCalledWith(expect.objectContaining({
            decision: 'approved', reviewedBy: 'provider:stub',
        }));
    });

    test('a callback for an already-decided record is ignored, not re-applied', async () => {
        registry.registerProvider('stub', new StubProvider({ verdict: { externalRef: 'VENDOR-ID-1', kind: 'identity', decision: 'rejected' } }));
        db.IdentityVerification.findOne.mockResolvedValue(rec({ status: 'approved' }));
        const out = await providerCheck.applyWebhook({ providerName: 'stub', payload: {}, headers: {}, db });
        expect(out.applied).toBe(false);
        expect(out.reason).toMatch(/already decided/);
        expect(identityService.review).not.toHaveBeenCalled();
    });

    test('a callback naming a different vendor than the active one is refused', async () => {
        registry.registerProvider('stub', new StubProvider({ verdict: { externalRef: 'X', kind: 'identity', decision: 'approved' } }));
        const out = await providerCheck.applyWebhook({ providerName: 'someone-else', payload: {}, headers: {}, db });
        expect(out.applied).toBe(false);
        expect(out.reason).toMatch(/someone-else/);
    });
});

describe('sumsub adapter', () => {
    const { SumsubProvider } = require('../service/verification/kycProviders/sumsubProvider');
    const secret = 'webhook-secret';
    const provider = () => new SumsubProvider({ appToken: 't', secretKey: 's', webhookSecret: secret });

    const signed = (body) => ({
        raw: body,
        headers: {
            'x-payload-digest': crypto.createHmac('sha256', secret).update(body).digest('hex'),
            'x-payload-digest-alg': 'HMAC_SHA256_HEX',
        },
    });

    test('it refuses to construct without credentials', () => {
        expect(() => new SumsubProvider({ appToken: null, secretKey: null })).toThrow(/SUMSUB_APP_TOKEN/);
    });

    test('a correctly signed GREEN review is an approval', () => {
        const body = JSON.stringify({ applicantId: 'A1', type: 'applicantReviewed', levelName: 'basic-kyc-level', reviewResult: { reviewAnswer: 'GREEN' } });
        const { headers } = signed(body);
        const v = provider().parseWebhookVerdict(JSON.parse(body), headers, body);
        expect(v).toMatchObject({ externalRef: 'A1', kind: 'identity', decision: 'approved' });
    });

    test('RED is a rejection, and the KYB level routes to the company track', () => {
        const body = JSON.stringify({ applicantId: 'A2', type: 'applicantReviewed', levelName: 'basic-kyb-level', reviewResult: { reviewAnswer: 'RED', moderationComment: 'documents unreadable' } });
        const { headers } = signed(body);
        const v = provider().parseWebhookVerdict(JSON.parse(body), headers, body);
        expect(v).toMatchObject({ kind: 'company', decision: 'rejected', reason: 'documents unreadable' });
    });

    test('a tampered body fails the signature', () => {
        const body = JSON.stringify({ applicantId: 'A3', type: 'applicantReviewed', reviewResult: { reviewAnswer: 'GREEN' } });
        const { headers } = signed(body);
        const tampered = body.replace('A3', 'A4');
        expect(() => provider().parseWebhookVerdict(JSON.parse(tampered), headers, tampered)).toThrow(/signature mismatch/);
    });

    test('an unsigned callback is refused outright', () => {
        expect(() => provider().parseWebhookVerdict({ applicantId: 'A5' }, {}, '{}')).toThrow(/missing X-Payload-Digest/);
    });
});

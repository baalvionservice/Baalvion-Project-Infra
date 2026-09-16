'use strict';
// KYC/KYB gating (service/verification/gate.js).
//
// Before this existed, verification was a form that filled a table and permitted
// nothing: an account that had never submitted KYC could book a container and bind
// a policy that charges a real premium. These pin the level ladder, the expiry
// behaviour, and the id-shape trap that would otherwise make the gate resolve the
// wrong organization.

jest.mock('../models', () => ({
    Organization: { findByPk: jest.fn(), findOne: jest.fn() },
    IdentityVerification: { count: jest.fn(async () => 0) },
    CompanyVerification: { count: jest.fn(async () => 0) },
}));

const db = require('../models');
const gate = require('../service/verification/gate');

const org = (over = {}) => ({ id: 1, tenant_id: 'tenant-uuid', verified_badge: false, ...over });

beforeEach(() => {
    [db.Organization.findByPk, db.Organization.findOne, db.IdentityVerification.count, db.CompanyVerification.count]
        .forEach((m) => m.mockReset());
    db.Organization.findByPk.mockResolvedValue(null);
    db.Organization.findOne.mockResolvedValue(org());
    db.IdentityVerification.count.mockResolvedValue(0);
    db.CompanyVerification.count.mockResolvedValue(0);
});

describe('verification level ladder', () => {
    test('nothing approved is level none, and says what is missing', async () => {
        const s = await gate.levelFor({ tenantId: 'tenant-uuid' });
        expect(s.level).toBe('none');
        expect(s.reasons.join(' ')).toMatch(/identity verification/i);
        expect(s.reasons.join(' ')).toMatch(/company verification/i);
    });

    test('approved KYC alone reaches identity, not business', async () => {
        db.IdentityVerification.count.mockResolvedValue(1);
        const s = await gate.levelFor({ tenantId: 'tenant-uuid' });
        expect(s.level).toBe('identity');
        expect(s.identity).toBe(true);
        expect(s.business).toBe(false);
    });

    test('KYC + KYB reaches business', async () => {
        db.IdentityVerification.count.mockResolvedValue(1);
        db.CompanyVerification.count.mockResolvedValue(1);
        const s = await gate.levelFor({ tenantId: 'tenant-uuid' });
        expect(s.level).toBe('business');
    });

    test('the verified badge is what makes it full', async () => {
        db.IdentityVerification.count.mockResolvedValue(1);
        db.CompanyVerification.count.mockResolvedValue(1);
        db.Organization.findOne.mockResolvedValue(org({ verified_badge: true }));
        const s = await gate.levelFor({ tenantId: 'tenant-uuid' });
        expect(s.level).toBe('full');
        expect(s.reasons).toEqual([]);
    });

    test('an account with no organization cannot reach any level', async () => {
        db.Organization.findOne.mockResolvedValue(null);
        const s = await gate.levelFor({ tenantId: 'tenant-uuid' });
        expect(s.level).toBe('none');
        expect(s.orgId).toBeNull();
        expect(s.reasons[0]).toMatch(/no organization/i);
    });
});

describe('organization resolution', () => {
    test('a UUID orgId is resolved by tenant, never as a primary key', async () => {
        // req.auth.orgId is the auth-service org UUID; trade.organizations.id is an
        // INTEGER. Looking it up as a PK is the mistake that would silently gate the
        // wrong company — or nobody.
        await gate.levelFor({ orgId: '48053c3c-a813-44e6-88b0-21f143f8a43d' });
        expect(db.Organization.findByPk).not.toHaveBeenCalled();
        expect(db.Organization.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ where: { tenant_id: '48053c3c-a813-44e6-88b0-21f143f8a43d' } }),
        );
    });

    test('a numeric orgId is accepted as the primary key it is', async () => {
        db.Organization.findByPk.mockResolvedValue(org());
        await gate.levelFor({ orgId: 7 });
        expect(db.Organization.findByPk).toHaveBeenCalledWith(7);
    });
});

describe('expiry', () => {
    test('identity is only counted while unexpired', async () => {
        db.IdentityVerification.count.mockResolvedValue(1);
        await gate.levelFor({ tenantId: 'tenant-uuid' });
        const where = db.IdentityVerification.count.mock.calls[0][0].where;
        expect(where.status).toBe('approved');
        // An Op.or over expires_at is what excludes a lapsed KYC refresh cycle.
        expect(Object.getOwnPropertySymbols(where).length).toBeGreaterThan(0);
    });
});

describe('meets()', () => {
    test('a lower level does not satisfy a higher requirement', async () => {
        db.IdentityVerification.count.mockResolvedValue(1);
        const s = await gate.meets('business', { tenantId: 'tenant-uuid' });
        expect(s.ok).toBe(false);
        expect(s.required).toBe('business');
        expect(s.level).toBe('identity');
    });

    test('a higher level satisfies a lower requirement', async () => {
        db.IdentityVerification.count.mockResolvedValue(1);
        db.CompanyVerification.count.mockResolvedValue(1);
        db.Organization.findOne.mockResolvedValue(org({ verified_badge: true }));
        expect((await gate.meets('identity', { tenantId: 'tenant-uuid' })).ok).toBe(true);
    });
});

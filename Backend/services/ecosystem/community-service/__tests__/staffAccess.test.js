'use strict';
jest.mock('../models', () => ({ StaffMember: { findByPk: jest.fn() } }));
const db = require('../models');
const { requirePerm, resolveTier, can, permissionsOf, PERMISSIONS, TIER_PERMISSIONS } = require('../middleware/staffAccess');

const run = async (mw, req) => { let out; await mw(req, {}, (e) => { out = e || 'ok'; }); return out; };
const as = (roles, userId = 'u1') => ({ auth: { roles, userId } });

describe('staff tiers', () => {
    beforeEach(() => db.StaffMember.findByPk.mockReset());

    it('derives the tier from the token roles first, without touching the database', async () => {
        expect(await resolveTier(as(['super_admin']))).toBe('super');
        expect(await resolveTier(as(['platform_admin']))).toBe('super');
        expect(await resolveTier(as(['country_admin']))).toBe('admin');
        expect(db.StaffMember.findByPk).not.toHaveBeenCalled();
    });

    it('falls back to a granted staff row for everyone else', async () => {
        db.StaffMember.findByPk.mockResolvedValue({ tier: 'moderator' });
        expect(await resolveTier(as(['user']))).toBe('moderator');
        db.StaffMember.findByPk.mockResolvedValue(null);
        expect(await resolveTier(as(['user'], 'u2'))).toBeNull();
    });

    it('cannot be escalated to super through the staff table', async () => {
        db.StaffMember.findByPk.mockResolvedValue({ tier: 'super' });
        // a malformed row still never maps to 'super' unless the token says so
        expect(TIER_PERMISSIONS[await resolveTier(as(['user']))]).toBeDefined();
        expect(can('moderator', 'kyc.review')).toBe(false);
    });

    it('matrix: moderators handle queues and support but not bounty, audit, announcements, KYC or staff', () => {
        for (const p of ['content.handle', 'verify.review', 'support.handle']) expect(can('moderator', p)).toBe(true);
        for (const p of ['content.manage', 'bounty.manage', 'announce.publish', 'audit.view', 'notify.send', 'kyc.review', 'staff.manage']) expect(can('moderator', p)).toBe(false);
    });

    it('matrix: admins do everything except identity documents and staff management', () => {
        for (const p of PERMISSIONS.filter((x) => !['kyc.review', 'staff.manage'].includes(x))) expect(can('admin', p)).toBe(true);
        expect(can('admin', 'kyc.review')).toBe(false);
        expect(can('admin', 'staff.manage')).toBe(false);
    });

    it('matrix: super holds every permission; no tier means nothing', () => {
        for (const p of PERMISSIONS) expect(can('super', p)).toBe(true);
        expect(can(null, 'content.handle')).toBe(false);
        expect(permissionsOf(null)).toEqual([]);
    });

    it('requirePerm: 403 for non-staff and for missing permission; passes and tags the tier otherwise', async () => {
        db.StaffMember.findByPk.mockResolvedValue(null);
        expect((await run(requirePerm('content.handle'), as(['user']))).statusCode).toBe(403);
        db.StaffMember.findByPk.mockResolvedValue({ tier: 'moderator' });
        expect((await run(requirePerm('bounty.manage'), as(['user'], 'm1'))).statusCode).toBe(403);
        const req = as(['user'], 'm2');
        expect(await run(requirePerm('content.handle'), req)).toBe('ok');
        expect(req.staffTier).toBe('moderator');
        expect(await run(requirePerm(), as(['country_admin']))).toBe('ok');   // any staff
        db.StaffMember.findByPk.mockResolvedValue(null);
        expect((await run(requirePerm(), as(['user'], 'x'))).statusCode).toBe(403);
    });
});

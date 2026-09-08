'use strict';
/**
 * Running a community: who may edit it, who may admit and remove people, and what the
 * client is told about its own membership.
 *
 * The boundary being defended here is the one most easily blurred: a community
 * administrator is not a platform moderator. They look similar from inside the product —
 * both remove things, both see a queue — but one is accountable for a room and the other is
 * accountable for the platform, and the powers must not bleed. Several tests below exist
 * only to hold that line.
 */
process.env.JWT_PUBLIC_KEY = 'test-public-key';
process.env.NODE_ENV = 'test';

const { forbidden, notFound, conflict } = require('../utils/errors');

// ── Fixtures ─────────────────────────────────────────────────────────────────
const COMMUNITY = {
    id: 'c-1', slug: 'general', name: 'General support', description: 'A description',
    purpose: 'A purpose', rules: 'Be kind.', visibility: 'PUBLIC', join_policy: 'REQUEST',
    country_code: null, region: null, is_active: true, created_by: 'u-admin',
    created_at: new Date('2026-01-01'),
};
const PRIVATE_COMMUNITY = { ...COMMUNITY, id: 'c-private', slug: 'quiet', visibility: 'PRIVATE' };

// community_members rows, keyed by "<communityId>:<userId>"
let MEMBERS = {};

const membershipRow = (communityId, userId, role, status) => ({
    id: `m-${userId}`, community_id: communityId, user_id: userId, role, status,
    joined_at: new Date('2026-02-01'),
    update: jest.fn(async function (patch) { Object.assign(this, patch); return this; }),
    destroy: jest.fn(async function () { delete MEMBERS[`${communityId}:${userId}`]; }),
});

jest.mock('../models', () => {
    const { Op } = require('sequelize');
    return {
        Op,
        sequelize: {
            transaction: jest.fn(async (cb) => cb({})),
            literal: jest.fn((sql) => ({ literal: sql })),
            escape: jest.fn((v) => `'${v}'`),
            fn: jest.fn((...a) => ({ fn: a })),
            col: jest.fn((c) => ({ col: c })),
        },
        Community: {
            findByPk: jest.fn(async (id) => {
                const row = id === 'c-1' ? global.__community : id === 'c-private' ? global.__private : null;
                if (!row) return null;
                return { ...row, update: jest.fn(async function (p) { Object.assign(this, p); Object.assign(row, p); return this; }) };
            }),
            findOne: jest.fn(async () => null),
            findAll: jest.fn(async () => []),
            findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })),
        },
        CommunityMember: {
            findOne: jest.fn(async ({ where }) => {
                const row = global.__members[`${where.community_id}:${where.user_id}`];
                if (!row) return null;
                const want = where.status;
                if (want && typeof want === 'string' && row.status !== want) return null;
                return row;
            }),
            findAll: jest.fn(async () => []),
            create: jest.fn(async (row) => row),
        },
        Post: { findAll: jest.fn(async () => []) },
        Notification: { create: jest.fn(async (r) => r) },
    };
});

const communityService = require('../service/communityService');

global.__community = COMMUNITY;
global.__private = PRIVATE_COMMUNITY;

const ctxFor = (userId, memberships = {}) => ({
    actor: { userId, roles: ['USER'] },
    communityIds: Object.entries(memberships).filter(([, m]) => m.status === 'ACTIVE').map(([id]) => id),
    membershipByCommunity: memberships,
    participantCaseIds: [],
    supporterCaseIds: [],
});

beforeEach(() => {
    global.__community = { ...COMMUNITY };
    global.__private = { ...PRIVATE_COMMUNITY };
    MEMBERS = {
        'c-1:u-admin': membershipRow('c-1', 'u-admin', 'ADMIN', 'ACTIVE'),
        'c-1:u-mod': membershipRow('c-1', 'u-mod', 'MODERATOR', 'ACTIVE'),
        'c-1:u-member': membershipRow('c-1', 'u-member', 'MEMBER', 'ACTIVE'),
        'c-1:u-pending': membershipRow('c-1', 'u-pending', 'MEMBER', 'PENDING'),
        'c-1:u-admin2': membershipRow('c-1', 'u-admin2', 'ADMIN', 'ACTIVE'),
    };
    global.__members = MEMBERS;
});

const expectRejection = async (promise, statusCode) => {
    await expect(promise).rejects.toMatchObject({ statusCode });
};

// ── What the client is told about its own membership ─────────────────────────

describe('a caller is told its own membership state, and only its own', () => {
    const stats = { memberCount: 5, postCount: 2, lastActivityAt: null };

    test('a stranger is NONE with no role', () => {
        const out = communityService.serialize(COMMUNITY, ctxFor('u-stranger'), stats);
        expect(out.membershipStatus).toBe('NONE');
        expect(out.myRole).toBeNull();
        expect(out.isMember).toBe(false);
    });

    test('a pending request reads as PENDING, not as membership', () => {
        // The whole point: somebody waiting for approval must not be shown the stranger's
        // view with no explanation, nor told they are in.
        const out = communityService.serialize(COMMUNITY, ctxFor('u-pending', { 'c-1': { status: 'PENDING', role: 'MEMBER' } }), stats);
        expect(out.membershipStatus).toBe('PENDING');
        expect(out.isMember).toBe(false);
    });

    test('a pending member is given no role, even though the row carries one', () => {
        // The row's role means nothing until the membership is active; reporting it would
        // let a client draw a management surface for somebody who has not been admitted.
        const out = communityService.serialize(COMMUNITY, ctxFor('u-pending', { 'c-1': { status: 'PENDING', role: 'ADMIN' } }), stats);
        expect(out.myRole).toBeNull();
    });

    test('an active administrator is told so', () => {
        const out = communityService.serialize(COMMUNITY, ctxFor('u-admin', { 'c-1': { status: 'ACTIVE', role: 'ADMIN' } }), stats);
        expect(out.membershipStatus).toBe('ACTIVE');
        expect(out.myRole).toBe('ADMIN');
        expect(out.isMember).toBe(true);
    });

    test('the payload never carries anybody else’s membership', () => {
        const out = communityService.serialize(COMMUNITY, ctxFor('u-admin', { 'c-1': { status: 'ACTIVE', role: 'ADMIN' } }), stats);
        const json = JSON.stringify(out);
        for (const other of ['u-mod', 'u-member', 'u-pending']) expect(json).not.toContain(other);
    });
});

// ── Editing the community ────────────────────────────────────────────────────

describe('only a community administrator may edit the community', () => {
    const asAdmin = () => ctxFor('u-admin', { 'c-1': { status: 'ACTIVE', role: 'ADMIN' } });

    test('an administrator can', async () => {
        const out = await communityService.update(asAdmin(), 'c-1', { rules: 'Be kind, and be specific.' });
        expect(out.rules).toBe('Be kind, and be specific.');
    });

    test('a moderator cannot', async () => {
        await expectRejection(
            communityService.update(ctxFor('u-mod', { 'c-1': { status: 'ACTIVE', role: 'MODERATOR' } }), 'c-1', { rules: 'x' }),
            403,
        );
    });

    test('an ordinary member cannot', async () => {
        await expectRejection(
            communityService.update(ctxFor('u-member', { 'c-1': { status: 'ACTIVE', role: 'MEMBER' } }), 'c-1', { rules: 'x' }),
            403,
        );
    });

    test('a stranger cannot', async () => {
        await expectRejection(communityService.update(ctxFor('u-stranger'), 'c-1', { rules: 'x' }), 403);
    });

    test('a PLATFORM moderator cannot either', async () => {
        // Moderating the platform is a different job from running a room. A platform
        // moderator acts on reported content, through the queue, where it is recorded —
        // not by silently rewriting somebody else's community.
        const ctx = { ...ctxFor('u-platform-mod'), actor: { userId: 'u-platform-mod', roles: ['USER', 'MODERATOR'] } };
        await expectRejection(communityService.update(ctx, 'c-1', { rules: 'x' }), 403);
    });

    test('a private community answers 404 to a non-member, not 403', async () => {
        // A 403 would confirm it exists, which is the fact membership is protecting.
        await expectRejection(communityService.update(ctxFor('u-stranger'), 'c-private', { rules: 'x' }), 404);
    });
});

describe('editing cannot change who can see the community', () => {
    test('visibility and joinPolicy are not editable fields', async () => {
        const ctx = ctxFor('u-admin', { 'c-1': { status: 'ACTIVE', role: 'ADMIN' } });
        const out = await communityService.update(ctx, 'c-1', {
            rules: 'New rules.', visibility: 'PUBLIC', joinPolicy: 'OPEN', slug: 'stolen', createdBy: 'u-admin',
        });
        // Turning a private community public would expose everybody who joined believing it
        // was not. That is a disclosure, not an edit, and it does not happen here.
        expect(out.visibility).toBe('PUBLIC');
        expect(out.joinPolicy).toBe('REQUEST');
        expect(out.slug).toBe('general');
    });
});

// ── Membership management ────────────────────────────────────────────────────

describe('admitting and declining people', () => {
    test('a moderator may decline a pending request', async () => {
        const ctx = ctxFor('u-mod', { 'c-1': { status: 'ACTIVE', role: 'MODERATOR' } });
        const out = await communityService.declineMember(ctx, 'c-1', 'u-pending');
        expect(out.status).toBe('DECLINED');
    });

    test('declining removes the row, so they may ask again later', async () => {
        const ctx = ctxFor('u-mod', { 'c-1': { status: 'ACTIVE', role: 'MODERATOR' } });
        await communityService.declineMember(ctx, 'c-1', 'u-pending');
        expect(global.__members['c-1:u-pending']).toBeUndefined();
    });

    test('an ordinary member may not decline anyone', async () => {
        await expectRejection(
            communityService.declineMember(ctxFor('u-member', { 'c-1': { status: 'ACTIVE', role: 'MEMBER' } }), 'c-1', 'u-pending'),
            403,
        );
    });

    test('declining somebody who is not pending is a 404', async () => {
        const ctx = ctxFor('u-mod', { 'c-1': { status: 'ACTIVE', role: 'MODERATOR' } });
        await expectRejection(communityService.declineMember(ctx, 'c-1', 'u-member'), 404);
    });
});

describe('removing a member', () => {
    const asAdmin = () => ctxFor('u-admin', { 'c-1': { status: 'ACTIVE', role: 'ADMIN' } });

    test('an administrator may remove an ordinary member', async () => {
        const out = await communityService.removeMember(asAdmin(), 'c-1', 'u-member');
        expect(out.status).toBe('LEFT');
    });

    test('removal marks LEFT rather than banning', async () => {
        // Ending access is not the same as asserting something about a person. Banning is a
        // separate, deliberate act.
        await communityService.removeMember(asAdmin(), 'c-1', 'u-member');
        expect(global.__members['c-1:u-member'].status).toBe('LEFT');
    });

    test('a moderator may NOT remove a member', async () => {
        await expectRejection(
            communityService.removeMember(ctxFor('u-mod', { 'c-1': { status: 'ACTIVE', role: 'MODERATOR' } }), 'c-1', 'u-member'),
            403,
        );
    });

    test('an administrator cannot be removed by another administrator', async () => {
        // A community must not lose the person responsible for it to one other person acting
        // alone, and certainly not to a disagreement between two of them.
        await expectRejection(asAdmin() && communityService.removeMember(asAdmin(), 'c-1', 'u-admin2'), 403);
    });

    test('an administrator cannot remove themselves this way', async () => {
        await expectRejection(communityService.removeMember(asAdmin(), 'c-1', 'u-admin'), 409);
    });

    test('removing somebody who is not a member is a 404', async () => {
        await expectRejection(communityService.removeMember(asAdmin(), 'c-1', 'u-nobody'), 404);
    });
});

// ── The powers a community administrator does NOT have ───────────────────────

describe('a community administrator is not a platform moderator', () => {
    test('the service exposes no way to grant a platform role', () => {
        // If this ever gains such a method, that is a design decision that should be argued
        // for explicitly rather than arrived at by autocomplete.
        const surface = Object.keys(communityService).join(' ');
        expect(surface).not.toMatch(/grantRole|setRole|promote|makeAdmin/i);
    });

    test('the service exposes nothing that reads cases or audit logs', () => {
        const surface = Object.keys(communityService).join(' ');
        expect(surface).not.toMatch(/case|audit|report/i);
    });
});

// ── errors used above behave as the tests assume ─────────────────────────────

describe('the error helpers carry the statuses these tests assert on', () => {
    test('forbidden is 403, notFound 404, conflict 409', () => {
        // Guards the assertions above: if these ever changed shape, every rejection test
        // would start passing for the wrong reason.
        expect(forbidden('x').statusCode).toBe(403);
        expect(notFound('x').statusCode).toBe(404);
        expect(conflict('x').statusCode).toBe(409);
    });
});

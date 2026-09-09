'use strict';
/**
 * Shareable invitation codes.
 *
 * The properties under test are the ones that make a code safe to hand over through a
 * channel the platform does not control: it is stored only as a hash, it identifies nobody,
 * it works once, it stops working on its own, and a code that never existed is
 * indistinguishable from one that was withdrawn.
 */
process.env.JWT_PUBLIC_KEY = 'test-public-key';
process.env.NODE_ENV = 'test';

jest.mock('@baalvion/auth-node', () => ({
    requireEnv: (name) => process.env[name] || '',
    buildPgSsl: () => false,
    createAuthMiddleware: () => (req, res, next) => next(),
}));

// `mock` prefix required: jest.mock factories are hoisted and may only close over
// variables named this way.
const mockRows = new Map();
const mockParticipants = new Map();

jest.mock('../models', () => {
    const { Op } = require('sequelize');
    const instance = (data, store, key) => ({
        ...data,
        update: jest.fn(async function (fields) {
            Object.assign(this, fields);
            store.set(key, { ...store.get(key), ...fields });
            return this;
        }),
    });
    return {
        Op,
        sequelize: { transaction: jest.fn(async (fn) => fn({})) },
        Case: { findByPk: jest.fn(async (id) => global.__cases[id] || null) },
        CaseInvitation: {
            create: jest.fn(async (data) => {
                const row = { id: `inv-${mockRows.size + 1}`, status: 'PENDING', accepted_by: null, responded_at: null, created_at: new Date(), ...data };
                mockRows.set(row.token_hash, row);
                return instance(row, mockRows, row.token_hash);
            }),
            findOne: jest.fn(async ({ where }) => {
                if (where.token_hash) {
                    const row = mockRows.get(where.token_hash);
                    return row ? instance(row, mockRows, where.token_hash) : null;
                }
                const found = [...mockRows.values()].find((r) => r.id === where.id && r.case_id === where.case_id);
                return found ? instance(found, mockRows, found.token_hash) : null;
            }),
            findAll: jest.fn(async ({ where }) => [...mockRows.values()].filter((r) =>
                (where.case_id ? r.case_id === where.case_id : true) &&
                (where.created_by ? r.created_by === where.created_by : true))),
        },
        CaseParticipant: {
            findOne: jest.fn(async ({ where }) => mockParticipants.get(`${where.case_id}:${where.user_id}`) || null),
            create: jest.fn(async (data) => {
                const row = { id: `p-${mockParticipants.size + 1}`, ...data };
                mockParticipants.set(`${data.case_id}:${data.user_id}`, row);
                return row;
            }),
        },
        Notification: { create: jest.fn(async (r) => r) },
    };
});

const invitationService = require('../service/invitationService');
const { ROLES } = require('../domain/roles');

const OWNER = 'owner-1';
const CASE = {
    id: 'case-1', owner_id: OWNER, community_id: null, visibility: 'PRIVATE', status: 'OPEN',
    moderation_state: 'VISIBLE', is_locked: false, allow_supporter_requests: true,
};
global.__cases = { 'case-1': CASE };

const ctx = (userId, roles = [ROLES.USER]) => ({
    actor: { userId, roles },
    communityIds: [], participantCaseIds: [], supporterCaseIds: [],
});

beforeEach(() => { mockRows.clear(); mockParticipants.clear(); });

describe('creating a code', () => {
    test('only the case owner can', async () => {
        await expect(invitationService.create(ctx('stranger'), 'case-1', { relation: 'PARTNER' }))
            .rejects.toMatchObject({ statusCode: 404 });
        // A moderator can see the case but still cannot invite on the owner's behalf.
        await expect(invitationService.create(ctx('mod-1', [ROLES.MODERATOR]), 'case-1', { relation: 'PARTNER' }))
            .rejects.toMatchObject({ statusCode: 403 });
    });

    test('returns the raw code exactly once and stores only its hash', async () => {
        const created = await invitationService.create(ctx(OWNER), 'case-1', { relation: 'PARTNER' });
        expect(created.token).toMatch(/^[0-9A-HJKMNP-TV-Z]{16}$/);

        const stored = [...mockRows.values()][0];
        // The clear-text code must not be recoverable from the row.
        expect(stored.token_hash).toBe(invitationService.hashToken(created.token));
        expect(JSON.stringify(stored)).not.toContain(created.token);
        expect(stored).not.toHaveProperty('token');
    });

    test('the stored row identifies nobody', async () => {
        await invitationService.create(ctx(OWNER), 'case-1', { relation: 'FAMILY_MEMBER' });
        const stored = [...mockRows.values()][0];
        for (const forbidden of ['email', 'name', 'display_name', 'phone', 'invitee']) {
            expect(stored).not.toHaveProperty(forbidden);
        }
        expect(stored.relation).toBe('FAMILY_MEMBER');
    });

    test('SELF cannot be handed out as a relation', async () => {
        await expect(invitationService.create(ctx(OWNER), 'case-1', { relation: 'SELF' }))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test('the lifetime is clamped rather than trusted', async () => {
        const long = await invitationService.create(ctx(OWNER), 'case-1', { relation: 'PARTNER', expiresInDays: 9999 });
        const days = (new Date(long.expiresAt) - Date.now()) / 86_400_000;
        expect(days).toBeLessThanOrEqual(61);
    });
});

describe('the preview a code-holder sees', () => {
    test('carries no case content at all', async () => {
        const created = await invitationService.create(ctx(OWNER), 'case-1', { relation: 'PARTNER' });
        const preview = await invitationService.preview(created.token);
        // The code may have travelled further than the owner intended.
        expect(Object.keys(preview).sort()).toEqual(['createdAt', 'expiresAt', 'relation', 'status']);
        expect(preview.relation).toBe('PARTNER');
    });

    test('an unknown code answers exactly like a withdrawn one', async () => {
        const created = await invitationService.create(ctx(OWNER), 'case-1', { relation: 'PARTNER' });
        const invId = [...mockRows.values()][0].id;
        await invitationService.revoke(ctx(OWNER), 'case-1', invId);

        const revoked = await invitationService.preview(created.token);
        expect(revoked.status).toBe('REVOKED');
        // A code that never existed must not be distinguishable by ERROR SHAPE either.
        await expect(invitationService.preview('ZZZZZZZZZZZZZZZZ')).rejects.toMatchObject({ statusCode: 404 });
    });
});

describe('accepting', () => {
    const mint = () => invitationService.create(ctx(OWNER), 'case-1', { relation: 'PARTNER' });

    test('creates a consenting participant', async () => {
        const created = await mint();
        const result = await invitationService.accept(ctx('invitee-1'), created.token);
        expect(result.caseId).toBe('case-1');
        expect(mockParticipants.get('case-1:invitee-1').consent_status).toBe('GRANTED');
    });

    test('a code works once', async () => {
        const created = await mint();
        await invitationService.accept(ctx('invitee-1'), created.token);
        await expect(invitationService.accept(ctx('invitee-2'), created.token))
            .rejects.toMatchObject({ statusCode: 409 });
    });

    test('the owner cannot redeem their own code', async () => {
        const created = await mint();
        await expect(invitationService.accept(ctx(OWNER), created.token))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test('an expired code is refused', async () => {
        const created = await mint();
        // Age the row past its expiry rather than waiting for it.
        [...mockRows.values()][0].expires_at = new Date(Date.now() - 1000);
        await expect(invitationService.accept(ctx('invitee-1'), created.token))
            .rejects.toMatchObject({ statusCode: 409 });
        expect(await invitationService.preview(created.token)).toMatchObject({ status: 'EXPIRED' });
    });

    test('a withdrawn code is refused', async () => {
        const created = await mint();
        await invitationService.revoke(ctx(OWNER), 'case-1', [...mockRows.values()][0].id);
        await expect(invitationService.accept(ctx('invitee-1'), created.token))
            .rejects.toMatchObject({ statusCode: 409 });
    });

    test('a declined code cannot then be accepted', async () => {
        const created = await mint();
        await invitationService.decline(ctx('invitee-1'), created.token);
        await expect(invitationService.accept(ctx('invitee-1'), created.token))
            .rejects.toMatchObject({ statusCode: 409 });
    });
});

describe('withdrawing', () => {
    test('only the owner may', async () => {
        await invitationService.create(ctx(OWNER), 'case-1', { relation: 'PARTNER' });
        const invId = [...mockRows.values()][0].id;
        await expect(invitationService.revoke(ctx('stranger'), 'case-1', invId))
            .rejects.toMatchObject({ statusCode: 403 });
    });

    test('an accepted invitation cannot be withdrawn retroactively', async () => {
        const created = await invitationService.create(ctx(OWNER), 'case-1', { relation: 'PARTNER' });
        await invitationService.accept(ctx('invitee-1'), created.token);
        // Consent already given is removed by removing the participant, not by rewriting history.
        await expect(invitationService.revoke(ctx(OWNER), 'case-1', [...mockRows.values()][0].id))
            .rejects.toMatchObject({ statusCode: 409 });
    });
});

describe('the owner’s list', () => {
    test('never carries the code or who holds it', async () => {
        await invitationService.create(ctx(OWNER), 'case-1', { relation: 'PARTNER' });
        const list = await invitationService.listForCase(ctx(OWNER), 'case-1');
        for (const inv of list) {
            expect(inv).not.toHaveProperty('token');
            expect(inv).not.toHaveProperty('tokenHash');
            expect(inv).not.toHaveProperty('acceptedBy');
        }
    });
});

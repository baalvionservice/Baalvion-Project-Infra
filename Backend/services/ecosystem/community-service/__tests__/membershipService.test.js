'use strict';
// Unit tests for the membership state machine — run without a real DB/Redis connection.

const mockCommunity = {
    id: 'c1', slug: 'general', access_model: 'free', is_active: true,
    nodebb_group_member: 'community-general-member',
    nodebb_group_paid: 'community-general-paid',
    nodebb_group_mod: 'community-general-mod',
};
const mockInviteOnlyCommunity = { ...mockCommunity, id: 'c2', slug: 'investors-founders', access_model: 'invite_only' };
const mockRequestCommunity = { ...mockCommunity, id: 'c3', slug: 'cybersecurity', access_model: 'request_approval' };

jest.mock('../models', () => {
    // findOrCreate/update on a tiny in-memory map — good enough to assert state transitions
    // without a real Postgres connection.
    const rows = new Map();
    const CommunityMembership = {
        findOne: jest.fn(async ({ where }) => rows.get(`${where.community_id}:${where.user_id}`) || null),
        findOrCreate: jest.fn(async ({ where, defaults }) => {
            const key = `${where.community_id}:${where.user_id}`;
            if (rows.has(key)) return [rows.get(key), false];
            const row = { ...defaults, update: jest.fn(async function (fields) { Object.assign(this, fields); return this; }) };
            rows.set(key, row);
            return [row, true];
        }),
        __rows: rows,
    };
    return {
        Community: { findOne: jest.fn(), findByPk: jest.fn() },
        CommunityMembership,
        CommunityInvite: { create: jest.fn(), findOne: jest.fn() },
        CommunityJoinRequest: { create: jest.fn(), findOne: jest.fn(), findAll: jest.fn() },
        CommunityModerationLog: { create: jest.fn(async (d) => d) },
    };
});

jest.mock('../service/nodebbClient', () => ({
    resolveUidByEmail: jest.fn(async () => null),
    addUserToGroup: jest.fn(async () => {}),
    removeUserFromGroup: jest.fn(async () => {}),
}));

jest.mock('../service/eventsClient', () => ({ emit: jest.fn(async () => {}) }));

const db = require('../models');
const membershipService = require('../service/membershipService');

describe('membershipService.join', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        db.CommunityMembership.__rows.clear();
    });

    it('approves immediately for a free community', async () => {
        db.Community.findOne.mockResolvedValue(mockCommunity);
        const { membership } = await membershipService.join('general', 'user-1', 'u1@example.com');
        expect(membership.status).toBe('approved');
        expect(membership.role).toBe('member');
    });

    it('creates a pending join request for request_approval communities', async () => {
        db.Community.findOne.mockResolvedValue(mockRequestCommunity);
        const { membership } = await membershipService.join('cybersecurity', 'user-2', 'u2@example.com');
        expect(membership.status).toBe('requested');
        expect(db.CommunityJoinRequest.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    });

    it('rejects a direct join for invite_only communities', async () => {
        db.Community.findOne.mockResolvedValue(mockInviteOnlyCommunity);
        await expect(membershipService.join('investors-founders', 'user-3', 'u3@example.com'))
            .rejects.toMatchObject({ code: 'INVITE_REQUIRED' });
    });

    it('rejects joining a community you are already an approved member of', async () => {
        db.Community.findOne.mockResolvedValue(mockCommunity);
        db.CommunityMembership.findOne.mockResolvedValueOnce({ status: 'approved' });
        await expect(membershipService.join('general', 'user-1', 'u1@example.com'))
            .rejects.toMatchObject({ code: 'ALREADY_MEMBER' });
    });

    it('rejects a banned user', async () => {
        db.Community.findOne.mockResolvedValue(mockCommunity);
        db.CommunityMembership.findOne.mockResolvedValueOnce({ status: 'banned' });
        await expect(membershipService.join('general', 'user-1', 'u1@example.com'))
            .rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
});

describe('membershipService.decideJoinRequest', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        db.CommunityMembership.__rows.clear();
    });

    it('approving a request marks it approved and grants membership', async () => {
        const request = { id: 'r1', user_id: 'user-4', status: 'pending', update: jest.fn(async function (f) { Object.assign(this, f); }) };
        db.CommunityJoinRequest.findOne.mockResolvedValue(request);
        const decided = await membershipService.decideJoinRequest(mockRequestCommunity, 'r1', 'mod-1', true);
        expect(decided.status).toBe('approved');
        const membership = await db.CommunityMembership.findOne({ where: { community_id: mockRequestCommunity.id, user_id: 'user-4' } });
        expect(membership.status).toBe('approved');
    });

    it('rejects deciding an already-decided request', async () => {
        db.CommunityJoinRequest.findOne.mockResolvedValue({ id: 'r1', status: 'approved' });
        await expect(membershipService.decideJoinRequest(mockRequestCommunity, 'r1', 'mod-1', true))
            .rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
});

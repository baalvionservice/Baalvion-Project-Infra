'use strict';
/**
 * Asking to become a supporter.
 *
 * This queue exists because the capability to offer support is not a sign-up default and had
 * no route to it at all — the platform's central act was unreachable for every account that
 * ever registered. These tests hold the two halves of the fix in place: that a member can ask,
 * and that asking cannot become a way around the vetting the default was protecting.
 */
const mockRoleRequest = { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn() };
const mockUserService = { rolesFor: jest.fn(), grantRole: jest.fn() };
const mockNotify = jest.fn();

jest.mock('../models', () => ({ RoleRequest: mockRoleRequest, User: {}, Profile: {}, UserRole: {} }));
jest.mock('../service/userService', () => mockUserService);
jest.mock('../service/notificationService', () => ({
    notify: mockNotify,
    EVENT: { roleRequestApproved: (r) => ({ type: 'approved', role: r }), roleRequestDeclined: () => ({ type: 'declined' }) },
}));

const service = require('../service/roleRequestService');

const ME = 'user-1';
const ctx = { actor: { userId: ME, roles: ['USER'] } };
const GOOD_REASON = 'My own parents refused for two years and eventually came round, and I would like to help other people through it.';

/** A row object with the update() the service calls. */
const row = (over = {}) => ({
    id: 'req-1', user_id: ME, role: 'SUPPORTER', reason: GOOD_REASON, status: 'PENDING',
    decision_note: null, decided_at: null, created_at: new Date(),
    update: jest.fn(function (patch) { Object.assign(this, patch); return this; }),
    ...over,
});

beforeEach(() => {
    jest.clearAllMocks();
    mockUserService.rolesFor.mockResolvedValue(['USER']);
    mockUserService.grantRole.mockResolvedValue({ role: 'SUPPORTER', created: true });
    mockRoleRequest.findOne.mockResolvedValue(null);
    mockRoleRequest.create.mockImplementation(async (v) => row(v));
});

describe('what can be asked for', () => {
    test('a member may ask to become a supporter', async () => {
        const r = await service.create(ctx, { role: 'SUPPORTER', reason: GOOD_REASON });
        expect(r.status).toBe('PENDING');
        expect(mockRoleRequest.create).toHaveBeenCalled();
    });

    for (const role of ['MODERATOR', 'ADMIN']) {
        test(`nobody can ask to become ${role}`, async () => {
            // The point of the whole table: a request queue that reached authority over other
            // people would be a self-nomination form.
            await expect(service.create(ctx, { role, reason: GOOD_REASON })).rejects.toMatchObject({ statusCode: 400 });
            expect(mockRoleRequest.create).not.toHaveBeenCalled();
        });
    }

    test('the refusal does not say which roles exist', async () => {
        // Same message for a real-but-unaskable role and for nonsense, so this is not an
        // enumeration oracle over the role vocabulary.
        const a = await service.create(ctx, { role: 'ADMIN', reason: GOOD_REASON }).catch((e) => e.message);
        const b = await service.create(ctx, { role: 'WIZARD', reason: GOOD_REASON }).catch((e) => e.message);
        expect(a).toBe(b);
    });

    test('a one-word reason is refused', async () => {
        await expect(service.create(ctx, { role: 'SUPPORTER', reason: 'please' })).rejects.toMatchObject({ statusCode: 400 });
    });
});

describe('you cannot ask twice', () => {
    test('not while one is still waiting', async () => {
        mockRoleRequest.findOne.mockResolvedValue(row());
        await expect(service.create(ctx, { role: 'SUPPORTER', reason: GOOD_REASON })).rejects.toMatchObject({ statusCode: 409 });
    });

    test('not for standing you already hold', async () => {
        mockUserService.rolesFor.mockResolvedValue(['USER', 'SUPPORTER']);
        await expect(service.create(ctx, { role: 'SUPPORTER', reason: GOOD_REASON })).rejects.toMatchObject({ statusCode: 409 });
    });

    test('but a previous refusal does not bar a new request', async () => {
        // findOne looks for PENDING only, so a DECLINED row is not in the way. Circumstances
        // change and a permanent silent no would be the platform choosing who may help.
        mockRoleRequest.findOne.mockResolvedValue(null);
        await expect(service.create(ctx, { role: 'SUPPORTER', reason: GOOD_REASON })).resolves.toMatchObject({ status: 'PENDING' });
    });
});

describe('withdrawing', () => {
    test('a member can withdraw their own pending request', async () => {
        mockRoleRequest.findByPk.mockResolvedValue(row());
        await expect(service.withdraw(ctx, 'req-1')).resolves.toMatchObject({ status: 'WITHDRAWN' });
    });

    test("somebody else's request is 404, not 403", async () => {
        // A 403 would confirm the id names a real request belonging to someone.
        mockRoleRequest.findByPk.mockResolvedValue(row({ user_id: 'someone-else' }));
        await expect(service.withdraw(ctx, 'req-1')).rejects.toMatchObject({ statusCode: 404 });
    });
});

describe('the moderator’s answer', () => {
    const mod = { actor: { userId: 'mod-1', roles: ['MODERATOR'] } };

    test('approving grants the role through the one place that decides grants', async () => {
        mockRoleRequest.findByPk.mockResolvedValue(row());
        const out = await service.decide(mod, 'req-1', { approve: true });
        expect(mockUserService.grantRole).toHaveBeenCalledWith({ actor: mod.actor, userId: ME, role: 'SUPPORTER' });
        expect(out.status).toBe('APPROVED');
    });

    test('a moderator who could not grant the role cannot approve their way to it', async () => {
        // grantRole is the authority; if it refuses, the request must not be marked approved.
        const r = row();
        mockRoleRequest.findByPk.mockResolvedValue(r);
        mockUserService.grantRole.mockRejectedValue(Object.assign(new Error('nope'), { statusCode: 403 }));
        await expect(service.decide(mod, 'req-1', { approve: true })).rejects.toMatchObject({ statusCode: 403 });
        expect(r.update).not.toHaveBeenCalled();
    });

    test('declining requires a written reason', async () => {
        mockRoleRequest.findByPk.mockResolvedValue(row());
        await expect(service.decide(mod, 'req-1', { approve: false })).rejects.toMatchObject({ statusCode: 400 });
    });

    test('a decline carries the note back to the applicant', async () => {
        mockRoleRequest.findByPk.mockResolvedValue(row());
        const out = await service.decide(mod, 'req-1', { approve: false, note: 'Please tell us a bit more about your own experience.' });
        expect(out.status).toBe('DECLINED');
        expect(out.decisionNote).toMatch(/tell us a bit more/);
        expect(mockUserService.grantRole).not.toHaveBeenCalled();
    });

    test('nobody decides their own request', async () => {
        mockRoleRequest.findByPk.mockResolvedValue(row({ user_id: 'mod-1' }));
        await expect(service.decide(mod, 'req-1', { approve: true })).rejects.toMatchObject({ statusCode: 403 });
    });

    test('a request already decided cannot be decided again', async () => {
        mockRoleRequest.findByPk.mockResolvedValue(row({ status: 'APPROVED' }));
        await expect(service.decide(mod, 'req-1', { approve: true })).rejects.toMatchObject({ statusCode: 409 });
    });

    test('the applicant is told, without the decision appearing in the notification body', async () => {
        mockRoleRequest.findByPk.mockResolvedValue(row());
        await service.decide(mod, 'req-1', { approve: false, note: 'Not yet — please reapply in a month.' });
        expect(mockNotify).toHaveBeenCalledWith(ME, { type: 'declined' }, 'mod-1');
    });
});

describe('the queue', () => {
    test('shows the longest wait first', async () => {
        mockRoleRequest.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        await service.queue({});
        const order = mockRoleRequest.findAndCountAll.mock.calls[0][0].order;
        expect(order).toEqual([['created_at', 'ASC']]);
    });

    test('defaults to the ones still waiting', async () => {
        mockRoleRequest.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        await service.queue({});
        expect(mockRoleRequest.findAndCountAll.mock.calls[0][0].where).toEqual({ status: 'PENDING' });
    });
});

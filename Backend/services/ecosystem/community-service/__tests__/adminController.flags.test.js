'use strict';
// Unit tests for the reports-queue controller actions — run without a real DB/NodeBB connection.

jest.mock('../models', () => ({
    Community: { findAll: jest.fn(), findOne: jest.fn() },
}));

jest.mock('../service/nodebbClient', () => ({
    getFlags: jest.fn(),
    updateFlagState: jest.fn(async () => {}),
    deletePost: jest.fn(async () => {}),
}));

jest.mock('../service/moderationService', () => ({ log: jest.fn(async () => {}) }));
jest.mock('../service/identityClient', () => ({ getEmailByUserId: jest.fn(async () => null) }));
jest.mock('../service/membershipService', () => ({}));

const db = require('../models');
const nodebb = require('../service/nodebbClient');
const moderation = require('../service/moderationService');
const ctrl = require('../controller/adminController');

function mockRes() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
}

describe('adminController.listFlags', () => {
    beforeEach(() => jest.clearAllMocks());

    it('enriches a flag with its owning community by nodebb_cid', async () => {
        db.Community.findAll.mockResolvedValue([
            { slug: 'general', name: 'General Discussion', nodebb_cid: 5 },
        ]);
        nodebb.getFlags.mockResolvedValue([
            {
                flagId: 42,
                type: 'post',
                state: 'open',
                reasons: ['Spam'],
                reporter: { username: 'reporter1', uid: 9 },
                targetId: 100,
                target: { pid: 100, content: 'bad post', category: { cid: 5 } },
                datetime: 1700000000000,
            },
        ]);

        const req = { requestId: 'r1' };
        const res = mockRes();
        await ctrl.listFlags(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(200);
        const payload = res.json.mock.calls[0][0];
        expect(payload.data).toHaveLength(1);
        expect(payload.data[0].community).toEqual({ slug: 'general', name: 'General Discussion' });
        expect(payload.data[0].target.id).toBe('100');
    });

    it('leaves community null when the flag has no mappable cid', async () => {
        db.Community.findAll.mockResolvedValue([{ slug: 'general', name: 'General Discussion', nodebb_cid: 5 }]);
        nodebb.getFlags.mockResolvedValue([{ flagId: 1, targetId: 7, target: {} }]);

        const res = mockRes();
        await ctrl.listFlags({ requestId: 'r2' }, res, jest.fn());

        expect(res.json.mock.calls[0][0].data[0].community).toBeNull();
    });
});

describe('adminController.resolveFlag', () => {
    beforeEach(() => jest.clearAllMocks());

    it('dismisses a flag without deleting the post', async () => {
        const req = {
            requestId: 'r3',
            params: { flagId: '42' },
            body: { action: 'dismiss', pid: '100', communitySlug: null },
            auth: { userId: 'admin-1' },
        };
        const res = mockRes();
        await ctrl.resolveFlag(req, res, jest.fn());

        expect(nodebb.deletePost).not.toHaveBeenCalled();
        expect(nodebb.updateFlagState).toHaveBeenCalledWith('42', 'resolved');
        expect(moderation.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'flag.dismissed', actorUserId: 'admin-1' }));
        expect(res.json.mock.calls[0][0].data).toMatchObject({ flagId: '42', action: 'dismiss' });
    });

    it('removes the flagged post before resolving the flag', async () => {
        const req = {
            requestId: 'r4',
            params: { flagId: '43' },
            body: { action: 'remove', pid: '101', communitySlug: 'general' },
            auth: { userId: 'admin-1' },
        };
        db.Community.findOne.mockResolvedValue({ id: 'c1', slug: 'general' });
        const res = mockRes();
        await ctrl.resolveFlag(req, res, jest.fn());

        expect(nodebb.deletePost).toHaveBeenCalledWith('101');
        expect(nodebb.updateFlagState).toHaveBeenCalledWith('43', 'resolved');
        expect(moderation.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'content.removed', communityId: 'c1', targetEntityId: '101' }));
    });

    it('rejects removal without a pid', async () => {
        const req = {
            requestId: 'r5',
            params: { flagId: '44' },
            body: { action: 'remove' },
            auth: { userId: 'admin-1' },
        };
        const res = mockRes();
        const next = jest.fn();
        await ctrl.resolveFlag(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
        expect(nodebb.deletePost).not.toHaveBeenCalled();
    });
});

'use strict';
/**
 * Post lifecycle: edit, delete, and what a deletion leaves behind.
 */
process.env.JWT_PUBLIC_KEY = 'test-public-key';
process.env.NODE_ENV = 'test';

const mockPosts = new Map();
const mockDestroyed = [];

jest.mock('@baalvion/auth-node', () => ({
    requireEnv: (n) => process.env[n] || '', buildPgSsl: () => false,
    createAuthMiddleware: () => (req, res, next) => next(),
}));

jest.mock('../models', () => {
    const { Op } = require('sequelize');
    return {
        Op,
        sequelize: { transaction: jest.fn(async (fn) => fn({})) },
        Post: {
            findByPk: jest.fn(async (id) => {
                const row = mockPosts.get(id);
                if (!row) return null;
                return {
                    ...row,
                    update: jest.fn(async function (fields) { Object.assign(row, fields); Object.assign(this, fields); return this; }),
                };
            }),
            findAndCountAll: jest.fn(async ({ where }) => {
                const rows = [...mockPosts.values()].filter((p) =>
                    p.community_id === where.community_id &&
                    p.moderation_state === where.moderation_state &&
                    (where.deleted_at === null ? p.deleted_at == null : true));
                return { rows, count: rows.length };
            }),
        },
        Comment: { destroy: jest.fn(async (args) => { mockDestroyed.push(args); return 1; }) },
        Community: { findByPk: jest.fn(async (id) => ({ id, slug: 'a-community', visibility: 'PUBLIC', is_active: true })) },
        Notification: { create: jest.fn(async (r) => r) },
    };
});

const postService = require('../service/postService');
const { ROLES } = require('../domain/roles');

const AUTHOR = 'author-1';
const post = (over = {}) => ({
    id: 'post-1', community_id: 'c1', author_id: AUTHOR, title: 'A post',
    body: 'The original body text.', moderation_state: 'VISIBLE', is_locked: false,
    comment_count: 3, deleted_at: null, ...over,
});

const ctx = (userId, roles = [ROLES.USER]) => ({
    actor: { userId, roles }, communityIds: ['c1'], participantCaseIds: [], supporterCaseIds: [],
});

beforeEach(() => { mockPosts.clear(); mockDestroyed.length = 0; mockPosts.set('post-1', post()); });

describe('editing', () => {
    test('the author may', async () => {
        const result = await postService.update(ctx(AUTHOR), 'post-1', { title: 'Edited', body: 'New body.' });
        expect(result.title).toBe('Edited');
    });

    test('another member may not', async () => {
        await expect(postService.update(ctx('someone-else'), 'post-1', { title: 'Hijacked' }))
            .rejects.toMatchObject({ statusCode: 403 });
    });

    test('a moderator may not either — moderation goes through recorded actions', async () => {
        await expect(postService.update(ctx('mod-1', [ROLES.MODERATOR]), 'post-1', { title: 'Edited' }))
            .rejects.toMatchObject({ statusCode: 403 });
    });

    test('a deleted post cannot be edited back into existence', async () => {
        mockPosts.set('post-1', post({ deleted_at: new Date(), title: '[deleted]', body: '' }));
        await expect(postService.update(ctx(AUTHOR), 'post-1', { body: 'restored' }))
            .rejects.toMatchObject({ statusCode: 404 });
    });
});

describe('deleting', () => {
    test('only the author may', async () => {
        await expect(postService.remove(ctx('someone-else'), 'post-1'))
            .rejects.toMatchObject({ statusCode: 403 });
        await expect(postService.remove(ctx('mod-1', [ROLES.MODERATOR]), 'post-1'))
            .rejects.toMatchObject({ statusCode: 403 });
    });

    test('the body is OVERWRITTEN, not merely flagged', async () => {
        await postService.remove(ctx(AUTHOR), 'post-1');
        const row = mockPosts.get('post-1');
        // The original text must not be recoverable from the row afterwards.
        expect(row.body).toBe('');
        expect(row.title).toBe('[deleted]');
        expect(JSON.stringify(row)).not.toContain('The original body text.');
        expect(row.deleted_at).toBeTruthy();
    });

    test('the row survives so a report about it still resolves', async () => {
        await postService.remove(ctx(AUTHOR), 'post-1');
        // A hard delete left moderators holding a UUID that pointed at nothing.
        expect(mockPosts.has('post-1')).toBe(true);
    });

    test('its replies are removed with it', async () => {
        await postService.remove(ctx(AUTHOR), 'post-1');
        expect(mockDestroyed[0].where).toMatchObject({ target_type: 'POST', target_id: 'post-1' });
        expect(mockPosts.get('post-1').comment_count).toBe(0);
    });

    test('deleting twice is refused rather than silently repeated', async () => {
        await postService.remove(ctx(AUTHOR), 'post-1');
        await expect(postService.remove(ctx(AUTHOR), 'post-1')).rejects.toMatchObject({ statusCode: 404 });
    });
});

describe('reading', () => {
    test('a deleted post is gone for everyone, its author included', async () => {
        await postService.remove(ctx(AUTHOR), 'post-1');
        await expect(postService.get(ctx(AUTHOR), 'post-1')).rejects.toMatchObject({ statusCode: 404 });
        await expect(postService.get(ctx('reader'), 'post-1')).rejects.toMatchObject({ statusCode: 404 });
    });

    test('the list excludes deleted posts', async () => {
        mockPosts.set('post-2', post({ id: 'post-2', deleted_at: new Date() }));
        const { items } = await postService.list(ctx('reader'), { communityId: 'c1', page: 1, pageSize: 10 });
        expect(items.map((p) => p.id)).toEqual(['post-1']);
    });
});

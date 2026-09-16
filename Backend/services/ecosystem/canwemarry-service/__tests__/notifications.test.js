'use strict';
/**
 * Notifications: what they say, and who can read them.
 *
 * A notification list is often the first thing visible when a phone is unlocked, and this
 * platform's users frequently share a device with the family a case is about. So the
 * strongest assertions here are about what the wording does NOT contain.
 */
process.env.JWT_PUBLIC_KEY = 'test-public-key';
process.env.NODE_ENV = 'test';

const mockRows = [];

jest.mock('@baalvion/auth-node', () => ({
    requireEnv: (n) => process.env[n] || '', buildPgSsl: () => false,
    createAuthMiddleware: () => (req, res, next) => next(),
}));

jest.mock('../models', () => ({
    Notification: {
        create: jest.fn(async (row) => { const r = { id: `n${mockRows.length + 1}`, read_at: null, created_at: new Date(), ...row }; mockRows.push(r); return r; }),
        findAndCountAll: jest.fn(async ({ where }) => {
            const rows = mockRows.filter((r) => r.user_id === where.user_id && (where.read_at === null ? r.read_at === null : true));
            return { rows, count: rows.length };
        }),
        findOne: jest.fn(async ({ where }) => {
            const row = mockRows.find((r) => r.id === where.id && r.user_id === where.user_id);
            if (!row) return null;
            // Sequelize instances carry update(); the service calls it.
            return Object.assign(row, { update: async (fields) => { Object.assign(row, fields); return row; } });
        }),
        count: jest.fn(async ({ where }) => mockRows.filter((r) => r.user_id === where.user_id && r.read_at === null).length),
        update: jest.fn(async (fields, { where }) => {
            const hit = mockRows.filter((r) => r.user_id === where.user_id && r.read_at === null);
            hit.forEach((r) => Object.assign(r, fields));
            return [hit.length];
        }),
    },
}));

const notificationService = require('../service/notificationService');
const { EVENT } = notificationService;

const SECRET_CASE_TITLE = 'My parents will not meet Priya';
const SECRET_COMMENT = 'She told me they threatened to disown her';

beforeEach(() => { mockRows.length = 0; });

describe('what a notification is allowed to say', () => {
    // Every event, rendered, then scanned for anything a passer-by should not read.
    const rendered = () => [
        EVENT.caseCommented('case-1'),
        EVENT.commentReplied('case-1'),
        EVENT.postCommented('a-community', 'post-1'),
        EVENT.joinApproved('a-community'),
        EVENT.reportResolved(),
        EVENT.contentModerated('HIDE'),
    ];

    test('no event quotes case or comment content', () => {
        for (const e of rendered()) {
            const text = `${e.title} ${e.body ?? ''}`;
            expect(text).not.toContain(SECRET_CASE_TITLE);
            expect(text).not.toContain(SECRET_COMMENT);
        }
    });

    test('no event takes user-supplied text as an argument at all', () => {
        // The wording is fixed in the catalogue; a caller can pass an id and nothing else,
        // so there is no route by which a case title could reach a notification body.
        expect(EVENT.caseCommented.length).toBe(1);
        expect(EVENT.commentReplied.length).toBe(1);
        expect(EVENT.reportResolved.length).toBe(0);
    });

    test('every event carries a title, and a link that goes somewhere', () => {
        for (const e of rendered()) {
            expect(e.title.length).toBeGreaterThan(8);
            expect(e.type).toMatch(/^[a-z]+(\.[a-z]+)+$/);
            expect(e.link.startsWith('/')).toBe(true);
        }
    });

    test('the report notification reveals neither the outcome nor which moderator', () => {
        const e = EVENT.reportResolved();
        const text = `${e.title} ${e.body}`.toLowerCase();
        // Saying "a moderator has looked at this" is fine and useful. What must not appear
        // is WHICH moderator, or WHAT they decided — the first is somebody's identity, the
        // second concerns another person's account.
        for (const leak of ['dismissed', 'actioned', 'suspended', 'removed', 'because', 'we found']) {
            expect(text).not.toContain(leak);
        }
        expect(text).not.toMatch(/@|\bby [a-z]+\b/);
    });
});

describe('who gets told', () => {
    test('nobody is notified about something they did themselves', async () => {
        await notificationService.notify('user-a', EVENT.caseCommented('case-1'), 'user-a');
        expect(mockRows).toHaveLength(0);
    });

    test('somebody else acting does produce one', async () => {
        await notificationService.notify('user-a', EVENT.caseCommented('case-1'), 'user-b');
        expect(mockRows).toHaveLength(1);
        expect(mockRows[0].user_id).toBe('user-a');
    });

    test('a missing recipient is a no-op rather than a crash', async () => {
        await expect(notificationService.notify(null, EVENT.caseCommented('case-1'), 'user-b')).resolves.toBeNull();
    });
});

describe('reading is scoped to the owner', () => {
    const ctx = (userId) => ({ actor: { userId } });

    beforeEach(async () => {
        await notificationService.notify('user-a', EVENT.caseCommented('case-1'), 'x');
        await notificationService.notify('user-b', EVENT.commentReplied('case-2'), 'x');
    });

    test('a list returns only the caller’s own', async () => {
        const { items } = await notificationService.list(ctx('user-a'), { page: 1, pageSize: 20 });
        expect(items).toHaveLength(1);
        expect(items[0].type).toBe('case.comment.created');
    });

    test('marking read is scoped by user_id in the WHERE clause', async () => {
        const theirs = mockRows.find((r) => r.user_id === 'user-b');
        // user-a naming user-b's notification id must miss, not succeed.
        await expect(notificationService.markRead(ctx('user-a'), theirs.id)).rejects.toMatchObject({ statusCode: 404 });
        expect(mockRows.find((r) => r.id === theirs.id).read_at).toBeNull();
    });

    test('mark-all-read touches nobody else’s', async () => {
        await notificationService.markAllRead(ctx('user-a'));
        expect(mockRows.find((r) => r.user_id === 'user-a').read_at).toBeTruthy();
        expect(mockRows.find((r) => r.user_id === 'user-b').read_at).toBeNull();
    });

    test('unread counts are per-account', async () => {
        expect(await notificationService.unreadCount(ctx('user-a'))).toBe(1);
        await notificationService.markAllRead(ctx('user-a'));
        expect(await notificationService.unreadCount(ctx('user-a'))).toBe(0);
        expect(await notificationService.unreadCount(ctx('user-b'))).toBe(1);
    });

    test('marking an already-read notification again is harmless', async () => {
        const mine = mockRows.find((r) => r.user_id === 'user-a');
        await notificationService.markRead(ctx('user-a'), mine.id);
        const first = mockRows.find((r) => r.id === mine.id).read_at;
        await notificationService.markRead(ctx('user-a'), mine.id);
        // The timestamp must not move on a repeat — two tabs racing should not disagree.
        expect(mockRows.find((r) => r.id === mine.id).read_at).toBe(first);
    });
});

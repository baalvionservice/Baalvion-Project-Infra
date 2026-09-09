'use strict';
/**
 * The HTTP trust boundary, exercised end to end through the real router.
 *
 * The database and the token verifier are replaced; the middleware chain, the permission
 * gates and the visibility rules are the real ones. That is the point — these assertions
 * fail if a route is ever mounted without its gate, which unit tests on the domain layer
 * alone would not catch.
 */
process.env.JWT_PUBLIC_KEY = 'test-public-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
// Real uuids — the service refuses a path parameter that cannot be one, and a required
// module is safe from the temporal dead zone that jest's mock hoisting creates.
const mockIds = require('./fixtures/ids');

// ── Token registry: a bearer value maps to a verified identity ───────────────
const mockTokens = {
    'member-token': { sub: mockIds.MEMBER, roles: [] },
    'supporter-token': { sub: mockIds.SUPPORTER, roles: [] },
    'moderator-token': { sub: mockIds.MODERATOR, roles: [] },
    'admin-token': { sub: mockIds.ADMIN, roles: [] },
};

// Product roles come from the service's own user_roles table, never from the token.
const PRODUCT_ROLES = {
    [mockIds.MEMBER]: ['USER'],
    [mockIds.SUPPORTER]: ['USER', 'SUPPORTER'],
    [mockIds.MODERATOR]: ['USER', 'MODERATOR'],
    [mockIds.ADMIN]: ['USER', 'ADMIN'],
};

jest.mock('@baalvion/auth-node', () => ({
    requireEnv: (name) => process.env[name] || '',
    buildPgSsl: () => false,
    createAuthMiddleware: () => (req, res, next) => {
        const header = req.headers.authorization || '';
        if (!header.startsWith('Bearer ')) {
            return next(Object.assign(new Error('Bearer token required'), { status: 401, code: 'unauthorized' }));
        }
        const claims = mockTokens[header.slice(7)];
        if (!claims) {
            return next(Object.assign(new Error('Invalid token'), { status: 401, code: 'unauthorized' }));
        }
        req.auth = { userId: claims.sub, roles: claims.roles, permissions: [] };
        return next();
    },
}));

jest.mock('@baalvion/telemetry/bootstrap', () => ({}), { virtual: true });
jest.mock('@baalvion/graceful-shutdown', () => ({ initGracefulShutdown: () => {}, registerShutdown: () => {} }), { virtual: true });

// ── In-memory data ───────────────────────────────────────────────────────────
const OWNER = mockIds.OWNER;
const CASES = {
    [mockIds.PRIVATE_CASE]: {
        id: mockIds.PRIVATE_CASE, reference: 'CWM-PRIV01', owner_id: OWNER, community_id: null,
        title: 'Private', summary: 'A private case', situation: 'Sensitive detail',
        support_needed: [], visibility: 'PRIVATE', status: 'OPEN', moderation_state: 'VISIBLE',
        is_locked: false, allow_supporter_requests: true, supporter_count: 0, comment_count: 0,
    },
    [mockIds.PUBLIC_CASE]: {
        id: mockIds.PUBLIC_CASE, reference: 'CWM-PUB001', owner_id: OWNER, community_id: null,
        title: 'Public', summary: 'A public case', situation: 'Published detail',
        support_needed: [], visibility: 'PUBLIC', status: 'OPEN', moderation_state: 'VISIBLE',
        is_locked: false, allow_supporter_requests: true, supporter_count: 0, comment_count: 0,
    },
};

jest.mock('../models', () => {
    const { Op } = require('sequelize');
    const empty = { findAll: jest.fn(async () => []), count: jest.fn(async () => 0) };
    return {
        Op,
        sequelize: {
            authenticate: jest.fn(async () => true),
            close: jest.fn(async () => {}),
            literal: jest.fn((sql) => ({ literal: sql })),
            fn: jest.fn((...args) => ({ fn: args })),
            col: jest.fn((name) => ({ col: name })),
        },
        User: {
            // provision() now keys on platform_subject and returns the LOCAL row; the tests
            // keep subject and local id identical so the fixtures stay readable.
            findOrCreate: jest.fn(async ({ where }) => [{ id: where.platform_subject, platform_subject: where.platform_subject, status: 'ACTIVE' }, false]),
            findByPk: jest.fn(async (id) => ({ id, status: 'ACTIVE' })),
            findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })),
        },
        UserRole: {
            count: jest.fn(async () => 1),
            bulkCreate: jest.fn(async () => []),
            findAll: jest.fn(async ({ where }) => (global.__roles[where.user_id] || ['USER']).map((role) => ({ role }))),
        },
        CommunityMember: empty,
        CaseParticipant: empty,
        CaseSupporter: empty,
        Case: {
            findByPk: jest.fn(async (id) => global.__cases[id] || null),
            findAndCountAll: jest.fn(async () => ({ rows: Object.values(global.__cases), count: 2 })),
        },
        Report: { findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })) },
        AuditLog: { create: jest.fn(async (row) => row), findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })) },
        Notification: { create: jest.fn(async (row) => row) },
    };
});

global.__roles = PRODUCT_ROLES;
global.__cases = CASES;

const app = require('../index');

const as = (token, req) => (token ? req.set('Authorization', `Bearer ${token}`) : req);

describe('the public boundary', () => {
    test('the case list is readable without an account', async () => {
        const res = await request(app).get('/v1/cases');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('opening a case requires an account', async () => {
        const res = await request(app).post('/v1/cases').send({ title: 'Title', summary: 'Summary' });
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('an invalid token is rejected rather than downgraded to anonymous', async () => {
        // Falling through to anonymous would turn an expired session into a silent
        // permission drop instead of a visible 401.
        const res = await as('not-a-real-token', request(app).get('/v1/cases'));
        expect(res.status).toBe(401);
    });
});

describe('unauthorized case access', () => {
    test('a stranger asking for a private case gets 404, not 403', async () => {
        // A 403 would confirm the case exists — the exact fact someone searching for a
        // relative's case would be probing for.
        const res = await as('member-token', request(app).get(`/v1/cases/${mockIds.PRIVATE_CASE}`));
        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('an anonymous visitor gets the same 404 for a private case', async () => {
        const res = await request(app).get(`/v1/cases/${mockIds.PRIVATE_CASE}`);
        expect(res.status).toBe(404);
    });

    test('a private case never leaks its body in the error', async () => {
        const res = await as('member-token', request(app).get(`/v1/cases/${mockIds.PRIVATE_CASE}`));
        expect(JSON.stringify(res.body)).not.toContain('Sensitive detail');
    });

    test('a public case returns the summary but withholds the internal fields', async () => {
        const res = await request(app).get(`/v1/cases/${mockIds.PUBLIC_CASE}`);
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe('Public');
        expect(res.body.data.viewLevel).toBe('SUMMARY');
        expect(res.body.data).not.toHaveProperty('situation');
        expect(res.body.data).not.toHaveProperty('ownerId');
        expect(res.body.data).not.toHaveProperty('participants');
    });

    test('a moderator sees the private case in full', async () => {
        const res = await as('moderator-token', request(app).get(`/v1/cases/${mockIds.PRIVATE_CASE}`));
        expect(res.status).toBe(200);
        expect(res.body.data.viewLevel).toBe('INTERNAL');
        expect(res.body.data.situation).toBe('Sensitive detail');
    });
});

describe('the moderator boundary', () => {
    test('a member cannot reach the report queue', async () => {
        const res = await as('member-token', request(app).get('/v1/moderation/reports'));
        expect(res.status).toBe(403);
    });

    test('a supporter cannot reach it either', async () => {
        const res = await as('supporter-token', request(app).get('/v1/moderation/reports'));
        expect(res.status).toBe(403);
    });

    test('a moderator can', async () => {
        const res = await as('moderator-token', request(app).get('/v1/moderation/reports'));
        expect(res.status).toBe(200);
    });

    test('a moderation action without a reason is refused', async () => {
        const res = await as('moderator-token', request(app).post('/v1/moderation/actions').send({
            targetType: 'CASE', targetId: '11111111-1111-4111-8111-111111111111', action: 'HIDE',
        }));
        expect(res.status).toBe(400);
        expect(res.body.error.details).toHaveProperty('reason');
    });
});

describe('the admin boundary', () => {
    test('anonymous access to the user list is rejected', async () => {
        expect((await request(app).get('/v1/admin/users')).status).toBe(401);
    });

    test('a member is refused', async () => {
        expect((await as('member-token', request(app).get('/v1/admin/users'))).status).toBe(403);
    });

    test('a moderator is refused the user list and the audit trail', async () => {
        expect((await as('moderator-token', request(app).get('/v1/admin/users'))).status).toBe(403);
        expect((await as('moderator-token', request(app).get('/v1/admin/audit'))).status).toBe(403);
    });

    test('an admin is admitted', async () => {
        expect((await as('admin-token', request(app).get('/v1/admin/users'))).status).toBe(200);
        expect((await as('admin-token', request(app).get('/v1/admin/audit'))).status).toBe(200);
    });
});

describe('input validation at the edge', () => {
    test('a malformed payload is refused with field-level detail', async () => {
        const res = await as('member-token', request(app).post('/v1/cases').send({ title: '', summary: '' }));
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('BAD_REQUEST');
        expect(Object.keys(res.body.error.details)).toEqual(expect.arrayContaining(['title', 'summary']));
    });

    test('an oversized page request is refused', async () => {
        const res = await request(app).get('/v1/cases?pageSize=100000');
        expect(res.status).toBe(400);
    });
});

describe('service surface', () => {
    test('health does not require authentication', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    test('an unknown route returns a structured 404', async () => {
        const res = await request(app).get('/v1/nope');
        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe('NOT_FOUND');
    });
});

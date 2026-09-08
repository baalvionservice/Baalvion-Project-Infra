'use strict';
/**
 * Email verification, enforced at the HTTP boundary.
 *
 * The domain rules are unit-tested in verification.test.js. What this file proves is the
 * part that unit tests cannot: that the gate is actually MOUNTED on the routes that need
 * it, that it cannot be walked around, and that a caller who cannot yet be judged is not
 * locked out of the product.
 *
 * The three states are driven by the token, because that is where they genuinely come
 * from — auth-service signs `email_verified` and @baalvion/auth-node hands it over as
 * req.auth.emailVerified. A token with no claim at all is the fourth fixture, and it
 * matters: it is what every session issued before the claim existed looks like.
 */
process.env.JWT_PUBLIC_KEY = 'test-public-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
// Real uuids — the service refuses a path parameter that cannot be one, and a required
// module is safe from the temporal dead zone that jest's mock hoisting creates.
const mockIds = require('./fixtures/ids');

const mockTokens = {
    'verified-token': { sub: mockIds.VERIFIED, emailVerified: true },
    'unverified-token': { sub: mockIds.UNVERIFIED, emailVerified: false },
    // Issued before the claim existed: carries no opinion either way.
    'claimless-token': { sub: mockIds.CLAIMLESS },
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
        req.auth = { userId: claims.sub, roles: [], permissions: [] };
        // Only set the property when the fixture has one — an `undefined` key and an absent
        // key must both read as UNKNOWN, and asserting that is half the point of this file.
        if ('emailVerified' in claims) req.auth.emailVerified = claims.emailVerified;
        return next();
    },
}));

jest.mock('@baalvion/telemetry/bootstrap', () => ({}), { virtual: true });
jest.mock('@baalvion/graceful-shutdown', () => ({ initGracefulShutdown: () => {}, registerShutdown: () => {} }), { virtual: true });

const OWNED_DRAFT = {
    id: mockIds.DRAFT_CASE, reference: 'CWM-DRAFT1', owner_id: mockIds.UNVERIFIED, community_id: null,
    title: 'Draft', summary: 'A draft', situation: 'Detail', support_needed: [],
    visibility: 'PRIVATE', status: 'DRAFT', moderation_state: 'VISIBLE', is_locked: false,
    allow_supporter_requests: true, supporter_count: 0, comment_count: 0,
};

jest.mock('../models', () => {
    const { Op } = require('sequelize');
    const empty = { findAll: jest.fn(async () => []), count: jest.fn(async () => 0), findOne: jest.fn(async () => null) };
    return {
        Op,
        sequelize: {
            authenticate: jest.fn(async () => true),
            close: jest.fn(async () => {}),
            literal: jest.fn((sql) => ({ literal: sql })),
            fn: jest.fn((...args) => ({ fn: args })),
            col: jest.fn((name) => ({ col: name })),
            transaction: jest.fn(async (cb) => cb({})),
        },
        User: {
            findOrCreate: jest.fn(async ({ where }) => [{ id: where.platform_subject, platform_subject: where.platform_subject, status: 'ACTIVE' }, false]),
            findByPk: jest.fn(async (id) => ({ id, status: 'ACTIVE' })),
        },
        UserRole: {
            count: jest.fn(async () => 1),
            bulkCreate: jest.fn(async () => []),
            findAll: jest.fn(async () => [{ role: 'USER' }]),
        },
        CommunityMember: empty,
        CaseParticipant: { ...empty, create: jest.fn(async (row) => row) },
        CaseSupporter: empty,
        Community: { findByPk: jest.fn(async () => ({ id: 'c1', status: 'ACTIVE', join_policy: 'OPEN', is_private: false })) },
        Case: {
            findByPk: jest.fn(async (id) => (id === mockIds.DRAFT_CASE ? { ...global.__draft, update: jest.fn(async function (p) { Object.assign(this, p); return this; }) } : null)),
            findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })),
            count: jest.fn(async () => 0),
            create: jest.fn(async (row) => ({ ...row, id: 'new-case', reference: 'CWM-NEW001', moderation_state: 'VISIBLE', supporter_count: 0, comment_count: 0 })),
        },
        Post: { create: jest.fn(async (row) => row) },
        Comment: { create: jest.fn(async (row) => row) },
        Report: { create: jest.fn(async (row) => row), findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })) },
        AuditLog: { create: jest.fn(async (row) => row), findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })) },
        Notification: { create: jest.fn(async (row) => row) },
        Profile: { findByPk: jest.fn(async () => null) },
        CaseInvitation: { findOne: jest.fn(async () => null) },
    };
});

global.__draft = OWNED_DRAFT;

const app = require('../index');
const as = (token, req) => req.set('Authorization', `Bearer ${token}`);

// Every gated route, with the smallest body that gets past validation. If a route is ever
// mounted without its gate, the unverified expectation below fails.
const GATED = [
    ['posts',       () => request(app).post('/v1/posts').send({ communityId: '6f1c3f2e-0000-4000-8000-000000000001', title: 'A title here', body: 'A body long enough to pass validation.' })],
    ['comments',    () => request(app).post('/v1/comments').send({ caseId: '6f1c3f2e-0000-4000-8000-000000000002', body: 'A comment body.' })],
    ['reports',     () => request(app).post('/v1/reports').send({ targetType: 'CASE', targetId: '6f1c3f2e-0000-4000-8000-000000000003', reason: 'HARASSMENT', detail: 'Detail text.' })],
    ['support',     () => request(app).post('/v1/cases/6f1c3f2e-0000-4000-8000-000000000004/supporters').send({ message: 'I would like to help.' })],
    ['community join', () => request(app).post('/v1/communities/6f1c3f2e-0000-4000-8000-000000000005/join').send({})],
    ['invitation accept', () => request(app).post('/v1/invitations/example-invite-token/accept').send({})],
];

describe('an unverified account cannot act on other people', () => {
    test.each(GATED)('%s is refused', async (_name, call) => {
        const res = await as('unverified-token', call());
        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('the refusal says what to do, and does not read as a permission problem', async () => {
        const res = await as('unverified-token', request(app).post('/v1/comments')
            .send({ caseId: '6f1c3f2e-0000-4000-8000-000000000002', body: 'A comment body.' }));
        expect(res.body.error.message).toMatch(/confirm your email/i);
        // "You do not have permission" would be a lie — the account holds the right, it
        // just has not proved its address yet, and the difference decides what someone does next.
        expect(res.body.error.message).not.toMatch(/permission|not allowed|forbidden/i);
    });
});

describe('an unverified account keeps its own workspace', () => {
    test('it can still read', async () => {
        const res = await as('unverified-token', request(app).get('/v1/cases'));
        expect(res.status).toBe(200);
    });

    test('it can still write a draft — a draft is visible to nobody', async () => {
        const res = await as('unverified-token', request(app).post('/v1/cases')
            .send({ title: 'My situation', summary: 'A summary of it.', situation: 'The detail.', visibility: 'PRIVATE' }));
        expect(res.status).toBe(201);
    });

    test('it can still reach its own notifications', async () => {
        const res = await as('unverified-token', request(app).get('/v1/me/notifications/unread-count'));
        expect(res.status).not.toBe(403);
    });
});

describe('publishing is gated on both doors, not just the obvious one', () => {
    test('creating a case already OPEN is refused', async () => {
        // The route-level gate cannot see this: it is a create, and creates are allowed.
        const res = await as('unverified-token', request(app).post('/v1/cases')
            .send({ title: 'My situation', summary: 'A summary of it.', situation: 'The detail.', visibility: 'PRIVATE', status: 'OPEN' }));
        expect(res.status).toBe(403);
        expect(res.body.error.message).toMatch(/confirm your email/i);
    });

    test('moving an existing draft out of DRAFT is refused', async () => {
        const res = await as('unverified-token', request(app).patch(`/v1/cases/${mockIds.DRAFT_CASE}`).send({ status: 'OPEN' }));
        expect(res.status).toBe(403);
    });

    test('editing the draft while leaving it a draft still works', async () => {
        const res = await as('unverified-token', request(app).patch(`/v1/cases/${mockIds.DRAFT_CASE}`).send({ summary: 'A revised summary.' }));
        expect(res.status).toBe(200);
    });

    test('the refusal reassures that the draft survived', async () => {
        const res = await as('unverified-token', request(app).patch(`/v1/cases/${mockIds.DRAFT_CASE}`).send({ status: 'OPEN' }));
        expect(res.body.error.message).toMatch(/draft is saved/i);
    });
});

describe('a verified account is unaffected', () => {
    test.each(GATED)('%s is not blocked by the verification gate', async (_name, call) => {
        const res = await as('verified-token', call());
        // These fail for their own reasons on mock data (404 for a case that is not there,
        // and so on). What must never appear is the verification refusal.
        expect(String(res.body?.error?.message || '')).not.toMatch(/confirm your email/i);
    });

    test('it can publish a case outright', async () => {
        const res = await as('verified-token', request(app).post('/v1/cases')
            .send({ title: 'My situation', summary: 'A summary of it.', situation: 'The detail.', visibility: 'PRIVATE', status: 'OPEN' }));
        expect(res.status).toBe(201);
    });
});

describe('a token with no claim is not locked out', () => {
    // Sessions issued before auth-service emitted the claim. Refusing these would log out
    // the entire existing userbase on deploy; the switch to refuse them is deliberate and off.
    test('gated actions are not refused for verification reasons', async () => {
        const res = await as('claimless-token', request(app).post('/v1/comments')
            .send({ caseId: '6f1c3f2e-0000-4000-8000-000000000002', body: 'A comment body.' }));
        expect(String(res.body?.error?.message || '')).not.toMatch(/confirm your email/i);
    });

    test('publishing is not refused either', async () => {
        const res = await as('claimless-token', request(app).patch(`/v1/cases/${mockIds.DRAFT_CASE}`).send({ status: 'OPEN' }));
        expect(res.status).not.toBe(403);
    });
});

describe('the gate cannot be talked out of', () => {
    test('a client-supplied verified flag in the body is ignored', async () => {
        const res = await as('unverified-token', request(app).post('/v1/comments')
            .send({ caseId: '6f1c3f2e-0000-4000-8000-000000000002', body: 'A comment.', emailVerified: true, verification: 'VERIFIED' }));
        expect(res.status).toBe(403);
    });

    test('a client-supplied header claiming verification is ignored', async () => {
        const res = await as('unverified-token', request(app).post('/v1/comments')
            .set('x-email-verified', 'true')
            .set('x-auth-email-verified', 'true')
            .send({ caseId: '6f1c3f2e-0000-4000-8000-000000000002', body: 'A comment.' }));
        expect(res.status).toBe(403);
    });

    test('a query parameter claiming verification is ignored', async () => {
        const res = await as('unverified-token', request(app).post('/v1/comments?emailVerified=true')
            .send({ caseId: '6f1c3f2e-0000-4000-8000-000000000002', body: 'A comment.' }));
        expect(res.status).toBe(403);
    });
});

describe('/me reports the state the gate actually used', () => {
    test('unverified is reported as UNVERIFIED', async () => {
        const res = await as('unverified-token', request(app).get('/v1/me'));
        expect(res.body.data.emailVerification.state).toBe('UNVERIFIED');
    });

    test('verified is reported as VERIFIED', async () => {
        const res = await as('verified-token', request(app).get('/v1/me'));
        expect(res.body.data.emailVerification.state).toBe('VERIFIED');
    });

    test('a claimless token is reported as UNKNOWN, not quietly as verified', async () => {
        const res = await as('claimless-token', request(app).get('/v1/me'));
        expect(res.body.data.emailVerification.state).toBe('UNKNOWN');
    });

    test('the report never contains an email address', async () => {
        // The state is the whole answer. The address itself belongs to auth-service.
        const res = await as('unverified-token', request(app).get('/v1/me'));
        expect(JSON.stringify(res.body)).not.toMatch(/@/);
    });
});

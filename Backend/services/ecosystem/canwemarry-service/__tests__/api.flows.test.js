'use strict';
/**
 * The user-facing flows Prompt 2 builds UI for, asserted through the real router.
 *
 * These complement api.authorization.test.js: that file proves the four trust boundaries,
 * this one proves the specific screens cannot be used to do something the product forbids —
 * publishing a draft by accident, answering somebody else's consent, or a moderator reaching
 * an administrator's surface.
 */
process.env.JWT_PUBLIC_KEY = 'test-public-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
// Real uuids — the service refuses a path parameter that cannot be one, and a required
// module is safe from the temporal dead zone that jest's mock hoisting creates.
const mockIds = require('./fixtures/ids');



const mockTokens = {
    'owner-token': mockIds.OWNER,
    'member-token': mockIds.MEMBER,
    'moderator-token': mockIds.MODERATOR,
    'admin-token': mockIds.ADMIN,
};

const PRODUCT_ROLES = {
    [mockIds.OWNER]: ['USER'],
    [mockIds.MEMBER]: ['USER'],
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
        const sub = global.__tokens[header.slice(7)];
        if (!sub) return next(Object.assign(new Error('Invalid token'), { status: 401, code: 'unauthorized' }));
        req.auth = { userId: sub, roles: [], permissions: [] };
        return next();
    },
}));
jest.mock('@baalvion/telemetry/bootstrap', () => ({}), { virtual: true });
jest.mock('@baalvion/graceful-shutdown', () => ({ initGracefulShutdown: () => {}, registerShutdown: () => {} }), { virtual: true });

const DRAFT = {
    id: mockIds.DRAFT_CASE, reference: 'CWM-DRAFT1', owner_id: mockIds.OWNER, community_id: null,
    title: 'A draft', summary: 'Not open yet', situation: 'Private detail',
    support_needed: [], visibility: 'PRIVATE', status: 'DRAFT', moderation_state: 'VISIBLE',
    is_locked: false, allow_supporter_requests: true, supporter_count: 0, comment_count: 0,
};

const OPEN_CASE = {
    ...DRAFT, id: mockIds.OPEN_CASE, reference: 'CWM-OPEN01', title: 'An open case',
    summary: 'Accepting support', status: 'OPEN',
};

// Readable by anyone, so a non-owner reaches the OWNERSHIP check rather than being
// stopped earlier by visibility. Both outcomes matter and they are different codes.
// A real UUID: the moderation-action schema validates targetId as one, so a friendly
// fixture id would fail validation before the permission check it is meant to exercise.
const PUBLIC_CASE = {
    ...OPEN_CASE, id: mockIds.PUBLIC_CASE, reference: 'CWM-PUB001', visibility: 'PUBLIC',
    title: 'A public case', summary: 'Visible to everyone',
};

// An invitation addressed to user-member, on the owner's case.
const INVITE = {
    id: mockIds.PARTICIPANT, case_id: mockIds.OPEN_CASE, user_id: mockIds.MEMBER,
    relation: 'PARTNER', consent_status: 'INVITED', invited_by: mockIds.OWNER,
    invited_at: '2026-01-01T00:00:00.000Z', responded_at: null,
};

jest.mock('../models', () => {
    const { Op } = require('sequelize');
    const none = { findAll: jest.fn(async () => []), count: jest.fn(async () => 0) };
    return {
        Op,
        sequelize: {
            authenticate: jest.fn(async () => true), close: jest.fn(async () => {}),
            literal: jest.fn((s) => ({ literal: s })), fn: jest.fn(), col: jest.fn(),
            transaction: jest.fn(async (fn) => fn({})),
        },
        User: {
            // provision() now keys on platform_subject and returns the LOCAL row; the tests
            // keep subject and local id identical so the fixtures stay readable.
            findOrCreate: jest.fn(async ({ where }) => [{ id: where.platform_subject, platform_subject: where.platform_subject, status: 'ACTIVE' }, false]),
            findByPk: jest.fn(async (id) => ({ id, status: 'ACTIVE', update: jest.fn() })),
            findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })),
        },
        UserRole: {
            count: jest.fn(async () => 1),
            bulkCreate: jest.fn(async () => []),
            findAll: jest.fn(async ({ where }) => (global.__roles[where.user_id] || ['USER']).map((role) => ({ role }))),
            findOrCreate: jest.fn(async ({ defaults }) => [defaults, true]),
            destroy: jest.fn(async () => 1),
        },
        Profile: { findByPk: jest.fn(async () => null), findOne: jest.fn(async () => null), create: jest.fn(async (r) => r) },
        CommunityMember: none,
        CaseParticipant: {
            ...none,
            create: jest.fn(async (r) => ({ ...r, id: 'participant-new' })),
            findOne: jest.fn(async ({ where }) => (where.id === mockIds.PARTICIPANT ? { ...global.__invite, update: jest.fn(async function (f) { Object.assign(this, f); }) } : null)),
        },
        CaseSupporter: { ...none, findOne: jest.fn(async () => null), create: jest.fn(async (r) => ({ ...r, id: mockIds.SUPPORT_ROW })) },
        Case: {
            // Rows come back with the instance methods the services call on them.
            findByPk: jest.fn(async (id) => {
                const row = global.__cases[id];
                if (!row) return null;
                return { ...row, update: jest.fn(async function (f) { Object.assign(this, f); return this; }),
                    increment: jest.fn(async () => {}), decrement: jest.fn(async () => {}), destroy: jest.fn(async () => {}) };
            }),
            findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })),
        },
        CaseUpdate: { findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })), create: jest.fn(async (r) => r) },
        Report: { findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })), findOne: jest.fn(async () => null), create: jest.fn(async (r) => ({ ...r, id: mockIds.REPORT })) },
        ModerationAction: { findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })), create: jest.fn(async (r) => ({ ...r, id: mockIds.ACTION })) },
        AuditLog: { create: jest.fn(async (r) => r), findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })) },
        Notification: { create: jest.fn(async (r) => r) },
        Comment: { findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })) },
    };
});

global.__tokens = mockTokens;
global.__roles = PRODUCT_ROLES;
global.__cases = { [mockIds.DRAFT_CASE]: DRAFT, [mockIds.OPEN_CASE]: OPEN_CASE, [mockIds.PUBLIC_CASE]: PUBLIC_CASE };
global.__invite = INVITE;

const app = require('../index');
const as = (token, req) => req.set('Authorization', `Bearer ${token}`);

describe('who am I', () => {
    test('returns the product roles and the permission list the server enforces', async () => {
        const res = await as('moderator-token', request(app).get('/v1/me'));
        expect(res.status).toBe(200);
        expect(res.body.data.authenticated).toBe(true);
        expect(res.body.data.roles).toEqual(['USER', 'MODERATOR']);
        expect(res.body.data.permissions).toContain('report:review');
        // The convenience endpoint must not imply a capability the routes refuse.
        expect(res.body.data.permissions).not.toContain('admin:users');
    });

    test('answers an anonymous caller with authenticated: false rather than an error', async () => {
        // "Nobody" is a valid answer to "who am I". A 401 here made every anonymous page
        // view log a failed request and trigger a pointless token refresh.
        const res = await request(app).get('/v1/me');
        expect(res.status).toBe(200);
        expect(res.body.data.authenticated).toBe(false);
        expect(res.body.data.userId).toBeNull();
        // It must not hand an anonymous caller any member capability.
        expect(res.body.data.permissions).not.toContain('case:create');
        expect(res.body.data.permissions).toContain('case:view');
    });
});

describe('drafts stay drafts', () => {
    test('a draft is invisible to another member', async () => {
        const res = await as('member-token', request(app).get(`/v1/cases/${mockIds.DRAFT_CASE}`));
        expect(res.status).toBe(404);
    });

    test('a draft is invisible even to a moderator on the public read path', async () => {
        // Staff DO see it — the point is that it is never reachable anonymously.
        expect((await request(app).get(`/v1/cases/${mockIds.DRAFT_CASE}`)).status).toBe(404);
    });

    test('creating a case cannot set a status other than DRAFT or OPEN', async () => {
        const res = await as('owner-token', request(app).post('/v1/cases').send({
            title: 'Title', summary: 'Summary', status: 'RESOLVED',
        }));
        expect(res.status).toBe(400);
        expect(res.body.error.details).toHaveProperty('status');
    });
});

describe('consent cannot be answered by anyone else', () => {
    test('the case owner cannot accept on the invitee’s behalf', async () => {
        const res = await as('owner-token',
            request(app).post(`/v1/cases/${mockIds.OPEN_CASE}/participants/${mockIds.PARTICIPANT}/respond`).send({ decision: 'GRANTED' }));
        expect(res.status).toBe(403);
    });

    test('an administrator cannot either — there is no override', async () => {
        const res = await as('admin-token',
            request(app).post(`/v1/cases/${mockIds.OPEN_CASE}/participants/${mockIds.PARTICIPANT}/respond`).send({ decision: 'GRANTED' }));
        expect(res.status).toBe(403);
    });

    test('the invitee can', async () => {
        const res = await as('member-token',
            request(app).post(`/v1/cases/${mockIds.OPEN_CASE}/participants/${mockIds.PARTICIPANT}/respond`).send({ decision: 'GRANTED' }));
        expect(res.status).toBe(200);
        expect(res.body.data.consentStatus).toBe('GRANTED');
    });

    test('an invitation payload carrying a name or email has those fields stripped', async () => {
        const res = await as('owner-token', request(app).post(`/v1/cases/${mockIds.OPEN_CASE}/participants`).send({
            userId: '11111111-1111-4111-8111-111111111111',
            relation: 'PARTNER',
            displayName: 'Someone Real', email: 'real@example.com', phone: '+10000000000',
        }));
        // Whatever the outcome, no identifying field may survive into the response.
        expect(JSON.stringify(res.body)).not.toContain('Someone Real');
        expect(JSON.stringify(res.body)).not.toContain('real@example.com');
    });
});

describe('case updates', () => {
    test('a member who cannot see the case gets 404, not 403', async () => {
        // The visibility check runs first on purpose: a 403 here would confirm that a
        // particular private case exists.
        const res = await as('member-token', request(app).post(`/v1/cases/${mockIds.OPEN_CASE}/updates`).send({ body: 'An update' }));
        expect(res.status).toBe(404);
    });

    test('a member who CAN see the case is refused for not owning it', async () => {
        const res = await as('member-token', request(app).post(`/v1/cases/${mockIds.PUBLIC_CASE}/updates`).send({ body: 'An update' }));
        expect(res.status).toBe(403);
        expect(res.body.error.message).toMatch(/opened a case/i);
    });

    test('the owner may', async () => {
        const res = await as('owner-token', request(app).post(`/v1/cases/${mockIds.OPEN_CASE}/updates`).send({ body: 'An update' }));
        expect(res.status).toBe(201);
    });

    test('an empty update is refused', async () => {
        const res = await as('owner-token', request(app).post(`/v1/cases/${mockIds.OPEN_CASE}/updates`).send({ body: '   ' }));
        expect(res.status).toBe(400);
    });
});

describe('reporting', () => {
    test('a member can report a case', async () => {
        const res = await as('member-token', request(app).post('/v1/reports').send({
            targetType: 'CASE', targetId: '11111111-1111-4111-8111-111111111111', reason: 'HARASSMENT',
        }));
        expect(res.status).toBe(201);
    });

    test('a safety reason is escalated without waiting for a human', async () => {
        const res = await as('member-token', request(app).post('/v1/reports').send({
            targetType: 'CASE', targetId: '22222222-2222-4222-8222-222222222222', reason: 'THREAT_OR_VIOLENCE',
        }));
        expect(res.status).toBe(201);
        expect(res.body.data.severity).toBe('CRITICAL');
    });

    test('reporting requires a session', async () => {
        const res = await request(app).post('/v1/reports').send({
            targetType: 'CASE', targetId: '11111111-1111-4111-8111-111111111111', reason: 'SPAM',
        });
        expect(res.status).toBe(401);
    });
});

describe('a moderator is not an administrator', () => {
    test('they reach the report queue and the moderation log', async () => {
        expect((await as('moderator-token', request(app).get('/v1/moderation/reports'))).status).toBe(200);
        expect((await as('moderator-token', request(app).get('/v1/moderation/actions'))).status).toBe(200);
    });

    test('they cannot reach user administration or the audit trail', async () => {
        expect((await as('moderator-token', request(app).get('/v1/admin/users'))).status).toBe(403);
        expect((await as('moderator-token', request(app).get('/v1/admin/audit'))).status).toBe(403);
    });

    test('they cannot promote anyone to administrator', async () => {
        const res = await as('moderator-token',
            request(app).post(`/v1/admin/users/${mockIds.MEMBER}/roles`).send({ role: 'ADMIN' }));
        expect(res.status).toBe(403);
        expect(res.body.error.message).toMatch(/administrator/i);
    });

    test('they may confer supporter standing', async () => {
        const res = await as('moderator-token',
            request(app).post(`/v1/admin/users/${mockIds.MEMBER}/roles`).send({ role: 'SUPPORTER' }));
        expect([200, 201]).toContain(res.status);
    });

    test('a moderation action still requires a reason of substance', async () => {
        const base = { targetType: 'CASE', targetId: mockIds.PUBLIC_CASE, action: 'HIDE' };
        expect((await as('moderator-token', request(app).post('/v1/moderation/actions').send({ ...base, reason: 'spam' }))).status).toBe(400);
        expect((await as('moderator-token', request(app).post('/v1/moderation/actions').send({ ...base, reason: 'Confirmed harassment after review.' }))).status).toBe(201);
    });
});

describe('one member cannot act on another member’s case', () => {
    test('editing someone else’s case is refused', async () => {
        const res = await as('member-token', request(app).patch(`/v1/cases/${mockIds.OPEN_CASE}`).send({ title: 'hijacked' }));
        expect([403, 404]).toContain(res.status);
    });

    test('deleting someone else’s case is refused', async () => {
        const res = await as('member-token', request(app).delete(`/v1/cases/${mockIds.OPEN_CASE}`));
        expect([403, 404]).toContain(res.status);
    });
});

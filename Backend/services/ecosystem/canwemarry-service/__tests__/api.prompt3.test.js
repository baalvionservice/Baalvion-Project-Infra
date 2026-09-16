'use strict';
/**
 * The authorization boundaries added in this round, through the real router.
 *
 * Covers post ownership, community creation standing, suspension, report visibility and
 * case-reference privacy — each of which is a place where a client could plausibly assume
 * the UI was the control.
 */
process.env.JWT_PUBLIC_KEY = 'test-public-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');

const mockTokens = {
    'author-token': 'user-author',
    'member-token': 'user-member',
    'volunteer-token': 'user-volunteer',
    'moderator-token': 'user-moderator',
    'admin-token': 'user-admin',
};

const PRODUCT_ROLES = {
    'user-author': ['USER'],
    'user-member': ['USER'],
    'user-volunteer': ['USER', 'VOLUNTEER'],
    'user-moderator': ['USER', 'MODERATOR'],
    'user-admin': ['USER', 'ADMIN'],
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

const PUBLIC_CASE_ID = '33333333-3333-4333-8333-333333333333';
const PRIVATE_CASE_ID = '44444444-4444-4444-8444-444444444444';

const PUBLIC_CASE = {
    id: PUBLIC_CASE_ID, reference: 'CWM-PUB001', owner_id: 'user-author', community_id: null,
    title: 'Public', summary: 'Visible', situation: 'Detail', support_needed: [],
    visibility: 'PUBLIC', status: 'OPEN', moderation_state: 'VISIBLE',
    is_locked: false, allow_supporter_requests: true, supporter_count: 0, comment_count: 0,
};
const PRIVATE_CASE = { ...PUBLIC_CASE, id: PRIVATE_CASE_ID, reference: 'CWM-PRV001', visibility: 'PRIVATE' };

const POST = {
    id: '55555555-5555-4555-8555-555555555555', community_id: 'c1', author_id: 'user-author',
    title: 'A post', body: 'Body', moderation_state: 'VISIBLE', is_locked: false, comment_count: 0,
};

jest.mock('../models', () => {
    const { Op } = require('sequelize');
    const none = { findAll: jest.fn(async () => []), count: jest.fn(async () => 0) };
    const withMethods = (row) => (row ? {
        ...row,
        update: jest.fn(async function (f) { Object.assign(this, f); return this; }),
        destroy: jest.fn(async () => {}), increment: jest.fn(async () => {}), decrement: jest.fn(async () => {}),
    } : null);
    return {
        Op,
        sequelize: {
            authenticate: jest.fn(async () => true), close: jest.fn(async () => {}),
            literal: jest.fn((s) => ({ literal: s })), fn: jest.fn(), col: jest.fn(),
            transaction: jest.fn(async (fn) => fn({})),
        },
        User: {
            findOrCreate: jest.fn(async ({ where, defaults }) => [{ id: where.platform_subject, platform_subject: where.platform_subject, status: 'ACTIVE', ...defaults }, false]),
            findByPk: jest.fn(async (id) => withMethods({ id, status: 'ACTIVE' })),
            findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })),
        },
        UserRole: {
            count: jest.fn(async () => 1), bulkCreate: jest.fn(async () => []),
            findAll: jest.fn(async ({ where }) => (global.__roles[where.user_id] || ['USER']).map((role) => ({ role }))),
            findOrCreate: jest.fn(async ({ defaults }) => [defaults, true]), destroy: jest.fn(async () => 1),
        },
        Profile: { findByPk: jest.fn(async () => null), findOne: jest.fn(async () => null) },
        CommunityMember: { ...none, findOne: jest.fn(async () => null), create: jest.fn(async (r) => r) },
        Community: {
            findByPk: jest.fn(async () => null),
            findOne: jest.fn(async () => null),
            findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })),
            create: jest.fn(async (r) => ({ ...r, id: 'new-community', created_at: new Date() })),
        },
        Case: {
            findByPk: jest.fn(async (id) => withMethods(global.__cases[id])),
            findOne: jest.fn(async ({ where }) => withMethods(Object.values(global.__cases).find((c) => c.reference === where.reference))),
            findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })),
            count: jest.fn(async () => 0),
        },
        CaseParticipant: { ...none, findOne: jest.fn(async () => null), create: jest.fn(async (r) => ({ ...r, id: 'p1' })) },
        CaseSupporter: { ...none, findOne: jest.fn(async () => null) },
        CaseUpdate: { findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })), create: jest.fn(async (r) => r) },
        CaseInvitation: {
            create: jest.fn(async (r) => ({ ...r, id: 'inv-1', status: 'PENDING', created_at: new Date() })),
            findOne: jest.fn(async () => null),
            findAll: jest.fn(async () => []),
        },
        Post: { findByPk: jest.fn(async (id) => withMethods(global.__posts[id])), findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })) },
        Comment: { destroy: jest.fn(async () => 1), findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })) },
        Report: {
            findAndCountAll: jest.fn(async () => ({ rows: [global.__report], count: 1 })),
            findOne: jest.fn(async () => null), findByPk: jest.fn(async () => withMethods(global.__report)),
            create: jest.fn(async (r) => ({ ...r, id: 'r1' })),
        },
        ModerationAction: { findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })), create: jest.fn(async (r) => ({ ...r, id: 'a1' })) },
        AuditLog: { create: jest.fn(async (r) => r), findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })) },
        Notification: { create: jest.fn(async (r) => r) },
    };
});

global.__tokens = mockTokens;
global.__roles = PRODUCT_ROLES;
global.__cases = { [PUBLIC_CASE_ID]: PUBLIC_CASE, [PRIVATE_CASE_ID]: PRIVATE_CASE };
global.__posts = { [POST.id]: POST };
global.__report = {
    id: 'r1', reporter_id: 'user-member', target_type: 'CASE', target_id: PUBLIC_CASE_ID,
    reason: 'HARASSMENT', details: 'internal detail', severity: 'NORMAL', status: 'ACTIONED',
    assigned_to: 'user-moderator', resolution_note: 'MODERATOR PRIVATE NOTE', resolved_at: new Date(), created_at: new Date(),
};

const app = require('../index');
const as = (token, req) => req.set('Authorization', `Bearer ${token}`);

describe('post ownership', () => {
    test('another member cannot edit a post they did not write', async () => {
        const res = await as('member-token', request(app).patch(`/v1/posts/${POST.id}`).send({ title: 'hijacked' }));
        expect([403, 404]).toContain(res.status);
    });

    test('another member cannot delete it either', async () => {
        const res = await as('member-token', request(app).delete(`/v1/posts/${POST.id}`));
        expect([403, 404]).toContain(res.status);
    });

    test('a moderator cannot edit someone’s post through the ordinary route', async () => {
        // Moderation happens through moderation/actions, with a recorded reason — not by
        // quietly rewriting what somebody said.
        const res = await as('moderator-token', request(app).patch(`/v1/posts/${POST.id}`).send({ title: 'edited' }));
        expect([403, 404]).toContain(res.status);
    });

    test('editing requires a session at all', async () => {
        expect((await request(app).patch(`/v1/posts/${POST.id}`).send({ title: 'x' })).status).toBe(401);
    });
});

describe('community creation standing', () => {
    const payload = { slug: 'a-new-group', name: 'A new group', purpose: 'For people in a shared situation.' };

    test('a plain member is refused', async () => {
        const res = await as('member-token', request(app).post('/v1/communities').send(payload));
        expect(res.status).toBe(403);
    });

    test('a volunteer may', async () => {
        const res = await as('volunteer-token', request(app).post('/v1/communities').send(payload));
        expect(res.status).toBe(201);
    });

    test('purpose and rules are accepted; unknown fields are stripped', async () => {
        const res = await as('volunteer-token', request(app).post('/v1/communities').send({
            ...payload, rules: 'Be kind.', isVerified: true,
        }));
        expect(res.status).toBe(201);
        expect(res.body.data.purpose).toBe(payload.purpose);
        expect(res.body.data.rules).toBe('Be kind.');
        expect(res.body.data).not.toHaveProperty('isVerified');
    });

    test('a client cannot inflate its own community counts', async () => {
        // memberCount and postCount ARE returned — they are server counts. What must not
        // happen is a caller supplying them: a hub that could be told it has 9999 members
        // is the same category of dishonesty as a fabricated testimonial.
        const res = await as('volunteer-token', request(app).post('/v1/communities').send({
            ...payload, slug: 'counted-group', memberCount: 9999, postCount: 4242,
        }));
        expect(res.status).toBe(201);
        expect(res.body.data.memberCount).toBe(0);
        expect(res.body.data.postCount).toBe(0);
    });
});

describe('suspension', () => {
    const suspend = { targetType: 'USER', targetId: '11111111-1111-4111-8111-111111111111', action: 'SUSPEND', reason: 'Repeated harassment after a warning.' };

    test('a plain member cannot suspend anyone', async () => {
        expect((await as('member-token', request(app).post('/v1/moderation/actions').send(suspend))).status).toBe(403);
    });

    test('a moderator can, and the expiry is carried through', async () => {
        const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
        const res = await as('moderator-token', request(app).post('/v1/moderation/actions').send({ ...suspend, expiresAt }));
        expect(res.status).toBe(201);
        // The backend really does store an expiry, so the duration picker is not a fiction.
        expect(res.body.data.expiresAt).toBeTruthy();
    });

    test('a reason of substance is still required', async () => {
        const res = await as('moderator-token', request(app).post('/v1/moderation/actions').send({ ...suspend, reason: 'bad' }));
        expect(res.status).toBe(400);
    });
});

describe('report visibility', () => {
    test('a reporter sees the outcome but never the moderator or their notes', async () => {
        const res = await as('member-token', request(app).get('/v1/me/reports'));
        expect(res.status).toBe(200);
        const body = JSON.stringify(res.body);
        expect(body).not.toContain('MODERATOR PRIVATE NOTE');
        expect(body).not.toContain('user-moderator');
        for (const row of res.body.data) {
            expect(row).not.toHaveProperty('resolutionNote');
            expect(row).not.toHaveProperty('assignedTo');
            expect(row).toHaveProperty('status');
        }
    });

    test('the moderator queue stays closed to a plain member', async () => {
        expect((await as('member-token', request(app).get('/v1/moderation/reports'))).status).toBe(403);
    });
});

describe('case reference privacy', () => {
    test('a public case resolves by reference', async () => {
        const res = await request(app).get(`/v1/cases/reference/${PUBLIC_CASE.reference}`);
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(PUBLIC_CASE_ID);
    });

    test('a private case answers 404 by reference, exactly as by id', async () => {
        // References are short and typed by hand, so this is the endpoint somebody would
        // guess at. It must not confirm that a reference is real.
        const byRef = await as('member-token', request(app).get(`/v1/cases/reference/${PRIVATE_CASE.reference}`));
        const byId = await as('member-token', request(app).get(`/v1/cases/${PRIVATE_CASE_ID}`));
        expect(byRef.status).toBe(404);
        expect(byId.status).toBe(404);
        expect(byRef.body.error.code).toBe(byId.body.error.code);
    });

    test('an invented reference answers the same way', async () => {
        const res = await request(app).get('/v1/cases/reference/CWM-ZZZZZZ');
        expect(res.status).toBe(404);
    });
});

describe('malformed input', () => {
    test('a body that is not JSON answers 400, not 500', async () => {
        // express.json() throws a SyntaxError before any handler runs. Reporting it as a
        // server fault sent callers hunting for a problem at our end.
        const res = await as('member-token', request(app)
            .post('/v1/reports')
            .set('Content-Type', 'application/json')
            .send('{"targetType": broken'));
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    test('the refusal quotes nothing back from the body', async () => {
        const res = await as('member-token', request(app)
            .post('/v1/reports')
            .set('Content-Type', 'application/json')
            .send('{"secretValue": zzzsecretzzz'));
        expect(JSON.stringify(res.body)).not.toContain('zzzsecretzzz');
    });
});

describe('invitations through the router', () => {
    test('creating one requires a session', async () => {
        const res = await request(app).post(`/v1/cases/${PUBLIC_CASE_ID}/invitations`).send({ relation: 'PARTNER' });
        expect(res.status).toBe(401);
    });

    test('a name or email on the payload is stripped before it reaches the service', async () => {
        const res = await as('author-token', request(app).post(`/v1/cases/${PUBLIC_CASE_ID}/invitations`).send({
            relation: 'PARTNER', displayName: 'Someone Real', email: 'real@example.com',
        }));
        expect(res.status).toBe(201);
        expect(JSON.stringify(res.body)).not.toContain('Someone Real');
        expect(JSON.stringify(res.body)).not.toContain('real@example.com');
    });

    test('a malformed code is rejected before any lookup', async () => {
        const res = await request(app).get('/v1/invitations/not-a-valid-code');
        expect([400, 404]).toContain(res.status);
    });
});

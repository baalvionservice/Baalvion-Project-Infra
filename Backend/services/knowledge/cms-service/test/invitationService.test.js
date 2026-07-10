'use strict';
// Unit tests for invitationService's business logic — the accept/create/revoke/resend
// guard rails. No Postgres: `../models` and `./identityService` are replaced in
// require.cache with in-memory stubs BEFORE the service is required (mirrors
// services/commerce/inventory-service/tests/reservation.test.js). What's asserted is the
// SERVICE LOGIC (status transitions, email-match guard, membership upsert-not-duplicate),
// not Sequelize itself — the real transaction/locking is exercised by the live e2e run,
// not by this suite.
const path = require('path');
const crypto = require('crypto');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const MODELS_PATH = require.resolve(path.join(__dirname, '..', 'models'));
const IDENTITY_PATH = require.resolve(path.join(__dirname, '..', 'service', 'identityService'));

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

let invitationRows;
let memberRows;
let authorRows;
let websiteRows;
let idSeq;
let users; // identityService stub backing store: id -> { id, email, fullName }

function makeRow(table, data) {
    const row = {
        ...data,
        async update(patch) {
            Object.assign(row, patch);
            return row;
        },
        toJSON() {
            const { update, toJSON, ...plain } = row;
            return plain;
        },
    };
    table.set(row.id, row);
    return row;
}

function makeModelsStub() {
    const txStub = { LOCK: { UPDATE: 'UPDATE' } };

    const CmsInvitation = {
        async findOne({ where }) {
            for (const row of invitationRows.values()) {
                if (where.tokenHash && row.tokenHash !== where.tokenHash) continue;
                if (where.id && row.id !== where.id) continue;
                if (where.websiteId && row.websiteId !== where.websiteId) continue;
                if (where.email && row.email !== where.email) continue;
                if (where.status && row.status !== where.status) continue;
                return row;
            }
            return null;
        },
        async findAll({ where }) {
            return [...invitationRows.values()].filter((row) => {
                if (where.websiteId && row.websiteId !== where.websiteId) return false;
                if (where.email && row.email !== where.email) return false;
                if (where.status && row.status !== where.status) return false;
                return true;
            });
        },
        async create(data) {
            return makeRow(invitationRows, { id: `inv-${idSeq++}`, createdAt: new Date(), updatedAt: new Date(), ...data });
        },
    };

    const CmsWebsiteMember = {
        async findOne({ where }) {
            for (const row of memberRows.values()) {
                if (where.websiteId && row.websiteId !== where.websiteId) continue;
                if (where.userId && row.userId !== where.userId) continue;
                return row;
            }
            return null;
        },
        async create(data) {
            return makeRow(memberRows, { id: `mem-${idSeq++}`, ...data });
        },
    };

    const CmsAuthor = {
        async findOne({ where }) {
            for (const row of authorRows.values()) {
                if (where.websiteId && row.websiteId !== where.websiteId) continue;
                if (where.slug && row.slug !== where.slug) continue;
                return row;
            }
            return null;
        },
        async create(data) {
            return makeRow(authorRows, { id: `auth-${idSeq++}`, ...data });
        },
    };

    const CmsWebsite = {
        async findByPk(id) {
            return websiteRows.get(id) || null;
        },
        async findOne({ where }) {
            for (const row of websiteRows.values()) {
                if (where.id && row.id !== where.id) continue;
                return row;
            }
            return null;
        },
    };

    const sequelize = {
        async transaction(fn) {
            return fn(txStub);
        },
    };

    return { sequelize, CmsInvitation, CmsWebsiteMember, CmsAuthor, CmsWebsite, Sequelize: { Op: {} } };
}

function makeIdentityStub() {
    return {
        async findByEmail(email) {
            return [...users.values()].find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
        },
        async mapByIds(ids) {
            const map = new Map();
            for (const id of ids) {
                const u = users.get(String(id));
                if (u) map.set(String(id), u);
            }
            return map;
        },
        async search() { return []; },
    };
}

function loadService() {
    require.cache[MODELS_PATH] = { id: MODELS_PATH, filename: MODELS_PATH, loaded: true, exports: makeModelsStub() };
    require.cache[IDENTITY_PATH] = { id: IDENTITY_PATH, filename: IDENTITY_PATH, loaded: true, exports: makeIdentityStub() };
    delete require.cache[require.resolve('../service/invitationService')];
    return require('../service/invitationService');
}

const WEBSITE_ID = 'site-1';

beforeEach(() => {
    invitationRows = new Map();
    memberRows = new Map();
    authorRows = new Map();
    websiteRows = new Map();
    users = new Map();
    idSeq = 1;

    websiteRows.set(WEBSITE_ID, { id: WEBSITE_ID, slug: 'imperialpedia', name: 'Imperialpedia' });
    users.set('42', { id: 42, email: 'jane@example.com', fullName: 'Jane Writer' });
    users.set('99', { id: 99, email: 'someone-else@example.com', fullName: 'Someone Else' });
});

function seedInvitation(overrides = {}) {
    const rawToken = 'raw-token-fixture';
    const row = makeRow(invitationRows, {
        id: 'inv-fixture',
        websiteId: WEBSITE_ID,
        email: 'jane@example.com',
        role: 'cms_author',
        inviterId: 7,
        inviterName: 'Editor',
        personalNote: null,
        tokenHash: hashToken(rawToken),
        status: 'pending',
        acceptedBy: null,
        acceptedAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
        ...overrides,
    });
    return { rawToken, row };
}

test('acceptInvitation throws NOT_FOUND for an unknown token', async () => {
    const svc = loadService();
    await assert.rejects(
        () => svc.acceptInvitation('does-not-exist', 42, { name: 'Jane', expertise: [] }),
        (err) => err.code === 'NOT_FOUND',
    );
});

test('acceptInvitation throws CONFLICT when already accepted', async () => {
    const { rawToken } = seedInvitation({ status: 'accepted' });
    const svc = loadService();
    await assert.rejects(
        () => svc.acceptInvitation(rawToken, 42, { name: 'Jane', expertise: [] }),
        (err) => err.code === 'CONFLICT',
    );
});

test('acceptInvitation throws GONE when revoked', async () => {
    const { rawToken } = seedInvitation({ status: 'revoked' });
    const svc = loadService();
    await assert.rejects(
        () => svc.acceptInvitation(rawToken, 42, { name: 'Jane', expertise: [] }),
        (err) => err.code === 'GONE',
    );
});

test('acceptInvitation throws GONE and flips status to expired when past expiresAt', async () => {
    const { rawToken, row } = seedInvitation({ expiresAt: new Date(Date.now() - 1000) });
    const svc = loadService();
    await assert.rejects(
        () => svc.acceptInvitation(rawToken, 42, { name: 'Jane', expertise: [] }),
        (err) => err.code === 'GONE',
    );
    assert.equal(row.status, 'expired');
});

test('acceptInvitation throws FORBIDDEN when the caller email does not match the invitation', async () => {
    const { rawToken } = seedInvitation();
    const svc = loadService();
    await assert.rejects(
        () => svc.acceptInvitation(rawToken, 99, { name: 'Someone Else', expertise: [] }),
        (err) => err.code === 'FORBIDDEN',
    );
});

test('acceptInvitation happy path creates membership + author profile and marks accepted', async () => {
    const { rawToken, row } = seedInvitation();
    const svc = loadService();
    const result = await svc.acceptInvitation(rawToken, 42, {
        name: 'Jane Writer', title: 'Correspondent', expertise: ['Markets'],
    });

    assert.equal(result.websiteId, WEBSITE_ID);
    assert.equal(result.redirectTo, '/welcome');
    assert.equal(row.status, 'accepted');
    assert.equal(row.acceptedBy, 42);

    const member = [...memberRows.values()].find((m) => m.websiteId === WEBSITE_ID && m.userId === 42);
    assert.ok(member, 'expected a membership row to be created');
    assert.equal(member.role, 'cms_author');

    const author = [...authorRows.values()].find((a) => a.websiteId === WEBSITE_ID);
    assert.ok(author, 'expected an author profile to be created');
    assert.equal(author.name, 'Jane Writer');
    assert.deepEqual(author.expertise, ['Markets']);
});

test('acceptInvitation updates role instead of duplicating an existing membership', async () => {
    makeRow(memberRows, { id: 'existing-member', websiteId: WEBSITE_ID, userId: 42, role: 'cms_viewer' });
    const { rawToken } = seedInvitation({ role: 'cms_editor' });
    const svc = loadService();
    await svc.acceptInvitation(rawToken, 42, { name: 'Jane Writer', expertise: [] });

    const membersForSite = [...memberRows.values()].filter((m) => m.websiteId === WEBSITE_ID && m.userId === 42);
    assert.equal(membersForSite.length, 1, 'must not create a second membership row');
    assert.equal(membersForSite[0].role, 'cms_editor');
});

test('createInvitation supersedes a prior pending invite for the same email+website', async () => {
    const { row: oldRow } = seedInvitation();
    const svc = loadService();
    const website = websiteRows.get(WEBSITE_ID);

    const fresh = await svc.createInvitation(website, 'jane@example.com', 'cms_author', { inviterId: 7 });

    assert.equal(oldRow.status, 'revoked');
    assert.equal(fresh.status, 'pending');
    assert.equal(fresh.email, 'jane@example.com');
});

test('revokeInvitation throws CONFLICT for a non-pending invitation', async () => {
    seedInvitation({ status: 'accepted' });
    const svc = loadService();
    await assert.rejects(
        () => svc.revokeInvitation(WEBSITE_ID, 'inv-fixture'),
        (err) => err.code === 'CONFLICT',
    );
});

test('revokeInvitation marks a pending invitation as revoked', async () => {
    const { row } = seedInvitation();
    const svc = loadService();
    await svc.revokeInvitation(WEBSITE_ID, 'inv-fixture');
    assert.equal(row.status, 'revoked');
});

test('resendInvitation mints a fresh token, reusing the original role and note', async () => {
    seedInvitation({ personalNote: 'Original note', role: 'cms_editor' });
    const svc = loadService();
    const website = websiteRows.get(WEBSITE_ID);
    const resent = await svc.resendInvitation(website, 'inv-fixture', 7);

    assert.equal(resent.role, 'cms_editor');
    assert.equal(resent.personalNote, 'Original note');
    assert.equal(resent.status, 'pending');
});

test('resendInvitation throws CONFLICT for an already-accepted invitation', async () => {
    seedInvitation({ status: 'accepted' });
    const svc = loadService();
    const website = websiteRows.get(WEBSITE_ID);
    await assert.rejects(
        () => svc.resendInvitation(website, 'inv-fixture', 7),
        (err) => err.code === 'CONFLICT',
    );
});

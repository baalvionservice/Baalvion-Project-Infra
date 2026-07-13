'use strict';
// Unit tests for contentService's CmsCategory.contentCount bookkeeping. Before this fix,
// content create/update/delete/bulk-assign never touched CmsCategory.contentCount — the
// admin taxonomy tree (CategoryTree.tsx) always rendered "0" next to every category
// regardless of how much real content was assigned to it. These tests assert the counter
// tracks assignment/reassignment/removal correctly, including the case bulk assign_category
// must get right: multiple content items leaving DIFFERENT old categories for the same new
// one (a naive `IN (...)` decrement would under-count duplicates across separate rows).
//
// No Postgres/Redis: `../models` and `./cacheService` are replaced in require.cache with
// in-memory stubs before the service is required (mirrors invitationService.test.js).
const path = require('path');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');

const MODELS_PATH = require.resolve(path.join(__dirname, '..', 'models'));
const CACHE_PATH = require.resolve(path.join(__dirname, '..', 'service', 'cacheService'));

let contentRows;
let categoryRows;
let tagRows;
let idSeq;

function makeRow(table, data) {
    const row = {
        ...data,
        async update(patch) {
            Object.assign(row, patch);
            return row;
        },
        async destroy() {
            table.delete(row.id);
        },
        toJSON() {
            const { update, destroy, toJSON, ...plain } = row;
            return plain;
        },
    };
    table.set(row.id, row);
    return row;
}

function matches(where, row) {
    if (where.id) {
        if (where.id[Op.in]) { if (!where.id[Op.in].includes(row.id)) return false; }
        else if (where.id[Op.ne]) { if (row.id === where.id[Op.ne]) return false; }
        else if (row.id !== where.id) return false;
    }
    if (where.websiteId && row.websiteId !== where.websiteId) return false;
    if (where.slug && row.slug !== where.slug) return false;
    if (where.deletionRequestedAt && typeof where.deletionRequestedAt === 'object') {
        // Unset (undefined) is NULL in a real DB column too — `IS NOT NULL` excludes it.
        if (Op.ne in where.deletionRequestedAt && where.deletionRequestedAt[Op.ne] === null && row.deletionRequestedAt == null) return false;
    }
    return true;
}

function makeModelsStub() {
    const txStub = {};

    const CmsCategory = {
        async count({ where }) {
            return [...categoryRows.values()].filter((r) => matches(where, r)).length;
        },
        async findByPk(id) {
            return categoryRows.get(id) || null;
        },
        async increment(field, { by, where }) {
            for (const row of categoryRows.values()) {
                if (matches(where, row)) row[field] = (row[field] || 0) + by;
            }
        },
    };

    const CmsTag = {
        async findAll({ where }) {
            return [...tagRows.values()].filter((r) => matches(where, r));
        },
        async increment() { /* not under test here */ },
    };

    const CmsContent = {
        async findOne({ where }) {
            return [...contentRows.values()].find((r) => matches(where, r)) || null;
        },
        async findAll({ where }) {
            return [...contentRows.values()].filter((r) => matches(where, r));
        },
        async create(data) {
            return makeRow(contentRows, { id: `content-${idSeq++}`, createdAt: new Date(), updatedAt: new Date(), ...data });
        },
        // Mirrors real Sequelize: a static bulk `Model.update()` issues a detached SQL
        // UPDATE — it must NOT mutate JS instances a caller already fetched via findAll
        // (contentService's bulkUpdate reads `contents` before calling this). Replacing
        // the map entry with a fresh row (rather than Object.assign on the same object)
        // keeps that aliasing-free.
        async update(patch, { where }) {
            for (const row of [...contentRows.values()]) {
                if (matches(where, row)) makeRow(contentRows, { ...row.toJSON(), ...patch });
            }
        },
        async destroy({ where }) {
            for (const row of [...contentRows.values()]) {
                if (matches(where, row)) contentRows.delete(row.id);
            }
        },
    };

    const CmsWorkflow = { async create() { return {}; } };
    const CmsWebsite = { async findByPk() { return null; } };

    const sequelize = { transaction: async (fn) => fn(txStub) };

    return { sequelize, CmsContent, CmsCategory, CmsTag, CmsWorkflow, CmsContentRevision: {}, CmsWebsite };
}

function makeCacheStub() {
    return {
        async get() { return null; },
        async set() {},
        async del() {},
        async delPattern() {},
        keys: {
            categoryTree: (id) => `cms:categories:${id}`,
            tagList: (id) => `cms:tags:${id}`,
            content: (id) => `cms:content:${id}`,
        },
    };
}

function loadService() {
    require.cache[MODELS_PATH] = { id: MODELS_PATH, filename: MODELS_PATH, loaded: true, exports: makeModelsStub() };
    require.cache[CACHE_PATH] = { id: CACHE_PATH, filename: CACHE_PATH, loaded: true, exports: makeCacheStub() };
    delete require.cache[require.resolve('../service/contentService')];
    return require('../service/contentService');
}

const WEBSITE_ID = 'site-1';

beforeEach(() => {
    contentRows = new Map();
    categoryRows = new Map();
    tagRows = new Map();
    idSeq = 1;

    makeRow(categoryRows, { id: 'cat-a', websiteId: WEBSITE_ID, name: 'Markets', contentCount: 0 });
    makeRow(categoryRows, { id: 'cat-b', websiteId: WEBSITE_ID, name: 'Crypto', contentCount: 0 });
    makeRow(categoryRows, { id: 'cat-c', websiteId: WEBSITE_ID, name: 'Economy', contentCount: 0 });
});

test('createContent increments contentCount for every assigned category', async () => {
    const contentService = loadService();
    await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'Fed Holds Rates',
        contentType: 'news',
        featuredImage: 'https://example.com/manual.png',
        categoryIds: ['cat-a', 'cat-b'],
    });

    assert.equal(categoryRows.get('cat-a').contentCount, 1);
    assert.equal(categoryRows.get('cat-b').contentCount, 1);
    assert.equal(categoryRows.get('cat-c').contentCount, 0);
});

test('updateContent moving categories decrements the old and increments the new', async () => {
    const contentService = loadService();
    const created = await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'Yen Slides',
        contentType: 'news',
        featuredImage: 'https://example.com/manual.png',
        categoryIds: ['cat-a'],
    });
    assert.equal(categoryRows.get('cat-a').contentCount, 1);

    await contentService.updateContent(WEBSITE_ID, created.id, 'user-1', {
        featuredImage: 'https://example.com/manual.png',
        categoryIds: ['cat-c'],
    });

    assert.equal(categoryRows.get('cat-a').contentCount, 0);
    assert.equal(categoryRows.get('cat-c').contentCount, 1);
});

test('deleteContent decrements contentCount for its categories', async () => {
    const contentService = loadService();
    const created = await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'BoJ Hike',
        contentType: 'news',
        featuredImage: 'https://example.com/manual.png',
        categoryIds: ['cat-b'],
    });
    assert.equal(categoryRows.get('cat-b').contentCount, 1);

    await contentService.deleteContent(WEBSITE_ID, created.id);

    assert.equal(categoryRows.get('cat-b').contentCount, 0);
});

test('bulkUpdate assign_category nets out counts when items leave different old categories', async () => {
    const contentService = loadService();
    const a = await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'Article A', contentType: 'news', featuredImage: 'https://example.com/x.png', categoryIds: ['cat-a'],
    });
    const b = await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'Article B', contentType: 'news', featuredImage: 'https://example.com/x.png', categoryIds: ['cat-a'],
    });
    const c = await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'Article C', contentType: 'news', featuredImage: 'https://example.com/x.png', categoryIds: ['cat-b'],
    });
    assert.equal(categoryRows.get('cat-a').contentCount, 2);
    assert.equal(categoryRows.get('cat-b').contentCount, 1);

    await contentService.bulkUpdate(WEBSITE_ID, 'user-1', {
        ids: [a.id, b.id, c.id],
        action: 'assign_category',
        categoryId: 'cat-c',
    });

    // Two items left cat-a (which must drop by exactly 2, not 1, despite a single
    // `IN (...)` decrement call being unsafe for duplicates), one left cat-b.
    assert.equal(categoryRows.get('cat-a').contentCount, 0);
    assert.equal(categoryRows.get('cat-b').contentCount, 0);
    assert.equal(categoryRows.get('cat-c').contentCount, 3);
});

test('bulkUpdate assign_category rejects an unknown target category', async () => {
    const contentService = loadService();
    const a = await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'Article A', contentType: 'news', featuredImage: 'https://example.com/x.png', categoryIds: ['cat-a'],
    });

    await assert.rejects(
        () => contentService.bulkUpdate(WEBSITE_ID, 'user-1', { ids: [a.id], action: 'assign_category', categoryId: 'does-not-exist' }),
        /Category not found/,
    );
    assert.equal(categoryRows.get('cat-a').contentCount, 1);
});

// ── Deletion requests — contributors/authors can't DELETE (requires cms_editor+ at the
// route), so this is their alternative: flag content for an editor/admin to act on. ────
test('requestDeletion flags content without deleting or changing its status', async () => {
    const contentService = loadService();
    const a = await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'Article A', contentType: 'news', featuredImage: 'https://example.com/x.png', categoryIds: ['cat-a'],
    });

    const flagged = await contentService.requestDeletion(WEBSITE_ID, a.id, 'user-2', 'This is outdated and wrong.');

    assert.equal(flagged.deletionRequestedBy, 'user-2');
    assert.ok(flagged.deletionRequestedAt);
    assert.equal(flagged.deletionRequestNote, 'This is outdated and wrong.');
    assert.equal(flagged.status, 'draft');
    assert.ok(contentRows.has(a.id), 'content must still exist — requesting deletion never deletes it');
});

test('requestDeletion works without a note', async () => {
    const contentService = loadService();
    const a = await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'Article A', contentType: 'news', featuredImage: 'https://example.com/x.png', categoryIds: ['cat-a'],
    });

    const flagged = await contentService.requestDeletion(WEBSITE_ID, a.id, 'user-2', undefined);
    assert.equal(flagged.deletionRequestNote, null);
});

test('dismissDeletionRequest clears the flag and leaves content otherwise untouched', async () => {
    const contentService = loadService();
    const a = await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'Article A', contentType: 'news', featuredImage: 'https://example.com/x.png', categoryIds: ['cat-a'],
    });
    await contentService.requestDeletion(WEBSITE_ID, a.id, 'user-2', 'Please remove.');

    const dismissed = await contentService.dismissDeletionRequest(WEBSITE_ID, a.id);

    assert.equal(dismissed.deletionRequestedBy, null);
    assert.equal(dismissed.deletionRequestedAt, null);
    assert.equal(dismissed.deletionRequestNote, null);
    assert.ok(contentRows.has(a.id));
});

test('listDeletionRequests returns only flagged content for the given website', async () => {
    const contentService = loadService();
    const a = await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'Flagged', contentType: 'news', featuredImage: 'https://example.com/x.png', categoryIds: ['cat-a'],
    });
    const b = await contentService.createContent(WEBSITE_ID, 'user-1', {
        title: 'Not flagged', contentType: 'news', featuredImage: 'https://example.com/x.png', categoryIds: ['cat-a'],
    });
    await contentService.requestDeletion(WEBSITE_ID, a.id, 'user-2', 'Remove this.');

    const requests = await contentService.listDeletionRequests(WEBSITE_ID);

    assert.equal(requests.length, 1);
    assert.equal(requests[0].id, a.id);
    assert.notEqual(requests.some((r) => r.id === b.id), true);
});

test('requestDeletion on unknown content throws NOT_FOUND', async () => {
    const contentService = loadService();
    await assert.rejects(
        () => contentService.requestDeletion(WEBSITE_ID, 'does-not-exist', 'user-2', 'note'),
        /Content not found/,
    );
});

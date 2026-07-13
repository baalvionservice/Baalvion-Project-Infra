'use strict';
// Unit tests for authorService.listAuthors' contentCount merge. CmsAuthor.contentCount was
// always stored as 0 and never updated (content links to an author only loosely via
// customFields.authorSlug, no FK) — the admin Authors page permanently showed "0 articles"
// for everyone. The fix computes counts at read time from a CmsContent GROUP BY and merges
// them onto each author by slug. What's under test here is that merge (matching by slug,
// zero for authors with no content, ignoring content whose authorSlug matches no profile) —
// not Sequelize's JSONB SQL translation, which is exercised live, not in this unit suite.
const path = require('path');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const MODELS_PATH = require.resolve(path.join(__dirname, '..', 'models'));

let authorRows;
let contentCountRows; // pre-baked as if Postgres already ran the GROUP BY

function makeModelsStub() {
    const CmsAuthor = {
        async findAll({ where }) {
            return [...authorRows.values()]
                .filter((r) => r.websiteId === where.websiteId)
                .map((r) => ({ ...r, toJSON: () => ({ ...r }) }));
        },
    };

    const CmsContent = {
        // authorService builds a GROUP BY query; the stub doesn't re-implement SQL, it
        // just returns the rows Postgres would produce for the fixtures below.
        async findAll() {
            return contentCountRows;
        },
    };

    return { CmsAuthor, CmsContent };
}

function loadService() {
    require.cache[MODELS_PATH] = { id: MODELS_PATH, filename: MODELS_PATH, loaded: true, exports: makeModelsStub() };
    delete require.cache[require.resolve('../service/authorService')];
    return require('../service/authorService');
}

const WEBSITE_ID = 'site-1';

beforeEach(() => {
    authorRows = new Map();
    contentCountRows = [];

    authorRows.set('auth-1', { id: 'auth-1', websiteId: WEBSITE_ID, slug: 'jane-writer', name: 'Jane Writer', sortOrder: 0 });
    authorRows.set('auth-2', { id: 'auth-2', websiteId: WEBSITE_ID, slug: 'john-analyst', name: 'John Analyst', sortOrder: 1 });
});

test('listAuthors merges real content counts by authorSlug', async () => {
    contentCountRows = [
        { authorSlug: 'jane-writer', count: '5' },
        { authorSlug: 'john-analyst', count: '0' },
    ];
    const authorService = loadService();
    const authors = await authorService.listAuthors(WEBSITE_ID);

    const jane = authors.find((a) => a.slug === 'jane-writer');
    const john = authors.find((a) => a.slug === 'john-analyst');
    assert.equal(jane.contentCount, 5);
    assert.equal(john.contentCount, 0);
});

test('listAuthors returns 0 for an author with no matching content rows at all', async () => {
    contentCountRows = [{ authorSlug: 'jane-writer', count: '3' }];
    const authorService = loadService();
    const authors = await authorService.listAuthors(WEBSITE_ID);

    const john = authors.find((a) => a.slug === 'john-analyst');
    assert.equal(john.contentCount, 0);
});

test('listAuthors ignores content whose authorSlug matches no known author profile', async () => {
    contentCountRows = [
        { authorSlug: 'jane-writer', count: '2' },
        { authorSlug: 'deleted-author-slug', count: '9' },
    ];
    const authorService = loadService();
    const authors = await authorService.listAuthors(WEBSITE_ID);

    assert.equal(authors.length, 2);
    assert.equal(authors.find((a) => a.slug === 'jane-writer').contentCount, 2);
});

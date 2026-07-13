'use strict';
// Unit test for the listPublicContent `authorSlug` filter fix. Before this fix,
// `where.customFields = { authorSlug }` compared the WHOLE customFields jsonb column for
// equality against `{authorSlug}` — real rows always have other keys too (faq, author,
// editorialTeam, ...), so it never matched and any "more from this author" / author-filtered
// listing silently came back empty. The fix uses Sequelize's documented dot-path JSONB key
// (`'customFields.authorSlug'`) instead. This test asserts the query reaches CmsContent with
// that exact key shape and that a matching stub correctly narrows results by it — it isn't
// re-verifying Sequelize's own SQL translation, which is exercised live, not in this suite.
const path = require('path');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const MODELS_PATH = require.resolve(path.join(__dirname, '..', 'models'));

let contentRows;
let capturedWhere;

function makeModelsStub() {
    const CmsWebsite = {
        async findOne({ where }) {
            if (where.slug === 'imperialpedia' && where.status === 'active') {
                return { id: 'site-1', toJSON: () => ({ id: 'site-1', slug: 'imperialpedia' }) };
            }
            return null;
        },
    };

    const CmsContent = {
        async findAndCountAll({ where }) {
            capturedWhere = where;
            const authorSlug = where['customFields.authorSlug'];
            const rows = contentRows.filter((r) => {
                if (r.websiteId !== where.websiteId) return false;
                if (authorSlug !== undefined && r.customFields?.authorSlug !== authorSlug) return false;
                return true;
            });
            return { rows: rows.map((r) => ({ ...r, toJSON: () => r })), count: rows.length };
        },
    };

    const CmsCategory = { async findOne() { return null; } };
    const CmsTag = {};
    const CmsAuthor = {};

    return { CmsWebsite, CmsContent, CmsCategory, CmsTag, CmsAuthor };
}

function loadService() {
    require.cache[MODELS_PATH] = { id: MODELS_PATH, filename: MODELS_PATH, loaded: true, exports: makeModelsStub() };
    delete require.cache[require.resolve('../service/publicService')];
    delete require.cache[require.resolve('../service/contentService')];
    return require('../service/publicService');
}

beforeEach(() => {
    capturedWhere = null;
    contentRows = [
        { id: 'c1', websiteId: 'site-1', title: 'By Jane', customFields: { authorSlug: 'jane-writer', faq: [] } },
        { id: 'c2', websiteId: 'site-1', title: 'By John', customFields: { authorSlug: 'john-analyst' } },
        { id: 'c3', websiteId: 'site-1', title: 'No byline', customFields: { faq: [] } },
    ];
});

test('listPublicContent filters by the dot-path customFields.authorSlug key, not a nested object', async () => {
    const publicService = loadService();
    const { data } = await publicService.listPublicContent('imperialpedia', { authorSlug: 'jane-writer' });

    assert.ok(Object.prototype.hasOwnProperty.call(capturedWhere, 'customFields.authorSlug'));
    assert.equal(capturedWhere['customFields.authorSlug'], 'jane-writer');
    assert.equal(data.length, 1);
    assert.equal(data[0].title, 'By Jane');
});

test('listPublicContent with no authorSlug filter returns all published content', async () => {
    const publicService = loadService();
    const { data } = await publicService.listPublicContent('imperialpedia', {});
    assert.equal(data.length, 3);
});

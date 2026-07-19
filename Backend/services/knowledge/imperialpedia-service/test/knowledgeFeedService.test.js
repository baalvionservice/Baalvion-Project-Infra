'use strict';

// Pure-logic tests for the unified knowledge-feed normalization layer. No live database, no
// network — buildKnowledgeFeed's actual cross-service merge is verified separately against real
// running services (see the local end-to-end verification notes), since it depends on a live
// cms-service internal call.
// Run: node --test

const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeArticle, normalizeCmsContent } = require('../service/knowledgeFeedService');

test('normalizeArticle maps an imperialpedia article row to the unified shape', () => {
    const result = normalizeArticle({
        id: 42,
        title: 'Compound Interest',
        slug: 'compound-interest',
        summary: 'A short summary',
        content: 'Full body text',
        is_premium: true,
        category: 'Investing Basics',
        tags: ['finance', 'basics'],
        published_at: '2026-01-01T00:00:00.000Z',
    });

    assert.deepEqual(result, {
        source: 'article',
        sourceId: '42',
        title: 'Compound Interest',
        slug: 'compound-interest',
        summary: 'A short summary',
        bodyFormat: 'text',
        body: 'Full body text',
        isPremium: true,
        category: 'Investing Basics',
        tags: ['finance', 'basics'],
        publishedAt: '2026-01-01T00:00:00.000Z',
        url: '/articles/compound-interest',
    });
});

test('normalizeArticle defaults missing optional fields to null/empty, never undefined', () => {
    const result = normalizeArticle({ id: 1, title: 'x', slug: 'x', published_at: null });
    assert.equal(result.summary, null);
    assert.equal(result.body, null);
    assert.equal(result.category, null);
    assert.deepEqual(result.tags, []);
    assert.equal(result.isPremium, false);
});

test('normalizeCmsContent maps a cms_content row to the SAME unified shape as an article', () => {
    const result = normalizeCmsContent({
        id: 'c1',
        title: 'Market News',
        slug: 'market-news',
        excerpt: 'Teaser',
        contentBlocks: [{ type: 'paragraph', content: { text: 'body' } }],
        isPremium: false,
        category: { name: 'News' },
        publishedAt: '2026-02-01T00:00:00.000Z',
    });

    assert.deepEqual(Object.keys(result).sort(), [
        'body', 'bodyFormat', 'category', 'isPremium', 'publishedAt', 'slug', 'source', 'sourceId', 'summary', 'tags', 'title', 'url',
    ]);
    assert.equal(result.source, 'cms_content');
    assert.equal(result.bodyFormat, 'blocks');
    assert.deepEqual(result.body, [{ type: 'paragraph', content: { text: 'body' } }]);
    assert.equal(result.category, 'News');
    assert.equal(result.url, '/market-news');
});

test('normalizeCmsContent handles a missing category (null) without throwing', () => {
    const result = normalizeCmsContent({ id: 'c2', title: 'x', slug: 'x', category: null, publishedAt: null });
    assert.equal(result.category, null);
});

test('article and cms_content normalizers agree on field names (true "unified" shape)', () => {
    const articleKeys = Object.keys(normalizeArticle({ id: 1, title: 'x', slug: 'x', published_at: null })).sort();
    const cmsKeys = Object.keys(normalizeCmsContent({ id: 1, title: 'x', slug: 'x', publishedAt: null })).sort();
    assert.deepEqual(articleKeys, cmsKeys);
});

'use strict';
/**
 * Pure unit tests for the about-service request schemas.
 * No DB/network — exercises the zod schemas (pure functions) to pin the
 * defaults, enum gates, slug regex, and pagination caps that callers rely on.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
    paginationSchema,
    createPageSchema,
    updatePageSchema,
    createNewsPostSchema,
    createContactSchema,
    newsListQuerySchema,
} = require('./schemas');

describe('paginationSchema', () => {
    it('applies defaults page=1 limit=20', () => {
        assert.deepStrictEqual(paginationSchema.parse({}), { page: 1, limit: 20 });
    });
    it('coerces numeric strings', () => {
        assert.deepStrictEqual(paginationSchema.parse({ page: '3', limit: '50' }), { page: 3, limit: 50 });
    });
    it('caps limit at 100', () => {
        assert.throws(() => paginationSchema.parse({ limit: 1000 }));
    });
    it('rejects page < 1', () => {
        assert.throws(() => paginationSchema.parse({ page: 0 }));
    });
});

describe('createPageSchema', () => {
    it('accepts a minimal valid page and applies defaults', () => {
        const out = createPageSchema.parse({ title: 'About', slug: 'about-us' });
        assert.strictEqual(out.page_type, 'general');
        assert.strictEqual(out.is_featured, false);
        assert.strictEqual(out.order_index, 0);
    });
    it('rejects an uppercase/invalid slug', () => {
        assert.throws(() => createPageSchema.parse({ title: 'X', slug: 'About Us' }));
    });
    it('rejects an unknown page_type', () => {
        assert.throws(() => createPageSchema.parse({ title: 'X', slug: 'x', page_type: 'wiki' }));
    });
    it('rejects an empty title', () => {
        assert.throws(() => createPageSchema.parse({ title: '', slug: 'x' }));
    });
});

describe('updatePageSchema (partial)', () => {
    it('accepts an empty body (all optional)', () => {
        assert.deepStrictEqual(updatePageSchema.parse({}), {});
    });
    it('still validates provided fields (bad slug rejected)', () => {
        assert.throws(() => updatePageSchema.parse({ slug: 'Bad Slug' }));
    });
});

describe('createNewsPostSchema', () => {
    it('defaults category=news, tags=[], read_time=3', () => {
        const out = createNewsPostSchema.parse({ title: 'T', slug: 'a-post' });
        assert.strictEqual(out.category, 'news');
        assert.deepStrictEqual(out.tags, []);
        assert.strictEqual(out.read_time_minutes, 3);
    });
});

describe('createContactSchema', () => {
    it('requires a valid email and non-empty message', () => {
        const out = createContactSchema.parse({ name: 'A', email: 'a@b.co', message: 'hi' });
        assert.strictEqual(out.inquiry_type, 'general');
    });
    it('rejects a malformed email', () => {
        assert.throws(() => createContactSchema.parse({ name: 'A', email: 'nope', message: 'hi' }));
    });
});

describe('newsListQuerySchema', () => {
    it('coerces paging and accepts optional category/tag', () => {
        const out = newsListQuerySchema.parse({ page: '2', category: 'press' });
        assert.strictEqual(out.page, 2);
        assert.strictEqual(out.category, 'press');
    });
    it('rejects an invalid category', () => {
        assert.throws(() => newsListQuerySchema.parse({ category: 'rumor' }));
    });
});

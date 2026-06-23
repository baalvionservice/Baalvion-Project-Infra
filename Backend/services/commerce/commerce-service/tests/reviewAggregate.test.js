'use strict';
// Review aggregate (C4) — listProductReviews returns a SERVER-COMPUTED ratingAverage/ratingCount
// over ALL approved reviews, not just the loaded page. Mirrors media.test.js: the real
// reviewService runs against a stubbed model/data layer (no DB). Verifies the aggregate is global
// (independent of pagination) and that the page metadata stays correct.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

require('./_env'); // dummy JWT_PUBLIC_KEY so the fail-loud config boots under CI (no .env)
const models = require('../models');
const reviewService = require('../service/reviewService');

const STORE = 'store-1';
const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';

// 13 approved reviews across 2 pages; ratings chosen so AVG = 52/13 = 4.0 exactly.
const RATINGS = [5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 3, 3, 2]; // sum 52, count 13

beforeEach(() => {
    models.CommerceProduct.findOne = async ({ where }) =>
        (where.slug === 'birkin' || where.id === PRODUCT_ID) && where.storeId === STORE
            ? { id: PRODUCT_ID }
            : null;

    const R = models.CommerceReview;
    // findAndCountAll → page of approved reviews (newest first); honors limit/offset.
    R.findAndCountAll = async ({ limit = 10, offset = 0 }) => {
        const all = RATINGS.map((rating, i) => ({
            id: `r${i}`, rating, title: null, body: null, userId: null,
            isVerifiedPurchase: false, status: 'approved', reply: null, replyAt: null,
            createdAt: new Date(2026, 0, RATINGS.length - i),
        }));
        return { rows: all.slice(offset, offset + limit), count: all.length };
    };
    // findAll → the aggregate query (raw AVG/COUNT). Compute it from RATINGS directly.
    R.findAll = async () => {
        const sum = RATINGS.reduce((a, b) => a + b, 0);
        return [{ avg: sum / RATINGS.length, count: RATINGS.length }];
    };
});

test('listProductReviews returns a global ratingAverage/ratingCount over ALL approved reviews', async () => {
    const page = await reviewService.listProductReviews(STORE, 'birkin', { page: 1, limit: 10 });
    assert.equal(page.ratingCount, 13, 'count is the full approved total, not the page size');
    assert.equal(page.ratingAverage, 4.0, 'average is over all 13 reviews (52/13 = 4.0)');
    assert.equal(page.total, 13);
    assert.equal(page.items.length, 10, 'first page holds 10 of 13');
});

test('the aggregate is page-independent: page 2 reports the SAME average/count as page 1', async () => {
    const p1 = await reviewService.listProductReviews(STORE, 'birkin', { page: 1, limit: 10 });
    const p2 = await reviewService.listProductReviews(STORE, 'birkin', { page: 2, limit: 10 });
    assert.equal(p1.ratingAverage, p2.ratingAverage, 'average does not drift with the loaded page');
    assert.equal(p1.ratingCount, p2.ratingCount);
    assert.equal(p2.items.length, 3, 'second page holds the remaining 3');
});

test('ratingCount equals total (both are the approved-review count)', async () => {
    const page = await reviewService.listProductReviews(STORE, 'birkin', { page: 1, limit: 5 });
    assert.equal(page.ratingCount, page.total);
});

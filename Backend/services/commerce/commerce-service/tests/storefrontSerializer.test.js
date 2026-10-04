'use strict';
// Storefront serializer — the read-model the Amarisé storefront renders. Pins the contract for
// real imagery (media[] + imageUrl, featured-first), the server-computed review aggregate
// (ratingAverage/ratingCount over ALL approved reviews, C4), the real department/brand taxonomy
// (from the category parent), and per-market pricing passthrough. Pure unit tests — no DB.
process.env.FX_LIVE_FEED = 'false';
process.env.FX_USD_GBP = '0.79';

const { test } = require('node:test');
const assert = require('node:assert');

require('./_env'); // dummy JWT_PUBLIC_KEY so the fail-loud config boots under CI (no .env)
const serializer = require('../utils/storefrontSerializer');

function makeProduct(overrides = {}) {
    return {
        id: 'p1', name: 'Hermès Birkin 25', slug: 'hermes-birkin-25',
        customFields: { rating: 4.666, reviewsCount: 12, basePrice: 100, isGlobal: true, regions: ['us', 'uk'] },
        variants: [{ isDefault: true, price: 100 }],
        media: [
            { url: 'https://cdn.amarise.com/a.jpg', altText: 'side', sortOrder: 1, isFeatured: false, mediaType: 'image' },
            { url: 'https://cdn.amarise.com/hero.jpg', thumbnailUrl: 'https://cdn.amarise.com/hero_t.jpg', altText: 'hero', sortOrder: 0, isFeatured: true, mediaType: 'image' },
        ],
        category: { id: 'c1', slug: 'hermes-birkin-handbags', name: 'Hermès Birkin Bags', parentId: 'd1', parent: { id: 'd1', slug: 'hermes', name: 'Hermès' } },
        ...overrides,
    };
}

// ════════════════════ REAL IMAGERY (media pipeline) ════════════════════
test('imageUrl surfaces real media URLs, featured-first then by sortOrder', () => {
    const out = serializer.serializeProductListItem(makeProduct(), {});
    assert.deepEqual(out.imageUrl, ['https://cdn.amarise.com/hero.jpg', 'https://cdn.amarise.com/a.jpg']);
});

test('media[] exposes url + thumbnail (falls back to url) + alt + type, featured-first', () => {
    const out = serializer.serializeProductListItem(makeProduct(), {});
    assert.equal(out.media.length, 2);
    assert.deepEqual(out.media[0], {
        url: 'https://cdn.amarise.com/hero.jpg', thumbnailUrl: 'https://cdn.amarise.com/hero_t.jpg', altText: 'hero', mediaType: 'image',
    });
    // second item has no thumbnailUrl → falls back to its own url
    assert.equal(out.media[1].thumbnailUrl, out.media[1].url);
});

test('a product with no media serializes to empty imageUrl/media (no crash, no fabricated URL)', () => {
    const out = serializer.serializeProductListItem(makeProduct({ media: [] }), {});
    assert.deepEqual(out.imageUrl, []);
    assert.deepEqual(out.media, []);
});

// ════════════════════ REVIEW AGGREGATE (C4) ════════════════════
test('ratingAverage/ratingCount come from the server aggregate and round to one decimal', () => {
    const out = serializer.serializeProductListItem(makeProduct(), {});
    assert.equal(out.ratingAverage, 4.7); // 4.666 → 4.7
    assert.equal(out.ratingCount, 12);
    // legacy aliases stay consistent with the canonical fields
    assert.equal(out.rating, out.ratingAverage);
    assert.equal(out.reviewsCount, out.ratingCount);
});

test('a product with no reviews reports a 0/0 aggregate, never NaN', () => {
    const out = serializer.serializeProductListItem(makeProduct({ customFields: { basePrice: 100 } }), {});
    assert.equal(out.ratingAverage, 0);
    assert.equal(out.ratingCount, 0);
    assert.ok(Number.isFinite(out.ratingAverage));
});

// ════════════════════ DEPARTMENT / BRAND TAXONOMY (real backend field) ════════════════════
test('department/departmentId resolve from the real category parent (root category = brand)', () => {
    const out = serializer.serializeProductListItem(makeProduct(), {});
    assert.equal(out.departmentId, 'hermes');
    assert.equal(out.department, 'Hermès');
    assert.equal(out.categoryName, 'Hermès Birkin Bags');
});

test('department falls back to custom_fields when the category has no parent', () => {
    const p = makeProduct({
        customFields: { departmentId: 'chanel', department: 'Chanel', basePrice: 100 },
        category: { id: 'c2', slug: 'chanel-flap-bags', name: 'Chanel Flap Bags', parentId: null, parent: null },
    });
    const out = serializer.serializeProductListItem(p, {});
    assert.equal(out.departmentId, 'chanel');
    assert.equal(out.department, 'Chanel');
});

// ════════════════════ PER-MARKET PRICING PASSTHROUGH (unchanged contract) ════════════════════
test('per-market pricing envelope is attached when a country is supplied', () => {
    const out = serializer.serializeProductListItem(makeProduct(), { country: 'uk' });
    assert.equal(out.price, 79); // 100 * 0.79
    assert.equal(out.currencyCode, 'GBP');
    assert.equal(out.taxType, 'VAT');
});

test('detail serializer carries the same aggregate + department + media', () => {
    const out = serializer.serializeProductDetail(makeProduct(), { country: 'uk' });
    assert.equal(out.ratingAverage, 4.7);
    assert.equal(out.department, 'Hermès');
    assert.equal(out.media.length, 2);
    assert.equal(out.description, ''); // detail-only field present
});

// ── KYC flag + whitelisted investment details ────────────────────────────────
{
    const { test } = require('node:test');
    const assert = require('node:assert/strict');
    const { serializeProductListItem, serializeProductDetail } = require('../utils/storefrontSerializer');
    const base = { id: 'p1', name: 'Channel stake', slug: 'channel-stake', variants: [{ price: 100, isActive: true }] };

    test('kycRequired is true only for an explicit requiresKyc flag', () => {
        assert.equal(serializeProductListItem({ ...base, customFields: { requiresKyc: true } }).kycRequired, true);
        assert.equal(serializeProductListItem({ ...base, customFields: { requiresKyc: 'true' } }).kycRequired, false);
        assert.equal(serializeProductListItem({ ...base, customFields: {} }).kycRequired, false);
    });

    test('investment details expose only whitelisted, sanitised keys', () => {
        const d = serializeProductDetail({
            ...base,
            customFields: { investment: { creatorName: 'Kay', channelUrl: 'https://youtube.com/@kay', investmentAmount: '5000', investorSharePct: 20, secretInternalNote: 'do not leak', channelUrlEvil: 'javascript:alert(1)' } },
        });
        assert.equal(d.investment.creatorName, 'Kay');
        assert.equal(d.investment.investmentAmount, 5000);
        assert.equal(d.investment.channelUrl, 'https://youtube.com/@kay');
        assert.equal('secretInternalNote' in d.investment, false);
        assert.equal(serializeProductDetail({ ...base, customFields: { investment: { channelUrl: 'javascript:alert(1)' } } }).investment.channelUrl, undefined);
        assert.equal(serializeProductDetail({ ...base, customFields: {} }).investment, undefined);
    });

    test('verification exposes only booleans and a date; unchecked is never reported as checked', () => {
        const checked = serializeProductDetail({ ...base, customFields: { investment: { creatorName: 'Kay', verification: { channelOwnershipChecked: true, revenueEvidenceSeen: 'yes', checkedAt: '2026-10-04T10:00:00Z', notes: 'private note', checkedBy: 'admin-7' } } } });
        assert.deepEqual(checked.investment.verification, { channelOwnershipChecked: true, revenueEvidenceSeen: false, checkedAt: '2026-10-04' });
        const none = serializeProductDetail({ ...base, customFields: { investment: { creatorName: 'Kay' } } });
        assert.equal(none.investment.verification.channelOwnershipChecked, false);
        assert.equal(none.investment.verification.revenueEvidenceSeen, false);
        assert.equal(JSON.stringify(checked).includes('private note'), false);
        assert.equal(JSON.stringify(checked).includes('admin-7'), false);
    });
}

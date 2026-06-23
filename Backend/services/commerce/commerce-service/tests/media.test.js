'use strict';
// Product media library — store/product boundary, ordering, featured-selection and
// delete-promotion behaviour. Exercises the real productMediaService with the data layer
// and the filesystem stubbed (no DB, no disk writes).
process.env.MEDIA_DRIVER = 'local';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

// Stub the filesystem BEFORE the service runs putObject (same cached module object).
const fs = require('fs');
fs.writeFileSync = () => {};
fs.mkdirSync = () => {};
fs.unlinkSync = () => {};

require('./_env'); // dummy JWT_PUBLIC_KEY so the fail-loud config boots under CI (no .env)
const models = require('../models');
const mediaService = require('../service/productMediaService');

// ── in-memory media table for ONE product ──────────────────────────────────────
const STORE = 'store-1';
const PRODUCT = 'prod-1';
let rows = [];
let idSeq = 0;

function makeRow(data) {
    const row = {
        ...data,
        id: data.id || `m${++idSeq}`,
        toJSON() { const { toJSON, update, destroy, ...rest } = this; return rest; },
        async update(patch) { Object.assign(this, patch); return this; },
        async destroy() { rows = rows.filter((r) => r.id !== this.id); },
    };
    return row;
}
const byProduct = (w) => rows.filter((r) => (w.productId ? r.productId === w.productId : true) && (w.id ? r.id === w.id : true));

beforeEach(() => {
    rows = []; idSeq = 0;
    // product exists only in STORE
    models.CommerceProduct.findOne = async ({ where }) =>
        (where.id === PRODUCT && where.storeId === STORE) ? { id: PRODUCT } : null;
    // transaction → run callback with a fake tx handle
    models.sequelize.transaction = async (cb) => cb({ LOCK: { UPDATE: 'UPDATE' } });

    const M = models.CommerceProductMedia;
    M.findOne = async ({ where = {}, order }) => {
        let set = byProduct(where);
        if (order && order[0][0] === 'sortOrder') {
            set = [...set].sort((a, b) => order[0][1] === 'DESC' ? b.sortOrder - a.sortOrder : a.sortOrder - b.sortOrder);
        }
        return set[0] || null;
    };
    M.findAll = async ({ where = {} }) => [...byProduct(where)].sort((a, b) => a.sortOrder - b.sortOrder);
    M.count = async ({ where = {} }) => byProduct(where).length;
    M.create = async (data) => { const r = makeRow(data); rows.push(r); return r; };
    M.update = async (patch, { where = {} }) => { for (const r of byProduct(where)) Object.assign(r, patch); return [byProduct(where).length]; };
});

const file = (name = 'a.jpg', type = 'image/jpeg') => ({ filename: name, contentType: type, data: Buffer.from('x'.repeat(64)) });
async function code(fn) { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } }

// ════════════════════ STORE / PRODUCT BOUNDARY ════════════════════
test('cross-store attach is blocked: a product not in the caller store 404s before any write', async () => {
    assert.equal(await code(() => mediaService.uploadMedia('other-store', PRODUCT, { filePart: file() })), 404);
    assert.equal(await code(() => mediaService.listMedia('other-store', PRODUCT)), 404);
    assert.equal(rows.length, 0, 'no media row created for a foreign store');
});

// ════════════════════ UPLOAD: ORDER + AUTO-FEATURE + THUMB FALLBACK ════════════════════
test('upload appends sortOrder, auto-features the first image, falls back to original as its own thumbnail', async () => {
    const first = await mediaService.uploadMedia(STORE, PRODUCT, { filePart: file('1.jpg') });
    const second = await mediaService.uploadMedia(STORE, PRODUCT, { filePart: file('2.jpg') });

    assert.equal(first.sortOrder, 0);
    assert.equal(second.sortOrder, 1);
    assert.equal(first.isFeatured, true, 'first image is featured by default');
    assert.equal(second.isFeatured, false, 'second image is not featured');
    assert.equal(first.thumbnailUrl, first.url, 'no thumbnail engine → original reused as thumbnail');
    assert.ok(first.url.includes(`commerce/products/${PRODUCT}/`), 'object key is product-namespaced');
});

test('upload rejects a non-image payload for mediaType=image', async () => {
    assert.equal(await code(() => mediaService.uploadMedia(STORE, PRODUCT, { filePart: file('x.txt', 'text/plain'), mediaType: 'image' })), 415);
});

// ════════════════════ FEATURED SELECTION ════════════════════
test('setFeatured makes exactly one item featured', async () => {
    const a = await mediaService.uploadMedia(STORE, PRODUCT, { filePart: file('a.jpg') }); // featured
    const b = await mediaService.uploadMedia(STORE, PRODUCT, { filePart: file('b.jpg') });
    await mediaService.setFeatured(STORE, PRODUCT, b.id);
    const list = await mediaService.listMedia(STORE, PRODUCT);
    assert.deepEqual(list.filter((m) => m.isFeatured).map((m) => m.id), [b.id]);
    assert.equal(list.find((m) => m.id === a.id).isFeatured, false);
});

// ════════════════════ REORDER (no cross-product) ════════════════════
test('reorder rewrites sortOrder and rejects ids that do not belong to the product', async () => {
    const a = await mediaService.uploadMedia(STORE, PRODUCT, { filePart: file('a.jpg') });
    const b = await mediaService.uploadMedia(STORE, PRODUCT, { filePart: file('b.jpg') });
    await mediaService.reorderMedia(STORE, PRODUCT, [b.id, a.id]);
    const list = await mediaService.listMedia(STORE, PRODUCT);
    assert.deepEqual(list.map((m) => m.id), [b.id, a.id], 'order follows the requested sequence');

    assert.equal(await code(() => mediaService.reorderMedia(STORE, PRODUCT, [a.id, 'foreign-id'])), 400);
});

// ════════════════════ DELETE PROMOTES NEXT FEATURED ════════════════════
test('deleting the featured item promotes the next item to featured', async () => {
    const a = await mediaService.uploadMedia(STORE, PRODUCT, { filePart: file('a.jpg') }); // featured
    const b = await mediaService.uploadMedia(STORE, PRODUCT, { filePart: file('b.jpg') });
    await mediaService.deleteMedia(STORE, PRODUCT, a.id);
    const list = await mediaService.listMedia(STORE, PRODUCT);
    assert.equal(list.length, 1);
    assert.equal(list[0].id, b.id);
    assert.equal(list[0].isFeatured, true, 'next item promoted to featured');
});

test('deleting a media item not on the product 404s', async () => {
    await mediaService.uploadMedia(STORE, PRODUCT, { filePart: file('a.jpg') });
    assert.equal(await code(() => mediaService.deleteMedia(STORE, PRODUCT, 'nope')), 404);
});

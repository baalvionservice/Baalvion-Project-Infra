'use strict';
/**
 * Attach REAL product photography to published products from a manifest — without re-running the
 * destructive full seed. This is the production pipeline for replacing the dev placeholder imagery
 * (picsum, which BrandImage.isRealImage() renders as a branded monogram panel) with real licensed
 * https photo URLs, so storefront PDPs / cards / carousels render actual product photos.
 *
 * It does NOT upload binaries (no licensed assets ship in the repo — see needsHumanInput). It maps
 * already-hosted https URLs (your CDN / S3 / DAM) onto the existing CommerceProductMedia rows. The
 * media binary lifecycle (upload, thumbnail, S3/local) is owned by service/productMediaService.js;
 * this script only wires real URLs onto real products idempotently.
 *
 * MANIFEST (JSON): an array of { match, images } entries. `match` resolves a product by slug, id,
 * or name (case-insensitive substring); `images` is an ordered array of https URLs (first = hero).
 *   [
 *     { "match": { "slug": "hermes-birkin-25-..." }, "images": ["https://cdn/.../a.jpg", ".../b.jpg"] },
 *     { "match": { "name": "Chanel Classic Medium" }, "images": ["https://cdn/.../chanel-1.jpg"] }
 *   ]
 *
 * Run:
 *   node scripts/attachProductMedia.js --manifest ./media-manifest.json
 *   node scripts/attachProductMedia.js --manifest ./media-manifest.json --store <storeId> --replace
 *
 * Flags:
 *   --manifest <path>   (required) path to the manifest JSON
 *   --store <uuid>      (optional) limit to one store (defaults to the Amarisé store)
 *   --replace           (optional) delete existing media rows for a matched product before attaching
 *   --dry-run           (optional) report what WOULD change without writing
 */
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const db = require('../models');

const { sequelize, CommerceProduct, CommerceProductMedia } = db;

const DEFAULT_STORE_ID = process.env.AMARISE_STORE_ID || 'a0a00000-0000-4000-8000-000000000001';
const HTTPS_RE = /^https:\/\/[^\s]+$/i;

function parseArgs(argv) {
    const args = { replace: false, dryRun: false, store: DEFAULT_STORE_ID, manifest: null };
    for (let i = 2; i < argv.length; i += 1) {
        const a = argv[i];
        if (a === '--manifest') args.manifest = argv[++i];
        else if (a === '--store') args.store = argv[++i];
        else if (a === '--replace') args.replace = true;
        else if (a === '--dry-run') args.dryRun = true;
    }
    return args;
}

function loadManifest(manifestPath) {
    if (!manifestPath) throw new Error('--manifest <path> is required');
    const abs = path.resolve(process.cwd(), manifestPath);
    const raw = fs.readFileSync(abs, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Manifest must be a JSON array of { match, images }');
    return parsed;
}

// Only finite, https URLs are accepted — never trust a manifest blindly (no http/data/javascript).
function sanitizeImages(images) {
    if (!Array.isArray(images)) return [];
    return images.filter((u) => typeof u === 'string' && HTTPS_RE.test(u.trim())).map((u) => u.trim());
}

async function resolveProduct(storeId, match) {
    if (!match || typeof match !== 'object') return null;
    if (match.id) return CommerceProduct.findOne({ where: { id: match.id, storeId } });
    if (match.slug) return CommerceProduct.findOne({ where: { slug: match.slug, storeId } });
    if (match.name) {
        return CommerceProduct.findOne({ where: { storeId, name: { [Op.iLike]: `%${match.name}%` } } });
    }
    return null;
}

async function attachOne(storeId, entry, opts) {
    const images = sanitizeImages(entry.images);
    if (images.length === 0) return { status: 'skipped', reason: 'no valid https images', match: entry.match };

    const product = await resolveProduct(storeId, entry.match);
    if (!product) return { status: 'skipped', reason: 'product not found', match: entry.match };

    if (opts.dryRun) {
        return { status: 'dry-run', product: product.slug, images: images.length, replace: opts.replace };
    }

    await sequelize.transaction(async (t) => {
        if (opts.replace) {
            await CommerceProductMedia.destroy({ where: { productId: product.id }, transaction: t });
        }
        const existingCount = opts.replace
            ? 0
            : await CommerceProductMedia.count({ where: { productId: product.id }, transaction: t });
        const rows = images.map((url, i) => ({
            productId: product.id,
            mediaType: 'image',
            url,
            thumbnailUrl: url,
            altText: product.name,
            sortOrder: existingCount + i,
            isFeatured: existingCount === 0 && i === 0,
        }));
        await CommerceProductMedia.bulkCreate(rows, { transaction: t });
    });

    return { status: 'attached', product: product.slug, images: images.length, replace: opts.replace };
}

async function run() {
    const opts = parseArgs(process.argv);
    const manifest = loadManifest(opts.manifest);
    await sequelize.authenticate();

    const results = [];
    for (const entry of manifest) {
        // eslint-disable-next-line no-await-in-loop
        results.push(await attachOne(opts.store, entry, opts));
    }

    const counts = results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
    console.log(`[attachProductMedia] store=${opts.store} dryRun=${opts.dryRun} replace=${opts.replace}`);
    for (const r of results) {
        console.log(`  ${r.status.padEnd(9)} ${r.product || JSON.stringify(r.match)}${r.reason ? ` — ${r.reason}` : ''}${r.images ? ` (${r.images} img)` : ''}`);
    }
    console.log(`[attachProductMedia] summary: ${JSON.stringify(counts)}`);
    await sequelize.close();
}

run().then(() => process.exit(0)).catch((err) => { console.error('[attachProductMedia] FAILED:', err.message); process.exit(1); });

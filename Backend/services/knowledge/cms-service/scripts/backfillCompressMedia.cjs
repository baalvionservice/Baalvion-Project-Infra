/* One-off backfill: recompress media uploaded BEFORE saveUpload() started resizing +
 * re-encoding photos to WebP on the way in (see service/mediaService.js). Everything
 * uploaded before that change sits on disk/MinIO at its original, often much larger,
 * size — served raw on every page view, which is a direct driver of Vercel's "Fast
 * Origin Transfer" bandwidth quota for every site cms-service feeds (imperialpedia and
 * the other CMS-driven frontends).
 *
 * For each cms_media_assets row with an image mime type and optimized_at IS NULL:
 *   1. Read the stored bytes (local disk or MinIO, per MEDIA_DRIVER)
 *   2. Resize to MEDIA_IMAGE_MAX_WIDTH / re-encode to WebP at MEDIA_IMAGE_QUALITY
 *   3. Generate a 400x400 thumbnail
 *   4. Write both under new keys, delete the old object, update the DB row
 *
 * Dry-run by default — downloads + compresses to report projected savings without
 * writing anything. Pass --apply to actually persist changes.
 *
 * Usage:
 *   node scripts/backfillCompressMedia.cjs [--limit=200] [--apply]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const s3 = require('../utils/s3Client');
const { processImage, generateThumbnail, extractMetadata } = require('@baalvion/upload/image.js');
const {
    UPLOAD_DIR, DRIVER, BUCKET, MAIN_MAX_WIDTH, MAIN_QUALITY,
} = require('../service/mediaService');

const APPLY = process.argv.includes('--apply');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : 200;

function sel(sql, replacements) { return sequelize.query(sql, { replacements, type: QueryTypes.SELECT }); }

async function readObject(storageKey) {
    if (DRIVER === 'minio') return s3.getObject(BUCKET, storageKey);
    return fs.readFileSync(path.join(UPLOAD_DIR, storageKey));
}

async function writeObject(key, data, contentType) {
    if (DRIVER === 'minio') {
        await s3.ensureBucket(BUCKET);
        await s3.putObject(BUCKET, key, data, contentType);
        return s3.publicUrl(BUCKET, key);
    }
    fs.writeFileSync(path.join(UPLOAD_DIR, key), data);
    // mediaService's own PUBLIC_BASE-prefixed URL shape — re-derive rather than import to
    // avoid depending on mediaService's module-load side effects for something this trivial.
    const base = (process.env.CMS_PUBLIC_URL || process.env.MEDIA_PUBLIC_BASE || 'http://localhost:3011').replace(/\/$/, '');
    return `${base}/uploads/${key}`;
}

async function deleteObject(storageKey) {
    if (DRIVER === 'minio') { try { await s3.deleteObject(BUCKET, storageKey); } catch { /* already gone */ } }
    else { try { fs.unlinkSync(path.join(UPLOAD_DIR, storageKey)); } catch { /* already gone */ } }
}

async function main() {
    const rows = await sel(`
        SELECT id, storage_key, filename, mime_type, size
          FROM cms.cms_media_assets
         WHERE mime_type IN ('image/jpeg', 'image/png', 'image/webp')
           AND optimized_at IS NULL
         ORDER BY size DESC
         LIMIT :limit`,
        { limit: LIMIT });

    if (!rows.length) {
        console.log('Nothing to backfill — no un-optimized image rows found.');
        return;
    }

    console.log(`${APPLY ? 'Compressing' : 'Would compress'} ${rows.length} image(s) (storage driver: ${DRIVER})...\n`);

    let bytesBefore = 0;
    let bytesAfter = 0;
    let succeeded = 0;
    let skipped = 0;

    for (const row of rows) {
        let original;
        try {
            original = await readObject(row.storage_key);
        } catch (err) {
            console.warn(`[skip] ${row.storage_key}: could not read source object (${err.message})`);
            skipped++;
            continue;
        }

        let processed, meta, thumb;
        try {
            processed = await processImage(original, {
                width: MAIN_MAX_WIDTH, format: 'webp', quality: MAIN_QUALITY, fit: 'inside',
            });
            meta = await extractMetadata(processed);
            thumb = await generateThumbnail(original);
        } catch (err) {
            console.warn(`[skip] ${row.storage_key}: sharp could not decode this file (${err.message})`);
            skipped++;
            continue;
        }

        const before = Number(row.size) || original.length;
        const after = processed.length;
        bytesBefore += before;
        bytesAfter += after;

        const pct = before > 0 ? (100 * (1 - after / before)).toFixed(0) : '0';
        console.log(`${APPLY ? '[write]' : '[dry-run]'} ${row.filename}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB  (-${pct}%)`);

        if (!APPLY) { succeeded++; continue; }

        const baseName = path.parse(row.storage_key).name;
        const newKey = `${baseName}.webp`;
        const thumbKey = `${baseName}-thumb.jpg`;

        const url = await writeObject(newKey, processed, 'image/webp');
        const thumbnailUrl = await writeObject(thumbKey, thumb, 'image/jpeg');

        await sel(`
            UPDATE cms.cms_media_assets
               SET storage_key = :newKey, mime_type = 'image/webp', size = :size, url = :url,
                   thumbnail_url = :thumbnailUrl, width = :width, height = :height,
                   optimized_at = now(), updated_at = now()
             WHERE id = :id`,
            {
                id: row.id, newKey, size: after, url, thumbnailUrl,
                width: meta.width || null, height: meta.height || null,
            });

        if (newKey !== row.storage_key) await deleteObject(row.storage_key);
        succeeded++;
    }

    console.log('\n---');
    console.log(`${APPLY ? 'Compressed' : 'Would compress'}: ${succeeded}   Skipped (unreadable/undecodable): ${skipped}`);
    if (bytesBefore > 0) {
        const savedPct = (100 * (1 - bytesAfter / bytesBefore)).toFixed(1);
        console.log(`Total: ${(bytesBefore / 1024 / 1024).toFixed(1)}MB -> ${(bytesAfter / 1024 / 1024).toFixed(1)}MB  (-${savedPct}%)`);
    }
    if (rows.length === LIMIT) {
        console.log(`\nHit --limit=${LIMIT}; re-run the same command to process the next batch (already-optimized rows are skipped automatically).`);
    }
    if (!APPLY) console.log('\nDry run only — re-run with --apply to actually write these changes.');
}

main()
    .then(() => sequelize.close())
    .catch((err) => {
        console.error(err);
        return sequelize.close().finally(() => { process.exitCode = 1; });
    });

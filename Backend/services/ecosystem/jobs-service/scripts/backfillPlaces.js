'use strict';
/**
 * Backfill place_slug / metro_slug for rows created before the gazetteer existed.
 *
 *   node scripts/backfillPlaces.js
 *
 * Resolves each listing's city (falling back to the first segment of its composed
 * `location` string) and records which place and metro it belongs to. Idempotent.
 */
require('dotenv').config();
const db = require('../models');
const { resolvePlace, metroFor } = require('../data/locations');

(async () => {
    await db.sequelize.authenticate();
    const jobs = await db.JobListing.findAll();
    let resolved = 0;
    let unmapped = 0;

    for (const job of jobs) {
        const candidate = job.city || String(job.location || '').split(',')[0].trim();
        const place = resolvePlace(candidate);
        if (!place) { unmapped += 1; continue; }
        const metro = metroFor(place);
        await job.update({
            place_slug: place.slug,
            metro_slug: metro ? metro.slug : place.slug,
            // Backfill the structured city too where only the display string existed.
            city: job.city || place.name,
        });
        resolved += 1;
    }

    console.log(`[backfill] ${resolved} listings resolved, ${unmapped} left unmapped (location not in the gazetteer)`);
    process.exit(0);
})().catch((err) => { console.error('[backfill] failed:', err.message); process.exit(1); });

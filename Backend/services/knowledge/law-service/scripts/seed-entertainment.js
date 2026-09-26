'use strict';
// Loads the site's bundled entertainment entries (data/entertainment-seed.json,
// produced by the frontend's scripts/export-entertainment-seed.ts) into
// legal.entertainment_entities so editors can manage them in the admin panel.
//
//   node scripts/seed-entertainment.js [--force]
//
// Existing rows are left alone unless --force, so admin edits are never overwritten.
const fs = require('fs');
const path = require('path');
const db = require('../models');
const { validateEntertainment } = require('../utils/entertainmentValidation');

const force = process.argv.includes('--force');
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'entertainment-seed.json'), 'utf8'));

const row = (e) => ({
    slug: e.slug, title: e.title, type: e.type, release_date: e.releaseDate || null, description: e.description || '',
    people_involved: e.peopleInvolved || [], related_entities: e.relatedEntities || [],
    related_article_slugs: e.relatedArticleSlugs || [], videos: e.videos || [], interviews: e.interviews || [],
    seo_title: e.seo?.metaTitle || null, seo_description: e.seo?.metaDescription || null,
    verified: !!e.verification?.verified, source_note: e.verification?.sourceNote || null,
    last_reviewed_at: e.verification?.lastReviewedAt || null, published: true, indexable: true,
});

(async () => {
    try {
        for (const e of seed) {
            const values = row(e);
            validateEntertainment(values, true);
            const existing = await db.EntertainmentEntity.findOne({ where: { slug: values.slug } });
            if (!existing) { await db.EntertainmentEntity.create(values); console.log(`created ${values.slug}`); }
            else if (force) { await existing.update(values); console.log(`replaced ${values.slug}`); }
            else console.log(`kept ${values.slug} (already in the admin panel)`);
        }
    } catch (e) {
        console.error('seed failed:', e.message);
        process.exitCode = 1;
    } finally {
        await db.sequelize.close();
    }
})();

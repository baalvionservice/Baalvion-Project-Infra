'use strict';
// Loads the site's bundled cases and courts (data/legal-seed.json, produced by
// the frontend's scripts/export-legal-seed.ts) into legal.case_profiles and
// legal.court_profiles so editors can manage them in the admin panel.
//
//   node scripts/seed-legal.js [--force]
//
// Existing rows are left alone unless --force, so admin edits are never overwritten.
const fs = require('fs');
const path = require('path');
const db = require('../models');
const { validateCourt, validateCase } = require('../utils/legalValidation');

const force = process.argv.includes('--force');
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'legal-seed.json'), 'utf8'));

const court = (c) => ({
    slug: c.slug, name: c.name, level: c.level, country_code: c.countryCode || null,
    description: c.description || '', url: c.url || null, published: true, indexable: true,
});

const legalCase = (c) => ({
    slug: c.slug, case_name: c.caseName, court_slug: c.courtSlug, jurisdiction: c.jurisdiction || '',
    country_code: c.countryCode || null, status: c.status, summary: c.summary || '',
    parties: c.parties || [], lawyers: c.lawyers || [], judges: c.judges || [],
    important_dates: c.importantDates || [], timeline: c.timeline || [], documents: c.documents || [],
    related_article_slugs: c.relatedArticleSlugs || [],
    seo_title: c.seo?.metaTitle || null, seo_description: c.seo?.metaDescription || null,
    verified: !!c.verification?.verified, source_note: c.verification?.sourceNote || null,
    last_reviewed_at: c.verification?.lastReviewedAt || null,
    published: true, indexable: true,
});

async function upsert(Model, values, validate, label) {
    validate(values, true);
    const existing = await Model.findOne({ where: { slug: values.slug } });
    if (!existing) { await Model.create(values); console.log(`created ${label} ${values.slug}`); return; }
    if (force) { await existing.update(values); console.log(`replaced ${label} ${values.slug}`); return; }
    console.log(`kept ${label} ${values.slug} (already in the admin panel)`);
}

(async () => {
    try {
        for (const c of seed.courts) await upsert(db.CourtProfile, court(c), validateCourt, 'court');
        for (const c of seed.cases) await upsert(db.CaseProfile, legalCase(c), validateCase, 'case');
    } catch (e) {
        console.error('seed failed:', e.message);
        process.exitCode = 1;
    } finally {
        await db.sequelize.close();
    }
})();

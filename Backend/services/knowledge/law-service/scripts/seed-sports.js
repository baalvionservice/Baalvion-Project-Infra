'use strict';
// Loads the site's bundled sports teams and competitions (data/sports-seed.json,
// produced by the frontend's scripts/export-sports-seed.ts) into
// legal.sports_teams and legal.sports_competitions.
//
//   node scripts/seed-sports.js [--force]
//
// Existing rows are left alone unless --force, so admin edits are never overwritten.
const fs = require('fs');
const path = require('path');
const db = require('../models');
const { validateTeam, validateCompetition } = require('../utils/sportsValidation');

const force = process.argv.includes('--force');
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'sports-seed.json'), 'utf8'));

const team = (t) => ({
    slug: t.slug, name: t.name, sport: t.sport, country_code: t.countryCode || null, description: t.description || '', url: t.url || null,
    verified: !!t.verification?.verified, source_note: t.verification?.sourceNote || null, published: true, indexable: true,
});
const competition = (c) => ({
    slug: c.slug, name: c.name, sport: c.sport, level: c.level, country_code: c.countryCode || null, description: c.description || '',
    event_date: c.date || null, people_involved: c.peopleInvolved || [], related_article_slugs: c.relatedArticleSlugs || [], videos: c.videos || [],
    verified: !!c.verification?.verified, source_note: c.verification?.sourceNote || null, published: true, indexable: true,
});

async function upsert(Model, values, validate, label) {
    validate(values, true);
    const existing = await Model.findOne({ where: { slug: values.slug } });
    if (!existing) { await Model.create(values); console.log(`created ${label} ${values.slug}`); }
    else if (force) { await existing.update(values); console.log(`replaced ${label} ${values.slug}`); }
    else console.log(`kept ${label} ${values.slug} (already in the admin panel)`);
}

(async () => {
    try {
        for (const t of seed.teams) await upsert(db.SportsTeam, team(t), validateTeam, 'team');
        for (const c of seed.competitions) await upsert(db.SportsCompetition, competition(c), validateCompetition, 'competition');
    } catch (e) {
        console.error('seed failed:', e.message);
        process.exitCode = 1;
    } finally {
        await db.sequelize.close();
    }
})();

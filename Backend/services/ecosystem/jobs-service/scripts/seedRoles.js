'use strict';
/**
 * Seed the company's role catalogue as job listings.
 *
 *   node scripts/seedRoles.js            # create/update, leave as drafts
 *   node scripts/seedRoles.js --publish  # and publish them
 *
 * Idempotent by (org, title, city): re-running updates the existing listing rather than
 * creating a duplicate, so the catalogue file stays the source of truth.
 *
 * These are seeded postings. Review them before the site is public — every one of them
 * will read to a job seeker as a real, open vacancy.
 */
require('dotenv').config();
const db = require('../models');
const catalogue = require('../data/roleCatalogue');
const { resolvePlace, metroFor } = require('../data/locations');
const countries = require('../data/countries');

const ORG_ID = process.env.SEED_ORG_ID || '9d421643-e0fa-42c4-abe9-34509a64387a';
const USER_ID = Number(process.env.SEED_USER_ID || 56);
const PUBLISH = process.argv.includes('--publish');

const countryName = (id) => (countries.find((c) => c.id === id) || {}).name || null;

(async () => {
    await db.sequelize.authenticate();

    // Skills are shared rows; make sure every one the catalogue mentions exists.
    const wanted = [...new Set(catalogue.flatMap((r) => r.skills || []))];
    const existing = await db.Skill.findAll({ where: { name: wanted } });
    const byName = new Map(existing.map((s) => [s.name, s]));
    for (const name of wanted) {
        if (!byName.has(name)) {
            byName.set(name, await db.Skill.create({ name, category: 'General' }));
        }
    }

    let created = 0;
    let updated = 0;

    for (const role of catalogue) {
        const place = resolvePlace(role.city);
        const metro = place ? metroFor(place) : null;
        const location = [role.city, role.region, countryName(role.countryId)].filter(Boolean).join(', ');

        const values = {
            org_id: ORG_ID,
            created_by: USER_ID,
            title: role.title,
            description: role.description,
            requirements: (role.requirements || []).map((r) => `• ${r}`).join('\n'),
            responsibilities: (role.responsibilities || []).map((r) => `• ${r}`).join('\n'),
            preferred_qualifications: (role.preferred || []).map((r) => `• ${r}`).join('\n'),
            location,
            city: role.city,
            region: role.region || null,
            country_id: role.countryId,
            department_id: role.department,
            place_slug: place ? place.slug : null,
            metro_slug: metro ? metro.slug : (place ? place.slug : null),
            job_type: role.type,
            experience_level: role.level,
            salary_min: role.salary ? role.salary[0] : null,
            salary_max: role.salary ? role.salary[1] : null,
            salary_period: role.period || 'year',
            currency: role.currency,
            remote_allowed: !!role.remote,
            status: PUBLISH ? 'published' : 'draft',
            published_at: PUBLISH ? new Date() : null,
        };

        const [job, wasCreated] = await db.JobListing.findOrCreate({
            where: { org_id: ORG_ID, title: role.title, city: role.city },
            defaults: values,
        });
        if (!wasCreated) {
            await job.update(values);
            updated += 1;
        } else {
            created += 1;
        }

        const skills = (role.skills || []).map((n) => byName.get(n)).filter(Boolean);
        if (skills.length) await job.setSkills(skills);
    }

    const total = await db.JobListing.count({ where: { org_id: ORG_ID } });
    console.log(`[seed:roles] ${created} created, ${updated} updated — ${total} listings in the org`);
    console.log(PUBLISH
        ? '[seed:roles] published. These read as real vacancies — review before the site goes public.'
        : '[seed:roles] left as drafts. Re-run with --publish to list them.');
    process.exit(0);
})().catch((err) => { console.error('[seed:roles] failed:', err.message); process.exit(1); });

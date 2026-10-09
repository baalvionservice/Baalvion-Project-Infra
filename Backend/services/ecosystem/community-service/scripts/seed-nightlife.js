'use strict';
// Idempotent import of the clubs directory + locals listings that previously shipped as static
// frontend data. Safe to re-run: rows are matched by slug and left untouched if they exist, so
// admin edits are never overwritten. The 100 Mumbai directory entries carried a placeholder
// rating (4.5) and stock photo, not real data, so they are seeded without a rating.
require('dotenv').config();
const db = require('../models');
const { slugify } = require('../utils/slug');

const clubs = require('../seed/clubs.json');

// Stock photos from the old static data that Unsplash no longer serves (404 as of 2026-10-04).
// Seeding them would put broken images on ~100 venue cards, so those clubs start with no photo.
const DEAD_PHOTO_IDS = ['photo-1574365561657-3f820253f545', 'photo-1572116469696-ed70ca8dbbc7', 'photo-1470229722913-7c090be5c520'];
const usablePhoto = (url) => (url && !DEAD_PHOTO_IDS.some((id) => url.includes(id)) ? url : null);
const locals = require('../seed/locals.json');

async function main() {
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS community');
    await db.sequelize.sync({ alter: false });

    let createdClubs = 0;
    for (const c of clubs) {
        const slug = slugify(`${c.name}-${c.city}`);
        const placeholder = String(c.id).startsWith('mumbai-');
        const [row, created] = await db.NightClub.findOrCreate({
            where: { slug },
            defaults: {
                slug, name: c.name, state: c.state, city: c.city, suburb: c.suburb || null,
                address: c.address || null, image: usablePhoto(c.image), music_types: c.musicType || [],
                days_open: c.daysOpen || null, description: c.description || null,
                cover_charge: c.coverCharge || null, vibe: c.vibe || null,
                required_roles: c.requiredRoles || [], rating: placeholder ? null : c.rating,
            },
        });
        if (created) {
            createdClubs += 1;
        } else {
            // The source data lists a few venues twice (hand-curated + directory entry); fill
            // fields the first copy lacks without overwriting anything already set.
            const fill = {};
            if (!row.address && c.address) fill.address = c.address;
            if (!row.vibe && c.vibe) fill.vibe = c.vibe;
            if (!row.required_roles.length && c.requiredRoles) fill.required_roles = c.requiredRoles;
            if (Object.keys(fill).length) await row.update(fill);
        }
    }

    let createdLocals = 0;
    for (const l of locals) {
        const [, created] = await db.LocalListing.findOrCreate({
            where: { slug: l.slug },
            defaults: {
                slug: l.slug, title: l.title, type: l.type, location: l.location, city: l.city,
                description: l.description, requirements: l.requirements || [], contact: l.contact || null,
                event_date: l.date || null, salary: l.salary || null, posted_by: l.postedBy,
                verified: !!l.verified, min_age: l.minAge || null, max_age: l.maxAge || null,
                gender: l.gender || null, primary_category: l.primaryCategory || null,
                role_requirements: l.roleRequirements || [], seo_keywords: l.seoKeywords || [],
            },
        });
        if (created) createdLocals += 1;
    }

    console.log(JSON.stringify({ clubs: { seeded: createdClubs, total: clubs.length }, locals: { seeded: createdLocals, total: locals.length } }));
    await db.sequelize.close();
}

main().catch((err) => { console.error(err); process.exit(1); });

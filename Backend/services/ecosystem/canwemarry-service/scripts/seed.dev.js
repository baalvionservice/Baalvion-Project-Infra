'use strict';
/**
 * DEVELOPMENT SEED — refuses to run outside development.
 *
 * It creates NO people and NO cases. Inventing a case would mean publishing a fabricated
 * account of a family opposing a marriage, which is exactly the kind of content this
 * platform must never carry, and a seeded "story" has a way of surviving into production.
 *
 * What it does create is the structural scaffolding a developer needs to exercise the
 * app: two communities and a set of resource-directory placeholders that are explicitly
 * marked as unpublished examples, so nothing here can be mistaken for a real referral.
 */
const config = require('../config/appConfig');
const db = require('../models');

if (config.env === 'production') {
    console.error('[canwemarry] seed.dev.js refuses to run with NODE_ENV=production');
    process.exit(1);
}

const COMMUNITIES = [
    {
        slug: 'general-support',
        name: 'General support',
        description: 'An open space for people navigating family or community opposition to their relationship.',
        visibility: 'PUBLIC',
        join_policy: 'REQUEST',
    },
    {
        slug: 'mediation-practice',
        name: 'Mediation practice',
        description: 'For volunteers with mediation or counselling experience to coordinate.',
        visibility: 'PRIVATE',
        join_policy: 'INVITE',
    },
];

// Categories only, so the directory has shape to develop against. Every row is left
// unpublished and its title says so — real entries are added by volunteers who have
// actually verified the service they are pointing someone towards.
const RESOURCE_PLACEHOLDERS = [
    ['legal-aid-example', 'LEGAL', 'Example entry — legal aid'],
    ['family-mediation-example', 'MEDIATION', 'Example entry — family mediation'],
    ['counselling-example', 'COUNSELLING', 'Example entry — counselling'],
    ['safety-planning-example', 'SAFETY', 'Example entry — safety planning'],
];

async function seed() {
    for (const c of COMMUNITIES) {
        const [row, created] = await db.Community.findOrCreate({ where: { slug: c.slug }, defaults: c });
        console.log(`[canwemarry] community ${row.slug}: ${created ? 'created' : 'exists'}`);
    }

    for (const [slug, category, title] of RESOURCE_PLACEHOLDERS) {
        const [row, created] = await db.Resource.findOrCreate({
            where: { slug },
            defaults: {
                slug,
                title,
                summary: 'Placeholder for local development. Not a real service and not published.',
                category,
                is_published: false,
            },
        });
        console.log(`[canwemarry] resource ${row.slug}: ${created ? 'created' : 'exists'}`);
    }

    console.log('[canwemarry] seed complete — no users and no cases were created, by design');
}

seed()
    .then(() => db.sequelize.close())
    .then(() => process.exit(0))
    .catch(async (err) => {
        console.error('[canwemarry] seed failed:', err.message);
        await db.sequelize.close().catch(() => {});
        process.exit(1);
    });

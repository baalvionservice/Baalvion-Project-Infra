'use strict';

/**
 * Probes a site's real public routes and records which of its CMS categories no
 * longer resolve.
 *
 * The alternative -- copying the frontend's redirect table into the backend --
 * drifts the moment someone edits next.config.ts, and it was exactly that drift
 * that left 66 dead Imperialpedia categories selectable in the admin panel. So
 * this asks the running site instead, and stores the answer on the publication
 * policy where the publish gate reads it.
 *
 * A category counts as dead when its route redirects away from itself (a 3xx to
 * a different path) or returns 4xx/5xx. Redirect-following is deliberately off:
 * a 308 to the homepage returns 200 if you follow it, which is precisely how
 * these went unnoticed.
 *
 *   SITE_BASE_URL=http://localhost:3029 node scripts/verify-publish-routes.cjs --website=imperialpedia
 *   node scripts/verify-publish-routes.cjs --website=law-elite-network --base=http://localhost:9002 --dry-run
 */

require('dotenv').config();
const db = require('../models');
const policyService = require('../service/editorial/policyService');

const arg = (name, fallback = null) => {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.split('=').slice(1).join('=') : fallback;
};
const WEBSITE = arg('website');
const BASE = arg('base', process.env.SITE_BASE_URL);
const DRY = process.argv.includes('--dry-run');
const TIMEOUT_MS = 20000;

// Categories whose public page is nested under /world rather than served at the
// bare slug. Kept in step with the frontend's REGIONS list.
const REGION_SLUGS = new Set(['us', 'europe', 'asia', 'china', 'emerging']);

async function probe(base, path) {
    const url = `${base.replace(/\/$/, '')}${path}`;
    try {
        const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
        const location = res.headers.get('location');
        if (res.status >= 300 && res.status < 400) {
            // Normalize so "/economy" -> "/economy/" is not read as a redirect away.
            const target = location ? new URL(location, url).pathname.replace(/\/$/, '') : '';
            const self = path.replace(/\/$/, '');
            return { status: res.status, location: target, alive: target === self };
        }
        return { status: res.status, location: null, alive: res.status >= 200 && res.status < 300 };
    } catch (err) {
        return { status: 0, location: null, alive: false, error: err.message };
    }
}

async function main() {
    if (!WEBSITE || !BASE) {
        console.error('usage: --website=<slug> --base=<https://site> (or SITE_BASE_URL)');
        process.exit(1);
    }
    await db.sequelize.authenticate();

    const site = await db.CmsWebsite.findOne({ where: { slug: WEBSITE } });
    if (!site) { console.error(`website "${WEBSITE}" not found`); process.exit(1); }

    // Archived categories are skipped. An inactive category cannot be published
    // into at all, so probing it adds nothing and its slug in dead_category_slugs
    // is noise the reviewer has to filter out by hand -- the useful list is
    // categories that are live in the CMS but broken on the site.
    const categories = await db.CmsCategory.findAll({
        where: { websiteId: site.id, status: 'active' },
        attributes: ['slug', 'name'],
        raw: true,
    });
    if (!categories.length) { console.log('no categories to check'); process.exit(0); }

    const dead = [];
    console.log(`probing ${categories.length} categories on ${BASE}\n`);
    for (const c of categories) {
        // Region categories are not served at /<slug>. Imperialpedia's world
        // desk lives under /world/<region>, so probing the bare slug reported
        // all five as dead when every one of them returns 200 — it over-counted
        // this site's dead routes by five. Probe where the page actually is.
        const path = REGION_SLUGS.has(c.slug) ? `/world/${c.slug}` : `/${c.slug}`;
        const r = await probe(BASE, path);
        const verdict = r.alive ? 'live' : 'DEAD';
        const detail = r.error ? r.error : r.location ? `${r.status} -> ${r.location || '/'}` : String(r.status);
        console.log(`  ${verdict.padEnd(5)} /${c.slug.padEnd(28)} ${detail}`);
        if (!r.alive) dead.push(c.slug);
    }

    console.log(`\n${dead.length} of ${categories.length} category routes are dead`);
    if (DRY) { console.log('(dry run — nothing written)'); await db.sequelize.close(); return; }

    await policyService.upsertPolicy(site.id, { deadCategorySlugs: dead }, null);
    await db.CmsPublicationPolicy.update({ routesVerifiedAt: new Date() }, { where: { websiteId: site.id } });
    console.log('recorded on the publication policy; the publish gate will refuse these.');
    await db.sequelize.close();
}

main().catch((err) => { console.error('failed:', err.message); process.exit(1); });

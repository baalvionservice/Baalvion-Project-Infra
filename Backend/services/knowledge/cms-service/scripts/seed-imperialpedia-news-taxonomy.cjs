'use strict';

/**
 * Creates Imperialpedia's news taxonomy in the CMS: the 13 editorial topics and
 * 6 regions the frontend actually recognises.
 *
 * These are not arbitrary -- admin-platform's news-taxonomy.ts and the site's
 * worldRegions.ts both hard-code this exact set, and worldFeed.ts queries CMS
 * content by `categorySlug: <regionId>`. A topic outside this list is invisible
 * to the site, so it is created here rather than free-typed.
 *
 * Idempotent. Region slugs must match RegionId exactly; topic slugs are derived
 * the same way admin-platform derives them.
 */

require('dotenv').config();
const db = require('../models');

const TOPICS = [
    'Markets', 'Business', 'Investing', 'Tech', 'Politics', 'World',
    'Finance', 'Health & Science', 'Media', 'Real Estate', 'Energy',
    'Climate', 'Personal Finance',
];

const REGIONS = [
    { label: 'World', slug: 'world' },
    { label: 'U.S.', slug: 'us' },
    { label: 'Europe', slug: 'europe' },
    { label: 'Asia-Pacific', slug: 'asia' },
    { label: 'China', slug: 'china' },
    { label: 'Emerging Markets', slug: 'emerging' },
];

const slugify = (s) => s.toLowerCase().trim().replace(/&/g, 'and').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

async function ensure(websiteId, name, slug) {
    const [row, created] = await db.CmsCategory.findOrCreate({
        where: { websiteId, slug },
        defaults: { websiteId, name, slug, parentId: null, sortOrder: 0, depth: 0, status: 'active', contentCount: 0 },
    });
    return { slug: row.slug, created };
}

async function main() {
    await db.sequelize.authenticate();
    const site = await db.CmsWebsite.findOne({ where: { slug: 'imperialpedia' } });
    if (!site) { console.error('imperialpedia not registered'); process.exit(1); }

    let made = 0;
    for (const t of TOPICS) {
        const { slug, created } = await ensure(site.id, t, slugify(t));
        if (created) made += 1;
        console.log(`  ${created ? 'created' : 'exists '}  topic   ${slug}`);
    }
    for (const r of REGIONS) {
        const { slug, created } = await ensure(site.id, r.label, r.slug);
        if (created) made += 1;
        console.log(`  ${created ? 'created' : 'exists '}  region  ${slug}`);
    }
    console.log(`\n${made} new categories (${TOPICS.length} topics + ${REGIONS.length} regions in the fixed set)`);
    await db.sequelize.close();
}

main().catch((e) => { console.error('failed:', e.message); process.exit(1); });

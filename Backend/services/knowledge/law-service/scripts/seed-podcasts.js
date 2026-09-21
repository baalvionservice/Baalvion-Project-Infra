'use strict';
// Seeds the editorial Top 10 podcasts per country (rank = position within the show's country). Fills only shows that do not exist yet,
// so admin edits are never overwritten; --force resets the seeded fields of existing rows.
//   node scripts/seed-podcasts.js [--force]
const db = require('../models');
const rows = require('../data/podcasts-top10.json');
const profiles = require('../data/podcasts-profiles.json');

// A profile page is only offered to search engines once it has real writing on it.
const MIN_WORDS = 80;

(async () => {
    const force = process.argv.includes('--force');
    for (const r of rows) {
        const pr = profiles[r.slug] || {};
        const words = String(pr.overview || '').trim().split(/\s+/).filter(Boolean).length;
        const profile = { ...pr, listen_url: undefined, reviewed_at: pr.overview ? new Date() : null, indexable: words >= MIN_WORDS };
        const listen = `https://podcasts.apple.com/search?term=${encodeURIComponent(r.title)}`;
        const [row, created] = await db.PodcastShow.findOrCreate({
            where: { slug: r.slug },
            defaults: { ...r, ...profile, listen_url: listen, published: true, ranking_note: 'Editorial selection of widely followed shows in this country, not a chart position.' },
        });
        if (!created && !force && !row.overview && pr.overview) await row.update(profile);
        if (!created && force) await row.update({ ...r, ...profile, listen_url: listen, ranking_note: 'Editorial selection of widely followed shows in this country, not a chart position.' });
        console.log(`${created ? 'added  ' : 'exists '} #${r.rank} ${r.title}`);
    }
    process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

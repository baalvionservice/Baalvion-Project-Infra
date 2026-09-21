'use strict';
// Seeds the Bigg Boss show page: overview, at-a-glance facts, every Hindi season with its host, winner,
// runner-up and housemates, quick answers, sources, and official clips from the Colors TV and JioHotstar
// YouTube channels. Fills only what does not exist yet, so admin edits are never overwritten; --force
// resets the seeded fields of existing rows.
//   node scripts/seed-bigg-boss.js [--force]
const db = require('../models');
const { show, videos } = require('../data/bigg-boss.json');

const force = process.argv.includes('--force');
const MIN_WORDS = 80;
const slugOf = (title, id) => `${title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '')}-${id.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

(async () => {
    const words = show.overview.trim().split(/\s+/).length;
    const profile = { ...show, reviewed_at: new Date(), indexable: words >= MIN_WORDS, published: true };
    const [row, created] = await db.VideoShow.findOrCreate({ where: { slug: show.slug }, defaults: profile });
    if (!created && force) await row.update(profile);
    console.log(`${created ? 'added' : force ? 'reset' : 'exists'} show ${show.slug} (${show.seasons.length} seasons)`);

    for (const v of videos) {
        const slug = slugOf(v.title, v.id);
        const data = {
            slug, title: v.title, description: v.description, video_url: `https://www.youtube.com/watch?v=${v.id}`, source_name: v.channel,
            show_slug: show.slug, category: v.category, scope: 'national', country_code: 'IN', duration_seconds: v.duration_seconds,
            published_at: v.published_at, featured: !!v.featured, published: true,
        };
        const [item, made] = await db.VideoItem.findOrCreate({ where: { slug }, defaults: data });
        if (!made && force) await item.update(data);
        console.log(`${made ? 'added ' : 'exists'} video ${slug}`);
    }
    process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

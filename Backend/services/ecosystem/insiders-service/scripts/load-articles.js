'use strict';
// Upserts the editorial articles by slug, so re-running edits in place rather than duplicating.
const db = require('../models');
const articles = [
    ...require('../content/articles-1'),
    ...require('../content/articles-2'),
    ...require('../content/articles-3'),
];

const readingMins = (body) => Math.max(1, Math.round(body.split(/\s+/).length / 220));

(async () => {
    let created = 0, updated = 0;
    for (const a of articles) {
        const values = {
            ...a,
            reading_mins: readingMins(a.body),
            published_at: new Date(),
        };
        const existing = await db.Article.findOne({ where: { slug: a.slug } });
        if (existing) { await existing.update({ ...values, published_at: existing.published_at || values.published_at }); updated++; }
        else { await db.Article.create(values); created++; }
    }
    console.log(`[articles] +${created} new, ${updated} updated (${articles.length} total)`);
    process.exit(0);
})().catch((e) => { console.error('[articles] failed:', e); process.exit(1); });

'use strict';
// Season 20 in depth: a written profile for each of the 16 housemates and the "so far" season notes, all
// from named sources. Only a profile with at least 80 words is offered to search engines.
//   node scripts/seed-bigg-boss-s20.js
const db = require('../models');
const data = require('../data/bigg-boss-s20.json');
const SHOW = 'bigg-boss';
const MIN_WORDS = 80;
// Status tags shown beside a name in the season list, from the same sources as the notes.
const STATUS = { 'Rohed Khan': 'Evicted on Day 14', 'Uditi Singh': 'Voted out on Day 6, lost a life' };

(async () => {
    const show = await db.VideoShow.findOne({ where: { slug: SHOW } });
    if (!show) throw new Error('Run scripts/seed-bigg-boss.js first');

    // Full names for the two housemates the season list only had a nickname for.
    const seasons = show.seasons.map((s) => (s.number !== 20 ? s : {
        ...s,
        notes: data.notes,
        participants: s.participants.map((p) => { const name = (data.renames.find((r) => r.old === p.name) || { new: p.name }).new; return { ...p, name, result: STATUS[name] || p.result || '' }; }),
    }));
    await show.update({ seasons });
    console.log('season 20 notes and names updated');

    for (const r of data.renames) {
        const slug = r.new.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const old = await db.ShowParticipant.findOne({ where: { show_slug: SHOW, slug: r.old.toLowerCase().replace(/[^a-z0-9]+/g, '-') } });
        if (old) await old.update({ name: r.new, slug });
    }

    for (const p of data.people) {
        const words = p.overview.trim().split(/\s+/).length;
        const rec = await db.ShowParticipant.findOne({ where: { show_slug: SHOW, slug: p.slug } });
        if (!rec) { console.log('MISSING', p.slug); continue; }
        await rec.update({
            name: p.name, known_for: p.known_for, overview: p.overview, facts: p.facts, faq: p.faq, sources: p.sources,
            seo_title: p.seo_title || null, seo_description: p.seo_description || null, reviewed_at: new Date(), indexable: words >= MIN_WORDS, published: true,
        });
        console.log(`${words >= MIN_WORDS ? 'live   ' : 'hidden '} ${p.slug} (${words} words)`);
    }
    process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

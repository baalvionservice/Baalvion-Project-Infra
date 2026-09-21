'use strict';
// Fills podcast photos with each host's Wikimedia Commons portrait (free licence only, credit and licence
// recorded as Commons has them). The first host's portrait becomes the show's main photo; the other hosts
// are added to its gallery. Shows whose hosts have no free portrait are left alone.
//   node scripts/fill-podcast-photos.js [--dry-run]
const db = require('../models');
const { portraitForWikipediaTitle, importFile } = require('../service/commonsSearch');
const profiles = require('../data/podcasts-profiles.json');

// Host name -> the exact English Wikipedia page title (each was fetched and checked to be that person).
const WIKI = {
    'Joe Rogan': 'Joe Rogan', 'Michael Barbaro': 'Michael Barbaro', 'Alex Cooper': 'Alex Cooper (podcaster)', 'Ashley Flowers': 'Ashley Flowers',
    'Mel Robbins': 'Mel Robbins', 'Andrew Huberman': 'Andrew Huberman', 'Ira Glass': 'Ira Glass', 'Dax Shepard': 'Dax Shepard', 'Monica Padman': 'Monica Padman',
    'Karen Kilgariff': 'Karen Kilgariff', 'Georgia Hardstark': 'Georgia Hardstark', 'Steven Bartlett': 'Steven Bartlett (businessman)', 'Alastair Campbell': 'Alastair Campbell',
    'Rory Stewart': 'Rory Stewart', 'Tom Holland': 'Tom Holland (author)', 'Dominic Sandbrook': 'Dominic Sandbrook', 'Emily Maitlis': 'Emily Maitlis', 'Jon Sopel': 'Jon Sopel',
    'Lewis Goodall': 'Lewis Goodall', 'Gary Lineker': 'Gary Lineker', 'Alan Shearer': 'Alan Shearer', 'Micah Richards': 'Micah Richards', 'Ed Gamble': 'Ed Gamble',
    'James Acaster': 'James Acaster', 'Jessie Ware': 'Jessie Ware', 'Lauren Laverne': 'Lauren Laverne', 'Melvyn Bragg': 'Melvyn Bragg', 'Adam Buxton': 'Adam Buxton',
    'Raj Shamani': 'Raj Shamani', 'Nikhil Kamath': 'Nikhil Kamath', 'Amit Varma': 'Amit Varma (writer)', 'Cyrus Broacha': 'Cyrus Broacha', 'Neelesh Misra': 'Neelesh Misra',
};
// Portraits reviewed by eye and rejected (e.g. the subject is a small figure in a wide shot).
const REJECT = new Set(['Michael Barbaro']);
const DRY = process.argv.includes('--dry-run');

(async () => {
    const shows = await db.PodcastShow.findAll({ attributes: ['slug', 'title'], order: [['country_code', 'ASC'], ['rank', 'ASC']] });
    for (const show of shows) {
        const hosts = (profiles[show.slug]?.hosts || []).map((h) => h.name).filter((n) => WIKI[n] && !REJECT.has(n)).slice(0, 3);
        const done = [];
        for (const host of hosts) {
            const c = await portraitForWikipediaTitle(WIKI[host]).catch(() => null);
            if (!c) { done.push(`${host}: no free portrait`); continue; }
            if (DRY) { done.push(`${host}: ${c.title} (${c.license})`); continue; }
            const { created } = await importFile('podcast', show.slug, c.title, host);
            done.push(`${host}: ${created ? 'added' : 'already there'} ${c.title} (${c.license})`);
        }
        console.log(`${show.slug.padEnd(34)} ${done.length ? done.join(' | ') : 'no hosts with a Wikipedia page'}`);
    }
    process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });

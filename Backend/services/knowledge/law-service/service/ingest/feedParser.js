'use strict';
// Minimal RSS 2.0 / Atom reader for the few official feeds we draft from. Deliberately
// dependency-free and text-only: it returns headline, link, id and date, never the
// body, so the site cannot end up republishing another organisation's copy.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => (ENTITIES[n.toLowerCase()] ?? m));
// One pass of tag-stripping can be beaten by nesting ("<<b>script>"), so repeat until nothing changes and then drop any
// stray angle bracket: a headline never needs one, and nothing here is ever rendered as HTML.
const stripTags = (input) => {
    let out = String(input);
    let prev;
    do { prev = out; out = out.replace(/<[^>]*>/g, ''); } while (out !== prev);
    return out.replace(/[<>]/g, '');
};
const clean = (s) => stripTags(decode(s)).replace(/\s+/g, ' ').trim();

const blocks = (xml, tag) => [...String(xml).matchAll(new RegExp(`<${tag}[ >][\\s\\S]*?</${tag}>`, 'g'))].map((m) => m[0]);
const text = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
    return m ? clean(m[1]) : '';
};

function parseAtom(xml) {
    return blocks(xml, 'entry').map((e) => {
        const alt = e.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/) || e.match(/<link[^>]*href="([^"]+)"[^>]*rel="alternate"/) || e.match(/<link[^>]*href="([^"]+)"/);
        return {
            id: text(e, 'id') || (alt ? alt[1] : ''),
            title: text(e, 'title'),
            link: alt ? decode(alt[1]) : '',
            date: text(e, 'published') || text(e, 'updated'),
            author: text(e, 'name'),
        };
    });
}

function parseRss(xml) {
    return blocks(xml, 'item').map((i) => ({
        id: text(i, 'guid') || text(i, 'link'),
        title: text(i, 'title'),
        link: text(i, 'link'),
        date: text(i, 'pubDate'),
        author: '',
    }));
}

/** Picks the parser from the document itself, so a source's declared type cannot drift from what it serves. */
function parseFeed(xml) {
    const s = String(xml);
    if (/<feed[\s>]/.test(s)) return parseAtom(s);
    if (/<rss[\s>]|<channel[\s>]/.test(s)) return parseRss(s);
    throw new Error('not an RSS or Atom document');
}

function wallTimeToUtc(y, mo, d, h, mi, s, timeZone) {
    // Feeds like uscourts.gov send local time with no offset. Resolve it in the named zone, DST included.
    const guess = Date.UTC(y, mo - 1, d, h, mi, s);
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(guess));
    const g = (t) => Number(parts.find((p) => p.type === t).value);
    return guess - (Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - guess);
}

/** ISO and RFC 822 dates parse directly; "YYYY-MM-DD HH:MM:SS" (no zone) is read in `assumeTimeZone`. Returns a Date or null. */
function parseFeedDate(value, assumeTimeZone = 'America/New_York') {
    const v = String(value || '').trim();
    if (!v) return null;
    const bare = v.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
    if (bare) return new Date(wallTimeToUtc(+bare[1], +bare[2], +bare[3], +bare[4], +bare[5], +bare[6], assumeTimeZone));
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}

module.exports = { parseFeed, parseAtom, parseRss, parseFeedDate, clean };

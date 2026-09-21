'use strict';
const { decodeEntities } = require('./text');

// Minimal RSS 2.0 / Atom reader for headlines. Returns title, link, id and date only, never the body,
// so the site cannot end up republishing another outlet's text.

// Repeat tag-stripping until stable (one pass is beaten by nesting), then drop any stray angle bracket.
const stripTags = (input) => {
    let out = String(input);
    let prev;
    do { prev = out; out = out.replace(/<[^>]*>/g, ' '); } while (out !== prev);
    return out.replace(/[<>]/g, ' ');
};
const clean = (s) => stripTags(decodeEntities(String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'))).replace(/\s+/g, ' ').trim();
const blocks = (xml, tag) => [...String(xml).matchAll(new RegExp(`<${tag}[ >][\\s\\S]*?</${tag}>`, 'g'))].map((m) => m[0]);
const text = (block, tag) => { const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`)); return m ? clean(m[1]) : ''; };

function parseFeed(xml) {
    const s = String(xml);
    if (/<feed[\s>]/.test(s)) {
        return blocks(s, 'entry').map((e) => {
            const alt = e.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/) || e.match(/<link[^>]*href="([^"]+)"/);
            return { id: text(e, 'id'), title: text(e, 'title'), link: alt ? decodeEntities(alt[1]) : '', date: text(e, 'published') || text(e, 'updated') };
        });
    }
    if (/<rss[\s>]|<channel[\s>]/.test(s)) {
        return blocks(s, 'item').map((i) => ({ id: text(i, 'guid') || text(i, 'link'), title: text(i, 'title'), link: text(i, 'link'), date: text(i, 'pubDate') || text(i, 'dc:date') }));
    }
    throw new Error('not an RSS or Atom document');
}

module.exports = { parseFeed };

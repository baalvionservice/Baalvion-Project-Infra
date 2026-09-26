'use strict';
const { decodeEntities } = require('./text');

// Google's daily "trending searches" feed, one per country. It lists what people are searching for
// and, per topic, a few news links. It says nothing about *why* and has no category, so callers
// must classify the topic themselves.
const DEFAULT_GEOS = ['US', 'GB', 'IN', 'CA', 'AU'];

const tag = (block, name) => {
    const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
    return m ? decodeEntities(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).replace(/\s+/g, ' ').trim() : '';
};

/** Trend items from one country's feed: topic, rough traffic, time, and the news links Google shows for it. */
function parseTrendsRss(xml) {
    return [...String(xml).matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
        const block = m[1];
        const news = [...block.matchAll(/<ht:news_item>([\s\S]*?)<\/ht:news_item>/g)].map((n) => ({
            title: tag(n[1], 'ht:news_item_title'),
            url: tag(n[1], 'ht:news_item_url'),
            source: tag(n[1], 'ht:news_item_source'),
        })).filter((n) => n.title && /^https:\/\//i.test(n.url));
        const at = new Date(tag(block, 'pubDate'));
        return { topic: tag(block, 'title'), traffic: tag(block, 'ht:approx_traffic'), at: Number.isNaN(at.getTime()) ? null : at, news };
    }).filter((t) => t.topic);
}

async function fetchGoogleTrends({ geos = DEFAULT_GEOS, getText }) {
    const out = []; const errors = [];
    for (const geo of geos) {
        try {
            for (const t of parseTrendsRss(await getText(`https://trends.google.com/trending/rss?geo=${geo}`))) out.push({ ...t, geo });
        } catch (err) { errors.push({ geo, error: String(err.message).slice(0, 120) }); }
    }
    return { trends: out, errors };
}

module.exports = { DEFAULT_GEOS, parseTrendsRss, fetchGoogleTrends };

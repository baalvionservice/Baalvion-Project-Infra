'use strict';
// RSS 2.0 / RSS 1.0 (RDF) / Atom parsing, built on fast-xml-parser (no dedicated
// feed-parsing library — RSS/Atom's structure is simple enough that a thin
// normalization layer over a general XML parser is the right amount of code).
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    trimValues: true,
});

function asArray(value) {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
}

function textOf(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object' && '#text' in value) return String(value['#text']);
    return '';
}

function stripHtml(html) {
    return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Real image URL extraction from the feed item itself (enclosure / media:content /
// media:thumbnail, or the first <img> in the HTML description) — never a placeholder.
// No CDN/re-hosting: the source's own URL is stored and rendered directly.
function firstImgSrc(html) {
    const match = /<img[^>]+src=["']([^"']+)["']/i.exec(String(html || ''));
    return match ? match[1] : null;
}

function extractRssImage(item) {
    const enclosure = item.enclosure;
    if (enclosure && typeof enclosure === 'object') {
        const type = enclosure['@_type'] || '';
        if (type.startsWith('image/') && enclosure['@_url']) return enclosure['@_url'];
    }
    const mediaContent = item['media:content'];
    if (mediaContent) {
        const first = asArray(mediaContent)[0];
        if (first && typeof first === 'object' && first['@_url']) return first['@_url'];
    }
    const mediaThumb = item['media:thumbnail'];
    if (mediaThumb) {
        const first = asArray(mediaThumb)[0];
        if (first && typeof first === 'object' && first['@_url']) return first['@_url'];
    }
    return firstImgSrc(textOf(item.description) || textOf(item['content:encoded']));
}

function normalizeRssItem(item) {
    return {
        title: textOf(item.title),
        link: textOf(item.link),
        guid: textOf(item.guid) || textOf(item.link),
        publishedAt: textOf(item.pubDate) || textOf(item['dc:date']),
        summary: stripHtml(textOf(item.description) || textOf(item['content:encoded'])),
        imageUrl: extractRssImage(item),
    };
}

function normalizeAtomEntry(entry) {
    const links = asArray(entry.link);
    const primaryLink = links.find((l) => !l['@_rel'] || l['@_rel'] === 'alternate') || links[0] || {};
    const href = typeof primaryLink === 'object' ? primaryLink['@_href'] : undefined;
    const enclosureLink = links.find((l) => typeof l === 'object' && l['@_rel'] === 'enclosure' && String(l['@_type'] || '').startsWith('image/'));
    return {
        title: textOf(entry.title),
        link: href || textOf(primaryLink),
        guid: textOf(entry.id) || href,
        publishedAt: textOf(entry.updated) || textOf(entry.published),
        summary: stripHtml(textOf(entry.summary) || textOf(entry.content)),
        imageUrl: (enclosureLink && enclosureLink['@_href']) || firstImgSrc(textOf(entry.summary) || textOf(entry.content)),
    };
}

/** Parses raw RSS 2.0 / RSS 1.0 (RDF) / Atom XML into a normalized list of feed items. */
function parseFeed(xml) {
    const doc = parser.parse(xml);
    if (doc.rss?.channel) return asArray(doc.rss.channel.item).map(normalizeRssItem);
    if (doc.feed?.entry) return asArray(doc.feed.entry).map(normalizeAtomEntry);
    if (doc['rdf:RDF']) return asArray(doc['rdf:RDF'].item).map(normalizeRssItem);
    return [];
}

async function fetchFeed(url, { timeoutMs = 15_000 } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'BaalvionIntelligenceBot/1.0 (+https://signals.baalvion.com)' },
        });
        if (!res.ok) throw new Error(`Feed fetch failed: HTTP ${res.status}`);
        const xml = await res.text();
        return parseFeed(xml);
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = { parseFeed, fetchFeed };

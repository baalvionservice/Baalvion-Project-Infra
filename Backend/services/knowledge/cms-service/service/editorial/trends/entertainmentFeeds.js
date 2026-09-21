'use strict';
const { parseFeed } = require('./feedParser');

/**
 * Headlines from entertainment outlets, as extra signals. Each feed's address was fetched and parsed before it was
 * listed. Do not add one without proving it returns recent items: several obvious candidates (Netflix's newsroom,
 * the WGA, Screen Daily) have no feed, and the Academy's and SAG-AFTRA's are years stale.
 *
 * Only the headline, link and time are kept. The outlet's own text is never stored, so the pipeline can corroborate a
 * story across outlets without any of their prose ending up in ours.
 */
const FEEDS = [
    { id: 'variety', name: 'Variety', department: 'movies', url: 'https://variety.com/feed/' },
    { id: 'deadline', name: 'Deadline', department: 'tv', url: 'https://deadline.com/feed/' },
    { id: 'thr', name: 'The Hollywood Reporter', department: 'movies', url: 'https://www.hollywoodreporter.com/feed/' },
    { id: 'indiewire', name: 'IndieWire', department: 'movies', url: 'https://www.indiewire.com/feed/' },
    { id: 'thewrap', name: 'TheWrap', department: 'tv', url: 'https://www.thewrap.com/feed/' },
    { id: 'billboard', name: 'Billboard', department: 'music', url: 'https://www.billboard.com/feed/' },
    { id: 'pitchfork', name: 'Pitchfork', department: 'music', url: 'https://pitchfork.com/feed/feed-news/rss' },
    { id: 'rollingstone', name: 'Rolling Stone', department: 'music', url: 'https://www.rollingstone.com/feed/' },
    { id: 'consequence', name: 'Consequence', department: 'music', url: 'https://consequence.net/feed/' },
    { id: 'bbc-ent', name: 'BBC News', department: 'celebrity', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
    { id: 'guardian-film', name: 'The Guardian', department: 'movies', url: 'https://www.theguardian.com/film/rss' },
    { id: 'guardian-music', name: 'The Guardian', department: 'music', url: 'https://www.theguardian.com/music/rss' },
    { id: 'guardian-tv', name: 'The Guardian', department: 'tv', url: 'https://www.theguardian.com/tv-and-radio/rss' },
    { id: 'npr-arts', name: 'NPR', department: 'celebrity', url: 'https://feeds.npr.org/1008/rss.xml' },
];

const DEFAULT_MAX_AGE_HOURS = 48;
const DEFAULT_PER_FEED = 12;
const CONCURRENCY = 5;

/** Wire-shaped items (headline + link only) from every feed; a failing feed is reported and skipped. */
async function fetchFeedArticles({ getText, now = new Date(), maxAgeHours = DEFAULT_MAX_AGE_HOURS, perFeed = DEFAULT_PER_FEED, feeds = FEEDS } = {}) {
    const articles = [];
    const report = [];
    const cutoff = now.getTime() - maxAgeHours * 3600 * 1000;

    const one = async (feed) => {
        const line = { id: feed.id, name: feed.name, department: feed.department, items: 0, error: null };
        try {
            const rows = parseFeed(await getText(feed.url))
                .map((e) => ({ ...e, at: new Date(e.date) }))
                .filter((e) => e.title && /^https:\/\//i.test(e.link) && !Number.isNaN(e.at.getTime()) && e.at.getTime() >= cutoff && e.at.getTime() <= now.getTime() + 3600 * 1000)
                .sort((a, b) => b.at - a.at)
                .slice(0, perFeed);
            for (const e of rows) {
                articles.push({ title: e.title, url: e.link, summary_raw: '', source: { name: feed.name, type: 'rss' }, published_at: e.at, category: 'Entertainment', country: null });
            }
            line.items = rows.length;
        } catch (err) { line.error = String(err.message || err).slice(0, 120); }
        report.push(line);
    };
    for (let i = 0; i < feeds.length; i += CONCURRENCY) await Promise.all(feeds.slice(i, i + CONCURRENCY).map(one));
    return { articles, report };
}

module.exports = { FEEDS, fetchFeedArticles };

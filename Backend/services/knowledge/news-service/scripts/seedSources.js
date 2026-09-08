'use strict';
// Seeds real public RSS feeds so the ingestion pipeline has live data to poll.
// Verify each feed_url is still valid before relying on it in production — publishers
// occasionally retire or move their public feeds.
require('dotenv').config();
const db = require('../models');

const sources = [
    { name: 'TechCrunch', type: 'rss', feed_url: 'https://techcrunch.com/feed/', country: 'US', default_category: 'Technology' },
    { name: 'TechCrunch Startups', type: 'rss', feed_url: 'https://techcrunch.com/category/startups/feed/', country: 'US', default_category: 'Startups' },
    { name: 'The Verge', type: 'rss', feed_url: 'https://www.theverge.com/rss/index.xml', country: 'US', default_category: 'Technology' },
    { name: 'Wired', type: 'rss', feed_url: 'https://www.wired.com/feed/rss', country: 'US', default_category: 'Technology' },
    { name: 'MIT News — Artificial Intelligence', type: 'rss', feed_url: 'https://news.mit.edu/rss/topic/artificial-intelligence2', country: 'US', default_category: 'AI' },
    { name: 'BBC World', type: 'rss', feed_url: 'http://feeds.bbci.co.uk/news/world/rss.xml', country: 'UK', default_category: 'World' },
    { name: 'BBC Business', type: 'rss', feed_url: 'http://feeds.bbci.co.uk/news/business/rss.xml', country: 'UK', default_category: 'Business' },
    { name: 'MarketWatch Top Stories', type: 'rss', feed_url: 'https://www.marketwatch.com/rss/topstories', country: 'US', default_category: 'Finance' },
    { name: 'Krebs on Security', type: 'rss', feed_url: 'https://krebsonsecurity.com/feed/', country: 'US', default_category: 'Cybersecurity' },
    { name: 'The Hacker News', type: 'rss', feed_url: 'https://feeds.feedburner.com/TheHackersNews', country: 'US', default_category: 'Cybersecurity' },
    { name: 'ScienceDaily', type: 'rss', feed_url: 'https://www.sciencedaily.com/rss/all.xml', country: 'US', default_category: 'Science' },
    { name: 'NASA', type: 'government', feed_url: 'https://www.nasa.gov/feed/', country: 'US', default_category: 'Science' },

    // ── Legal beat (Law Elite Network) ────────────────────────────────────────
    // Courts, enforcement actions and safety recalls. The three recall/enforcement
    // feeds matter most for the personal-injury and product-liability practice
    // areas: a CPSC or FDA recall is the originating document behind a whole
    // class of claims, not a secondhand report of one.
    { name: 'JURIST Legal News', type: 'rss', feed_url: 'https://www.jurist.org/news/feed/', country: 'US', default_category: 'Legal' },
    { name: 'SCOTUSblog', type: 'rss', feed_url: 'https://www.scotusblog.com/feed/', country: 'US', default_category: 'Legal' },
    { name: 'Above the Law', type: 'rss', feed_url: 'https://feeds.feedburner.com/abovethelaw', country: 'US', default_category: 'Legal' },
    { name: 'U.S. Department of Justice', type: 'government', feed_url: 'https://www.justice.gov/news/rss?type=press_release', country: 'US', default_category: 'Legal' },
    { name: 'Federal Trade Commission', type: 'government', feed_url: 'https://www.ftc.gov/feeds/press-release.xml', country: 'US', default_category: 'Legal' },
    { name: 'CPSC Recalls', type: 'government', feed_url: 'https://www.cpsc.gov/Newsroom/CPSC-RSS-Feed/Recalls-RSS', country: 'US', default_category: 'Legal' },
    { name: 'FDA Recalls', type: 'government', feed_url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml', country: 'US', default_category: 'Legal' },
    { name: 'OSHA News Releases', type: 'government', feed_url: 'https://www.osha.gov/news/newsreleases.xml', country: 'US', default_category: 'Legal' },

    // ── Finance beat (Imperialpedia) ──────────────────────────────────────────
    // The original list carried only MarketWatch and BBC Business for a site
    // whose whole beat is money. Primary sources (Fed, SEC, BLS, CFPB) are first
    // here deliberately: a rate decision or an enforcement order read from the
    // issuing body is a stronger basis for a story than a wire write-up of it.
    { name: 'Federal Reserve Press Releases', type: 'government', feed_url: 'https://www.federalreserve.gov/feeds/press_all.xml', country: 'US', default_category: 'Finance' },
    { name: 'SEC Press Releases', type: 'government', feed_url: 'https://www.sec.gov/news/pressreleases.rss', country: 'US', default_category: 'Finance' },
    { name: 'Bureau of Labor Statistics', type: 'government', feed_url: 'https://www.bls.gov/feed/bls_latest.rss', country: 'US', default_category: 'Finance' },
    { name: 'Consumer Financial Protection Bureau', type: 'government', feed_url: 'https://www.consumerfinance.gov/about-us/newsroom/feed/', country: 'US', default_category: 'Finance' },
    { name: 'CNBC Top News', type: 'rss', feed_url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', country: 'US', default_category: 'Finance' },
    { name: 'Yahoo Finance', type: 'rss', feed_url: 'https://finance.yahoo.com/news/rssindex', country: 'US', default_category: 'Finance' },
];

async function seed() {
    await db.sequelize.authenticate();
    let created = 0;
    for (const source of sources) {
        const [, wasCreated] = await db.Source.findOrCreate({
            where: { feed_url: source.feed_url },
            defaults: { ...source, language: 'en', is_active: true, poll_interval_minutes: 15 },
        });
        if (wasCreated) created += 1;
    }
    console.log(`[news-service] seeded ${created} new sources (${sources.length} total in seed list)`);
    await db.sequelize.close();
}

seed().catch((err) => {
    console.error('[news-service] seed failed:', err.message);
    process.exit(1);
});

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

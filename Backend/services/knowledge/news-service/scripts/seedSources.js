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

    // ── Regional desks (Imperialpedia /world) ─────────────────────────────────
    // Every URL below was fetched and confirmed to return a parseable feed with
    // items on 8 Sep 2026. Region is derived from `country` at publish time
    // (gateService.REGION_BY_COUNTRY), which is why the codes matter: without a
    // mapped country a story is filed on its topic alone and never reaches
    // /world/<region>.
    //
    // Central banks and statistics offices lead each region deliberately — they
    // are primary documents, so the editorial charter's single-primary-source
    // rule lets one of them carry a story on its own.

    // Europe
    { name: 'European Central Bank', type: 'government', feed_url: 'https://www.ecb.europa.eu/rss/press.html', country: 'EU', default_category: 'Finance' },
    { name: 'European Commission', type: 'government', feed_url: 'https://ec.europa.eu/commission/presscorner/api/rss?language=en', country: 'EU', default_category: 'Business' },
    { name: 'UK Office for National Statistics', type: 'government', feed_url: 'https://www.ons.gov.uk/releasecalendar?rss', country: 'GB', default_category: 'Finance' },
    { name: 'HM Treasury', type: 'government', feed_url: 'https://www.gov.uk/government/organisations/hm-treasury.atom', country: 'GB', default_category: 'Finance' },
    { name: 'UK Financial Conduct Authority', type: 'government', feed_url: 'https://www.fca.org.uk/news/rss.xml', country: 'GB', default_category: 'Finance' },

    // Asia-Pacific
    { name: 'Bank of Japan', type: 'government', feed_url: 'https://www.boj.or.jp/en/rss/whatsnew.xml', country: 'JP', default_category: 'Finance' },
    { name: 'Reserve Bank of India', type: 'government', feed_url: 'https://www.rbi.org.in/pressreleases_rss.xml', country: 'IN', default_category: 'Finance' },
    { name: 'Reserve Bank of Australia', type: 'government', feed_url: 'https://www.rba.gov.au/rss/rss-cb-media-releases.xml', country: 'AU', default_category: 'Finance' },
    { name: 'Nikkei Asia', type: 'rss', feed_url: 'https://asia.nikkei.com/rss/feed/nar', country: 'JP', default_category: 'Business' },
    { name: 'The Straits Times — Business', type: 'rss', feed_url: 'https://www.straitstimes.com/news/business/rss.xml', country: 'SG', default_category: 'Business' },

    // China
    { name: 'South China Morning Post — Business', type: 'rss', feed_url: 'https://www.scmp.com/rss/92/feed', country: 'CN', default_category: 'Business' },
    { name: 'Xinhua Business', type: 'rss', feed_url: 'http://www.news.cn/english/rss/businessrss.xml', country: 'CN', default_category: 'Business' },

    // Emerging markets
    { name: 'Al Jazeera', type: 'rss', feed_url: 'https://www.aljazeera.com/xml/rss/all.xml', country: 'QA', default_category: 'World' },
    { name: 'Moneyweb South Africa', type: 'rss', feed_url: 'https://www.moneyweb.co.za/feed/', country: 'ZA', default_category: 'Finance' },
    { name: 'Buenos Aires Times', type: 'rss', feed_url: 'https://www.batimes.com.ar/feed', country: 'AR', default_category: 'Business' },

    // Americas outside the U.S. desk — good finance material with no region page
    // of its own; it lands on topic only, which is the honest filing.
    { name: 'Bank of Canada', type: 'government', feed_url: 'https://www.bankofcanada.ca/content_type/press-releases/feed/', country: 'CA', default_category: 'Finance' },

    // ── Emerging markets ──────────────────────────────────────────────────────
    // The first pass left this region with one usable signal: the central banks
    // of Brazil, Mexico, Turkey, Nigeria, Indonesia and South Africa have all
    // retired or firewalled their public feeds, and the obvious substitute --
    // Google News search RSS -- was rejected on inspection. Its items link to
    // opaque news.google.com/rss/articles/CBMi… redirects rather than to the
    // publisher, and this pipeline cites the body that published a number. A
    // citation a reader cannot follow is not a citation.
    //
    // So these are publisher-direct feeds, every one confirmed to return items
    // whose <link> is the outlet's own URL.
    { name: 'Nairametrics', type: 'rss', feed_url: 'https://nairametrics.com/feed/', country: 'NG', default_category: 'Finance' },
    { name: 'BusinessDay Nigeria', type: 'rss', feed_url: 'https://businessday.ng/feed/', country: 'NG', default_category: 'Business' },
    { name: 'Daily Sabah — Business', type: 'rss', feed_url: 'https://www.dailysabah.com/rssFeed/22', country: 'TR', default_category: 'Business' },
    { name: 'Hürriyet Daily News — Economy', type: 'rss', feed_url: 'https://www.hurriyetdailynews.com/rss/economy', country: 'TR', default_category: 'Finance' },
    { name: 'The Rio Times', type: 'rss', feed_url: 'https://www.riotimesonline.com/feed/', country: 'BR', default_category: 'Business' },
    { name: 'Mexico News Daily', type: 'rss', feed_url: 'https://mexiconewsdaily.com/feed/', country: 'MX', default_category: 'Business' },
    { name: 'Egypt Independent', type: 'rss', feed_url: 'https://www.egyptindependent.com/feed/', country: 'EG', default_category: 'World' },
    { name: 'Buenos Aires Herald', type: 'rss', feed_url: 'https://buenosairesherald.com/feed', country: 'AR', default_category: 'Business' },

    // India files under Asia-Pacific, not Emerging — the site has both regions
    // and India is geographically the former, whatever its market classification.
    { name: 'Livemint — Economy', type: 'rss', feed_url: 'https://www.livemint.com/rss/economy', country: 'IN', default_category: 'Finance' },
    { name: 'The Economic Times', type: 'rss', feed_url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', country: 'IN', default_category: 'Business' },
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

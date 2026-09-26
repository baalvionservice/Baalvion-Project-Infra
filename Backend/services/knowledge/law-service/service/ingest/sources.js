'use strict';
// Official, login-free feeds we draft homepage "breaking" candidates from. Adding a source is one
// entry here. A candidate carries only a headline, the publisher's name, a link and a time:
// the summary stays empty so an editor writes it in their own words (see the admin workflow guide).
//
// Every address below was fetched and parsed before it was listed. Many courts publish no feed at
// all (Canada, Australia, India, Ireland, Singapore ...) or a dead one, so do not add a source
// without proving it returns recent, parseable items first.

const HOUR = 3600 * 1000;
const toHttps = (u) => String(u || '').replace(/^http:\/\//i, 'https://');
const tail = (id, re) => String(id).replace(re, '$1');

const courtListenerCourts = () =>
    String(process.env.INGEST_COURTS || 'scotus').split(',').map((c) => c.trim().toLowerCase()).filter((c) => /^[a-z0-9]+$/.test(c));

// region: an ISO 3166 country code, or INTL for international bodies. Shown to editors next to each draft.
function sources() {
    return [
        ...courtListenerCourts().map((court) => ({
            id: `courtlistener-${court}`, keyPrefix: 'courtlistener',
            label: `CourtListener opinions (${court})`,
            region: 'US',
            url: `https://www.courtlistener.com/feed/court/${court}/`,
            maxAgeMs: 40 * HOUR, // opinions are dated to the day, so allow for the midnight timestamp
            limit: 8,
            candidate: (e) => ({
                key: `courtlistener:${tail(e.id, /^.*\/opinion\/(\d+).*$/)}`,
                title: `${e.title} — ${e.author || 'court'} opinion`,
                source_name: e.author || 'CourtListener',
                url: e.link,
            }),
        })),
        {
            id: 'uscourts-news', keyPrefix: 'uscourts', label: 'Federal judiciary news (uscourts.gov)', region: 'US',
            url: 'https://www.uscourts.gov/news/rss', maxAgeMs: 36 * HOUR, limit: 6,
            candidate: (e) => ({ key: `uscourts:${e.id}`, title: e.title, source_name: 'U.S. Courts (federal judiciary)', url: toHttps(e.link) }),
        },
        {
            id: 'doj-press', keyPrefix: 'doj', label: 'Department of Justice press releases', region: 'US',
            url: 'https://www.justice.gov/news/rss?type=press_release&m=1', maxAgeMs: 36 * HOUR, limit: 8,
            candidate: (e) => ({ key: `doj:${e.id || e.link}`, title: e.title, source_name: 'U.S. Department of Justice', url: toHttps(e.link) }),
        },
        {
            id: 'uk-moj-news', keyPrefix: 'govuk', label: 'UK Ministry of Justice news (gov.uk)', region: 'GB',
            url: 'https://www.gov.uk/search/news-and-communications.atom?organisations%5B%5D=ministry-of-justice', maxAgeMs: 36 * HOUR, limit: 6,
            candidate: (e) => ({ key: `govuk:${e.id || e.link}`, title: e.title, source_name: 'UK Ministry of Justice', url: e.link }),
        },
        {
            id: 'uk-judiciary', keyPrefix: 'ukjud', label: 'Courts and Tribunals Judiciary (judiciary.uk)', region: 'GB',
            url: 'https://www.judiciary.uk/feed/', maxAgeMs: 36 * HOUR, limit: 6,
            candidate: (e) => ({ key: `ukjud:${e.id || e.link}`, title: e.title, source_name: 'Courts and Tribunals Judiciary (UK)', url: e.link }),
        },
        {
            id: 'ke-judiciary', keyPrefix: 'kejud', label: 'Judiciary of Kenya', region: 'KE',
            url: 'https://www.judiciary.go.ke/feed/', maxAgeMs: 36 * HOUR, limit: 6,
            candidate: (e) => ({ key: `kejud:${e.id || e.link}`, title: e.title, source_name: 'Judiciary of Kenya', url: e.link }),
        },
        {
            id: 'un-law-crime', keyPrefix: 'un', label: 'UN News: law and crime prevention', region: 'INTL',
            url: 'https://news.un.org/feed/subscribe/en/news/topic/law-and-crime-prevention/feed/rss.xml', maxAgeMs: 36 * HOUR, limit: 6,
            candidate: (e) => ({ key: `un:${e.id || e.link}`, title: e.title, source_name: 'UN News', url: e.link }),
        },
        {
            id: 'icc-news', keyPrefix: 'icc', label: 'International Criminal Court', region: 'INTL',
            url: 'https://www.icc-cpi.int/rss.xml', maxAgeMs: 36 * HOUR, limit: 6,
            candidate: (e) => ({ key: `icc:${tail(e.id, /^(\d+).*$/)}`, title: e.title, source_name: 'International Criminal Court', url: e.link }),
        },
    ];
}

module.exports = { sources };

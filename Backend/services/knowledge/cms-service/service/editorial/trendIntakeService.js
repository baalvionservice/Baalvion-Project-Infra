'use strict';

/**
 * Stage 1b — trending entertainment topics.
 *
 * Finds what is trending (Google Trends per country, Wikipedia most-read, TMDB when a key is set),
 * keeps only entertainment topics, and records them as ordinary signals scored against the site's
 * charter. Nothing here writes an article or skips a stage: a trend is a *lead*, and the brief stage
 * still requires facts that cite a real source URL before anything is drafted, then a human approves.
 */

const charterService = require('./charterService');
const { ingestArticles, DEFAULT_ACCEPT_THRESHOLD } = require('./intakeService');
const { fetchTrendArticles } = require('./trends');
const { DEFAULT_GEOS } = require('./trends/googleTrends');
const { fetchFeedArticles } = require('./trends/entertainmentFeeds');
const defaultHttp = require('./trends/http');

async function runTrendIntake(websiteId, { geos = DEFAULT_GEOS, acceptThreshold = DEFAULT_ACCEPT_THRESHOLD, fetchTrends = fetchTrendArticles, feeds = true, fetchFeeds = () => fetchFeedArticles({ getText: defaultHttp.getText }) } = {}) {
    const charter = await charterService.requireCharter(websiteId); // a site with no charter is refused, as everywhere else
    const { articles, report } = await fetchTrends({ geos });
    // Entertainment outlets' headlines: the same story from two outlets is what lets the brief stage corroborate it.
    const fromFeeds = feeds ? await fetchFeeds() : { articles: [], report: [] };
    const all = [...articles, ...fromFeeds.articles];
    const counts = await ingestArticles(websiteId, charter, all, acceptThreshold);
    return { scanned: all.length, ...counts, report: { ...report, feeds: fromFeeds.report } };
}

module.exports = { runTrendIntake };

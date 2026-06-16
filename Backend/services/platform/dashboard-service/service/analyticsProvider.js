'use strict';
// Web-analytics provider seam. Per-domain metrics are served from the domain_analytics cache table.
// To make figures fully live, implement fetchDomainMetrics() against your analytics source
// (Google Analytics Data API, Plausible, Matomo, Cloudflare Web Analytics, ...) and return a partial
// object of camelCase fields to override the cached row (e.g. { monthlyVisitors, pageViews, uptime }).
// Returning null (the default) means "no live override — serve the cached/seeded values".

/**
 * @param {string} _domain e.g. 'baalvionmining.com'
 * @returns {Promise<object|null>} partial override of analytics fields, or null.
 */
async function fetchDomainMetrics(_domain) {
    // No external analytics integration configured yet — serve cached values.
    // Example wiring:
    //   const r = await gaClient.runReport({ property, domain: _domain });
    //   return { monthlyVisitors: r.users, pageViews: r.pageViews, ... };
    return null;
}

module.exports = { fetchDomainMetrics };

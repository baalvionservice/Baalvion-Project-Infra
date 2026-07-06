'use strict';
/**
 * Cloudflare Analytics connector (GraphQL Analytics API).
 *
 * requiredCreds: zoneId, apiToken (scoped: Zone → Analytics → Read)
 */
const { requireCreds } = require('./lib/googleAuth');

const API_URL = 'https://api.cloudflare.com/client/v4/graphql';
const day = (d) => d.toISOString().slice(0, 10);

const QUERY = `
query ZoneStats($zoneTag: string, $since: Date, $until: Date) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1dGroups(limit: 31, filter: { date_geq: $since, date_leq: $until }) {
        dimensions { date }
        sum { requests pageViews bytes threats }
        uniq { uniques }
      }
    }
  }
}`;

module.exports = {
    id: 'cloudflare',
    provider: 'cloudflare',
    category: 'traffic',
    requiredCreds: ['zoneId', 'apiToken'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'Cloudflare'); },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);

        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${merged.apiToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: QUERY, variables: { zoneTag: merged.zoneId, since: day(since), until: day(until) } }),
        });
        if (!res.ok) throw new Error(`Cloudflare GraphQL failed: HTTP ${res.status}`);
        const json = await res.json();
        if (json.errors) throw new Error(`Cloudflare GraphQL error: ${(json.errors[0] && json.errors[0].message) || 'unknown'}`);

        const zone = json.data && json.data.viewer && json.data.viewer.zones && json.data.viewer.zones[0];
        const groups = (zone && zone.httpRequests1dGroups) || [];
        const out = [];
        for (const g of groups) {
            const d = g.dimensions && g.dimensions.date;
            if (!d) continue;
            const sum = g.sum || {};
            out.push(
                { metric: 'requests', dims: {}, value: Number(sum.requests || 0), granularity: 'day', periodStart: d, periodEnd: d },
                { metric: 'pageviews', dims: {}, value: Number(sum.pageViews || 0), granularity: 'day', periodStart: d, periodEnd: d },
                { metric: 'bytes', dims: {}, value: Number(sum.bytes || 0), granularity: 'day', periodStart: d, periodEnd: d },
                { metric: 'threats', dims: {}, value: Number(sum.threats || 0), granularity: 'day', periodStart: d, periodEnd: d },
                { metric: 'uniqueVisitors', dims: {}, value: Number((g.uniq && g.uniq.uniques) || 0), granularity: 'day', periodStart: d, periodEnd: d },
            );
        }
        logger.debug({ days: groups.length }, 'Cloudflare sync complete');
        return out;
    },
};

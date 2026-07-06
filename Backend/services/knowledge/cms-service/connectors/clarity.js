'use strict';
/**
 * Microsoft Clarity connector (Data Export API, beta).
 *
 * Clarity's export API is project-scoped with a plain bearer API token (no
 * OAuth) and — a hard platform constraint — only returns the LAST 1-3 days; it
 * has no historical date-range parameter. This connector always requests the
 * max (3 days) regardless of the sync job's since/until window. It is a beta
 * API — field names in `information` rows may shift; verify against a live
 * response if Microsoft changes the shape.
 *
 * requiredCreds: apiToken
 */
const { requireCreds } = require('./lib/googleAuth');

const API_URL = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';
const MAX_DAYS = 3;

module.exports = {
    id: 'clarity',
    provider: 'clarity',
    category: 'traffic',
    requiredCreds: ['apiToken'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'Clarity'); },

    async sync({ creds, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);

        const res = await fetch(`${API_URL}?numOfDays=${MAX_DAYS}`, { headers: { Authorization: `Bearer ${merged.apiToken}` } });
        if (!res.ok) throw new Error(`Clarity export failed: HTTP ${res.status}`);
        const json = await res.json(); // array of { metricName, information: [...] }

        const periodEnd = until.toISOString().slice(0, 10);
        const periodStart = new Date(until.getTime() - (MAX_DAYS - 1) * 86_400_000).toISOString().slice(0, 10);
        const out = [];
        for (const entry of (Array.isArray(json) ? json : [])) {
            const metric = entry.metricName;
            if (!metric) continue;
            for (const info of (entry.information || [])) {
                const value = Number(info.sessionsCount ?? info.sessionsWithMetricPercentage ?? info.totalSessionCount ?? 0);
                if (Number.isFinite(value)) out.push({ metric, dims: {}, value, granularity: 'range', periodStart, periodEnd });
            }
        }
        logger.debug({ metrics: out.length }, 'Clarity sync complete');
        return out;
    },
};

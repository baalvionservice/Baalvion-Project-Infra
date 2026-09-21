'use strict';
const { parseFeed, parseFeedDate } = require('./feedParser');
const { sources } = require('./sources');
const { validateHomeWidgetItem } = require('../../utils/homeWidgetValidation');

const UA = 'Mozilla/5.0 (compatible; LawEliteNetwork-ingest; +https://lawelitenetwork.com)';
const MAX_BYTES = 3 * 1024 * 1024;
const BREAKING_LIFETIME_MS = 48 * 3600 * 1000; // the most a breaking item may stay up (see homeWidgetValidation)

async function fetchText(url) {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml' }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.text();
    if (body.length > MAX_BYTES) throw new Error('feed is unexpectedly large');
    return body;
}

/**
 * Drafts new candidates from every official source. Never publishes: rows are created with
 * published=false so an editor reviews, rewrites the summary, and publishes. A failing source
 * is reported and skipped; it never stops the others. `deps` exists so tests can run offline.
 */
async function runIngest({ Model = require('../../models').HomeWidgetItem, get = fetchText, now = new Date() } = {}) {
    const report = { created: 0, alreadyKnown: 0, tooOld: 0, invalid: 0, sources: [] };
    for (const src of sources()) {
        const line = { id: src.id, label: src.label, created: 0, error: null };
        try {
            const entries = parseFeed(await get(src.url));
            const recent = [];
            for (const e of entries) {
                const at = parseFeedDate(e.date);
                if (!at || !e.title || !e.link) { report.invalid++; continue; }
                if (now.getTime() - at.getTime() > src.maxAgeMs || at.getTime() > now.getTime() + 3600 * 1000) { report.tooOld++; continue; }
                recent.push({ ...src.candidate(e), at, region: src.region });
            }
            recent.sort((a, b) => b.at - a.at);
            const picked = recent.slice(0, src.limit);
            const known = new Set((await Model.findAll({ where: { source_key: picked.map((c) => c.key) }, attributes: ['source_key'] })).map((r) => r.source_key));
            for (const c of picked) {
                if (known.has(c.key)) { report.alreadyKnown++; continue; }
                const row = {
                    widget: 'breaking', title: c.title.slice(0, 300), summary: '', source_name: c.source_name, url: c.url,
                    event_at: c.at.toISOString(), expires_at: new Date(c.at.getTime() + BREAKING_LIFETIME_MS).toISOString(),
                    published: false, archived: false, source_key: c.key, extra: { region: c.region }, region: c.region,
                };
                try { validateHomeWidgetItem({ ...row }, true); } catch { report.invalid++; continue; }
                await Model.create(row);
                report.created++; line.created++;
            }
        } catch (err) {
            line.error = String(err.message || err).slice(0, 200);
        }
        report.sources.push(line);
    }
    return report;
}

/** runIngest plus a stored record of the outcome, so the console can show per-feed health. Used by the admin button and the worker. */
async function runAndRecord() {
    const report = await runIngest();
    try {
        await require('../../models').IngestRun.create({ created: report.created, report });
    } catch (err) {
        console.error('[ingest] could not store run record:', err.message); // never fail a fetch over bookkeeping
    }
    return report;
}

module.exports = { runIngest, runAndRecord, fetchText };

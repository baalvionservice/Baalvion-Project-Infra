'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { KINDS } = require('../utils/homeWidgetValidation');

// What the console's Law Elite overview counts. `verified` = the table has an editor sign-off flag.
const SECTIONS = [
    { key: 'people', label: 'People', model: 'Person', href: '/law/people', verified: true },
    { key: 'cases', label: 'Cases', model: 'CaseProfile', href: '/law/cases', verified: true },
    { key: 'courts', label: 'Courts', model: 'CourtProfile', href: '/law/courts', verified: false },
    { key: 'entertainment', label: 'Entertainment', model: 'EntertainmentEntity', href: '/law/entertainment', verified: true },
    { key: 'sports_teams', label: 'Sports teams', model: 'SportsTeam', href: '/law/sports-teams', verified: true },
    { key: 'competitions', label: 'Competitions', model: 'SportsCompetition', href: '/law/sports-competitions', verified: true },
    { key: 'topics', label: 'Topics', model: 'Topic', href: '/law/topics', verified: false },
];
const DAY_MS = 24 * 3600 * 1000;

async function countSection(s) {
    const M = db[s.model];
    const [published, draft, archived, unverified] = await Promise.all([
        M.count({ where: { published: true, archived: false } }),
        M.count({ where: { published: false, archived: false } }),
        M.count({ where: { archived: true } }),
        s.verified ? M.count({ where: { published: true, archived: false, verified: false } }) : Promise.resolve(0),
    ]);
    return { key: s.key, label: s.label, href: s.href, published, draft, archived, unverified };
}

/** Read-only summary for the console's Law Elite landing page: what is live, what awaits review, what is about to lapse. */
const overview = async (req, res, next) => {
    try {
        const now = new Date();
        const soon = new Date(now.getTime() + DAY_MS);
        const notExpired = { [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: now } }] };
        const live = { published: true, archived: false, ...notExpired };
        const [sections, widgetRows] = await Promise.all([
            Promise.all(SECTIONS.map(countSection)),
            Promise.all(KINDS.map(async (kind) => {
                const [liveCount, drafts, expiringSoon, lapsed] = await Promise.all([
                    db.HomeWidgetItem.count({ where: { widget: kind, ...live } }),
                    db.HomeWidgetItem.count({ where: { widget: kind, published: false, archived: false } }),
                    db.HomeWidgetItem.count({ where: { widget: kind, published: true, archived: false, expires_at: { [Op.gt]: now, [Op.lte]: soon } } }),
                    db.HomeWidgetItem.count({ where: { widget: kind, published: true, archived: false, expires_at: { [Op.lte]: now } } }),
                ]);
                return { widget: kind, live: liveCount, drafts, expiringSoon, lapsed };
            })),
        ]);
        return sendSuccess(req, res, { generatedAt: now.toISOString(), sections, widgets: widgetRows });
    } catch (err) { return next(err); }
};

module.exports = { overview };

const { sources: ingestSources } = require('../service/ingest/sources');
const REGION_ORDER = ['US', 'GB', 'KE', 'INTL'];

/** Country-by-country view of the homepage fetcher: each source's feed health on the last run and what its items became. */
const sourcesBreakdown = async (req, res, next) => {
    try {
        const [rows] = await db.sequelize.query(`
            SELECT split_part(source_key, ':', 1) AS prefix,
              count(*) FILTER (WHERE published = false AND archived = false AND (expires_at IS NULL OR expires_at > now()))::int AS waiting,
              count(*) FILTER (WHERE published AND archived = false AND (expires_at IS NULL OR expires_at > now()))::int AS live,
              count(*) FILTER (WHERE archived)::int AS skipped,
              count(*) FILTER (WHERE archived = false AND expires_at <= now())::int AS expired,
              count(*)::int AS total,
              max(event_at) AS latest
            FROM legal.home_widget_items WHERE source_key IS NOT NULL GROUP BY 1`);
        const byPrefix = Object.fromEntries(rows.map((r) => [r.prefix, r]));
        const lastRun = await db.IngestRun.findOne({ order: [['ran_at', 'DESC']] });
        const perSource = Object.fromEntries(((lastRun && lastRun.report && lastRun.report.sources) || []).map((s) => [s.id, s]));
        const manual = await db.HomeWidgetItem.count({ where: { source_key: null, archived: false } });

        const groups = {};
        for (const s of ingestSources()) {
            const c = byPrefix[s.keyPrefix] || { waiting: 0, live: 0, skipped: 0, expired: 0, total: 0, latest: null };
            const run = perSource[s.id];
            (groups[s.region] = groups[s.region] || []).push({
                id: s.id, label: s.label, url: s.url,
                waiting: c.waiting, live: c.live, skipped: c.skipped, expired: c.expired, total: c.total, latestItemAt: c.latest,
                lastRun: run ? { ok: !run.error, error: run.error, drafted: run.created } : null,
            });
        }
        const countries = Object.keys(groups).sort((a, b) => REGION_ORDER.indexOf(a) - REGION_ORDER.indexOf(b)).map((region) => {
            const list = groups[region];
            const sum = (k) => list.reduce((n, x) => n + x[k], 0);
            return { region, sources: list, waiting: sum('waiting'), live: sum('live'), skipped: sum('skipped'), expired: sum('expired'), total: sum('total') };
        });
        return sendSuccess(req, res, { generatedAt: new Date().toISOString(), lastRunAt: lastRun ? lastRun.ran_at : null, countries, manualEntries: manual });
    } catch (err) { return next(err); }
};

module.exports.sourcesBreakdown = sourcesBreakdown;

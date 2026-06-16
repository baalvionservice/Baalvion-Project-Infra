'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { refreshFxRates } = require('../service/fxProvider');

const STALE_MS = 6 * 60 * 60 * 1000; // refresh if cached rates are older than 6h
const HOUR_MS = 60 * 60 * 1000;

function toView(rows) {
    const now = Date.now();
    const asOf = rows.reduce((max, r) => {
        const t = r.as_of ? new Date(r.as_of).getTime() : 0;
        return t > max ? t : max;
    }, 0);
    return {
        base: rows[0]?.base || 'USD',
        asOf: asOf ? new Date(asOf).toISOString() : new Date().toISOString(),
        rates: rows.map((r) => {
            const updated = r.last_updated ? new Date(r.last_updated).getTime() : 0;
            return {
                code: r.code, symbol: r.symbol, currency: r.currency,
                rate: Number(r.rate), change24h: Number(r.change_24h), change7d: Number(r.change_7d),
                lastUpdated: updated && now - updated < HOUR_MS ? 'just now' : (r.last_updated ? new Date(r.last_updated).toISOString() : 'just now'),
            };
        }),
    };
}

exports.get = async (req, res, next) => {
    try {
        let rows = await db.FxRate.findAll({ order: [['id', 'ASC']], raw: false });
        const newest = rows.reduce((max, r) => {
            const t = r.last_updated ? new Date(r.last_updated).getTime() : 0;
            return t > max ? t : max;
        }, 0);
        if (rows.length && Date.now() - newest > STALE_MS) {
            try { rows = await refreshFxRates(db); } catch (_) { /* serve cached */ }
        }
        return sendSuccess(req, res, toView(rows.map((r) => (r.get ? r.get({ plain: true }) : r))));
    } catch (err) { return next(err); }
};

exports.refresh = async (req, res, next) => {
    try {
        const rows = await refreshFxRates(db);
        return sendSuccess(req, res, toView(rows.map((r) => (r.get ? r.get({ plain: true }) : r))));
    } catch (err) { return next(err); }
};

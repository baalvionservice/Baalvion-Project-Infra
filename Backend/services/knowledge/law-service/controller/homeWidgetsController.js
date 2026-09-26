'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { KINDS } = require('../utils/homeWidgetValidation');

const FIELDS = ['id', 'widget', 'title', 'summary', 'source_name', 'url', 'image_url', 'credit', 'value', 'extra', 'event_at', 'sort_order'];

/** Everything the homepage widgets should show right now, grouped by widget. Expired entries drop out on their own. */
const listLive = async (req, res, next) => {
    try {
        const now = new Date();
        const rows = await db.HomeWidgetItem.findAll({
            where: { published: true, archived: false, [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: now } }] },
            attributes: FIELDS,
            order: [['sort_order', 'ASC'], ['event_at', 'DESC'], ['id', 'DESC']],
            limit: 300,
        });
        const grouped = Object.fromEntries(KINDS.map((k) => [k, []]));
        for (const r of rows) if (grouped[r.widget]) grouped[r.widget].push(r);
        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
        return sendSuccess(req, res, grouped);
    } catch (err) { return next(err); }
};

/** Admin "fetch now": drafts new candidates from the official feeds once. Drafts only; nothing is published. */
const ingestNow = async (req, res, next) => {
    try { return sendSuccess(req, res, await require('../service/ingest/run').runAndRecord()); }
    catch (err) { return next(err); }
};

module.exports = { listLive, ingestNow };

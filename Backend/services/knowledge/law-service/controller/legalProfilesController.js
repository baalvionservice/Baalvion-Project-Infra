'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const publicWhere = { published: true, archived: false };
const cache = (res) => res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

const list = (Model, order) => async (req, res, next) => {
    try {
        const rows = await Model.findAll({ where: publicWhere, order, limit: 5000 });
        cache(res);
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

const one = (Model, label) => async (req, res, next) => {
    try {
        const row = await Model.findOne({ where: { ...publicWhere, slug: req.params.slug } });
        if (!row) return next(new AppError('NOT_FOUND', `${label} not found`, 404));
        cache(res);
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
};

/** Slugs an editor has ARCHIVED. The site hides its bundled copy of these, so archiving in the admin panel really takes a seeded case or court offline. */
const hiddenSlugs = async (req, res, next) => {
    try {
        const where = { archived: true };
        const [cases, courts] = await Promise.all([
            db.CaseProfile.findAll({ where, attributes: ['slug'] }),
            db.CourtProfile.findAll({ where, attributes: ['slug'] }),
        ]);
        cache(res);
        return sendSuccess(req, res, { cases: cases.map((r) => r.slug), courts: courts.map((r) => r.slug) });
    } catch (err) { return next(err); }
};

module.exports = {
    hiddenSlugs,
    listCourts: list(db.CourtProfile, [['name', 'ASC']]),
    getCourt: one(db.CourtProfile, 'Court'),
    listCases: list(db.CaseProfile, [['case_name', 'ASC']]),
    getCase: one(db.CaseProfile, 'Case'),
};

'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const publicWhere = { published: true, archived: false };
const cache = (res) => res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

const list = (Model, order) => async (req, res, next) => {
    try { const rows = await Model.findAll({ where: publicWhere, order, limit: 5000 }); cache(res); return sendSuccess(req, res, rows); }
    catch (err) { return next(err); }
};
const one = (Model, label) => async (req, res, next) => {
    try {
        const row = await Model.findOne({ where: { ...publicWhere, slug: req.params.slug } });
        if (!row) return next(new AppError('NOT_FOUND', `${label} not found`, 404));
        cache(res); return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
};

/** Slugs an editor has archived; the site hides its bundled copy of these. */
const hiddenSlugs = async (req, res, next) => {
    try {
        const where = { archived: true };
        const [teams, competitions] = await Promise.all([
            db.SportsTeam.findAll({ where, attributes: ['slug'] }),
            db.SportsCompetition.findAll({ where, attributes: ['slug'] }),
        ]);
        cache(res);
        return sendSuccess(req, res, { teams: teams.map((r) => r.slug), competitions: competitions.map((r) => r.slug) });
    } catch (err) { return next(err); }
};

module.exports = {
    hiddenSlugs,
    listTeams: list(db.SportsTeam, [['name', 'ASC']]), getTeam: one(db.SportsTeam, 'Team'),
    listCompetitions: list(db.SportsCompetition, [['name', 'ASC']]), getCompetition: one(db.SportsCompetition, 'Competition'),
};

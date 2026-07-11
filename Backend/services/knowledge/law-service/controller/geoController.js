'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

// Public — states for a country (registration wizard Step 2 + search filters).
const listStates = async (req, res, next) => {
    try {
        const countryCode = String(req.query.countryCode || '').toUpperCase();
        if (!countryCode) return next(new AppError('VALIDATION_ERROR', 'countryCode is required', 422));
        const states = await db.State.findAll({
            where: { country_code: countryCode },
            order: [['name', 'ASC']],
        });
        return sendSuccess(req, res, states);
    } catch (err) { return next(err); }
};

// Public — cities for a state (registration wizard Step 3 + search filters).
const listCities = async (req, res, next) => {
    try {
        const stateId = Number(req.query.stateId);
        if (!stateId) return next(new AppError('VALIDATION_ERROR', 'stateId is required', 422));
        const cities = await db.City.findAll({
            where: { state_id: stateId },
            order: [['name', 'ASC']],
        });
        return sendSuccess(req, res, cities);
    } catch (err) { return next(err); }
};

// Real active-lawyer counts per state within a country — mirrors the existing
// /lawyers/countries "browse by country" pattern so the search UI never shows
// a fabricated number next to a state/city filter option.
const statesSummary = async (req, res, next) => {
    try {
        const countryCode = String(req.query.countryCode || '').toUpperCase();
        if (!countryCode) return next(new AppError('VALIDATION_ERROR', 'countryCode is required', 422));
        const rows = await db.Lawyer.findAll({
            attributes: ['state_id', [db.sequelize.fn('COUNT', db.sequelize.col('Lawyer.id')), 'count']],
            where: { status: 'active', country_code: countryCode, state_id: { [Op.ne]: null } },
            include: [{ model: db.State, as: 'state', attributes: ['id', 'name', 'code'] }],
            group: ['state_id', 'state.id', 'state.name', 'state.code'],
            raw: true,
            nest: true,
        });
        return sendSuccess(req, res, rows.map((r) => ({
            stateId: r.state_id, name: r.state?.name, code: r.state?.code, count: Number(r.count),
        })));
    } catch (err) { return next(err); }
};

const citiesSummary = async (req, res, next) => {
    try {
        const stateId = Number(req.query.stateId);
        if (!stateId) return next(new AppError('VALIDATION_ERROR', 'stateId is required', 422));
        const rows = await db.Lawyer.findAll({
            attributes: ['city_id', [db.sequelize.fn('COUNT', db.sequelize.col('Lawyer.id')), 'count']],
            where: { status: 'active', state_id: stateId, city_id: { [Op.ne]: null } },
            include: [{ model: db.City, as: 'cityRef', attributes: ['id', 'name'] }],
            group: ['city_id', 'cityRef.id', 'cityRef.name'],
            raw: true,
            nest: true,
        });
        return sendSuccess(req, res, rows.map((r) => ({
            cityId: r.city_id, name: r.cityRef?.name, count: Number(r.count),
        })));
    } catch (err) { return next(err); }
};

module.exports = { listStates, listCities, statesSummary, citiesSummary };

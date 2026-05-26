'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');

const getTradeSummary = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const rows = await db.sequelize.query(
            `SELECT status, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total_amount
             FROM mining.orders
             WHERE org_id = :orgId
             GROUP BY status`,
            { replacements: { orgId }, type: db.sequelize.QueryTypes.SELECT }
        );
        return sendSuccess(req, res, { by_status: rows });
    } catch (err) { return next(err); }
};

const getListingStats = async (req, res, next) => {
    try {
        const rows = await db.sequelize.query(
            `SELECT mineral_type, COUNT(*) AS count
             FROM mining.mineral_listings
             GROUP BY mineral_type
             ORDER BY count DESC`,
            { type: db.sequelize.QueryTypes.SELECT }
        );
        return sendSuccess(req, res, { by_mineral_type: rows });
    } catch (err) { return next(err); }
};

const getMonthlyVolume = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const rows = await db.sequelize.query(
            `SELECT DATE_TRUNC('month', created_at) AS month,
                    COUNT(*) AS count,
                    COALESCE(SUM(total_amount), 0) AS total_amount
             FROM mining.orders
             WHERE org_id = :orgId
               AND created_at >= NOW() - INTERVAL '12 months'
             GROUP BY DATE_TRUNC('month', created_at)
             ORDER BY month ASC`,
            { replacements: { orgId }, type: db.sequelize.QueryTypes.SELECT }
        );
        return sendSuccess(req, res, { monthly_volume: rows });
    } catch (err) { return next(err); }
};

module.exports = { getTradeSummary, getListingStats, getMonthlyVolume };

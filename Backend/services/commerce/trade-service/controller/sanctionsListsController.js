'use strict';
// GET /v1/compliance/lists/status — how fresh each sanctions list is, for ops dashboards and
// external monitors. Counts and dates only; nothing about customers.
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const alerts = require('../service/compliance/lists/alerts');

const listsStatus = async (req, res, next) => {
    try {
        const lists = await alerts.getStatus(db.sequelize);
        return sendSuccess(req, res, {
            ok: lists.every((l) => !l.stale),
            max_age_hours: alerts.maxAgeHours(),
            lists,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = { listsStatus };

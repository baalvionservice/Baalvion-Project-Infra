'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');

// Public — the fixed practice-area list (registration wizard Step "Professional
// Details" multi-select + search filter dropdown).
const listPracticeAreas = async (req, res, next) => {
    try {
        const areas = await db.PracticeArea.findAll({
            where: { is_active: true },
            order: [['order', 'ASC'], ['name', 'ASC']],
        });
        return sendSuccess(req, res, areas);
    } catch (err) { return next(err); }
};

module.exports = { listPracticeAreas };

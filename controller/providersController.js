'use strict';
const providers = require('../providers');
const { sendSuccess } = require('../utils/response');

const health = async (req, res, next) => {
    try {
        const report = await providers.healthAll();
        return sendSuccess(req, res, report);
    } catch (err) {
        return next(err);
    }
};

module.exports = { health };

'use strict';
const { sendSuccess } = require('../utils/response');
const reconciliation = require('../service/reconciliationService');

const report = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        return sendSuccess(req, res, await reconciliation.report(req.params.storeId, { from, to }));
    } catch (err) { return next(err); }
};

const backfill = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        return sendSuccess(req, res, await reconciliation.backfill(req.params.storeId, { from, to }));
    } catch (err) { return next(err); }
};

module.exports = { report, backfill };

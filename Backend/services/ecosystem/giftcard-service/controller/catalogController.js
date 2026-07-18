'use strict';
const giftcardService = require('../service/giftcardService');
const catalogSyncService = require('../service/catalogSyncService');
const { listSuppliers } = require('../service/suppliers/supplierRegistry');
const { sendSuccess } = require('../utils/response');

const listCatalog = async (req, res, next) => {
    try {
        const data = await giftcardService.listCatalog({ countryCode: req.query.country });
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const listSupplierStatus = async (req, res, next) => {
    try {
        return sendSuccess(req, res, listSuppliers());
    } catch (err) { return next(err); }
};

// Platform-admin only — see routes/adminRoutes.js.
const syncCatalog = async (req, res, next) => {
    try {
        const results = await catalogSyncService.syncAllTargetCountries(req.body.supplier || 'reloadly');
        return sendSuccess(req, res, { synced: results });
    } catch (err) { return next(err); }
};

module.exports = { listCatalog, listSupplierStatus, syncCatalog };

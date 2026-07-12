'use strict';
// Platform Management console controller. Mirrors featureFlagsController.js: thin
// try/catch handlers delegating to the service, standard sendSuccess envelope.
const platformRegistryService = require('../service/platformRegistryService');
const { sendSuccess } = require('../utils/response');

// GET /admin/platforms — registry + live health/version per external property.
exports.listPlatforms = async (req, res, next) => {
    try {
        const platforms = await platformRegistryService.listPlatforms();
        sendSuccess(req, res, platforms);
    } catch (err) { next(err); }
};

// GET /admin/platforms/revenue — cross-platform revenue rollup. Forwards the caller's own
// bearer to platforms sharing the central RS256 realm (see service for per-platform auth mode).
exports.getRevenueRollup = async (req, res, next) => {
    try {
        const callerBearer = req.headers.authorization || null;
        const rollup = await platformRegistryService.getRevenueRollup(callerBearer);
        sendSuccess(req, res, rollup);
    } catch (err) { next(err); }
};

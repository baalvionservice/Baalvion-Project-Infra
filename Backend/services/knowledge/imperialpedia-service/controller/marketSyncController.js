'use strict';
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const marketSyncService = require('../service/marketSyncService');

// GET /market-data/sync-status — staff read: is the asset_summaries sync
// pipeline actually working? (last success/error, row/skip counts, whether
// CMS_BASE_URL/INTERNAL_SERVICE_SECRET are even configured). Backs
// admin-platform's SyncHealthPanel.
const getSyncStatus = async (req, res, next) => {
    try {
        return sendSuccess(req, res, marketSyncService.getSyncStatus());
    } catch (err) { return next(err); }
};

// POST /market-data/resync — staff write: force an immediate sync bypassing
// the 60s TTL. Role-gated the same way as assetsController.upsertAsset.
const triggerResync = async (req, res, next) => {
    try {
        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin', 'system'].includes(r))) {
            return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        }
        await marketSyncService.forceSync();
        return sendSuccess(req, res, marketSyncService.getSyncStatus());
    } catch (err) { return next(err); }
};

module.exports = { getSyncStatus, triggerResync };

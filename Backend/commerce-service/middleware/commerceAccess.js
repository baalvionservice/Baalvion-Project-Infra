'use strict';
const { CommerceStoreMember } = require('../models');
const { AppError } = require('../utils/errors');

const STORE_ROLE_LEVEL = { store_admin: 100, commerce_manager: 80, inventory_manager: 60, fulfillment_manager: 50, seo_manager: 50, content_editor: 40, support_agent: 30, reviewer: 20 };
const PLATFORM_BYPASS = ['super_admin', 'owner', 'admin'];

const loadStoreRole = async (req, res, next) => {
    try {
        if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
        if (PLATFORM_BYPASS.includes(req.auth.role)) { req.storeRole = 'store_admin'; req.storeLevel = 100; return next(); }
        const storeId = req.params.storeId || req.body.storeId || req.query.storeId;
        if (!storeId) return next(new AppError('BAD_REQUEST', 'storeId is required', 400));
        const member = await CommerceStoreMember.findOne({ where: { storeId, userId: req.auth.userId } });
        if (!member) return next(new AppError('FORBIDDEN', 'You are not a member of this store', 403));
        req.storeRole = member.role; req.storeLevel = STORE_ROLE_LEVEL[member.role] || 0;
        return next();
    } catch (err) { return next(err); }
};

const requireStoreRole = (...minRoles) => (req, res, next) => {
    if (req.storeLevel === undefined) return next(new AppError('FORBIDDEN', 'Store access not verified', 403));
    const minLevel = Math.min(...minRoles.map(r => typeof r === 'number' ? r : (STORE_ROLE_LEVEL[r] || 0)));
    if (req.storeLevel < minLevel) return next(new AppError('FORBIDDEN', 'Insufficient store permissions', 403));
    return next();
};

module.exports = { loadStoreRole, requireStoreRole, STORE_ROLE_LEVEL };

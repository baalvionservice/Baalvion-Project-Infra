'use strict';
// Logistics Core Foundation (Phase 1) — granular permission catalog + check,
// layered on top of authMiddleware's coarse requireRole. `req.auth.permissions`
// is already populated by gatewayToAuth() (see middleware/authMiddleware.js)
// from the gateway-bridged identity; nothing in trade-service read it before
// this. No new auth plumbing is introduced here.
//
// Cross-boundary note: these permission STRINGS only take effect once
// identity/rbac-service (or Backend/packages/commerce-rbac) actually issues
// them for the roles listed in models/tradeops/logistics_role_permission.js —
// that registration is identity-domain's call, not trade-service's. Until
// then, the admin/owner/super_admin role bypass keeps existing flows working.
const { AppError } = require('../utils/errors');

const LOGISTICS_PERMISSIONS = Object.freeze({
    SHIPMENT_CREATE: 'logistics:shipment:create',
    SHIPMENT_UPDATE: 'logistics:shipment:update',
    SHIPMENT_CANCEL: 'logistics:shipment:cancel',
    SHIPMENT_DELETE: 'logistics:shipment:delete',
    DRIVER_ASSIGN: 'logistics:driver:assign',
    BOOKING_APPROVE: 'logistics:booking:approve',
    DOCUMENT_UPLOAD_BOL: 'logistics:document:upload_bol',
    DOCUMENT_DOWNLOAD: 'logistics:document:download',
    LABEL_GENERATE: 'logistics:label:generate',
    COST_VIEW: 'logistics:cost:view',
    COST_APPROVE: 'logistics:cost:approve',
    CUSTOMS_VIEW: 'logistics:customs:view',
    CONTAINER_MANAGE: 'logistics:container:manage',
    WAREHOUSE_MANAGE: 'logistics:warehouse:manage',
    FLEET_MANAGE: 'logistics:fleet:manage',
    TRACKING_MANAGE: 'logistics:tracking:manage',
    REPORT_EXPORT: 'logistics:report:export',
    // Phase 3 additions:
    INCIDENT_MANAGE: 'logistics:incident:manage',
    RETURN_MANAGE: 'logistics:return:manage',
});

const ADMIN_BYPASS_ROLES = new Set(['admin', 'owner', 'super_admin']);

function isAdminBypass(req) {
    if (req.auth && ADMIN_BYPASS_ROLES.has(req.auth.role)) return true;
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => ADMIN_BYPASS_ROLES.has(r));
}

// requirePermission(...perms) — caller needs at least ONE of the listed
// permissions (or an admin-tier role) to proceed.
const requirePermission = (...perms) => (req, res, next) => {
    if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
    if (isAdminBypass(req)) return next();
    const granted = req.auth.permissions || [];
    if (perms.some((p) => granted.includes(p))) return next();
    return next(new AppError('FORBIDDEN', `Missing permission: ${perms.join(' or ')}`, 403));
};

module.exports = { LOGISTICS_PERMISSIONS, requirePermission, isAdminBypass };

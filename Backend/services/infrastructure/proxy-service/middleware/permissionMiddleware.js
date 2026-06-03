const { AppError } = require('../utils/errors');
const { hasPermission } = require('../service/rbac');

const requirePermission = (permission) => (req, res, next) => {
    const permissions = req.auth?.permissions || [];

    if (!hasPermission(permissions, permission)) {
        return next(new AppError('FORBIDDEN', `Missing permission: ${permission}`, 403));
    }

    return next();
};

// platform_admin OR the strictly-higher super_admin (the central console logs in as
// super_admin). Check both the single role claim and the roles array.
const PLATFORM_ADMIN_ROLES = new Set(['platform_admin', 'super_admin']);
const requirePlatformAdmin = (req, res, next) => {
    const roles = [req.auth?.role, ...(req.auth?.roles || [])].filter(Boolean);
    if (!roles.some((r) => PLATFORM_ADMIN_ROLES.has(r))) {
        return next(new AppError('FORBIDDEN', 'Platform admin role required', 403));
    }

    return next();
};

module.exports = {
    requirePermission,
    requirePlatformAdmin,
};
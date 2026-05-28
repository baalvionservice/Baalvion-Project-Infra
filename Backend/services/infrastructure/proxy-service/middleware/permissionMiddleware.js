const { AppError } = require('../utils/errors');
const { hasPermission } = require('../service/rbac');

const requirePermission = (permission) => (req, res, next) => {
    const permissions = req.auth?.permissions || [];

    if (!hasPermission(permissions, permission)) {
        return next(new AppError('FORBIDDEN', `Missing permission: ${permission}`, 403));
    }

    return next();
};

const requirePlatformAdmin = (req, res, next) => {
    if (req.auth?.role !== 'platform_admin') {
        return next(new AppError('FORBIDDEN', 'Platform admin role required', 403));
    }

    return next();
};

module.exports = {
    requirePermission,
    requirePlatformAdmin,
};
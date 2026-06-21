/**
 * Role-Based Access Control Middleware
 * Roles: Owner, Admin, Support, Finance, Viewer, Restricted
 */

const ROLE_HIERARCHY = {
  Owner: 0,
  Admin: 1,
  Support: 2,
  Finance: 3,
  Viewer: 4,
  Restricted: 5
};

/**
 * Check if user has required role
 * @param {string} requiredRole - The role to check against
 * @returns {Function} Express middleware
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'User role not found in token'
        });
      }

      const userLevel = ROLE_HIERARCHY[userRole];
      const requiredLevel = ROLE_HIERARCHY[requiredRole];

      if (userLevel === undefined || requiredLevel === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role configuration'
        });
      }

      // Allow if user role is >= required role (fewer or equal hierarchy level)
      if (userLevel <= requiredLevel) {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required role: ${requiredRole}, Your role: ${userRole}`
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

/**
 * Check if user has ANY of the specified roles
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 */
const requireAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'User role not found in token'
        });
      }

      if (allowedRoles.includes(userRole)) {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: `Access denied. Allowed roles: ${allowedRoles.join(', ')}`
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

/**
 * Check if user has ALL of the specified roles (rarely used)
 * For most cases, use requireRole or requireAnyRole
 */
const requireAllRoles = (requiredRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'User role not found in token'
        });
      }

      if (requiredRoles.includes(userRole)) {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

module.exports = {
  requireRole,
  requireAnyRole,
  requireAllRoles,
  ROLE_HIERARCHY
};

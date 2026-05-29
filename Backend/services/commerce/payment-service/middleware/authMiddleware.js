const config = require('../config/appConfig');

/**
 * Auth middleware for payment-service
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    // TODO: Validate JWT against JWKS endpoint in production
    req.user = {
      sub: 'user-' + Math.random().toString(36).substr(2, 9),
      tenantId: req.headers['x-tenant-id'],
      roles: ['USER'],
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: err.message,
    });
  }
}

module.exports = authMiddleware;

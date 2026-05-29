const config = require('../config/appConfig');

/**
 * Simple auth middleware.
 * In production, this would validate RS256 JWT from the JWKS endpoint.
 * For now, we accept any bearer token and extract user claims.
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
    // TODO: Validate JWT against JWKS endpoint (config.auth.jwksUri)
    // For now, we'll parse the bearer token as-is
    // In production: use jose or jsonwebtoken to verify

    // Mock user from token (in production, parse and verify JWT)
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

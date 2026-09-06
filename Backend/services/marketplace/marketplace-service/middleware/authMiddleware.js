'use strict';
// Canonical RS256 verification via @baalvion/auth-node, created lazily so the service
// still boots in dev without a key/JWKS configured. Mirrors the platform pattern used by
// every other service (ir-service, account-service, …). Controllers read req.user.
const { createAuthMiddleware } = require('@baalvion/auth-node');
const { bffBridge } = require('@baalvion/gateway-bridge');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

let _canonical = null;
let _initTried = false;

function getVerifier() {
    if (_initTried) return _canonical;
    _initTried = true;
    if (!config.jwt.publicKey && !config.jwt.jwksUri) return null; // not configured (dev)
    try {
        _canonical = createAuthMiddleware({
            jwksUri: config.jwt.jwksUri || undefined,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience,
            staticPublicKey: config.jwt.publicKey || undefined,
        });
    } catch {
        _canonical = null;
    }
    return _canonical;
}

const toAppError = (err) =>
    new AppError((err.code || 'unauthorized').toUpperCase(), err.message, err.status || 401);

const attach = (req) => {
    if (req.auth) req.user = { id: req.auth.userId, orgId: req.auth.orgId, roles: req.auth.roles };
};

/**
 * Identity, from whichever source the deployment uses.
 *
 * Behind auth-gateway there IS no bearer token: the gateway strips Authorization and injects
 * signed identity headers instead. Verifying only bearers meant this service could never sit
 * behind the gateway in strict mode — it would see no identity at all and 401 every request.
 * The gateway path is tried first and, when its headers are present but invalid, the request is
 * REFUSED rather than falling back to a bearer: an invalid signature is an attack, not an
 * absence.
 */
const authMiddleware = (req, res, next) => {
    const bridged = bffBridge(req);
    if (bridged && bridged.reject) {
        return next(new AppError(bridged.code || 'INVALID_GATEWAY_IDENTITY', 'Gateway identity could not be verified', 401));
    }
    if (bridged && bridged.identity) {
        req.auth = bridged.identity;
        attach(req);
        return next();
    }

    const verifier = getVerifier();
    if (!verifier) {
        return next(new AppError('AUTH_NOT_CONFIGURED', 'Authentication is not configured on this environment', 401));
    }
    return verifier(req, res, (err) => {
        if (err) return next(toAppError(err));
        attach(req);
        return next();
    });
};

const optionalAuth = (req, res, next) => {
    // Same precedence as above: gateway identity first, so the tenant transaction downstream is
    // opened with the right org even when no bearer is present.
    const bridged = bffBridge(req);
    if (bridged && bridged.identity) {
        req.auth = bridged.identity;
        attach(req);
        return next();
    }
    const header = req.headers.authorization || '';
    const verifier = getVerifier();
    if (!header.startsWith('Bearer ') || !verifier) return next();
    return verifier(req, res, () => {
        attach(req);
        return next();
    });
};

module.exports = { authMiddleware, optionalAuth };

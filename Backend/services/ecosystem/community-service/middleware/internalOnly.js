'use strict';
// Defence in depth for service-to-service routes. These routes already need the shared internal
// secret, but they sit under the same path prefix the public gateway forwards. A request that
// arrived through a reverse proxy or CDN carries forwarding headers; a direct call from another
// container on the private network does not. Refuse the former with a plain 404, so the route is
// not even discoverable from the internet.
//
// Consequence: callers must use the service's private address (http://<service>:<port>), never the
// public API hostname.
const FORWARDING_HEADERS = ['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-real-ip', 'cf-connecting-ip', 'cf-ray', 'forwarded', 'via'];

function internalOnly(req, res, next) {
    if (FORWARDING_HEADERS.some((h) => req.headers[h] !== undefined)) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
    }
    return next();
}

module.exports = { internalOnly, FORWARDING_HEADERS };

'use strict';
// API versioning. Versioning is URI-based (`/v1`, `/api/v1`); this middleware stamps the
// negotiated version onto the request (so response `meta.version` echoes it) and onto the
// response as the `X-API-Version` header. A future breaking revision mounts the same router
// factory under `/v2` with `apiVersion('v2')` — additive changes stay within a version.
const config = require('../config/appConfig');

/**
 * @param {string} version - e.g. 'v1'
 */
const apiVersion = (version) => (req, res, next) => {
    req.apiVersion = version;
    res.setHeader('X-API-Version', version);
    res.setHeader('X-API-Supported-Versions', config.supportedVersions.join(', '));
    next();
};

module.exports = apiVersion;

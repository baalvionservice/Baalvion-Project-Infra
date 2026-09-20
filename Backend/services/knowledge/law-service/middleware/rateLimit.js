'use strict';
// IP rate limiter backed by express-rate-limit (a CodeQL-recognized limiter). Applied
// globally via app.use(createIpRateLimit()) before the routers, so every route inherits it.
const rateLimit = require('express-rate-limit');
const config = require('../config/appConfig');

// Public, immutable image bytes (/v1/photos/:id, /v1/people/photos/:id). A directory page
// asks for dozens at once through the website's server, so counting them against the
// per-IP budget made the first view of a page fail. They carry `immutable` cache headers and
// sit behind a CDN, so they get a much larger budget of their own instead of the API's.
const PHOTO_PATH = /^\/(?:api\/)?v1\/(?:photos|people\/photos)\/\d+$/;
const isPhoto = (req) => req.method === 'GET' && PHOTO_PATH.test(req.path || req.originalUrl.split('?')[0]);

const message = { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } };

module.exports = () => {
    const general = rateLimit({
        windowMs: 60_000,
        max: (config.security && config.security.ipRateLimit) || 120,
        standardHeaders: true,
        legacyHeaders: false,
        skip: isPhoto,
        message,
    });
    const photos = rateLimit({
        windowMs: 60_000,
        max: (config.security && config.security.photoRateLimit) || 3000,
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => !isPhoto(req),
        message,
    });
    return (req, res, next) => (isPhoto(req) ? photos(req, res, next) : general(req, res, next));
};

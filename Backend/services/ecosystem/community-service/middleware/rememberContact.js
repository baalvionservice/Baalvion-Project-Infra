'use strict';
// After authentication, remember the caller's own email (from their token) so notifications can
// reach them. Throttled in memory and never blocks or fails the request.
const db = require('../models');
const { decodeEmailFromRequest } = require('./authMiddleware');

const seen = new Map();
const EVERY_MS = 10 * 60 * 1000;

function rememberContact(req, res, next) {
    try {
        const userId = req.auth && req.auth.userId;
        const email = decodeEmailFromRequest(req);
        if (userId && email) {
            const key = `${userId}:${email}`;
            const last = seen.get(key) || 0;
            if (Date.now() - last > EVERY_MS) {
                seen.set(key, Date.now());
                if (seen.size > 5000) seen.clear();
                db.NotificationContact.upsert({ user_id: userId, email: email.toLowerCase().slice(0, 320) }).catch(() => {});
            }
        }
    } catch { /* never block a request on this */ }
    return next();
}

module.exports = { rememberContact };

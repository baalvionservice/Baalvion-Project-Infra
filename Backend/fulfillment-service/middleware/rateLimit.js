'use strict';
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');
const store = new Map();
const createIpRateLimit = (max = config.security.ipRateLimit, windowMs = 60000) => (req, res, next) => { const key = req.ip; const now = Date.now(); const entry = store.get(key) || { count: 0, resetAt: now + windowMs }; if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; } entry.count += 1; store.set(key, entry); if (entry.count > max) return next(new AppError('RATE_LIMITED', 'Too many requests', 429)); return next(); };
module.exports = createIpRateLimit;

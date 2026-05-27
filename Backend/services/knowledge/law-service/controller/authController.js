'use strict';
// Phase 4 A4 cutover: law-service no longer issues tokens or writes auth users.
// Authentication is the canonical auth-service's responsibility — /login and /register
// redirect there (308 preserves the POST method + body). No local HS256 issuance, no
// password handling, no local user-auth writes. `me` is a profile READ keyed by the
// email-reconciled local id (req.user.id) set by authMiddleware.
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');

const AUTH = config.authServiceUrl;

const register = (req, res) => res.redirect(308, `${AUTH}/v1/auth/register`);
const login    = (req, res) => res.redirect(308, `${AUTH}/v1/auth/login`);

const me = async (req, res, next) => {
    try {
        if (!req.user.id) return next(new AppError('NOT_FOUND', 'No local profile for this identity', 404));
        const user = await db.User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] },
        });
        if (!user) return next(new AppError('NOT_FOUND', 'User not found', 404));
        return sendSuccess(req, res, user);
    } catch (err) { return next(err); }
};

module.exports = { register, login, me };

'use strict';
const { Router } = require('express');
const svc = require('../service/memberService');
const { sendSuccess } = require('../utils/response');

const rolesOf = (req) => [req.auth.role, ...(Array.isArray(req.auth.roles) ? req.auth.roles : [])].filter(Boolean);
const wrap = (fn, status) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); }
};

// Signed-in: the caller's own member profile + (for sellers) their dashboard numbers.
const me = Router();
me.get('/', wrap((req) => svc.getMine(req.auth.userId)));
me.put('/', wrap((req) => svc.updateMine(req.auth.userId, req.body && req.body.displayName)));

// Public: a member's profile by member number. Reputation only, nothing private.
const pub = Router();
pub.get('/:memberNumber', wrap((req) => svc.getPublic(req.params.memberNumber)));

// Signed-in members with marketplace access: a seller's live listings.
const listings = Router();
listings.get('/:memberNumber/listings', wrap((req) => svc.getListings(req.params.memberNumber, { userId: req.auth.userId, roles: rolesOf(req) })));

module.exports = { me, pub, listings };

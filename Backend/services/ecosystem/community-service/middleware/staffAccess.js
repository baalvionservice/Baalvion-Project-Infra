'use strict';
// Staff tiers and the permission matrix for the site's admin console.
//
//   super      platform role super_admin / platform_admin in the token: everything, incl. KYC + staff
//   admin      platform role country_admin, or granted 'admin' in staff_members: day-to-day content,
//              verification, bounty, support, announcements, audit. NOT identity documents or staff.
//   moderator  granted in staff_members: handles bookings/applications, vets profiles, answers support.
//              No bounty, no announcements, no audit log, no money, no identity documents.
//
// Tiers resolve per request from the verified token plus one lookup, never from anything the
// client sends. Each protected route names the single permission it needs.
const db = require('../models');
const { AppError } = require('../utils/errors');

const PERMISSIONS = [
    'content.manage',   // clubs, events, locals listings, gig removal, session cancellation
    'content.handle',   // booking + application decisions
    'verify.review',    // candidate / employer / teacher approvals
    'bounty.manage',
    'support.handle',
    'announce.publish',
    'audit.view',
    'notify.send',
    'kyc.review',
    'staff.manage',
];

const TIER_PERMISSIONS = {
    super: new Set(PERMISSIONS),
    admin: new Set(PERMISSIONS.filter((p) => !['kyc.review', 'staff.manage'].includes(p))),
    moderator: new Set(['content.handle', 'verify.review', 'support.handle']),
};

const SUPER_ROLES = new Set(['super_admin', 'platform_admin']);
const ADMIN_ROLES = new Set(['country_admin']);

async function resolveTier(req) {
    if (req._staffTier !== undefined) return req._staffTier;
    const roles = (Array.isArray(req.auth && req.auth.roles) ? req.auth.roles : []).map((r) => String(r).toLowerCase());
    let tier = null;
    if (roles.some((r) => SUPER_ROLES.has(r))) tier = 'super';
    else if (roles.some((r) => ADMIN_ROLES.has(r))) tier = 'admin';
    else if (req.auth && req.auth.userId) {
        const row = await db.StaffMember.findByPk(req.auth.userId);
        tier = row ? row.tier : null;
    }
    req._staffTier = tier;
    return tier;
}

const permissionsOf = (tier) => (tier ? [...TIER_PERMISSIONS[tier]] : []);
const can = (tier, perm) => !!tier && TIER_PERMISSIONS[tier].has(perm);

// Use after authMiddleware. Pass one permission, or none to require any staff tier.
const requirePerm = (perm) => async (req, res, next) => {
    try {
        const tier = await resolveTier(req);
        if (!tier) return next(new AppError('FORBIDDEN', 'Staff access required', 403));
        if (perm && !can(tier, perm)) return next(new AppError('FORBIDDEN', `Your staff level cannot do this (${perm})`, 403));
        req.staffTier = tier;
        return next();
    } catch (err) { return next(err); }
};

module.exports = { PERMISSIONS, TIER_PERMISSIONS, resolveTier, permissionsOf, can, requirePerm };

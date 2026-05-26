/**
 * CMS-level RBAC middleware.
 *
 * CMS roles (stored in cms.website_members.role):
 *   cms_admin       → 100
 *   cms_editor      → 80
 *   cms_publisher   → 70
 *   cms_reviewer    → 60
 *   cms_seo_manager → 50
 *   cms_author      → 40
 *   cms_contributor → 20
 *   cms_viewer      → 10
 *
 * Platform super_admin/owner/admin bypass all CMS-level checks.
 */

const db = require('../models');
const { AppError } = require('../utils/errors');

const CMS_ROLE_LEVEL = {
    cms_admin: 100,
    cms_editor: 80,
    cms_publisher: 70,
    cms_reviewer: 60,
    cms_seo_manager: 50,
    cms_author: 40,
    cms_contributor: 20,
    cms_viewer: 10,
};

const PLATFORM_BYPASS_ROLES = ['super_admin', 'owner', 'admin'];

/**
 * Load the caller's CMS role for a specific website and attach to req.cmsRole.
 * Must be used AFTER authMiddleware. The websiteId must be in req.params.websiteId.
 */
const loadCmsRole = async (req, res, next) => {
    try {
        if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));

        // Platform admins bypass website-level membership checks
        if (PLATFORM_BYPASS_ROLES.includes(req.auth.role)) {
            req.cmsRole = 'cms_admin';
            req.cmsLevel = 100;
            return next();
        }

        const websiteId = req.params.websiteId || req.body.websiteId || req.query.websiteId;
        if (!websiteId) return next(new AppError('BAD_REQUEST', 'websiteId is required', 400));

        const member = await db.CmsWebsiteMember.findOne({
            where: { website_id: websiteId, user_id: req.auth.userId },
        });

        if (!member) {
            return next(new AppError('FORBIDDEN', 'You are not a member of this website', 403));
        }

        req.cmsRole = member.role;
        req.cmsLevel = CMS_ROLE_LEVEL[member.role] || 0;
        return next();
    } catch (err) {
        return next(err);
    }
};

/**
 * Require a minimum CMS role level.
 * minRole can be a role name string or a numeric level.
 */
const requireCmsRole = (...minRoles) => (req, res, next) => {
    if (!req.cmsLevel && req.cmsLevel !== 0) {
        return next(new AppError('FORBIDDEN', 'CMS access not verified', 403));
    }
    const minLevel = Math.min(...minRoles.map(r =>
        typeof r === 'number' ? r : (CMS_ROLE_LEVEL[r] || 0)
    ));
    if (req.cmsLevel < minLevel) {
        return next(new AppError('FORBIDDEN', 'Insufficient CMS permissions', 403));
    }
    return next();
};

module.exports = { loadCmsRole, requireCmsRole, CMS_ROLE_LEVEL, PLATFORM_BYPASS_ROLES };

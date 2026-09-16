'use strict';
const profileService = require('../service/profileService');
const { permissionsFor, ANONYMOUS_PERMISSIONS } = require('../domain/permissions');
const { primaryRole } = require('../domain/roles');
const { stateFrom } = require('../domain/verification');
const config = require('../config/appConfig');
const { asyncHandler } = require('./asyncHandler');
const { sendSuccess } = require('../utils/response');

/**
 * The caller's own identity as this product understands it.
 *
 * Answers 200 for everyone, including a visitor with no session — "nobody" is a valid
 * answer to "who am I", not an error. Returning 401 here made every anonymous page view
 * log a failed request and trigger a pointless token refresh, for a question the app asks
 * on load precisely because it does not yet know.
 *
 * It exists so the web app can decide which NAVIGATION to render, and is a convenience
 * rather than a security boundary: the permission list is the same one the server enforces,
 * but a client that ignores it and calls an admin endpoint still gets a 403 from the route.
 *
 * Roles come from this service's user_roles table, never from the token — being an
 * administrator of another Baalvion product confers nothing here.
 */
const whoami = asyncHandler(async (req, res) => {
    const actor = req.actor || { userId: null, roles: [] };

    if (!actor.userId) {
        return sendSuccess(req, res, {
            authenticated: false,
            userId: null,
            status: null,
            roles: [],
            primaryRole: null,
            permissions: [...ANONYMOUS_PERMISSIONS],
            emailVerification: null,
            profile: null,
        });
    }

    const profile = await profileService.getOwn(actor.userId);
    return sendSuccess(req, res, {
        authenticated: true,
        userId: actor.userId,
        status: actor.status,
        roles: actor.roles,
        primaryRole: primaryRole(actor.roles),
        permissions: [...permissionsFor(actor.roles)],
        // Reported honestly, including when it is UNKNOWN — which now means a session
        // predating the `email_verified` claim rather than a platform that cannot answer.
        // The client must not render a "Verified" indicator off an unknown.
        emailVerification: {
            state: stateFrom(req.auth),
            enforced: config.security.requireEmailVerification,
        },
        profile,
    });
});

module.exports = { whoami };

'use strict';
const invitationService = require('../service/invitationService');
const { sendSuccess } = require('../utils/response');

// Public — the opaque token in the URL is the credential, no session required.
const getPublic = async (req, res, next) => {
    try {
        const invitation = await invitationService.getPublicInvitation(req.params.token);
        return sendSuccess(req, res, invitation);
    } catch (err) { return next(err); }
};

// Authenticated — the caller must already hold a session (established via
// auth-service /register or /login moments earlier in the same flow). The
// invitation's own email must match the caller's verified platform email.
const accept = async (req, res, next) => {
    try {
        const result = await invitationService.acceptInvitation(req.params.token, req.user.id, req.validated.authorProfile);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { getPublic, accept };

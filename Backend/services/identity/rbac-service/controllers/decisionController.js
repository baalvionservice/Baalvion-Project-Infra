'use strict';
const decisionService = require('../services/decisionService');
const { sendSuccess } = require('../utils/response');

/** Normalize { resource: "cms.article" } → { resource: { type: "cms.article" } }. */
function normalize(body) {
    const req = { ...body };
    if (typeof req.resource === 'string') req.resource = { type: req.resource };
    return req;
}

/**
 * PDP — the Policy Decision Point. Returns allow/deny + obligations. A caller may
 * ask about THEMSELVES (subject omitted ⇒ uses req.auth) or, when trusted
 * (internal key / super_admin), about ANOTHER subject.
 */
const authorize = async (req, res) => {
    const body = normalize(req.valid);
    // Default the subject to the caller when not supplied.
    if (!body.userId && !body.subject?.id && req.auth?.userId) {
        body.subject = { id: req.auth.userId, orgId: req.auth.orgId, roles: req.auth.roles };
    }
    const result = await decisionService.authorize(body, { log: true, requestId: req.requestId });
    sendSuccess(req, res, result);
};

/** Dry-run: evaluate without writing a decision log (policy authoring / testing). */
const simulate = async (req, res) => {
    const body = normalize(req.valid);
    const result = await decisionService.authorize(body, { log: false, requestId: req.requestId });
    sendSuccess(req, res, result);
};

module.exports = { authorize, simulate };

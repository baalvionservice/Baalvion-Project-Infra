'use strict';
/**
 * Order journey — HTTP surface. Thin on purpose: who is asking comes from the verified session
 * (never from the request body), and every rule lives in service/journey.
 */
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const journeys = require('../service/journey/journeys');
const parties = require('../service/journey/parties');
const db = require('../service/journey/db');
const internalAuth = require('../service/journey/internalAuth');
const { ROLES, PERMISSIONS, DEFAULT_PERMISSIONS, DEFAULT_DOCUMENT_SCOPES, DOCUMENT_SCOPES } = require('../service/journey/permissions');

const who = (req) => {
    const orgId = req.auth && (req.auth.orgId || req.auth.tenantId);
    if (!orgId) throw new AppError('FORBIDDEN', 'Your account is not linked to an organisation, so it cannot see an order journey.', 403);
    return { orgId: String(orgId), userId: req.auth.userId ? String(req.auth.userId) : null };
};
const wrap = (fn) => async (req, res, next) => { try { return await fn(req, res); } catch (e) { return next(e); } };

const mine = wrap(async (req, res) => sendSuccess(req, res, await journeys.listMyJourneys({ ...who(req), limit: req.query.limit })));
const byOrder = wrap(async (req, res) => sendSuccess(req, res, await journeys.getJourneyByOrder({ ...who(req), orderId: req.params.orderId })));
const one = wrap(async (req, res) => sendSuccess(req, res, await journeys.getJourney({ ...who(req), journeyId: req.params.id })));
const steps = wrap(async (req, res) => sendSuccess(req, res, await journeys.getSteps({ ...who(req), journeyId: req.params.id })));
const listParties = wrap(async (req, res) => sendSuccess(req, res, await parties.listParties({ ...who(req), journeyId: req.params.id })));
const events = wrap(async (req, res) => sendSuccess(req, res, await parties.listEvents({ ...who(req), journeyId: req.params.id, limit: req.query.limit })));

const invite = wrap(async (req, res) => {
    const b = req.body || {};
    const out = await parties.inviteParty({
        ...who(req), journeyId: req.params.id, role: b.role, partyOrgId: b.orgId, externalName: b.externalName,
        externalContact: b.externalContact, permissions: b.permissions, documentScopes: b.documentScopes,
    });
    return sendSuccess(req, res, out, 201);
});
const respond = wrap(async (req, res) => sendSuccess(req, res, await parties.respondToInvitation({ ...who(req), journeyId: req.params.id, partyId: req.params.partyId, accept: req.body && req.body.accept === true })));
const grants = wrap(async (req, res) => sendSuccess(req, res, await parties.updateGrants({ ...who(req), journeyId: req.params.id, partyId: req.params.partyId, permissions: (req.body || {}).permissions, documentScopes: (req.body || {}).documentScopes })));
const remove = wrap(async (req, res) => sendSuccess(req, res, await parties.removeParty({ ...who(req), journeyId: req.params.id, partyId: req.params.partyId })));

/** What the rules are, so a screen can offer only valid choices and explain them. */
const rules = wrap(async (req, res) => sendSuccess(req, res, { roles: ROLES, permissions: PERMISSIONS, defaultPermissions: DEFAULT_PERMISSIONS, documentTypes: DOCUMENT_SCOPES, defaultDocumentTypes: DEFAULT_DOCUMENT_SCOPES }));

/** Says plainly whether Postgres or only the application is enforcing the access rules. */
const status = wrap(async (req, res) => {
    const mode = db.enforcement();
    return sendSuccess(req, res, {
        enforcement: mode,
        databaseEnforced: mode === 'database+application',
        note: mode === 'application-only'
            ? 'Access rules are enforced by the application. Create the restricted database role and set JOURNEY_DB_USER / JOURNEY_DB_PASSWORD so Postgres enforces them too.'
            : 'Postgres enforces the access rules as a role that cannot bypass them, and the application repeats them.',
    });
});

/** Order service -> us: open the journey for a confirmed order. Signed, not a user session. */
const openFromOrder = wrap(async (req, res) => {
    const check = internalAuth.verify({ rawBody: req.rawBody, headers: req.headers });
    if (!check.ok) throw new AppError('UNAUTHORIZED', `Request rejected: ${check.reason}`, 401);
    const b = req.body || {};
    const out = await journeys.openJourneyForOrder({
        orderId: b.orderId, buyerOrgId: b.buyerOrgId, sellerOrgId: b.sellerOrgId, referenceNo: b.referenceNo,
        originCountry: b.originCountry, destinationCountry: b.destinationCountry, incoterm: b.incoterm,
        commodity: b.commodity, hsCode: b.hsCode, userId: b.openedByUserId,
    });
    return sendSuccess(req, res, out, 201);
});

module.exports = { steps, mine, byOrder, one, listParties, events, invite, respond, grants, remove, rules, status, openFromOrder };

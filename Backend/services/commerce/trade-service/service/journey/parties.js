'use strict';
/**
 * Inviting, accepting, adjusting and removing the organisations party to an order, with an audit
 * entry for every change, written in the same transaction as the change.
 *
 * Only a party with `parties.manage` (the buyer and the seller) can add, adjust or remove another
 * party. An outsider is told "not found"; a party without that permission is told it may not.
 */
const { AppError } = require('../../utils/errors');
const db = require('./db');
const orgDirectory = require('./orgDirectory');
const { resolveGrant, assertOrgTypeAllowed, ROLES } = require('./permissions');
const { myParty } = require('./journeys');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const notFound = () => new AppError('NOT_FOUND', 'Journey not found', 404);
const forbidden = (m) => new AppError('FORBIDDEN', m, 403);
const bad = (m, code = 'VALIDATION_ERROR', status = 422) => new AppError(code, m, status);
const arr = (a) => `{${a.join(',')}}`;

const clean = (v, max = 200) => (v == null || v === '' ? null : String(v).trim().slice(0, max));

async function record(exec, { journeyId, actorOrg, actorUser, action, partyOrg = null, partyRole = null, detail = {} }) {
    await exec(
        `INSERT INTO tradeops.order_party_events (journey_id, actor_org_id, actor_user_id, action, party_org_id, party_role, detail)
         VALUES (:j, :actor, :user, :action, :po, :pr, :detail::jsonb)`,
        { j: journeyId, actor: actorOrg, user: actorUser, action, po: partyOrg, pr: partyRole, detail: JSON.stringify(detail) },
    );
}

/** Confirm the caller is a party who may manage parties. Outsiders get not-found. */
async function requireManager(query, journeyId, orgId) {
    if (!UUID.test(String(journeyId))) throw notFound();
    const me = await myParty(query, journeyId, orgId);
    if (!me) throw notFound();
    if (!me.permissions.includes('parties.manage')) throw forbidden('Only the buyer or the seller can manage who is on this order.');
    return me;
}

/** The organisations on a journey. Managers see every row with its grants; others see who and in what role. */
async function listParties({ orgId, journeyId }) {
    if (!UUID.test(String(journeyId))) throw notFound();
    return db.withOrg(orgId, async (query) => {
        const me = await myParty(query, journeyId, String(orgId));
        if (!me) throw notFound();
        if (me.permissions.includes('parties.manage')) {
            const rows = await query(
                `SELECT id, party_role, org_id, external_name, external_contact, status, permissions, document_scopes, invited_at, responded_at, removed_at
                   FROM tradeops.order_parties WHERE journey_id = :j AND tradeops.party_can(:j, :org, 'parties.manage') ORDER BY invited_at`,
                { j: journeyId, org: String(orgId) },
            );
            return rows.map((r) => ({
                id: r.id, role: r.party_role, orgId: r.org_id, externalName: r.external_name, externalContact: r.external_contact,
                status: r.status, permissions: r.permissions, documentScopes: r.document_scopes,
                invitedAt: r.invited_at, respondedAt: r.responded_at, removedAt: r.removed_at,
            }));
        }
        const rows = await query('SELECT party_role, org_id, external_name, status FROM tradeops.order_party_directory WHERE journey_id = :j', { j: journeyId });
        return rows.map((r) => ({ role: r.party_role, orgId: r.org_id, externalName: r.external_name, status: r.status }));
    });
}

/**
 * Add a party. Either a registered organisation (it will be invited and must accept) or, for a partner
 * not yet on the platform, an external party that Baalvion tracks but that has no login and no access.
 */
async function inviteParty({ orgId, userId = null, journeyId, role, partyOrgId, externalName, externalContact, permissions, documentScopes }) {
    return db.withOrg(orgId, async (query, _tx, exec) => {
        // Who is asking comes first. A caller who may not manage this order's parties learns nothing
        // about what would or would not have been valid.
        await requireManager(query, journeyId, String(orgId));

        if (!ROLES.includes(role)) throw bad(`"${role}" is not a role on an order.`);
        if (role === 'buyer' || role === 'seller') throw bad('The buyer and the seller are set when the order is placed and cannot be invited.');
        if (!partyOrgId && !externalName) throw bad('Give either the organisation to invite or the name of the external partner.');
        if (partyOrgId && externalName) throw bad('Give either an organisation or an external partner, not both.');
        const grant = resolveGrant(role, { permissions, documentScopes });

        if (partyOrgId) {
            const target = await orgDirectory.lookup(partyOrgId);
            if (!target) throw bad('That organisation is not registered on Baalvion yet. Add it as an external partner, or invite it to join first.', 'ORG_NOT_FOUND', 404);
            if (target.status !== 'active') throw bad(`That organisation is ${target.status}, so it cannot be added yet.`);
            assertOrgTypeAllowed(role, target.type);
        }

        const existing = await query(
            "SELECT 1 FROM tradeops.order_parties WHERE journey_id = :j AND org_id = :po AND party_role = :r AND status <> 'removed'",
            { j: journeyId, po: partyOrgId ? String(partyOrgId) : '', r: role },
        );
        if (partyOrgId && existing[0]) throw bad('That organisation already has this role on the order.', 'CONFLICT', 409);

        const status = partyOrgId ? 'invited' : 'active'; // an external partner is tracked, not invited
        const rows = await query(
            `INSERT INTO tradeops.order_parties (journey_id, org_id, external_name, external_contact, party_role, status, permissions, document_scopes, added_by_org_id, added_by_user_id)
             VALUES (:j, :po, :en, :ec, :r, :status, :perms::text[], :scopes::text[], :actor, :user) RETURNING id`,
            {
                j: journeyId, po: partyOrgId ? String(partyOrgId) : null, en: clean(externalName), ec: clean(externalContact),
                r: role, status, perms: arr(grant.permissions), scopes: arr(grant.documentScopes), actor: String(orgId), user: userId,
            },
        );
        await record(exec, { journeyId, actorOrg: String(orgId), actorUser: userId, action: partyOrgId ? 'party.invited' : 'party.tracked', partyOrg: partyOrgId ? String(partyOrgId) : null, partyRole: role, detail: { permissions: grant.permissions, documentScopes: grant.documentScopes, external: !partyOrgId } });
        return { id: rows[0].id, status, role, orgId: partyOrgId || null, externalName: clean(externalName), ...grant };
    });
}

/** An invited organisation accepts or declines. It can do nothing else to its own row. */
async function respondToInvitation({ orgId, userId = null, journeyId, partyId, accept }) {
    if (!UUID.test(String(journeyId)) || !UUID.test(String(partyId))) throw notFound();
    return db.withOrg(orgId, async (query, _tx, exec) => {
        const rows = await query(
            "SELECT id, party_role, status FROM tradeops.order_parties WHERE id = :p AND journey_id = :j AND org_id = :org",
            { p: partyId, j: journeyId, org: String(orgId) },
        );
        if (!rows[0]) throw notFound();
        if (rows[0].status !== 'invited') throw bad(`This invitation was already ${rows[0].status}.`, 'CONFLICT', 409);
        const next = accept ? 'active' : 'declined';
        await query('UPDATE tradeops.order_parties SET status = :s, responded_at = now() WHERE id = :p RETURNING id', { s: next, p: partyId });
        await record(exec, { journeyId, actorOrg: String(orgId), actorUser: userId, action: accept ? 'party.accepted' : 'party.declined', partyOrg: String(orgId), partyRole: rows[0].party_role });
        return { id: partyId, status: next };
    });
}

/** Change what an existing party may do. Buyer and seller cannot be changed. */
async function updateGrants({ orgId, userId = null, journeyId, partyId, permissions, documentScopes }) {
    return db.withOrg(orgId, async (query, _tx, exec) => {
        await requireManager(query, journeyId, String(orgId));
        const rows = await query("SELECT id, party_role, org_id, permissions, document_scopes FROM tradeops.order_parties WHERE id = :p AND journey_id = :j AND status <> 'removed' AND tradeops.party_can(:j, :org, 'parties.manage')", { p: partyId, j: journeyId, org: String(orgId) });
        if (!rows[0]) throw notFound();
        const grant = resolveGrant(rows[0].party_role, { permissions: permissions ?? rows[0].permissions, documentScopes: documentScopes ?? rows[0].document_scopes });
        await query('UPDATE tradeops.order_parties SET permissions = :perms::text[], document_scopes = :scopes::text[] WHERE id = :p RETURNING id', { perms: arr(grant.permissions), scopes: arr(grant.documentScopes), p: partyId });
        await record(exec, { journeyId, actorOrg: String(orgId), actorUser: userId, action: 'party.grants_changed', partyOrg: rows[0].org_id, partyRole: rows[0].party_role, detail: { before: { permissions: rows[0].permissions, documentScopes: rows[0].document_scopes }, after: grant } });
        return { id: partyId, ...grant };
    });
}

/** Remove a party. Access ends at once. The buyer and the seller cannot be removed. */
async function removeParty({ orgId, userId = null, journeyId, partyId }) {
    return db.withOrg(orgId, async (query, _tx, exec) => {
        await requireManager(query, journeyId, String(orgId));
        const rows = await query("SELECT id, party_role, org_id FROM tradeops.order_parties WHERE id = :p AND journey_id = :j AND status <> 'removed' AND tradeops.party_can(:j, :org, 'parties.manage')", { p: partyId, j: journeyId, org: String(orgId) });
        if (!rows[0]) throw notFound();
        if (rows[0].party_role === 'buyer' || rows[0].party_role === 'seller') throw bad('The buyer and the seller cannot be removed from their own order.', 'CONFLICT', 409);
        await query("UPDATE tradeops.order_parties SET status = 'removed', removed_at = now() WHERE id = :p RETURNING id", { p: partyId });
        await record(exec, { journeyId, actorOrg: String(orgId), actorUser: userId, action: 'party.removed', partyOrg: rows[0].org_id, partyRole: rows[0].party_role });
        return { id: partyId, status: 'removed' };
    });
}

async function listEvents({ orgId, journeyId, limit = 100 }) {
    const n = Math.min(Math.max(Number(limit) || 100, 1), 500);
    return db.withOrg(orgId, async (query) => {
        await requireManager(query, journeyId, String(orgId));
        const rows = await query(
            `SELECT action, actor_org_id, actor_user_id, party_org_id, party_role, detail, occurred_at FROM tradeops.order_party_events
              WHERE journey_id = :j AND tradeops.party_can(:j, :org, 'parties.manage') ORDER BY occurred_at DESC LIMIT ${n}`,
            { j: journeyId, org: String(orgId) },
        );
        return rows.map((r) => ({ action: r.action, actorOrgId: r.actor_org_id, actorUserId: r.actor_user_id, partyOrgId: r.party_org_id, partyRole: r.party_role, detail: r.detail, at: r.occurred_at }));
    });
}

module.exports = { listParties, inviteParty, respondToInvitation, updateGrants, removeParty, listEvents };

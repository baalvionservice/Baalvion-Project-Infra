'use strict';
/**
 * Opening and reading an order journey.
 *
 * A journey is opened for an order by the order service (which knows who the buyer and seller are and
 * can vouch for them), not by whichever user asks. Reading is always as an organisation: an
 * organisation that is not an active party to a journey gets "not found", the same answer as for a
 * journey that does not exist, so a journey's existence is never revealed to an outsider.
 *
 * Every read repeats the access rule with tradeops.party_can, the same function the database policies
 * use, so the rule holds even on a connection that bypasses row-level security.
 */
const { AppError } = require('../../utils/errors');
const db = require('./db');
const { DEFAULT_PERMISSIONS, DEFAULT_DOCUMENT_SCOPES } = require('./permissions');
const { buildSteps } = require('./steps');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COUNTRY = /^[A-Za-z]{2}$/;
const notFound = () => new AppError('NOT_FOUND', 'Journey not found', 404);
const bad = (m) => new AppError('VALIDATION_ERROR', m, 422);

const clean = (v, max = 200) => (v == null || v === '' ? null : String(v).trim().slice(0, max));
const country = (v, name) => {
    if (v == null || v === '') return null;
    if (!COUNTRY.test(String(v))) throw bad(`${name} must be a two-letter country code.`);
    return String(v).toUpperCase();
};

const JOURNEY_COLUMNS = 'j.id, j.order_id, j.reference_no, j.owner_org_id, j.origin_country, j.destination_country, j.incoterm, j.commodity, j.hs_code, j.status, j.created_at, j.updated_at';

/**
 * Open a journey for an order, with its buyer and seller both as active parties.
 * Called by the order service once an order is confirmed.
 */
async function openJourneyForOrder({ orderId, buyerOrgId, sellerOrgId, referenceNo, originCountry, destinationCountry, incoterm, commodity, hsCode, userId = null }) {
    if (!UUID.test(String(orderId))) throw bad('orderId must be a UUID.');
    if (!buyerOrgId || !sellerOrgId) throw bad('Both the buyer and the seller organisation are required.');
    if (String(buyerOrgId) === String(sellerOrgId)) throw bad('The buyer and the seller must be different organisations.');
    const ref = clean(referenceNo, 64) || `GTI-${String(orderId).slice(0, 8).toUpperCase()}`;

    // Open as the buyer (who becomes the first party), then add the seller as an active party.
    const journeyId = await db.withOrg(String(buyerOrgId), async (query, _tx, exec) => {
        const rows = await query(
            'SELECT tradeops.create_journey(:order, :ref, :org, \'buyer\', :user, :origin, :dest, :incoterm, :commodity, :hs, :perms::text[]) AS id',
            {
                order: orderId, ref, org: String(buyerOrgId), user: userId,
                origin: country(originCountry, 'originCountry'), dest: country(destinationCountry, 'destinationCountry'),
                incoterm: clean(incoterm, 16), commodity: clean(commodity), hs: clean(hsCode, 16),
                perms: `{${DEFAULT_PERMISSIONS.buyer.join(',')}}`,
            },
        );
        const id = rows[0].id;
        await exec(
            `INSERT INTO tradeops.order_parties (journey_id, org_id, party_role, status, permissions, document_scopes, added_by_org_id, added_by_user_id, responded_at)
             VALUES (:j, :seller, 'seller', 'active', :perms::text[], :scopes::text[], :buyer, :user, now())`,
            { j: id, seller: String(sellerOrgId), buyer: String(buyerOrgId), user: userId, perms: `{${DEFAULT_PERMISSIONS.seller.join(',')}}`, scopes: `{${DEFAULT_DOCUMENT_SCOPES.seller.join(',')}}` },
        );
        await exec(
            `INSERT INTO tradeops.order_party_events (journey_id, actor_org_id, actor_user_id, action, party_org_id, party_role, detail)
             VALUES (:j, :buyer, :user, 'party.added', :seller, 'seller', '{"how":"opened with the order"}'::jsonb)`,
            { j: id, buyer: String(buyerOrgId), user: userId, seller: String(sellerOrgId) },
        );
        return id;
    }).catch((err) => {
        const unique = err.name === 'SequelizeUniqueConstraintError' || (err.original && err.original.code === '23505');
        if (unique) throw new AppError('CONFLICT', 'This order already has a journey.', 409);
        throw err;
    });
    return { id: journeyId };
}

/** The caller's own standing on a journey, or null when they are not an active party. */
async function myParty(query, journeyId, orgId) {
    const rows = await query(
        "SELECT id, party_role, permissions, document_scopes FROM tradeops.order_parties WHERE journey_id = :j AND org_id = :org AND status = 'active' LIMIT 1",
        { j: journeyId, org: orgId },
    );
    return rows[0] || null;
}

/** One journey, as seen by `orgId`. */
async function getJourney({ orgId, journeyId }) {
    if (!UUID.test(String(journeyId))) throw notFound();
    return db.withOrg(orgId, async (query) => {
        const rows = await query(
            `SELECT ${JOURNEY_COLUMNS} FROM tradeops.order_journeys j WHERE j.id = :j AND tradeops.party_can(j.id, :org, 'journey.view')`,
            { j: journeyId, org: String(orgId) },
        );
        if (!rows[0]) throw notFound();
        const me = await myParty(query, journeyId, String(orgId));
        const people = await query('SELECT party_role, org_id, external_name, status FROM tradeops.order_party_directory WHERE journey_id = :j ORDER BY party_role', { j: journeyId });
        return {
            ...rows[0],
            me: me ? { role: me.party_role, permissions: me.permissions, documentScopes: me.document_scopes } : null,
            parties: people.map((p) => ({ role: p.party_role, orgId: p.org_id, externalName: p.external_name, status: p.status })),
        };
    });
}

async function getJourneyByOrder({ orgId, orderId }) {
    if (!UUID.test(String(orderId))) throw notFound();
    const found = await db.withOrg(orgId, (query) => query(
        "SELECT j.id FROM tradeops.order_journeys j WHERE j.order_id = :o AND tradeops.party_can(j.id, :org, 'journey.view')",
        { o: orderId, org: String(orgId) },
    ));
    if (!found[0]) throw notFound();
    return getJourney({ orgId, journeyId: found[0].id });
}

/** The journeys `orgId` is an active party to, newest first. */
async function listMyJourneys({ orgId, limit = 50 }) {
    const n = Math.min(Math.max(Number(limit) || 50, 1), 200);
    return db.withOrg(orgId, async (query) => {
        const rows = await query(
            `SELECT ${JOURNEY_COLUMNS}, p.party_role AS my_role
               FROM tradeops.order_journeys j
               JOIN tradeops.order_parties p ON p.journey_id = j.id AND p.org_id = :org AND p.status = 'active'
              WHERE tradeops.party_can(j.id, :org, 'journey.view')
              ORDER BY j.created_at DESC LIMIT ${n}`,
            { org: String(orgId) },
        );
        return rows.map((r) => ({ ...r, myRole: r.my_role }));
    });
}

/**
 * The seven steps of a journey as `orgId` may see them. The records behind the steps come from
 * tradeops.journey_records, which leaves prices out and returns only the kinds the caller's
 * permissions allow, so the steps cannot reveal more than the caller could be shown directly.
 */
async function getSteps({ orgId, journeyId }) {
    if (!UUID.test(String(journeyId))) throw notFound();
    return db.withOrg(orgId, async (query) => {
        const rows = await query(
            `SELECT ${JOURNEY_COLUMNS} FROM tradeops.order_journeys j WHERE j.id = :j AND tradeops.party_can(j.id, :org, 'journey.view')`,
            { j: journeyId, org: String(orgId) },
        );
        if (!rows[0]) throw notFound();
        const me = await myParty(query, journeyId, String(orgId));
        const people = await query('SELECT party_role, org_id, external_name, status FROM tradeops.order_party_directory WHERE journey_id = :j', { j: journeyId });
        const records = await query('SELECT kind, record_id, status, title, detail, occurred_at, owner_org FROM tradeops.journey_records(:j, :org)', { j: journeyId, org: String(orgId) });
        const j = rows[0];
        const built = buildSteps({
            journey: j,
            records,
            parties: people.map((p) => ({ role: p.party_role, status: p.status })),
            me: me ? { role: me.party_role, permissions: me.permissions, documentScopes: me.document_scopes } : null,
        });
        return {
            journeyId: j.id, orderId: j.order_id, reference: j.reference_no,
            origin: j.origin_country, destination: j.destination_country, incoterm: j.incoterm,
            myRole: me ? me.party_role : null,
            ...built,
        };
    });
}

module.exports = { getSteps, openJourneyForOrder, getJourney, getJourneyByOrder, listMyJourneys, myParty, JOURNEY_COLUMNS };

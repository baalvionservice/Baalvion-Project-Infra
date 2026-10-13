'use strict';
/**
 * Looks up an organisation so we only ever invite a real, active one of the right kind.
 * The default reads trade-service's own organisations table, keyed by the same organisation id the
 * gateway puts on every request. It is a function so tests and other directories can replace it.
 */
const db = require('./db');

// trade-service's organisations table predates the platform's identity types and names two of them
// differently. The journey speaks the platform's names (the ones on the signed-in session), so
// translate on the way out. See docs/gti/TRADE-JOURNEY-PLAN.md, finding 5.
const PLATFORM_TYPE = Object.freeze({ carrier: 'logistics_provider', insurer: 'insurance_provider' });

async function lookup(orgId) {
    const [rows] = await db.mainPool().query(
        'SELECT tenant_id AS org_id, type::text AS type, status::text AS status, name FROM trade.organizations WHERE tenant_id = :org LIMIT 1',
        { replacements: { org: String(orgId) } },
    );
    return rows[0] ? { orgId: rows[0].org_id, type: PLATFORM_TYPE[rows[0].type] || rows[0].type, status: rows[0].status, name: rows[0].name } : null;
}

module.exports = { lookup, PLATFORM_TYPE };

'use strict';
/**
 * Cross-estate payment read model.
 *
 * Owns `admin.payment_records` — the table that lets one panel show every payment taken
 * anywhere in the estate. Rows are derived exclusively from `payment.recorded` events on the
 * bus; this service never reads another service's payment tables, which is what keeps the
 * platform's "no cross-service DB access" rule intact while still producing one number.
 *
 * Money is stored and returned as an integer count of minor units plus the currency's own
 * exponent. It is never converted to a float anywhere in this file — a panel that displays a
 * total is the last place you want rounding drift to appear.
 *
 * Mirrors adminService.js conventions: raw Sequelize via db.sequelize.query with bind params.
 */
const { Money } = require('@baalvion/money');
const { siteById } = require('@baalvion/sites');
const parties = require('./partyService');

let _db;
function db() {
    if (!_db) _db = require('../models');
    return _db;
}

/**
 * Run a statement against the payment read model with the platform scope established.
 *
 * `admin.payment_records` carries a fail-closed RLS policy (see the DDL below). Reading across
 * every tenant is the console's whole job, so each statement declares that intent explicitly by
 * setting `app.tenant_bypass` transaction-locally — the same GUC contract as @baalvion/tenancy.
 *
 * Transaction-local (`set_config(..., true)`) rather than session-level on purpose: a pooled
 * connection must never carry the bypass on to whatever borrows it next.
 *
 * The bypass only works for a role that is NOT the restricted runtime role, so this cannot be
 * used from `baalvion_app`, and an injection there cannot turn it on for itself.
 *
 * Every read and write of this table goes through here. Route a new one through it too: a
 * statement that misses this returns zero rows rather than the wrong rows, which is the safe
 * direction, but it makes the panel look empty rather than broken.
 */
function platformQuery(sql, options = {}) {
    return db().sequelize.transaction(async (transaction) => {
        await db().sequelize.query(
            "SELECT set_config('app.tenant_bypass', 'on', true)",
            { transaction },
        );
        return db().sequelize.query(sql, { ...options, transaction });
    });
}

// Position on the payment ladder. Scaled by 10 so FAILED sits between AUTHORIZED and CAPTURED:
// a failure is a pre-capture terminal, so it may supersede an authorization but must never
// overwrite a capture or a settlement that a later, out-of-order delivery could carry.
const STATE_RANK = { INITIATED: 0, AUTHORIZED: 10, FAILED: 15, CAPTURED: 20, SETTLED: 30 };

const DDL = `
CREATE SCHEMA IF NOT EXISTS admin;
CREATE TABLE IF NOT EXISTS admin.payment_records (
    payment_id          VARCHAR(190) NOT NULL,
    site_id             VARCHAR(64)  NOT NULL,
    tenant_id           VARCHAR(190),
    party_id            VARCHAR(190),
    state               VARCHAR(16)  NOT NULL,
    state_rank          SMALLINT     NOT NULL,
    provider            VARCHAR(40)  NOT NULL,
    rail                VARCHAR(24)  NOT NULL,
    provider_payment_id VARCHAR(190),
    amount_minor        BIGINT       NOT NULL,
    currency            CHAR(3)      NOT NULL,
    exponent            SMALLINT     NOT NULL,
    fee_minor           BIGINT,
    net_minor           BIGINT,
    order_ref           VARCHAR(190),
    failure_reason      TEXT,
    idempotency_key     VARCHAR(400) NOT NULL,
    occurred_at         TIMESTAMPTZ  NOT NULL,
    recorded_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (payment_id, site_id)
);
-- Column evolution. CREATE TABLE IF NOT EXISTS is a no-op once the table exists, so a new
-- column has to be added explicitly or an upgraded service writes to a column that is not
-- there. Each ALTER is idempotent, so this stays safe to run on every boot.
ALTER TABLE admin.payment_records ADD COLUMN IF NOT EXISTS fee_minor BIGINT;
ALTER TABLE admin.payment_records ADD COLUMN IF NOT EXISTS net_minor BIGINT;
CREATE INDEX IF NOT EXISTS idx_payment_records_occurred ON admin.payment_records (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_site_occurred ON admin.payment_records (site_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_site_state_occurred ON admin.payment_records (site_id, state, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_tenant_occurred ON admin.payment_records (tenant_id, occurred_at DESC) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_records_party ON admin.payment_records (party_id, occurred_at DESC) WHERE party_id IS NOT NULL;
-- Retention: this table is a read model, not the source of truth, so old rows can be archived.
-- Nothing is deleted automatically -- this only provides the index an archive sweep needs.
CREATE INDEX IF NOT EXISTS idx_payment_records_recorded ON admin.payment_records (recorded_at);
-- Row-level security. Same policy as migrations/007_payment_records.sql -- see there for the
-- This table holds EVERY tenant's payments in one place, which is exactly why it gets a real
-- fail-closed policy rather than an audit exemption.
--
-- The rule, using @baalvion/tenancy's standard shape (packages/tenancy/sql.js):
--   • no tenant set and no bypass  → ZERO rows. A service that reaches this table without
--     establishing who it is sees nothing, which is the lateral-movement case that matters.
--   • a tenant set                 → only that tenant's rows.
--   • bypass, from a role that is NOT the restricted runtime role → all rows. This is how the
--     console reads across the estate, and 'current_user <> 'baalvion_app'' means a SQL
--     injection on the app connection cannot turn the bypass on for itself (CR-8).
--
-- ⚠️ POSTGRES IGNORES RLS FOR SUPERUSERS. While admin-service connects as a superuser this
-- policy is inert — present and correct, enforcing nothing. Give the service a non-superuser
-- login role to make it real. Verify with:
--   SELECT current_user, usesuper FROM pg_user WHERE usename = current_user;
ALTER TABLE admin.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.payment_records FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON admin.payment_records;
CREATE POLICY tenant_isolation ON admin.payment_records
    USING (
        (current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app')
        OR (current_setting('app.current_tenant', true) IS NOT NULL
            AND current_setting('app.current_tenant', true) <> ''
            AND tenant_id::text = current_setting('app.current_tenant', true))
    )
    WITH CHECK (
        (current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app')
        OR (current_setting('app.current_tenant', true) IS NOT NULL
            AND current_setting('app.current_tenant', true) <> ''
            AND tenant_id::text = current_setting('app.current_tenant', true))
    );

CREATE TABLE IF NOT EXISTS admin.payment_stream_offsets (
    consumer    VARCHAR(120) PRIMARY KEY,
    last_id     VARCHAR(64)  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
`;

let schemaReady = null;
/** Idempotent, memoized provisioning — matches analyticsService's self-provisioning convention. */
function ensureSchema() {
    if (!schemaReady) {
        schemaReady = db().sequelize.query(DDL).catch((err) => {
            schemaReady = null; // let a later call retry rather than caching the failure
            throw err;
        });
    }
    return schemaReady;
}

class PaymentRecordError extends Error {
    constructor(code, message) { super(message); this.name = 'PaymentRecordError'; this.code = code; }
}

/**
 * Apply one `payment.recorded` event.
 *
 * Idempotent and replay-safe: the upsert only advances a payment up the ladder, so a
 * duplicate delivery is a no-op and an out-of-order delivery cannot move a settled payment
 * back to authorized. Returns whether the row actually changed, so the consumer can log
 * meaningfully instead of guessing.
 */
async function applyPaymentRecorded(event) {
    await ensureSchema();
    const p = (event && event.payload) || {};

    if (!p.siteId) throw new PaymentRecordError('MISSING_SITE', 'payment.recorded without a siteId cannot be attributed');
    if (!p.paymentId) throw new PaymentRecordError('MISSING_PAYMENT_ID', 'payment.recorded without a paymentId');
    const rank = STATE_RANK[p.state];
    if (rank === undefined) throw new PaymentRecordError('UNKNOWN_STATE', `Unknown payment state: ${p.state}`);
    if (!siteById(p.siteId)) throw new PaymentRecordError('UNKNOWN_SITE', `Site "${p.siteId}" is not in the registry`);

    // Resolve the payer to a group-wide party, so "what has this person paid us across every
    // property" is answerable. Never fatal: an unresolvable identity leaves party_id null rather
    // than rejecting a real payment.
    let partyId = p.partyId || null;
    if (!partyId && p.customer) {
        partyId = await parties.resolveFromPayment(p).catch((err) => {
            console.warn(JSON.stringify({ evt: 'party.resolve_failed', paymentId: p.paymentId, msg: err.message }));
            return null;
        });
    }

    // Validates the money is an exact integer in a known currency before it reaches the panel.
    const money = Money.of(p.money.amount, p.money.currency);
    // A fee the provider has not reported stays null. Defaulting it to zero would make every
    // margin figure on the panel look better than it is.
    const fee = p.fee ? Money.of(p.fee.amount, p.fee.currency) : null;
    const net = p.net ? Money.of(p.net.amount, p.net.currency) : (fee ? money.subtract(fee) : null);

    const [rows] = await platformQuery(
        `INSERT INTO admin.payment_records (
            payment_id, site_id, tenant_id, party_id, state, state_rank, provider, rail,
            provider_payment_id, amount_minor, currency, exponent, fee_minor, net_minor,
            order_ref, failure_reason, idempotency_key, occurred_at, recorded_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, NOW(), NOW())
         ON CONFLICT (payment_id, site_id) DO UPDATE SET
            state = EXCLUDED.state,
            state_rank = EXCLUDED.state_rank,
            tenant_id = COALESCE(EXCLUDED.tenant_id, admin.payment_records.tenant_id),
            party_id = COALESCE(EXCLUDED.party_id, admin.payment_records.party_id),
            provider_payment_id = COALESCE(EXCLUDED.provider_payment_id, admin.payment_records.provider_payment_id),
            amount_minor = EXCLUDED.amount_minor,
            currency = EXCLUDED.currency,
            exponent = EXCLUDED.exponent,
            fee_minor = COALESCE(EXCLUDED.fee_minor, admin.payment_records.fee_minor),
            net_minor = COALESCE(EXCLUDED.net_minor, admin.payment_records.net_minor),
            order_ref = COALESCE(EXCLUDED.order_ref, admin.payment_records.order_ref),
            failure_reason = EXCLUDED.failure_reason,
            idempotency_key = EXCLUDED.idempotency_key,
            occurred_at = EXCLUDED.occurred_at,
            updated_at = NOW()
         WHERE EXCLUDED.state_rank > admin.payment_records.state_rank
         RETURNING payment_id`,
        {
            bind: [
                p.paymentId, p.siteId, p.tenantId || null, partyId, p.state, rank,
                p.provider, p.rail, p.providerPaymentId || null,
                money.minor.toString(), money.currency, money.exponent,
                fee ? fee.minor.toString() : null, net ? net.minor.toString() : null,
                p.orderRef || null, p.failureReason || null,
                p.idempotencyKey || `${p.paymentId}:${p.state}:${p.providerPaymentId || 'none'}`,
                p.occurredAt,
            ],
        },
    );
    return { changed: Array.isArray(rows) && rows.length > 0 };
}

function decodeRow(row) {
    const money = Money.of(String(row.amount_minor), String(row.currency).trim());
    const site = siteById(row.site_id);
    return {
        paymentId: row.payment_id,
        siteId: row.site_id,
        siteName: site ? site.name : row.site_id,
        tenantId: row.tenant_id,
        partyId: row.party_id,
        state: row.state,
        provider: row.provider,
        rail: row.rail,
        providerPaymentId: row.provider_payment_id,
        // Both forms: the exact wire value, and a display string. Never a float.
        money: money.toJSON(),
        amountDisplay: money.format(),
        fee: row.fee_minor == null ? null : Money.of(String(row.fee_minor), String(row.currency).trim()).toJSON(),
        net: row.net_minor == null ? null : Money.of(String(row.net_minor), String(row.currency).trim()).toJSON(),
        orderRef: row.order_ref,
        failureReason: row.failure_reason,
        occurredAt: row.occurred_at,
    };
}

/** Estate-wide payment feed, filterable. Cursor-free keyset would need a stable tiebreak; the
 *  panel pages by offset, which is correct at this table's size. */
async function listPayments({ siteId, state, provider, from, to, limit = 50, offset = 0 } = {}) {
    await ensureSchema();
    const where = [];
    const bind = [];
    const add = (sql, value) => { bind.push(value); where.push(sql.replace('?', `$${bind.length}`)); };

    if (siteId) add('site_id = ?', siteId);
    if (state) add('state = ?', String(state).toUpperCase());
    if (provider) add('provider = ?', provider);
    if (from) add('occurred_at >= ?', from);
    if (to) add('occurred_at <= ?', to);

    const capped = Math.min(Math.max(Number(limit) || 50, 1), 200);
    bind.push(capped, Math.max(Number(offset) || 0, 0));

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await platformQuery(
        `SELECT * FROM admin.payment_records ${clause}
          ORDER BY occurred_at DESC
          LIMIT $${bind.length - 1} OFFSET $${bind.length}`,
        { bind },
    );
    const [[counted]] = await platformQuery(
        `SELECT COUNT(*)::bigint AS total FROM admin.payment_records ${clause}`,
        { bind: bind.slice(0, bind.length - 2) },
    );
    return {
        payments: rows.map(decodeRow),
        total: Number(counted ? counted.total : 0),
        limit: capped,
        offset: Math.max(Number(offset) || 0, 0),
    };
}

/**
 * Per-site totals for captured + settled money.
 *
 * Grouped by currency as well as site, and NEVER summed across currencies — adding INR to USD
 * to produce one headline number is the kind of figure that looks authoritative and is simply
 * wrong. Conversion belongs to fx-service, applied deliberately, not implied by a SUM().
 */
async function summaryBySite({ from, to } = {}) {
    await ensureSchema();
    const where = ["state IN ('CAPTURED','SETTLED')"];
    const bind = [];
    if (from) { bind.push(from); where.push(`occurred_at >= $${bind.length}`); }
    if (to) { bind.push(to); where.push(`occurred_at <= $${bind.length}`); }

    const [rows] = await platformQuery(
        `SELECT site_id, currency, exponent,
                COUNT(*)::bigint                    AS payment_count,
                SUM(amount_minor)::bigint           AS gross_minor,
                SUM(COALESCE(fee_minor, 0))::bigint AS fee_minor,
                COUNT(fee_minor)::bigint            AS fee_known_count,
                MAX(occurred_at)                    AS last_payment_at
           FROM admin.payment_records
          WHERE ${where.join(' AND ')}
          GROUP BY site_id, currency, exponent
          ORDER BY site_id, currency`,
        { bind },
    );

    const sites = new Map();
    for (const r of rows) {
        const money = Money.of(String(r.gross_minor), String(r.currency).trim());
        const site = siteById(r.site_id);
        if (!sites.has(r.site_id)) {
            sites.set(r.site_id, {
                siteId: r.site_id,
                siteName: site ? site.name : r.site_id,
                rails: site ? site.rails : [],
                totals: [],
                paymentCount: 0,
            });
        }
        const entry = sites.get(r.site_id);
        const count = Number(r.payment_count);
        entry.paymentCount += count;
        const fees = Money.of(String(r.fee_minor), String(r.currency).trim());
        const feeKnown = Number(r.fee_known_count);
        entry.totals.push({
            money: money.toJSON(),
            display: money.format(),
            fees: fees.toJSON(),
            feesDisplay: fees.format(),
            // Net after processor fees — the figure that answers "does this property make
            // money". Flagged partial when some payments have no fee recorded, so an
            // incomplete number is never read as a complete one.
            net: money.subtract(fees).toJSON(),
            netDisplay: money.subtract(fees).format(),
            feeCoverage: count === 0 ? null : (feeKnown === count ? 'complete' : 'partial'),
            paymentsMissingFee: count - feeKnown,
            paymentCount: count,
            lastPaymentAt: r.last_payment_at,
        });
    }
    return { sites: [...sites.values()] };
}

/**
 * How much history the read model is holding.
 *
 * `payment_records` is derived — every row can be rebuilt from the events that produced it — so
 * old rows are safe to archive. Reported rather than acted on: a service should not decide by
 * itself to delete financial records.
 */
async function retentionReport({ olderThanDays = 730 } = {}) {
    await ensureSchema();
    const days = Math.max(Number(olderThanDays) || 730, 1);
    const [[row]] = await platformQuery(
        `SELECT COUNT(*)::bigint AS total,
                COUNT(*) FILTER (WHERE recorded_at < NOW() - ($1 || ' days')::interval)::bigint AS older,
                MIN(recorded_at) AS oldest,
                pg_size_pretty(pg_total_relation_size('admin.payment_records')) AS size
           FROM admin.payment_records`,
        { bind: [String(days)] },
    );
    return {
        total: Number(row.total),
        olderThanDays: days,
        eligibleForArchive: Number(row.older),
        oldest: row.oldest,
        tableSize: row.size,
    };
}

/**
 * Delete rows older than the cutoff. Explicit, operator-run, and refuses to run blind:
 * `confirm` must be true, so it can never be triggered by a stray call or a default.
 */
async function pruneOlderThan({ olderThanDays = 730, confirm = false, limit = 10000 } = {}) {
    await ensureSchema();
    if (confirm !== true) {
        return { pruned: 0, refused: 'pruneOlderThan requires confirm:true — it deletes financial history' };
    }
    const days = Math.max(Number(olderThanDays) || 730, 1);
    const [, meta] = await platformQuery(
        `DELETE FROM admin.payment_records
          WHERE ctid IN (
            SELECT ctid FROM admin.payment_records
             WHERE recorded_at < NOW() - ($1 || ' days')::interval
             LIMIT $2
          )`,
        { bind: [String(days), Math.min(Math.max(Number(limit) || 10000, 1), 100000)] },
    );
    const pruned = (meta && meta.rowCount) || 0;
    console.info(JSON.stringify({ evt: 'payment_records.pruned', pruned, olderThanDays: days }));
    return { pruned, olderThanDays: days };
}

module.exports = {
    ensureSchema,
    retentionReport,
    pruneOlderThan,
    applyPaymentRecorded,
    listPayments,
    summaryBySite,
    PaymentRecordError,
    STATE_RANK,
};

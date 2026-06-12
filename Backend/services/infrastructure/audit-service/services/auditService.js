'use strict';
const { QueryTypes } = require('sequelize');
const db = require('../models');
const { Errors } = require('../utils/errors');
const { GENESIS, computeHash } = require('./hashChain');

// Constant advisory-lock key — serializes appends so the hash chain stays linear
// under concurrency without locking the whole table.
const APPEND_LOCK = 982451653;

function normalize(i = {}) {
    if (!i.action) throw Errors.badRequest('action is required');
    return {
        occurred_at:    new Date(i.occurredAt || i.occurred_at || Date.now()).toISOString(),
        actor_id:       i.actorId ?? i.actor_id ?? null,
        actor_org_id:   i.actorOrgId ?? i.orgId ?? null,
        ip_address:     i.ip ?? i.ipAddress ?? null,
        user_agent:     i.userAgent ?? null,
        action:         String(i.action),
        resource_type:  i.resourceType ?? i.resource?.type ?? null,
        resource_id:    i.resourceId ?? i.resource?.id ?? null,
        tenant_id:      i.tenantId ?? null,
        scope_id:       i.scopeId ?? null,
        outcome:        i.outcome ?? 'success',
        severity:       i.severity ?? 'info',
        source_service: i.sourceService ?? i.source ?? null,
        app_id:         i.appId ?? null,
        correlation_id: i.correlationId ?? null,
        metadata:       (i.metadata && typeof i.metadata === 'object') ? i.metadata : {},
    };
}

const INSERT_SQL = `
    INSERT INTO audit.events
        (occurred_at, actor_id, actor_org_id, ip_address, user_agent, action, resource_type, resource_id,
         tenant_id, scope_id, outcome, severity, source_service, app_id, correlation_id, metadata, prev_hash, hash)
    VALUES
        (:occurred_at,:actor_id,:actor_org_id,:ip_address,:user_agent,:action,:resource_type,:resource_id,
         :tenant_id,:scope_id,:outcome,:severity,:source_service,:app_id,:correlation_id, CAST(:metadata AS JSONB), :prev_hash, :hash)
    RETURNING seq, event_id, recorded_at, hash, prev_hash`;

async function insertChained(e, t) {
    await db.sequelize.query('SELECT pg_advisory_xact_lock(:k)', { replacements: { k: APPEND_LOCK }, transaction: t });
    const last = await db.sequelize.query('SELECT hash FROM audit.events ORDER BY seq DESC LIMIT 1', { transaction: t, type: QueryTypes.SELECT });
    const prevHash = last[0]?.hash || GENESIS;
    const hash = computeHash(prevHash, e);
    const [rows] = await db.sequelize.query(INSERT_SQL, {
        replacements: { ...e, metadata: JSON.stringify(e.metadata), prev_hash: prevHash, hash },
        transaction: t,
    });
    return serialize({ ...e, ...rows[0] });
}

async function append(input) {
    const e = normalize(input);
    return db.sequelize.transaction((t) => insertChained(e, t));
}

/** Append many in chain order within one transaction. */
async function appendBatch(inputs = []) {
    const events = inputs.map(normalize);
    return db.sequelize.transaction(async (t) => {
        const out = [];
        for (const e of events) out.push(await insertChained(e, t));
        return out;
    });
}

function serialize(r) {
    return {
        seq: Number(r.seq), eventId: r.event_id, occurredAt: r.occurred_at, recordedAt: r.recorded_at,
        actorId: r.actor_id, actorOrgId: r.actor_org_id, ip: r.ip_address, userAgent: r.user_agent,
        action: r.action, resourceType: r.resource_type, resourceId: r.resource_id,
        tenantId: r.tenant_id, scopeId: r.scope_id, outcome: r.outcome, severity: r.severity,
        sourceService: r.source_service, appId: r.app_id, correlationId: r.correlation_id,
        metadata: r.metadata || {}, prevHash: r.prev_hash, hash: r.hash,
    };
}

// ─── Query ──────────────────────────────────────────────────────────────────
/**
 * @param {object} f           - raw filter params (from req.query)
 * @param {object} [caller]    - { orgId, isSuperAdmin } derived from req.auth
 *
 * For non-super_admin callers the tenant scope is ALWAYS forced to caller.orgId.
 * Any client-supplied ?tenantId that differs is silently overridden so that a
 * scoped caller can never enumerate events belonging to another tenant.
 *
 * Internal service principals (req.internal) bypass tenant scoping because they
 * write cross-tenant events on behalf of the platform.
 */
async function query(f = {}, caller = {}) {
    const where = {};
    const { Op } = db.Sequelize;

    // ── Tenant scope enforcement ──────────────────────────────────────────────
    // Super-admins and internal service callers may pass an explicit tenantId.
    // All other callers are pinned to their own orgId and may NOT widen the scope.
    const isSuperAdmin = caller.isSuperAdmin === true;
    const isInternal   = caller.isInternal   === true;
    if (!isSuperAdmin && !isInternal) {
        // Non-privileged: scope is always the caller's own org.  Ignore any
        // client-supplied tenantId that differs to prevent cross-tenant reads.
        if (caller.orgId) {
            where.tenant_id = String(caller.orgId);
        } else {
            // Caller authenticated but carries no org claim; return an empty
            // result set using an impossible seq condition.  This is safer than
            // scoping to actor_org_id = null, which would accidentally expose
            // all platform-level events that were written without a tenant.
            where.seq = -1;
        }
    } else if (f.tenantId) {
        // Privileged caller may filter by a specific tenant.
        where.tenant_id = String(f.tenantId);
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (f.actorId)       where.actor_id = String(f.actorId);
    if (f.action)        where.action = f.action;
    if (f.resourceType)  where.resource_type = f.resourceType;
    if (f.resourceId)    where.resource_id = String(f.resourceId);
    if (f.sourceService) where.source_service = f.sourceService;
    if (f.severity)      where.severity = f.severity;
    if (f.outcome)       where.outcome = f.outcome;
    if (f.correlationId) where.correlation_id = String(f.correlationId);
    if (f.from || f.to) {
        where.occurred_at = {};
        if (f.from) where.occurred_at[Op.gte] = new Date(f.from);
        if (f.to)   where.occurred_at[Op.lte] = new Date(f.to);
    }
    const limit = Math.min(Number(f.limit) || 50, 500);
    const offset = Number(f.offset) || 0;
    const { rows, count } = await db.AuditEvent.findAndCountAll({ where, order: [['seq', 'DESC']], limit, offset });
    return { items: rows.map((r) => serialize(r.get({ plain: true }))), total: count, limit, offset };
}

/**
 * Fetch a single event by primary-key seq.
 * Non-super_admin / non-internal callers are restricted to events that belong
 * to their own tenant so they cannot enumerate cross-tenant rows by seq probing.
 *
 * @param {number|string} seq
 * @param {object} [caller]  - { orgId, isSuperAdmin, isInternal } from req.auth
 */
async function getBySeq(seq, caller = {}) {
    const r = await db.AuditEvent.findByPk(seq);
    if (!r) throw Errors.notFound('Audit event not found');
    const row = r.get({ plain: true });

    // ── Tenant scope enforcement ──────────────────────────────────────────────
    const isSuperAdmin = caller.isSuperAdmin === true;
    const isInternal   = caller.isInternal   === true;
    if (!isSuperAdmin && !isInternal) {
        // A caller without an org claim must NOT see any event; return 404 so
        // the existence of the seq is not leaked (same as not-found behaviour).
        if (!caller.orgId) throw Errors.notFound('Audit event not found');
        if (row.tenant_id !== String(caller.orgId)) throw Errors.notFound('Audit event not found');
    }
    // ─────────────────────────────────────────────────────────────────────────

    return serialize(row);
}

/**
 * Re-walk the chain and detect tampering. Catches BOTH content edits (recomputed
 * hash ≠ stored hash) and inserted/removed rows (prev_hash ≠ previous row's hash).
 *
 * @param {object} opts      - { fromSeq, toSeq }
 * @param {object} [caller]  - { orgId, isSuperAdmin, isInternal } from req.auth
 *
 * Non-super_admin / non-internal callers are scoped to their own tenant so they
 * cannot verify (and thus enumerate) events belonging to other tenants.
 */
async function verify({ fromSeq = 0, toSeq } = {}, caller = {}) {
    const { Op } = db.Sequelize;
    const where = { seq: { [Op.gte]: Number(fromSeq) || 0 } };
    if (toSeq) where.seq[Op.lte] = Number(toSeq);

    // ── Tenant scope enforcement ──────────────────────────────────────────────
    const isSuperAdmin = caller.isSuperAdmin === true;
    const isInternal   = caller.isInternal   === true;
    if (!isSuperAdmin && !isInternal) {
        if (caller.orgId) {
            where.tenant_id = String(caller.orgId);
        } else {
            // No org claim and not privileged — verify over zero rows (safe default).
            where.seq = { ...where.seq, [db.Sequelize.Op.lt]: 0 };
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const rows = await db.AuditEvent.findAll({ where, order: [['seq', 'ASC']] });

    let prevRowHash = null;
    let checked = 0;
    for (const m of rows) {
        const r = m.get({ plain: true });
        const recomputed = computeHash(r.prev_hash, r);
        if (recomputed !== r.hash) return { ok: false, checked, brokenAtSeq: Number(r.seq), reason: 'content_hash_mismatch' };
        if (prevRowHash !== null && r.prev_hash !== prevRowHash) {
            return { ok: false, checked, brokenAtSeq: Number(r.seq), reason: 'chain_link_broken' };
        }
        prevRowHash = r.hash;
        checked++;
    }
    return { ok: true, checked, brokenAtSeq: null };
}

// ─── CSV export ───────────────────────────────────────────────────────────────
const CSV_COLS = ['seq', 'occurredAt', 'actorId', 'action', 'resourceType', 'resourceId', 'outcome', 'severity', 'sourceService', 'ip', 'correlationId', 'hash'];
function toCsv(items) {
    const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    return [CSV_COLS.join(','), ...items.map((it) => CSV_COLS.map((c) => esc(it[c])).join(','))].join('\n');
}

async function exportEvents(f = {}, caller = {}) {
    const res = await query({ ...f, limit: 500 }, caller);
    return toCsv(res.items);
}

module.exports = { append, appendBatch, query, getBySeq, verify, exportEvents, normalize, serialize };

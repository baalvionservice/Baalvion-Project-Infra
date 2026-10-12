'use strict';
/**
 * Compliance & Sanctions Engine — DB-backed ORCHESTRATOR (War Room 4, Prompt 8).
 *
 * Wraps the PURE layers (rules / severity / report) + the async KYC/AML hooks with
 * the persistence and context-loading they deliberately avoid:
 *
 *   • screen()            — STATELESS. Normalize a subject, load the reference data
 *                           + the caller's tenant blacklist/whitelist, run the
 *                           KYC/AML hooks, build the compliance_report. No DB write.
 *
 *   • screenOperation()   — load a trade operation for context, assemble the
 *                           subject from it (+ caller overrides), screen, and
 *                           PERSIST an append-only compliance_screenings snapshot,
 *                           refreshing the per-operation cache.
 *
 *   • getLatest()         — the live, cached screening for an operation
 *                           (cache-aside; seeds one on first read).
 *
 *   • triggerScreen()     — fire-and-forget event hook (workflow compliance_check
 *                           transition). NEVER throws into the caller's path.
 *
 * REFERENCE DATA loads from the global tables (compliance_sanctioned_parties /
 * _controlled_goods / _trade_bans) and falls back to service/compliance/dataset.js
 * when they are empty / un-migrated — so the engine always has rules to run.
 */

const db = require('../../models');
const cache = require('../../cache');
const logger = require('../logger');
const rules = require('./rules');
const report = require('./report');
const dataset = require('./dataset');
const kycAml = require('./kycAml');
const { AppError } = require('../../utils/errors');
const { PartyIndex } = require('./lists/partyIndex');

const REF_CACHE_KEY = cache.key('global', 'compliance:refdata', 'v1');
const REF_CACHE_TTL = 300; // seconds — reference data is slow-moving
let refMemo = null;     // { at, data }
let refLoading = null;  // in-flight load, so concurrent screenings share one query
const LATEST_NS = 'compliance:latest';
const LATEST_TTL = 60;

const latestKey = (tenantId, operationId) => cache.tkey(tenantId || 'global', LATEST_NS, operationId);

/** Plain-object view of a Sequelize instance (or pass-through for a POJO). */
const plain = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);

// ── Reference data ───────────────────────────────────────────────────────────

/** Shape DB/dataset rows into the refData the pure rules engine consumes. */
function shapeReferenceData(parties, goods, bans) {
    return {
        sanctionedCountries: parties.filter((p) => p.party_type === 'country'),
        namedParties: parties.filter((p) => p.party_type !== 'country'),
        controlledGoods: goods,
        tradeBans: bans,
    };
}

/** The dataset fallback shaped for the rules engine. */
function datasetReferenceData() {
    return {
        ...shapeReferenceData(dataset.sanctionedParties(), dataset.controlledGoods(), dataset.tradeBans()),
        source: 'dataset',
    };
}

/**
 * Load the global compliance reference data (cache-aside). Falls back to the
 * static dataset when the tables are missing/empty so screening never runs blind.
 */
async function loadReferenceData() {
    // Held in process memory, not Redis: the party index is an object with methods
    // and ~50,000 names, which a JSON cache cannot carry. Other instances pick up a
    // fresh import within REF_CACHE_TTL.
    if (refMemo && Date.now() - refMemo.at < REF_CACHE_TTL * 1000) return refMemo.data;
    if (refLoading) return refLoading;

    refLoading = (async () => {
        let refData = datasetReferenceData();
        try {
            if (db.SanctionedParty && db.ControlledGood && db.TradeBan) {
                const [parties, goods, bans] = await Promise.all([
                    db.SanctionedParty.findAll({ where: { active: true } }),
                    db.ControlledGood.findAll({ where: { active: true } }),
                    db.TradeBan.findAll({ where: { active: true } }),
                ]);
                // Each component falls back to the built-in dataset on its own. Importing the
                // sanctions lists fills only the parties table; adopting the DB wholesale
                // would otherwise switch off the goods and trade-ban checks on a database
                // where those tables were never seeded.
                const fromDb = {
                    parties: parties.length > 0,
                    goods: goods.length > 0,
                    bans: bans.length > 0,
                };
                if (fromDb.parties || fromDb.goods || fromDb.bans) {
                    const plainParties = parties.map(plain);
                    const dbCountries = plainParties.filter((p) => p.party_type === 'country');
                    const dbNamed = plainParties.filter((p) => p.party_type !== 'country');
                    const fallback = shapeReferenceData(dataset.sanctionedParties(), dataset.controlledGoods(), dataset.tradeBans());
                    refData = {
                        sanctionedCountries: dbCountries.length ? dbCountries : fallback.sanctionedCountries,
                        namedParties: dbNamed.length ? new PartyIndex(dbNamed) : fallback.namedParties,
                        controlledGoods: fromDb.goods ? goods.map(plain) : fallback.controlledGoods,
                        tradeBans: fromDb.bans ? bans.map(plain) : fallback.tradeBans,
                        source: fromDb.parties && fromDb.goods && fromDb.bans ? 'db' : 'db+dataset',
                    };
                }
            }
        } catch {
            // table missing / not migrated — keep the dataset fallback
            refData = datasetReferenceData();
        }
        refMemo = { at: Date.now(), data: refData };
        return refData;
    })();
    try {
        return await refLoading;
    } finally {
        refLoading = null;
    }
}

/** Bust the reference-data cache (call after seeding / editing the lists). */
async function invalidateReferenceData() {
    refMemo = null;
    await cache.del(REF_CACHE_KEY); // legacy key from before the in-process cache
}

// ── Tenant blacklist / whitelist ─────────────────────────────────────────────

/** Load a tenant's active, non-expired blacklist + whitelist entries. */
async function loadTenantLists(tenantId, { now = new Date() } = {}) {
    const empty = { blacklist: [], whitelist: [] };
    if (!db.ComplianceListEntry || !tenantId) return empty;
    let rows = [];
    try {
        rows = await db.ComplianceListEntry.findAll({ where: { tenant_id: tenantId, active: true } });
    } catch {
        return empty;
    }
    const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
    const lists = { blacklist: [], whitelist: [] };
    for (const r of rows.map(plain)) {
        if (r.expires_at && new Date(r.expires_at).getTime() <= nowMs) continue; // expired
        const entry = { subject_type: r.subject_type, value: r.value, severity: r.severity, reason: r.reason };
        if (r.list_type === 'whitelist') lists.whitelist.push(entry);
        else lists.blacklist.push(entry);
    }
    return lists;
}

// ── Subject assembly ─────────────────────────────────────────────────────────

/** Build a screening subject from a trade operation (+ caller overrides). */
function subjectFromOperation(operation, overrides = {}) {
    const op = plain(operation) || {};
    const meta = op.metadata || {};

    // Parties: prefer explicit metadata.parties; else derive from buyer/seller orgs.
    let parties = Array.isArray(meta.parties) && meta.parties.length ? meta.parties : null;
    if (!parties) {
        parties = [];
        if (op.seller_org_id) parties.push({ name: op.seller_org_id, role: 'seller', country: op.origin_country });
        if (op.buyer_org_id) parties.push({ name: op.buyer_org_id, role: 'buyer', country: op.destination_country });
    }

    // Goods: prefer metadata.goods; else derive from commodity + hs_code.
    let goods = Array.isArray(meta.goods) && meta.goods.length ? meta.goods : null;
    if (!goods) {
        goods = [];
        if (op.commodity || op.hs_code) {
            goods.push({ description: op.commodity || null, hsCode: op.hs_code || null, category: meta.category || null, value: op.total_value != null ? Number(op.total_value) : null });
        }
    }

    return {
        originCountry: overrides.originCountry || op.origin_country,
        destinationCountry: overrides.destinationCountry || op.destination_country,
        direction: overrides.direction || meta.direction || 'both',
        totalValue: overrides.totalValue != null ? overrides.totalValue : (op.total_value != null ? Number(op.total_value) : null),
        currency: overrides.currency || op.currency,
        parties: overrides.parties || parties,
        goods: overrides.goods || goods,
    };
}

// ── Public: stateless screen ─────────────────────────────────────────────────

/**
 * Stateless compliance screening. No DB write.
 *
 * @param {object} input  raw subject (see report.normalizeSubject) + tenantId
 * @param {object} [opts] { tenantId, runHooks=true, now }
 * @returns {Promise<object>} compliance_report
 */
async function screen(input = {}, { tenantId = null, runHooks = true, now = new Date() } = {}) {
    const subject = report.normalizeSubject(input);
    const effectiveTenant = tenantId || input.tenantId || null;

    const [refData, tenantLists] = await Promise.all([
        loadReferenceData(),
        loadTenantLists(effectiveTenant, { now }),
    ]);

    const hooks = runHooks ? await kycAml.screen(subject) : null;
    return report.build({ subject, refData, tenantLists, hooks, now });
}

// ── Public: persisted operation screen ───────────────────────────────────────

/** Persist a compliance_report as a ComplianceScreening row. */
async function persistScreening({ tenantId, operation, shipmentId, subjectRef, report: r, trigger, reason, actor }) {
    return db.ComplianceScreening.create({
        tenant_id: tenantId,
        subject_ref: subjectRef || null,
        trade_operation_id: operation ? operation.id : null,
        shipment_id: shipmentId || null,
        decision: r.decision,
        risk_score: r.risk_score,
        severity: r.severity,
        violation_count: r.violation_count,
        blocking: r.blocking,
        origin_country: r.subject.origin_country || null,
        destination_country: r.subject.destination_country || null,
        parties: r.subject.parties || [],
        goods: r.subject.goods || [],
        violations: r.violations || [],
        checks: r.checks || {},
        kyc_status: r.kyc ? r.kyc.status : 'not_checked',
        aml_status: r.aml ? r.aml.status : 'not_checked',
        report: r,
        engine_version: r.engine_version,
        trigger: trigger || 'manual',
        reason: reason || null,
        created_by: actor || null,
    });
}

/** Normalize a screening (fresh report + persisted row) into the API view shape. */
function toView(r, { record = null } = {}) {
    return {
        screening_id: record ? record.id : null,
        trade_operation_id: record ? record.trade_operation_id : null,
        decision: r.decision,
        risk_score: r.risk_score,
        severity: r.severity,
        blocking: r.blocking,
        violation_count: r.violation_count,
        violations: r.violations,
        checks: r.checks,
        kyc: r.kyc,
        aml: r.aml,
        subject: r.subject,
        summary: r.summary,
        engine_version: r.engine_version,
        trigger: record ? record.trigger : null,
        screened_at: record ? record.created_at : r.screened_at,
        persisted: !!record,
    };
}

/**
 * Screen a trade operation in-context and PERSIST the result.
 *
 * @param {string} operationId
 * @param {object} opts { overrides, trigger, reason, actor, tenantId, runHooks, persist, now }
 * @returns {Promise<{ report, record, view }>}
 */
async function screenOperation(operationId, {
    overrides = {}, trigger = 'manual', reason = null, actor = null,
    tenantId = null, runHooks = true, persist = true, shipmentId = null, now = new Date(),
} = {}) {
    const where = { id: operationId };
    if (tenantId) where.tenant_id = tenantId; // defence in depth over the tenant hook + RLS
    const operation = await db.TradeOperation.findOne({ where });
    if (!operation) throw new AppError('NOT_FOUND', 'Trade operation not found', 404);

    const subjectRaw = subjectFromOperation(operation, overrides);
    const subject = report.normalizeSubject(subjectRaw);

    const effectiveTenant = tenantId || operation.tenant_id;
    const [refData, tenantLists] = await Promise.all([
        loadReferenceData(),
        loadTenantLists(effectiveTenant, { now }),
    ]);
    const hooks = runHooks ? await kycAml.screen(subject) : null;
    const r = report.build({ subject, refData, tenantLists, hooks, now });

    let record = null;
    if (persist) {
        record = await persistScreening({
            tenantId: effectiveTenant, operation, shipmentId, subjectRef: overrides.subjectRef || operation.reference_no,
            report: r, trigger, reason, actor,
        });
    }

    const view = toView(r, { record });
    await cache.set(latestKey(effectiveTenant, operation.id), view, LATEST_TTL);
    return { report: r, record, view };
}

/** The live, cached latest screening for an operation (seeds one on first read). */
async function getLatest(operation, { now = new Date() } = {}) {
    const op = plain(operation);
    const ck = latestKey(op.tenant_id, op.id);
    const cached = await cache.get(ck);
    if (cached) return cached;

    // Scope by tenant explicitly: getLatest is reachable from the event path
    // (no request ALS context → the tenant beforeFind hook is a no-op there), so we
    // never rely on it alone. RLS is the final backstop.
    const where = { trade_operation_id: op.id };
    if (op.tenant_id) where.tenant_id = op.tenant_id;
    const latest = await db.ComplianceScreening.findOne({
        where,
        order: [['created_at', 'DESC']],
    });
    if (latest) {
        const view = toView(latest.report, { record: latest });
        await cache.set(ck, view, LATEST_TTL);
        return view;
    }
    const { view } = await screenOperation(op.id, { trigger: 'api', reason: 'first-read seed', tenantId: op.tenant_id, now });
    return view;
}

/** Paginated screening history (newest first) for an operation. */
async function listHistory(operationId, { page = 1, limit = 20, tenantId = null } = {}) {
    const p = Math.max(1, Number.parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const where = { trade_operation_id: operationId };
    if (tenantId) where.tenant_id = tenantId;
    const { count, rows } = await db.ComplianceScreening.findAndCountAll({
        where, order: [['created_at', 'DESC']], limit: l, offset: (p - 1) * l,
    });
    return { items: rows, total: count, page: p, limit: l, pages: Math.ceil(count / l) || 0 };
}

// ── Event-triggered screening hook (fire-and-forget) ─────────────────────────

/**
 * Best-effort screening for an operation. NEVER throws — it is called from the
 * post-commit path of the workflow engine (entering COMPLIANCE_CHECK), so a
 * screening failure must not roll back or break the transition.
 */
async function triggerScreen(operationId, { trigger = 'workflow_transition', reason = null, actor = 'system', tenantId = null, shipmentId = null } = {}) {
    if (!operationId) return null;
    try {
        return await screenOperation(operationId, { trigger, reason, actor, tenantId, shipmentId });
    } catch (err) {
        // Sanctions screening has regulatory significance — a missed screen must be
        // observable even in production (not just dev). Log structured, no subject PII.
        logger.warn('compliance screening failed', {
            operation_id: operationId,
            trigger,
            code: err && err.code,
            message: err && err.message,
        });
        return null;
    }
}

module.exports = {
    screen,
    screenOperation,
    getLatest,
    listHistory,
    triggerScreen,
    loadReferenceData,
    invalidateReferenceData,
    loadTenantLists,
    subjectFromOperation,
    toView,
    LATEST_NS,
    LATEST_TTL,
    REF_CACHE_KEY,
};

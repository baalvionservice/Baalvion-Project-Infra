'use strict';
/**
 * Canonical Consignment — DB-backed ORCHESTRATOR (Compression, Phase 1).
 *
 * Owns persistence for the single source of truth and its derived paperwork. All
 * normalization, money arithmetic and document generation live in the pure cores
 * (schema.js / derive.js); this file stores, re-derives and reports staleness.
 *
 * LOCKING — once a consignment has been filed with a government gateway its facts
 * are on record with a sovereign authority. Editing it silently would leave the
 * filed declaration and the stored consignment describing different cargo, so a
 * locked consignment rejects updates outright and forces an explicit amendment.
 *
 * LEDGER — creating a consignment plans the Phase 0 stage ledger and closes
 * `order_capture`, so the compression clock starts at the same moment the facts
 * do. Ledger writes are fire-and-forget: measurement must never fail a shipment.
 */

const db = require('../../models');
const schema = require('./schema');
const derive = require('./derive');
const ledger = require('../clearance/ledger');
const { AppError } = require('../../utils/errors');

const plain = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);

/** Denormalized columns kept in step with `canonical` for cheap filtering. */
function projection(canonical) {
    return {
        direction: canonical.direction,
        origin_country: canonical.origin_country,
        destination_country: canonical.destination_country,
        incoterm: canonical.incoterm,
        currency: canonical.currency,
        totals: canonical.totals,
        schema_version: canonical.schema_version,
        source_hash: derive.sourceHash(canonical),
    };
}

async function fetch(id, { tenantId = null } = {}) {
    const where = { id };
    if (tenantId) where.tenant_id = tenantId;
    const row = await db.Consignment.findOne({ where });
    if (!row) throw new AppError('NOT_FOUND', 'Consignment not found', 404);
    return row;
}

/**
 * Create the canonical record, derive the full document set, and start the clock.
 */
async function create(input = {}, { tenantId = null, actor = null, now = new Date() } = {}) {
    const canonical = schema.normalize(input);
    const proj = projection(canonical);

    const row = await db.Consignment.create({
        ...(tenantId ? { tenant_id: tenantId } : {}),
        reference: canonical.reference,
        status: 'active',
        trade_operation_id: input.trade_operation_id || null,
        shipment_id: input.shipment_id || null,
        canonical,
        created_by: actor,
        ...proj,
    });

    await regenerate(row.id, { tenantId, now, consignmentRow: row });

    // Phase 0 clock starts here: the facts exist, so order_capture is done.
    const subject = { subjectType: 'consignment', subjectId: row.id };
    ledger.plan(subject, { tenantId: row.tenant_id, startAt: now, metadata: { created_by: actor } })
        .then(() => ledger.record(subject, 'order_capture', 'close', { tenantId: row.tenant_id, actor, now }))
        .catch(() => null);

    return get(row.id, { tenantId });
}

/**
 * Amend the canonical record. Every derived document is regenerated in the same
 * call — leaving them behind is exactly the drift this phase exists to remove.
 */
async function update(id, patch = {}, { tenantId = null, actor = null, now = new Date() } = {}) {
    const row = await fetch(id, { tenantId });
    if (row.status === 'locked') {
        throw new AppError('CONSIGNMENT_LOCKED',
            'Consignment is locked: it has been filed with a customs gateway. File an amendment instead of editing it.',
            409, { locked_at: row.locked_at });
    }
    if (row.status === 'cancelled') {
        throw new AppError('CONSIGNMENT_CANCELLED', 'Cancelled consignments cannot be amended', 409);
    }

    // Flatten the stored record back to input shape, apply the patch, then
    // re-normalize the WHOLE thing. Patching the normalized output directly would
    // skip the money recomputation and let totals drift from the lines that
    // produced them.
    const canonical = schema.normalize({ ...schema.flattenCanonical(row.canonical || {}), ...patch });
    await row.update({ canonical, ...projection(canonical) });

    await regenerate(row.id, { tenantId, now, consignmentRow: row });
    return get(row.id, { tenantId });
}

/**
 * Re-derive the document set. Upsert by (consignment, doc_type) so regeneration
 * is idempotent and a document never forks into two competing revisions.
 */
async function regenerate(id, { tenantId = null, only = null, now = new Date(), consignmentRow = null } = {}) {
    const row = consignmentRow || await fetch(id, { tenantId });
    const derived = derive.deriveAll(row.canonical, { generatedAt: now, only });

    for (const doc of derived.documents) {
        const where = { consignment_id: row.id, doc_type: doc.doc_type };
        if (row.tenant_id) where.tenant_id = row.tenant_id;
        const existing = await db.ConsignmentDocument.findOne({ where });
        const values = {
            payload: doc.payload,
            source_hash: doc.source_hash,
            content_hash: doc.content_hash,
            deriver_version: doc.deriver_version,
            generated_at: now,
        };
        if (existing) await existing.update(values);
        else await db.ConsignmentDocument.create({ tenant_id: row.tenant_id, consignment_id: row.id, doc_type: doc.doc_type, ...values });
    }
    return derived;
}

/** Freeze the record once it has been filed. Idempotent. */
async function lock(id, { tenantId = null, now = new Date() } = {}) {
    const row = await fetch(id, { tenantId });
    if (row.status === 'locked') return get(row.id, { tenantId });
    await row.update({ status: 'locked', locked_at: now });
    return get(row.id, { tenantId });
}

/**
 * Read the consignment with its documents and an explicit staleness verdict.
 *
 * A stale document is reported, never silently served: handing a caller
 * paperwork that no longer matches the consignment is precisely the failure this
 * whole phase is built to prevent.
 */
async function get(id, { tenantId = null } = {}) {
    const row = await fetch(id, { tenantId });
    const where = { consignment_id: row.id };
    if (row.tenant_id) where.tenant_id = row.tenant_id;
    const docs = (await db.ConsignmentDocument.findAll({ where, order: [['doc_type', 'ASC']] })).map(plain);

    const currentHash = derive.sourceHash(row.canonical);
    const documents = docs.map((d) => ({ ...d, stale: d.source_hash !== currentHash }));
    const missing = derive.DOC_TYPES.filter((t) => !docs.some((d) => d.doc_type === t));

    return {
        consignment: plain(row),
        documents,
        source_hash: currentHash,
        stale_documents: documents.filter((d) => d.stale).map((d) => d.doc_type),
        missing_documents: missing,
        // Regenerating from the canonical record is always safe and always cheap,
        // so a consistency check on the live set costs nothing worth saving.
        consistency: derive.crossCheck(derive.deriveAll(row.canonical)),
    };
}

/** The declaration payload the customs gateway consumes, freshly derived. */
async function declarationFor(id, { tenantId = null } = {}) {
    const row = await fetch(id, { tenantId });
    return derive.deriveOne(row.canonical, 'customs_declaration').payload;
}

async function list({ tenantId = null, status = null, destination = null, page = 1, limit = 20 } = {}) {
    const where = {};
    if (tenantId) where.tenant_id = tenantId;
    if (status) where.status = status;
    if (destination) where.destination_country = String(destination).toUpperCase();
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const { count, rows } = await db.Consignment.findAndCountAll({
        where, limit: l, offset: (p - 1) * l, order: [['created_at', 'DESC']],
    });
    return { items: rows.map(plain), total: count, page: p, limit: l, pages: Math.ceil(count / l) };
}

module.exports = { create, update, regenerate, lock, get, declarationFor, list, fetch };

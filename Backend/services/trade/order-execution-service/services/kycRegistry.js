'use strict';
/**
 * ============================================================================
 * Tenant-bound KYC verification registry — closes the order-gate IDOR.
 * ============================================================================
 * The PLATFORM owns the binding (tenant_id, subject_ref) -> provider_verification_id + status.
 * The order placement gate resolves KYC by the ORDER's tenant + a subject ref — never by a
 * caller-supplied provider id. The Onfido verification id is stored server-side and is never
 * accepted from order placement, so a caller cannot reference another tenant's verification.
 *
 * Every tenant-scoped read/write runs inside runWithTenant({tenantId}) + a transaction, so the
 * RLS GUC bridge (models/index.js) sets app.current_tenant and FORCE RLS filters every row.
 * The webhook path (no tenant) resolves by the server-stored provider id under bypass.
 */
const db = require('../models');
const { runWithTenant } = require('@baalvion/tenancy');

const TERMINAL_STATUSES = Object.freeze(['APPROVED', 'REJECTED']);

// Allowed registry statuses — validated at the write boundary (defense-in-depth ON TOP of the
// DB CHECK constraint) so an out-of-enum provider status can never be persisted.
const ALLOWED_STATUSES = new Set(['NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED', 'REVIEW', 'RESUBMIT']);

// Coerce provider-supplied reasons to a bounded array of strings (or null). Never store an
// arbitrary/oversized structure from the webhook body.
function normalizeReasons(reasons) {
    return Array.isArray(reasons) ? reasons.map(String).slice(0, 50) : null;
}

// Lazy default adapter (the real Onfido provider). Injectable via deps.adapter for tests so
// the registry never touches the network/SDK under unit test.
function defaultAdapter() {
    return require('../integrations/kyc/realAdapter').createRealKycProvider();
}

function adapterOf(deps) {
    return (deps && deps.adapter) || defaultAdapter();
}

/**
 * Start (or reuse) a KYC verification for a tenant's subject. Idempotent: a row that ALREADY holds
 * a provider_verification_id was already submitted to the provider, so it short-circuits with no
 * second provider call (regardless of status). Only a row that never got a provider id — a prior
 * call that threw before the adapter returned — is (re)submitted. Otherwise the adapter starts the
 * run and the (tenant_id, subject_ref) row is upserted with the SERVER-STORED provider verification id.
 *
 * @param {{ tenantId:string, subjectRef:string, subjectType?:string, fullName?:string,
 *           legalName?:string, country?:string, idempotencyKey?:string }} args
 * @param {{ adapter?:object }} [deps]
 * @returns {Promise<object>} the persisted KycVerification row
 */
async function startVerification(args, deps = {}) {
    const { tenantId, subjectRef } = args;
    if (!tenantId) throw new Error('startVerification: tenantId required');
    if (!subjectRef) throw new Error('startVerification: subjectRef required');
    const subjectType = args.subjectType || 'BUSINESS';
    const idempotencyKey = args.idempotencyKey || `kyc-${tenantId}-${subjectRef}`;
    const adapter = adapterOf(deps);

    return runWithTenant({ tenantId }, () =>
        db.sequelize.transaction(async (t) => {
            const existing = await db.KycVerification.findOne({
                where: { tenant_id: tenantId, subject_ref: subjectRef },
                transaction: t,
            });
            // Idempotent: a row that already has a server-stored provider id was already submitted —
            // never call the adapter again (avoids a duplicate KYC run on a PENDING re-entry). Only a
            // row that never got a provider id (prior call threw before the adapter returned) retries.
            if (existing && existing.provider_verification_id) return existing;

            const result = await adapter.startVerification({
                idempotencyKey,
                type: subjectType,
                fullName: args.fullName,
                legalName: args.legalName,
                country: args.country,
                externalRef: subjectRef,
                tenantId,
            });

            await db.KycVerification.upsert({
                tenant_id: tenantId,
                subject_ref: subjectRef,
                subject_type: subjectType,
                provider: adapter.name || 'onfido',
                provider_verification_id: result.id,
                status: result.status,
                reasons: result.reasons || null,
                idempotency_key: idempotencyKey,
                last_checked_at: new Date(),
            }, { transaction: t });

            return db.KycVerification.findOne({
                where: { tenant_id: tenantId, subject_ref: subjectRef },
                transaction: t,
            });
        }));
}

/**
 * Load a tenant's KYC binding for a subject. When refresh is set and the row is non-terminal,
 * the server-stored provider id is re-checked against the adapter and the row is updated.
 *
 * @param {{ tenantId:string, subjectRef:string }} args
 * @param {{ refresh?:boolean, deps?:{ adapter?:object } }} [opts]
 * @returns {Promise<object|null>}
 */
async function getBySubject({ tenantId, subjectRef }, opts = {}) {
    if (!tenantId) throw new Error('getBySubject: tenantId required');
    if (!subjectRef) throw new Error('getBySubject: subjectRef required');
    const refresh = !!opts.refresh;
    const adapter = adapterOf(opts.deps);

    return runWithTenant({ tenantId }, () =>
        db.sequelize.transaction(async (t) => {
            const row = await db.KycVerification.findOne({
                where: { tenant_id: tenantId, subject_ref: subjectRef },
                transaction: t,
            });
            if (!row) return null;
            if (!refresh || !row.provider_verification_id || TERMINAL_STATUSES.includes(row.status)) {
                return row;
            }
            // Re-check the in-flight verification by the SERVER-stored provider id (never caller input).
            const result = await adapter.getResult(row.provider_verification_id, { tenantId });
            // Immutable update — return a new persisted state rather than mutating the row in place.
            return row.update(
                { status: result.status, reasons: result.reasons || null, last_checked_at: new Date() },
                { transaction: t },
            );
        }));
}

/**
 * THE GATE PRIMITIVE. Resolves a tenant's KYC binding for a subject and reports approval.
 *
 * SECURITY: the lookup is `WHERE tenant_id = <order tenant> AND subject_ref = <ref>` — an explicit
 * tenant_id filter (defense-in-depth ON TOP of RLS). It NEVER accepts or looks up by a provider id,
 * so a valid APPROVED verification from another tenant can never satisfy this gate.
 *
 * @param {{ tenantId:string, subjectRef:string }} args
 * @returns {Promise<{ approved:boolean, status:string }>}
 */
async function requireApproved({ tenantId, subjectRef }) {
    if (!tenantId) throw new Error('requireApproved: tenantId required');
    if (!subjectRef) throw new Error('requireApproved: subjectRef required');

    return runWithTenant({ tenantId }, () =>
        db.sequelize.transaction(async (t) => {
            const row = await db.KycVerification.findOne({
                where: { tenant_id: tenantId, subject_ref: subjectRef },
                transaction: t,
            });
            return { approved: row ? row.status === 'APPROVED' : false, status: (row && row.status) || 'NOT_FOUND' };
        }));
}

/**
 * Apply an async provider (Onfido webhook) status update. Resolves the row by the SERVER-STORED
 * provider verification id under tenant bypass (cross-tenant by the internal id WE stored — safe,
 * the id is never caller-supplied). Returns the resolved tenant/subject so the caller can audit.
 *
 * @param {{ providerVerificationId:string, status:string, reasons?:string[] }} args
 * @returns {Promise<{ updated:boolean, tenantId?:string, subjectRef?:string }>}
 */
async function applyWebhookUpdate({ providerVerificationId, status, reasons }) {
    if (!providerVerificationId) throw new Error('applyWebhookUpdate: providerVerificationId required');
    if (!status) throw new Error('applyWebhookUpdate: status required');
    // Validate the incoming status against the allowed enum at the write boundary — do not rely
    // solely on the DB CHECK constraint. An out-of-enum status is dropped without a write.
    if (!ALLOWED_STATUSES.has(status)) return { updated: false };

    return runWithTenant({ tenantId: null, bypass: true }, () =>
        db.sequelize.transaction(async (t) => {
            const row = await db.KycVerification.findOne({
                where: { provider_verification_id: providerVerificationId },
                transaction: t,
            });
            if (!row) return { updated: false };
            // Do not regress a terminal decision on replay / out-of-order delivery: a row already
            // APPROVED/REJECTED is never moved back to a non-terminal status. Terminal->terminal and
            // non-terminal->anything still proceed.
            if (TERMINAL_STATUSES.includes(row.status) && !TERMINAL_STATUSES.includes(status)) {
                return { updated: false, tenantId: row.tenant_id, subjectRef: row.subject_ref };
            }
            // Immutable update with a structurally-guarded reasons value.
            await row.update(
                { status, reasons: normalizeReasons(reasons), last_checked_at: new Date() },
                { transaction: t },
            );
            return { updated: true, tenantId: row.tenant_id, subjectRef: row.subject_ref };
        }));
}

module.exports = { startVerification, getBySubject, requireApproved, applyWebhookUpdate, TERMINAL_STATUSES };

'use strict';
/**
 * ============================================================================
 * Onfido (API v3.6) — real KYC/IDV provider client.
 * ============================================================================
 * Thin, auditable client over the shared httpClient. Maps Onfido's resources to
 * the KYC contract (contract.js). PII (names) is sent to Onfido but NEVER logged
 * here — the shared httpClient deliberately never logs bodies.
 *
 * Flow (Onfido Studio workflow, the modern path):
 *   1. POST /applicants            -> applicant id
 *   2. POST /workflow_runs         -> workflow run id  (== our KycResult.id)
 *   3. GET  /workflow_runs/:id     -> poll/resolve status
 * The workflow run is async: initial status is normally PENDING. The decision
 * arrives later via getResult() polling or a webhook callback.
 *
 * Legacy path (when no ONFIDO_WORKFLOW_ID is configured): /checks.
 *
 * Config (env / secret manager — NEVER hardcode):
 *   ONFIDO_API_TOKEN     required. Auth: `Authorization: Token token=<TOKEN>`.
 *   ONFIDO_REGION        eu | us | ca  (default eu). Selects the API base host.
 *   ONFIDO_WORKFLOW_ID   Onfido Studio workflow id (modern path).
 *   ONFIDO_WEBHOOK_TOKEN HMAC-SHA256 key for X-SHA2-Signature on callbacks.
 */
const { request, IntegrationTimeoutError } = require('../../_shared/httpClient');
const { KYC_STATUS } = require('../contract');

/** Region -> API base. Onfido hosts data per residency region. */
const REGION_BASE = Object.freeze({
    eu: 'https://api.eu.onfido.com/v3.6',
    us: 'https://api.us.onfido.com/v3.6',
    ca: 'https://api.ca.onfido.com/v3.6',
});

/**
 * Onfido workflow-run status -> KYC_STATUS. FAIL-CLOSED: only the explicit
 * `approved` terminal maps to APPROVED. Anything unrecognised maps to REVIEW
 * (human adjudication), never APPROVED.
 */
const WORKFLOW_STATUS_MAP = Object.freeze({
    awaiting_input: KYC_STATUS.PENDING,
    processing: KYC_STATUS.PENDING,
    approved: KYC_STATUS.APPROVED,
    declined: KYC_STATUS.REJECTED,
    review: KYC_STATUS.REVIEW,
    manual: KYC_STATUS.REVIEW, // some workflow tasks surface a manual-review state
    abandoned: KYC_STATUS.RESUBMIT,
    error: KYC_STATUS.REVIEW,
});

/**
 * Legacy /checks result -> KYC_STATUS (only used when no workflow id is set).
 * `clear` -> APPROVED, `consider` -> REVIEW (a human must look), others REVIEW.
 */
const CHECK_RESULT_MAP = Object.freeze({
    clear: KYC_STATUS.APPROVED,
    consider: KYC_STATUS.REVIEW,
    unidentified: KYC_STATUS.REVIEW,
});

/** Map an Onfido workflow-run status string -> KYC_STATUS (fail-closed). */
function mapWorkflowStatus(status) {
    const key = String(status || '').toLowerCase();
    return WORKFLOW_STATUS_MAP[key] || KYC_STATUS.REVIEW;
}

/** Map a legacy /checks result string -> KYC_STATUS. `null` (in-flight) -> PENDING. */
function mapCheckResult(result, status) {
    if (status && String(status).toLowerCase() === 'in_progress') return KYC_STATUS.PENDING;
    if (result == null) return KYC_STATUS.PENDING;
    const key = String(result).toLowerCase();
    return CHECK_RESULT_MAP[key] || KYC_STATUS.REVIEW;
}

/** Pull reason codes out of a workflow-run `output`/`reasons` blob, if present. */
function extractReasons(body) {
    if (!body || typeof body !== 'object') return undefined;
    const out = body.output || {};
    const raw = body.reasons || out.reasons || out.reason || out.decline_reasons;
    if (raw == null) return undefined;
    const arr = Array.isArray(raw) ? raw : [raw];
    const reasons = arr.map((r) => String(r)).filter(Boolean);
    return reasons.length ? reasons : undefined;
}

/**
 * Split a subject into Onfido first_name / last_name. Onfido requires both for
 * an applicant. For BUSINESS subjects there is no person name, so we use the
 * legal name as last_name and a stable placeholder first_name (Onfido rejects
 * empty names). The real KYB document/biometric checks run in the workflow.
 */
function nameFields(subject) {
    const full = String(subject.fullName || '').trim();
    if (full) {
        const parts = full.split(/\s+/);
        if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] };
        return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
    }
    const legal = String(subject.legalName || '').trim();
    if (legal) return { first_name: legal.split(/\s+/)[0], last_name: legal };
    // Last resort: never send empty — Onfido 422s. Use the external ref / type.
    const ref = String(subject.externalRef || subject.type || 'Counterparty').trim();
    return { first_name: ref, last_name: ref };
}

/**
 * Build the Onfido provider.
 * @param {Object} args
 * @param {string} args.apiToken            ONFIDO_API_TOKEN (required)
 * @param {string} [args.region='eu']       ONFIDO_REGION
 * @param {string} [args.workflowId]        ONFIDO_WORKFLOW_ID (modern path)
 * @param {string} [args.webhookToken]      ONFIDO_WEBHOOK_TOKEN
 * @param {typeof fetch} [args.fetchImpl]   injectable fetch (tests)
 * @param {Function} [args.httpRequest]     injectable request() (tests)
 */
function createOnfidoProvider(args = {}) {
    const {
        apiToken,
        region = 'eu',
        workflowId,
        webhookToken,
        fetchImpl,
        httpRequest = request,
    } = args;

    if (!apiToken) throw new Error('createOnfidoProvider: apiToken is required');
    const base = REGION_BASE[String(region).toLowerCase()] || REGION_BASE.eu;
    const useWorkflow = Boolean(workflowId);

    function headers(idempotencyKey) {
        const h = {
            Authorization: `Token token=${apiToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };
        if (idempotencyKey) h['Idempotency-Key'] = idempotencyKey;
        return h;
    }

    async function post(path, payload, idempotencyKey) {
        return httpRequest({
            url: `${base}${path}`,
            method: 'POST',
            headers: headers(idempotencyKey),
            body: JSON.stringify(payload),
            fetchImpl,
            // POSTs are NOT auto-retried by default (httpClient retries=0) so an
            // idempotency-protected create is never blindly re-sent on timeout.
        });
    }

    async function get(path) {
        return httpRequest({
            url: `${base}${path}`,
            method: 'GET',
            headers: headers(),
            fetchImpl,
            retries: 2, // GETs are safe to retry on 429/5xx/timeout
        });
    }

    /**
     * Create the applicant + start the verification. Returns the verification id
     * (workflow run id, or legacy check id) plus initial mapped status.
     * @param {import('../contract').KycSubject} subject
     * @returns {Promise<import('../contract').KycResult>}
     */
    async function startVerification(subject) {
        const applicantRes = await post('/applicants', nameFields(subject), subject.idempotencyKey);
        const applicantId = applicantRes.json && applicantRes.json.id;
        if (!applicantId) {
            const err = new Error('Onfido: applicant create returned no id');
            err.code = 'ONFIDO_NO_APPLICANT_ID';
            throw err;
        }

        if (useWorkflow) {
            const runRes = await post(
                '/workflow_runs',
                { workflow_id: workflowId, applicant_id: applicantId },
                subject.idempotencyKey,
            );
            const body = runRes.json || {};
            if (!body.id) {
                const err = new Error('Onfido: workflow_run returned no id');
                err.code = 'ONFIDO_NO_RUN_ID';
                throw err;
            }
            return toResult(subject.idempotencyKey, body, applicantId, /* legacy */ false);
        }

        // Legacy path: a /checks run on the applicant.
        const checkRes = await post(
            '/checks',
            { applicant_id: applicantId, report_names: ['document', 'facial_similarity_photo'] },
            subject.idempotencyKey,
        );
        const body = checkRes.json || {};
        if (!body.id) {
            const err = new Error('Onfido: check returned no id');
            err.code = 'ONFIDO_NO_CHECK_ID';
            throw err;
        }
        return toResult(subject.idempotencyKey, body, applicantId, /* legacy */ true);
    }

    /**
     * Resolve the current decision for a verification id.
     * @param {string} id   workflow run id (or legacy check id)
     * @param {{ idempotencyKey?: string, legacy?: boolean }} [opts]
     * @returns {Promise<import('../contract').KycResult>}
     */
    async function getResult(id, opts = {}) {
        if (!id) {
            const err = new Error('Onfido getResult: id is required');
            err.code = 'ONFIDO_NO_ID';
            throw err;
        }
        const legacy = opts.legacy != null ? opts.legacy : !useWorkflow;
        // Encode the caller-derived id into the path so a value like '../x' or
        // 'a/b' can't alter the request path (path-traversal / SSRF safety).
        const safeId = encodeURIComponent(id);
        const path = legacy ? `/checks/${safeId}` : `/workflow_runs/${safeId}`;
        const res = await get(path);
        const body = res.json || {};
        return toResult(opts.idempotencyKey, body, body.applicant_id, legacy);
    }

    /** Shape an Onfido resource body into a KycResult. */
    function toResult(idempotencyKey, body, applicantId, legacy) {
        const status = legacy
            ? mapCheckResult(body.result, body.status)
            : mapWorkflowStatus(body.status);
        const result = {
            id: body.id,
            idempotencyKey: idempotencyKey || undefined,
            status,
            providerRef: applicantId || (body.applicant_id ?? undefined),
        };
        const reasons = extractReasons(body);
        if (reasons) result.reasons = reasons;
        return result;
    }

    return {
        startVerification,
        getResult,
        // exposed for the adapter + tests
        useWorkflow,
        base,
        webhookToken,
        _maps: { mapWorkflowStatus, mapCheckResult },
    };
}

module.exports = {
    createOnfidoProvider,
    mapWorkflowStatus,
    mapCheckResult,
    REGION_BASE,
    WORKFLOW_STATUS_MAP,
    CHECK_RESULT_MAP,
    IntegrationTimeoutError,
};

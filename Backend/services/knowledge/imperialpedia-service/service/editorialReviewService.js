'use strict';
/**
 * PROMPT 5 — Human-Vetted Publishing Workflow.
 *
 * Pure validation/derivation helpers behind the editorial-review-approve flow. This module
 * never computes an editorial audit itself (that's editorialAuditService.js, reused here via
 * HUMAN_REVIEW_CHECKLIST + contentFingerprint — no second checklist, no second fingerprint
 * algorithm) and never talks to the DB — the controller owns persistence so these functions
 * stay unit-testable without a DB connection, matching editorialAuditService.test.js's style.
 *
 * Trust model: reviewedFingerprint/auditStatusAtReview/criticalCount/etc. are a client echo of
 * a PRIOR server response (POST /ai/full-editorial-audit) — same pattern already established
 * for externalOriginality/claimResearch in editorialAuditService.js. The one field that is
 * SECURITY-load-bearing is reviewedFingerprint, and it is never trusted on its own: the
 * controller always recomputes the article's CURRENT fingerprint from the DB row and rejects
 * the approval if they don't match (spec §8/§21). A reviewer who understates criticalCount only
 * weakens their own acknowledgement prompt, never the article's actual audit result or the
 * fingerprint check — the same bar as the existing external-echo fields.
 */

const { HUMAN_REVIEW_CHECKLIST, contentFingerprint } = require('./editorialAuditService');

const CHECKLIST_IDS = HUMAN_REVIEW_CHECKLIST.map((i) => i.id);
const REVIEWER_NOTE_MAX_LEN = 2000;
const FINGERPRINT_MAX_LEN = 32;
const AUDIT_STATUS_MAX_LEN = 50;
const MAX_COUNT = 9999;

/** Only known checklist ids survive; every value is coerced to a strict boolean. Anything else
 *  the client sends (extra keys, non-boolean values) is dropped rather than trusted. */
function sanitizeChecklistState(raw) {
    const state = {};
    if (raw && typeof raw === 'object') {
        for (const id of CHECKLIST_IDS) state[id] = raw[id] === true;
    } else {
        for (const id of CHECKLIST_IDS) state[id] = false;
    }
    return state;
}

function checklistIsComplete(checklistState) {
    return CHECKLIST_IDS.every((id) => checklistState[id] === true);
}

function sanitizeReviewerNote(raw) {
    if (raw === undefined || raw === null) return null;
    const cleaned = String(raw).replace(/\x00/g, '').trim().slice(0, REVIEWER_NOTE_MAX_LEN);
    return cleaned || null;
}

function isNonNegativeInt(v) {
    return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= MAX_COUNT;
}

/**
 * Validates the body of POST /articles/:id/editorial-review/approve. Returns
 * { ok: true, value } or { ok: false, error }. reviewerId/articleId are NEVER read from the
 * body — the controller derives those from authenticated request context and the route param.
 */
function validateApprovalInput(body) {
    body = body && typeof body === 'object' ? body : {};

    const reviewedFingerprint = typeof body.reviewedFingerprint === 'string'
        ? body.reviewedFingerprint.trim().slice(0, FINGERPRINT_MAX_LEN)
        : '';
    if (!reviewedFingerprint) {
        return { ok: false, error: 'reviewedFingerprint is required — run the full editorial audit first.' };
    }

    const auditStatusAtReview = typeof body.auditStatusAtReview === 'string'
        ? body.auditStatusAtReview.slice(0, AUDIT_STATUS_MAX_LEN)
        : null;

    const criticalCount = isNonNegativeInt(body.criticalCount) ? body.criticalCount : 0;
    const warningCount = isNonNegativeInt(body.warningCount) ? body.warningCount : 0;
    const suggestionCount = isNonNegativeInt(body.suggestionCount) ? body.suggestionCount : 0;

    const checklistState = sanitizeChecklistState(body.checklistState);
    if (!checklistIsComplete(checklistState)) {
        return { ok: false, error: 'Every human review checklist item must be completed before approval.' };
    }

    const acknowledgedCritical = body.acknowledgedCritical === true;
    if (criticalCount > 0 && !acknowledgedCritical) {
        return { ok: false, error: 'Critical editorial issues remain. Confirm that you reviewed them before approving.' };
    }

    const reviewerNote = sanitizeReviewerNote(body.reviewerNote);

    return {
        ok: true,
        value: {
            reviewedFingerprint, auditStatusAtReview, criticalCount, warningCount, suggestionCount,
            checklistState, acknowledgedCritical, reviewerNote,
        },
    };
}

/**
 * Derives the review status shown in the UI from the latest persisted review row (or null) and
 * the article's CURRENT fingerprint. Intentionally the smallest useful state model (spec §25):
 * REVIEW_IN_PROGRESS is a frontend-only, session-local concept (checklist partially ticked but
 * not yet submitted) and is never persisted or returned here.
 */
function deriveReviewStatus(latestReview, currentFingerprint) {
    if (!latestReview || !latestReview.approved_for_publication) return 'NOT_REVIEWED';
    return latestReview.reviewed_fingerprint === currentFingerprint ? 'APPROVED' : 'STALE';
}

module.exports = {
    CHECKLIST_IDS,
    sanitizeChecklistState,
    checklistIsComplete,
    sanitizeReviewerNote,
    validateApprovalInput,
    deriveReviewStatus,
    contentFingerprint,
};

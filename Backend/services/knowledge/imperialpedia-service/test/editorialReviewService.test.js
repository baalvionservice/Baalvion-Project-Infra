'use strict';

// Pure-logic tests for the Prompt 5 approval-validation/staleness layer — no DB, no network.
// Mirrors editorialAuditService.test.js's style.

const test = require('node:test');
const assert = require('node:assert/strict');

const svc = require('../service/editorialReviewService');
const { HUMAN_REVIEW_CHECKLIST } = require('../service/editorialAuditService');

function completeChecklist(overrides = {}) {
    const state = {};
    for (const item of HUMAN_REVIEW_CHECKLIST) state[item.id] = true;
    return { ...state, ...overrides };
}

function validApprovalBody(overrides = {}) {
    return {
        reviewedFingerprint: 'abc123',
        auditStatusAtReview: 'READY_FOR_HUMAN_REVIEW',
        criticalCount: 0,
        warningCount: 1,
        suggestionCount: 2,
        checklistState: completeChecklist(),
        acknowledgedCritical: false,
        reviewerNote: 'Looks good.',
        ...overrides,
    };
}

// ---- checklist sanitization ----

test('sanitizeChecklistState only keeps known ids and coerces to strict booleans', () => {
    const result = svc.sanitizeChecklistState({ claims: true, sources: 'yes', bogus: true });
    assert.equal(result.claims, true);
    assert.equal(result.sources, false); // non-boolean is NOT truthy-coerced
    assert.ok(!('bogus' in result));
    assert.equal(Object.keys(result).length, HUMAN_REVIEW_CHECKLIST.length);
});

test('sanitizeChecklistState defaults every item to false for non-object input', () => {
    const result = svc.sanitizeChecklistState(null);
    assert.ok(Object.values(result).every((v) => v === false));
});

test('checklistIsComplete requires every checklist item true', () => {
    const full = svc.sanitizeChecklistState(completeChecklist());
    assert.equal(svc.checklistIsComplete(full), true);
    const partial = svc.sanitizeChecklistState(completeChecklist({ proofread: false }));
    assert.equal(svc.checklistIsComplete(partial), false);
});

// ---- validateApprovalInput ----

test('validateApprovalInput accepts a well-formed, fully-checked approval', () => {
    const result = svc.validateApprovalInput(validApprovalBody());
    assert.equal(result.ok, true);
    assert.equal(result.value.reviewedFingerprint, 'abc123');
    assert.equal(result.value.reviewerNote, 'Looks good.');
});

test('validateApprovalInput rejects a missing reviewedFingerprint', () => {
    const result = svc.validateApprovalInput(validApprovalBody({ reviewedFingerprint: '' }));
    assert.equal(result.ok, false);
    assert.match(result.error, /reviewedFingerprint/);
});

test('validateApprovalInput rejects an incomplete checklist', () => {
    const result = svc.validateApprovalInput(validApprovalBody({ checklistState: completeChecklist({ claims: false }) }));
    assert.equal(result.ok, false);
    assert.match(result.error, /checklist/i);
});

test('validateApprovalInput requires explicit critical acknowledgement when criticalCount > 0', () => {
    const withoutAck = svc.validateApprovalInput(validApprovalBody({ criticalCount: 2, acknowledgedCritical: false }));
    assert.equal(withoutAck.ok, false);
    assert.match(withoutAck.error, /Critical editorial issues remain/);

    const withAck = svc.validateApprovalInput(validApprovalBody({ criticalCount: 2, acknowledgedCritical: true }));
    assert.equal(withAck.ok, true);
    assert.equal(withAck.value.criticalCount, 2);
});

test('validateApprovalInput never reads a reviewer/article id from the body (no such fields exist on the output)', () => {
    const result = svc.validateApprovalInput(validApprovalBody({ reviewerId: 999, reviewer_user_id: 999, articleId: 1 }));
    assert.equal(result.ok, true);
    assert.ok(!('reviewerId' in result.value));
    assert.ok(!('reviewer_user_id' in result.value));
});

test('validateApprovalInput caps reviewerNote length and strips null bytes', () => {
    const long = 'x'.repeat(5000);
    const result = svc.validateApprovalInput(validApprovalBody({ reviewerNote: `\x00${long}` }));
    assert.equal(result.ok, true);
    assert.ok(result.value.reviewerNote.length <= 2000);
    assert.ok(!result.value.reviewerNote.includes('\x00'));
});

test('validateApprovalInput clamps out-of-range counts to a safe default rather than trusting them blindly', () => {
    const result = svc.validateApprovalInput(validApprovalBody({ criticalCount: -5 }));
    assert.equal(result.ok, true);
    assert.equal(result.value.criticalCount, 0);
});

// ---- deriveReviewStatus ----

test('deriveReviewStatus returns NOT_REVIEWED when there is no review row', () => {
    assert.equal(svc.deriveReviewStatus(null, 'fp1'), 'NOT_REVIEWED');
});

test('deriveReviewStatus returns NOT_REVIEWED when the latest row was never approved', () => {
    assert.equal(svc.deriveReviewStatus({ approved_for_publication: false, reviewed_fingerprint: 'fp1' }, 'fp1'), 'NOT_REVIEWED');
});

test('deriveReviewStatus returns APPROVED when the reviewed fingerprint matches the current one', () => {
    assert.equal(svc.deriveReviewStatus({ approved_for_publication: true, reviewed_fingerprint: 'fp1' }, 'fp1'), 'APPROVED');
});

test('deriveReviewStatus returns STALE when the article changed since the approved review', () => {
    assert.equal(svc.deriveReviewStatus({ approved_for_publication: true, reviewed_fingerprint: 'fp-old' }, 'fp-new'), 'STALE');
});

// ---- fingerprint reuse (no second algorithm) ----

test('editorialReviewService re-exports the SAME contentFingerprint as editorialAuditService (no duplicate algorithm)', () => {
    const audit = require('../service/editorialAuditService');
    assert.equal(svc.contentFingerprint, audit.contentFingerprint);
});

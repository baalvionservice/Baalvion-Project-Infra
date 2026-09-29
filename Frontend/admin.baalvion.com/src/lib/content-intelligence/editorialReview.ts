// Pure presentation-logic helpers behind the "HUMAN EDITORIAL REVIEW" section of
// ContentIntelligencePanel.tsx (Prompt 5). Like editorialAudit.ts, this module never computes a
// review decision itself — the backend (editorialReviewController.js /
// editorialReviewService.js) is authoritative for approval and staleness. This only formats
// what the server returned and derives the one purely-local, never-persisted state
// (REVIEW_IN_PROGRESS) from the in-session checklist.

export type ServerReviewStatus = 'NOT_REVIEWED' | 'APPROVED' | 'STALE';
export type ReviewUiStatus = ServerReviewStatus | 'REVIEW_IN_PROGRESS';

export interface EditorialReviewRecord {
  id: string;
  reviewerUserId: number;
  reviewedFingerprint: string;
  auditStatusAtReview: string | null;
  criticalCount: number;
  warningCount: number;
  suggestionCount: number;
  checklistState: Record<string, boolean>;
  reviewerNote: string | null;
  acknowledgedCritical: boolean;
  approvedForPublication: boolean;
  approvedAt: string | null;
  createdAt: string;
}

export interface EditorialReviewState {
  status: ServerReviewStatus;
  currentFingerprint: string;
  review: EditorialReviewRecord | null;
}

/**
 * Combines the server-derived status with the local, session-only checklist progress. The
 * server never sees "in progress" — it only ever sees NOT_REVIEWED (nothing approved yet) or
 * APPROVED/STALE (something was approved at some point). REVIEW_IN_PROGRESS exists purely so the
 * UI can say "you've started" before the reviewer submits an approval (spec §30-B).
 */
export function deriveUiStatus(serverStatus: ServerReviewStatus, checkedCount: number, checklistLength: number): ReviewUiStatus {
  if (serverStatus !== 'NOT_REVIEWED') return serverStatus;
  return checkedCount > 0 && checklistLength > 0 ? 'REVIEW_IN_PROGRESS' : 'NOT_REVIEWED';
}

const STATUS_LABEL: Record<ReviewUiStatus, string> = {
  NOT_REVIEWED: 'Not reviewed',
  REVIEW_IN_PROGRESS: 'Review in progress',
  APPROVED: 'Approved for publication',
  STALE: 'Review is stale',
};

export function reviewStatusLabel(status: ReviewUiStatus): string {
  return STATUS_LABEL[status] || status;
}

export function reviewStatusSeverity(status: ReviewUiStatus): 'ok' | 'warn' | 'critical' | 'todo' {
  if (status === 'APPROVED') return 'ok';
  if (status === 'STALE') return 'critical';
  if (status === 'REVIEW_IN_PROGRESS') return 'warn';
  return 'todo';
}

/** The exact UX-state sentences from spec §30 — never claims success the server hasn't confirmed. */
export function reviewStatusExplanation(status: ReviewUiStatus): string {
  switch (status) {
    case 'NOT_REVIEWED':
      return 'Human review has not been completed.';
    case 'REVIEW_IN_PROGRESS':
      return 'Complete the editorial checklist before approval.';
    case 'APPROVED':
      return 'Approved for publication by the reviewer below. This reflects the article version at the time of approval.';
    case 'STALE':
      return 'Article content changed after human approval. New review required.';
    default:
      return '';
  }
}

/** True once every checklist item is checked — the ONLY gate on enabling the approval action
 *  that this module concerns itself with; fingerprint/critical-ack gating is handled separately
 *  (see canApprove below) so each condition stays independently testable. */
export function isChecklistComplete(checkedIds: ReadonlySet<string>, allIds: readonly string[]): boolean {
  return allIds.length > 0 && allIds.every((id) => checkedIds.has(id));
}

export interface CanApproveInput {
  checklistComplete: boolean;
  /** The audit that produced the counts/fingerprint being submitted is itself stale relative to
   *  the current draft (title/content edited since that audit ran). */
  auditStale: boolean;
  criticalCount: number;
  acknowledgedCritical: boolean;
  hasArticleId: boolean;
}

/** Mirrors the backend's own gating (editorialReviewService.validateApprovalInput) so the
 *  frontend never shows an enabled button the server would reject — but the server call is
 *  still the only thing that actually records an approval (spec §14/§29). */
export function canApprove(input: CanApproveInput): boolean {
  if (!input.hasArticleId) return false;
  if (!input.checklistComplete) return false;
  if (input.auditStale) return false;
  if (input.criticalCount > 0 && !input.acknowledgedCritical) return false;
  return true;
}

export type ApproveReviewState = 'idle' | 'pending' | 'success' | 'error';

export function approveButtonLabel(state: ApproveReviewState): string {
  if (state === 'pending') return 'Approving…';
  if (state === 'error') return 'Retry Approval';
  return 'Approve for Publication';
}

/** Short, display-friendly fingerprint — never used for the actual staleness comparison (that's
 *  a strict string equality against the full value), only for the "Article version: …" line. */
export function shortFingerprint(fingerprint: string | null | undefined): string {
  if (!fingerprint) return '—';
  return fingerprint.slice(0, 8);
}

export function reviewerDisplayName(reviewerUserId: number, currentUserId: number | null | undefined, currentUserName: string | null | undefined): string {
  if (currentUserId != null && reviewerUserId === currentUserId) {
    return currentUserName ? `${currentUserName} (you)` : 'You';
  }
  return `User #${reviewerUserId}`;
}

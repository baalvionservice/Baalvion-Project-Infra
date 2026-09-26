import { describe, it, expect } from 'vitest';
import {
  deriveUiStatus,
  reviewStatusLabel,
  reviewStatusSeverity,
  reviewStatusExplanation,
  isChecklistComplete,
  canApprove,
  approveButtonLabel,
  shortFingerprint,
  reviewerDisplayName,
  type ReviewUiStatus,
} from './editorialReview';

describe('deriveUiStatus', () => {
  it('passes through APPROVED and STALE from the server untouched', () => {
    expect(deriveUiStatus('APPROVED', 0, 10)).toBe('APPROVED');
    expect(deriveUiStatus('STALE', 0, 10)).toBe('STALE');
  });

  it('shows NOT_REVIEWED when nothing has been checked yet', () => {
    expect(deriveUiStatus('NOT_REVIEWED', 0, 10)).toBe('NOT_REVIEWED');
  });

  it('shows REVIEW_IN_PROGRESS once at least one checklist item is checked, purely client-side', () => {
    expect(deriveUiStatus('NOT_REVIEWED', 1, 10)).toBe('REVIEW_IN_PROGRESS');
  });
});

describe('reviewStatusLabel / severity / explanation', () => {
  it('labels every UI status distinctly', () => {
    const statuses: ReviewUiStatus[] = ['NOT_REVIEWED', 'REVIEW_IN_PROGRESS', 'APPROVED', 'STALE'];
    const labels = statuses.map(reviewStatusLabel);
    expect(new Set(labels).size).toBe(statuses.length);
  });

  it('maps APPROVED to ok and STALE to critical', () => {
    expect(reviewStatusSeverity('APPROVED')).toBe('ok');
    expect(reviewStatusSeverity('STALE')).toBe('critical');
    expect(reviewStatusSeverity('NOT_REVIEWED')).toBe('todo');
    expect(reviewStatusSeverity('REVIEW_IN_PROGRESS')).toBe('warn');
  });

  it('never claims success or a quality guarantee for APPROVED — only that a reviewer approved it', () => {
    const text = reviewStatusExplanation('APPROVED').toLowerCase();
    expect(text).not.toMatch(/100%|guarantee|plagiarism-free|ai-free|verified/);
  });

  it('gives every status a non-empty explanation', () => {
    const statuses: ReviewUiStatus[] = ['NOT_REVIEWED', 'REVIEW_IN_PROGRESS', 'APPROVED', 'STALE'];
    for (const s of statuses) expect(reviewStatusExplanation(s).length).toBeGreaterThan(0);
  });
});

describe('isChecklistComplete', () => {
  const ALL = ['a', 'b', 'c'];

  it('is false when empty', () => {
    expect(isChecklistComplete(new Set(), ALL)).toBe(false);
  });

  it('is false when partially checked', () => {
    expect(isChecklistComplete(new Set(['a', 'b']), ALL)).toBe(false);
  });

  it('is true only when every id is checked', () => {
    expect(isChecklistComplete(new Set(['a', 'b', 'c']), ALL)).toBe(true);
  });

  it('is false for an empty checklist definition (never auto-true)', () => {
    expect(isChecklistComplete(new Set(), [])).toBe(false);
  });
});

describe('canApprove', () => {
  const base = { checklistComplete: true, auditStale: false, criticalCount: 0, acknowledgedCritical: false, hasArticleId: true };

  it('allows approval when checklist complete, audit fresh, and no criticals', () => {
    expect(canApprove(base)).toBe(true);
  });

  it('blocks approval when the checklist is incomplete', () => {
    expect(canApprove({ ...base, checklistComplete: false })).toBe(false);
  });

  it('blocks approval when the audit is stale relative to the current draft', () => {
    expect(canApprove({ ...base, auditStale: true })).toBe(false);
  });

  it('blocks approval when critical issues remain and are not acknowledged', () => {
    expect(canApprove({ ...base, criticalCount: 2, acknowledgedCritical: false })).toBe(false);
  });

  it('allows approval when critical issues remain but were explicitly acknowledged', () => {
    expect(canApprove({ ...base, criticalCount: 2, acknowledgedCritical: true })).toBe(true);
  });

  it('blocks approval when the article has never been saved (no id yet)', () => {
    expect(canApprove({ ...base, hasArticleId: false })).toBe(false);
  });
});

describe('approveButtonLabel', () => {
  it('gives every state a distinct label', () => {
    const labels = (['idle', 'pending', 'success', 'error'] as const).map(approveButtonLabel);
    expect(new Set(labels).size).toBeGreaterThanOrEqual(3);
  });
});

describe('shortFingerprint', () => {
  it('truncates to 8 chars', () => {
    expect(shortFingerprint('abcdef1234567890')).toBe('abcdef12');
  });

  it('handles missing input without throwing', () => {
    expect(shortFingerprint(null)).toBe('—');
    expect(shortFingerprint(undefined)).toBe('—');
    expect(shortFingerprint('')).toBe('—');
  });
});

describe('reviewerDisplayName', () => {
  it('marks the current user as "(you)"', () => {
    expect(reviewerDisplayName(42, 42, 'Ada Lovelace')).toBe('Ada Lovelace (you)');
  });

  it('falls back to "You" when the current user has no display name', () => {
    expect(reviewerDisplayName(42, 42, null)).toBe('You');
  });

  it('shows a generic id for another reviewer', () => {
    expect(reviewerDisplayName(7, 42, 'Ada Lovelace')).toBe('User #7');
  });

  it('shows a generic id when the current user is unknown', () => {
    expect(reviewerDisplayName(7, null, null)).toBe('User #7');
  });
});

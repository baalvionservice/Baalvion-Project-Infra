// Pure presentation-logic helpers behind the "FULL EDITORIAL AUDIT" section of
// ContentIntelligencePanel.tsx (Prompt 4). Kept separate — like locate.ts / originality.ts /
// factSource.ts — so they're unit-testable without a DOM harness.
//
// This module never computes an audit itself (that's the backend's editorialAuditService.js,
// which aggregates Prompts 1-3's already-computed results). It only formats what the backend
// returned, tracks the transient "is this audit stale?" comparison, and never invents a
// guarantee ("100% original", "AdSense approved", etc.) that the backend didn't state.

export type AuditStatus = 'READY_FOR_HUMAN_REVIEW' | 'REVIEW_RECOMMENDED' | 'REVISION_RECOMMENDED' | 'CRITICAL_REVIEW_REQUIRED' | 'NOT_ENOUGH_CONTENT';

export interface AuditIssue {
  category: string;
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
  title: string;
  message: string;
  source: string;
  location: string | null;
  actionable: boolean;
  resolved: boolean;
}

export interface AuditCategory {
  key: string;
  label: string;
  status: 'ok' | 'warn' | 'critical';
  issueCount: number;
  criticalCount: number;
  warningCount: number;
  suggestionCount: number;
  issues: AuditIssue[];
}

export interface HumanReviewChecklistItem { id: string; label: string }

export interface FullEditorialAudit {
  status: AuditStatus;
  generatedAt: string;
  contentFingerprint: string;
  summary: { critical: number; warnings: number; suggestions: number };
  categories: AuditCategory[];
  humanReviewChecklist: HumanReviewChecklistItem[];
  qualitySummary: string;
  externalVerification: { originality: string; research: string };
  articleSummary: Record<string, unknown> | null;
}

/** Dependency-free string hash (djb2) — MUST match the backend's editorialAuditService.js
 *  contentFingerprint() byte-for-byte, since it's compared directly against the server's
 *  fingerprint to detect staleness without re-sending or storing the full article text. */
export function contentFingerprint(title: string, content: string): string {
  const input = `${title || ''}\u0000${content || ''}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = ((hash * 33) ^ input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

const STATUS_LABEL: Record<AuditStatus, string> = {
  READY_FOR_HUMAN_REVIEW: 'Ready for Human Review',
  REVIEW_RECOMMENDED: 'Review Recommended',
  REVISION_RECOMMENDED: 'Revision Recommended',
  CRITICAL_REVIEW_REQUIRED: 'Critical Review Required',
  NOT_ENOUGH_CONTENT: 'Not Enough Content',
};

export function statusLabel(status: AuditStatus): string {
  return STATUS_LABEL[status] || status;
}

export function statusSeverity(status: AuditStatus): 'ok' | 'warn' | 'critical' | 'todo' {
  if (status === 'READY_FOR_HUMAN_REVIEW') return 'ok';
  if (status === 'CRITICAL_REVIEW_REQUIRED') return 'critical';
  if (status === 'NOT_ENOUGH_CONTENT') return 'todo';
  return 'warn'; // REVIEW_RECOMMENDED | REVISION_RECOMMENDED
}

/**
 * "Automated editorial checks currently show no major unresolved issue" — the ONLY sentence
 * this module ever uses to explain READY_FOR_HUMAN_REVIEW. Never "perfect", never "100% human",
 * never a publication guarantee (spec §9/§28).
 */
export function statusExplanation(status: AuditStatus): string {
  switch (status) {
    case 'NOT_ENOUGH_CONTENT':
      return 'Add more content before a full editorial audit can run.';
    case 'CRITICAL_REVIEW_REQUIRED':
      return 'One or more critical issues need human attention before this article is ready for review.';
    case 'REVISION_RECOMMENDED':
      return 'Several significant issues were found — revision is recommended before human review.';
    case 'REVIEW_RECOMMENDED':
      return 'Minor issues were found — human review is recommended before publication.';
    case 'READY_FOR_HUMAN_REVIEW':
    default:
      return 'The automated editorial checks currently show no major unresolved issue. This is not a guarantee of accuracy, originality, or publication approval.';
  }
}

export function categorySymbol(status: 'ok' | 'warn' | 'critical'): '✓' | '⚠' | '✕' {
  if (status === 'ok') return '✓';
  if (status === 'critical') return '✕';
  return '⚠';
}

/** True when the currently-edited title/content no longer matches the audit's fingerprint. */
export function isAuditStale(audit: Pick<FullEditorialAudit, 'contentFingerprint'> | null, currentTitle: string, currentContent: string): boolean {
  if (!audit) return false;
  return contentFingerprint(currentTitle, currentContent) !== audit.contentFingerprint;
}

/** "2 minutes ago" style relative time for "Last full audit: …". Small, dependency-free. */
export function relativeTimeFrom(isoTimestamp: string, now: Date = new Date()): string {
  const then = new Date(isoTimestamp).getTime();
  const diffMs = now.getTime() - then;
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'just now';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export type RunAuditState = 'idle' | 'pending' | 'success' | 'error';

export function runAuditButtonLabel(state: RunAuditState, hasPriorAudit: boolean): string {
  if (state === 'pending') return 'Running Full Audit…';
  if (state === 'error') return 'Retry Full Audit';
  if (hasPriorAudit) return 'Run Again';
  return 'Run Full Audit';
}

const EXTERNAL_STATUS_LABEL: Record<string, string> = {
  not_performed: 'Not performed in this session',
  not_configured: 'No provider configured',
  checked: 'Checked',
  completed: 'Completed',
  error: 'Provider error',
};

/** Never says "No factual issues" or "Original" for an absent external check — spec §17/§23/§24. */
export function externalVerificationLabel(kind: 'originality' | 'research', value: string): string {
  const base = EXTERNAL_STATUS_LABEL[value] || value;
  if (value === 'not_performed' || value === 'not_configured') {
    return kind === 'originality'
      ? `External originality provider not configured (${base}).`
      : `External claim verification is not configured (${base}).`;
  }
  return base;
}

/** Only non-CRITICAL, non-factual suggestions may be dismissed (spec §15) — factual/source
 *  claims stay tied to their real verification status and can never be waved away by the UI. */
export function isDismissible(issue: Pick<AuditIssue, 'severity' | 'category'>): boolean {
  if (issue.severity === 'CRITICAL') return false;
  if (issue.category === 'FACTS') return false;
  return true;
}

import { describe, it, expect } from 'vitest';
import {
  contentFingerprint,
  statusLabel,
  statusSeverity,
  statusExplanation,
  categorySymbol,
  isAuditStale,
  relativeTimeFrom,
  runAuditButtonLabel,
  externalVerificationLabel,
  isDismissible,
  type FullEditorialAudit,
} from './editorialAudit';

describe('contentFingerprint', () => {
  it('is deterministic for the same title+content', () => {
    expect(contentFingerprint('Title', 'Body')).toBe(contentFingerprint('Title', 'Body'));
  });

  it('changes when content changes', () => {
    expect(contentFingerprint('Title', 'Body')).not.toBe(contentFingerprint('Title', 'Body changed'));
  });

  it('changes when title changes', () => {
    expect(contentFingerprint('Title A', 'Body')).not.toBe(contentFingerprint('Title B', 'Body'));
  });
});

describe('statusLabel / statusSeverity', () => {
  it('labels every status distinctly', () => {
    const statuses: FullEditorialAudit['status'][] = ['READY_FOR_HUMAN_REVIEW', 'REVIEW_RECOMMENDED', 'REVISION_RECOMMENDED', 'CRITICAL_REVIEW_REQUIRED', 'NOT_ENOUGH_CONTENT'];
    const labels = statuses.map(statusLabel);
    expect(new Set(labels).size).toBe(statuses.length);
  });

  it('maps READY_FOR_HUMAN_REVIEW to ok and CRITICAL_REVIEW_REQUIRED to critical', () => {
    expect(statusSeverity('READY_FOR_HUMAN_REVIEW')).toBe('ok');
    expect(statusSeverity('CRITICAL_REVIEW_REQUIRED')).toBe('critical');
    expect(statusSeverity('NOT_ENOUGH_CONTENT')).toBe('todo');
    expect(statusSeverity('REVIEW_RECOMMENDED')).toBe('warn');
    expect(statusSeverity('REVISION_RECOMMENDED')).toBe('warn');
  });
});

describe('statusExplanation', () => {
  it('never claims READY_FOR_HUMAN_REVIEW means perfect, 100% human, or approved — and explicitly disclaims a guarantee', () => {
    const text = statusExplanation('READY_FOR_HUMAN_REVIEW');
    for (const phrase of ['perfect', '100%', 'AdSense', 'Google']) {
      expect(text.toLowerCase()).not.toContain(phrase.toLowerCase());
    }
    expect(text).toMatch(/no major unresolved issue/i);
    expect(text).toMatch(/not a guarantee/i);
  });

  it('gives a distinct explanation per status', () => {
    const statuses: FullEditorialAudit['status'][] = ['READY_FOR_HUMAN_REVIEW', 'REVIEW_RECOMMENDED', 'REVISION_RECOMMENDED', 'CRITICAL_REVIEW_REQUIRED', 'NOT_ENOUGH_CONTENT'];
    const texts = statuses.map(statusExplanation);
    expect(new Set(texts).size).toBe(statuses.length);
  });
});

describe('categorySymbol', () => {
  it('maps ok/warn/critical to distinct symbols', () => {
    expect(categorySymbol('ok')).toBe('✓');
    expect(categorySymbol('warn')).toBe('⚠');
    expect(categorySymbol('critical')).toBe('✕');
  });
});

describe('isAuditStale', () => {
  const audit = { contentFingerprint: contentFingerprint('Title', 'Original content') };

  it('is false when nothing changed', () => {
    expect(isAuditStale(audit, 'Title', 'Original content')).toBe(false);
  });

  it('is true when the content changed since the audit ran', () => {
    expect(isAuditStale(audit, 'Title', 'Edited content')).toBe(true);
  });

  it('is false when there is no prior audit at all', () => {
    expect(isAuditStale(null, 'Title', 'Anything')).toBe(false);
  });
});

describe('relativeTimeFrom', () => {
  it('renders "just now" for a timestamp seconds ago', () => {
    const now = new Date('2026-01-01T00:01:00Z');
    const ts = new Date('2026-01-01T00:00:30Z').toISOString();
    expect(relativeTimeFrom(ts, now)).toBe('just now');
  });

  it('renders "2 minutes ago"', () => {
    const now = new Date('2026-01-01T00:02:00Z');
    const ts = new Date('2026-01-01T00:00:00Z').toISOString();
    expect(relativeTimeFrom(ts, now)).toBe('2 minutes ago');
  });

  it('renders singular "1 hour ago"', () => {
    const now = new Date('2026-01-01T01:00:00Z');
    const ts = new Date('2026-01-01T00:00:00Z').toISOString();
    expect(relativeTimeFrom(ts, now)).toBe('1 hour ago');
  });
});

describe('runAuditButtonLabel', () => {
  it('shows "Run Full Audit" the first time', () => {
    expect(runAuditButtonLabel('idle', false)).toBe('Run Full Audit');
  });

  it('shows "Run Again" once a prior audit exists', () => {
    expect(runAuditButtonLabel('idle', true)).toBe('Run Again');
  });

  it('shows a loading label while pending', () => {
    expect(runAuditButtonLabel('pending', true)).toMatch(/running/i);
  });

  it('shows a retry label on error', () => {
    expect(runAuditButtonLabel('error', true)).toMatch(/retry/i);
  });
});

describe('externalVerificationLabel', () => {
  it('never implies "no factual issues" when research was not configured', () => {
    const text = externalVerificationLabel('research', 'not_configured');
    expect(text.toLowerCase()).not.toContain('no factual issues');
    expect(text).toMatch(/not configured/i);
  });

  it('never says "Original" when originality was not performed', () => {
    const text = externalVerificationLabel('originality', 'not_performed');
    expect(text).not.toBe('Original');
    expect(text).toMatch(/not configured/i);
  });

  it('passes through a real "checked"/"completed" status', () => {
    expect(externalVerificationLabel('originality', 'checked')).toBe('Checked');
    expect(externalVerificationLabel('research', 'completed')).toBe('Completed');
  });
});

describe('isDismissible', () => {
  it('never allows a CRITICAL issue to be dismissed', () => {
    expect(isDismissible({ severity: 'CRITICAL', category: 'WRITING' })).toBe(false);
  });

  it('never allows a FACTS-category issue to be dismissed, even at WARNING severity', () => {
    expect(isDismissible({ severity: 'WARNING', category: 'FACTS' })).toBe(false);
  });

  it('allows a non-critical, non-factual suggestion to be dismissed', () => {
    expect(isDismissible({ severity: 'SUGGESTION', category: 'WRITING' })).toBe(true);
    expect(isDismissible({ severity: 'WARNING', category: 'SEO' })).toBe(true);
  });
});

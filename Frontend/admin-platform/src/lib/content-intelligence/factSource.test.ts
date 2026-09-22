import { describe, it, expect } from 'vitest';
import {
  categoryLabel,
  evidenceStatusLabel,
  evidenceStatusSeverity,
  sourceQualityLabel,
  buildSummaryRows,
  verifyClaimsButtonLabel,
  mergeResearchIntoClaims,
  type Claim,
  type ClaimResearchResult,
} from './factSource';

describe('categoryLabel', () => {
  it('title-cases a simple category', () => {
    expect(categoryLabel('TAX')).toBe('Tax');
  });

  it('splits and title-cases a multi-word category', () => {
    expect(categoryLabel('DATE_SENSITIVE')).toBe('Date Sensitive');
    expect(categoryLabel('PERSON_ATTRIBUTION')).toBe('Person Attribution');
  });
});

describe('evidenceStatusLabel', () => {
  it('never claims a claim is simply "true" or "false"', () => {
    expect(evidenceStatusLabel('SUPPORTED')).not.toMatch(/^true$/i);
    expect(evidenceStatusLabel('NO_SOURCE_FOUND')).not.toMatch(/false/i);
    expect(evidenceStatusLabel('SUPPORTED')).toMatch(/supported/i);
  });

  it('labels every evidence status distinctly', () => {
    const statuses: Array<Parameters<typeof evidenceStatusLabel>[0]> = [
      'SUPPORTED', 'CONTRADICTED', 'PARTIALLY_SUPPORTED', 'UNCLEAR', 'NO_SOURCE_FOUND', 'needs_research',
    ];
    const labels = statuses.map(evidenceStatusLabel);
    expect(new Set(labels).size).toBe(statuses.length);
  });

  it('falls back to "Needs research" for an unrecognized status', () => {
    // @ts-expect-error deliberately testing the fallback branch with an unknown string
    expect(evidenceStatusLabel('something_else')).toBe('Needs research');
  });
});

describe('evidenceStatusSeverity', () => {
  it('maps SUPPORTED to ok', () => {
    expect(evidenceStatusSeverity('SUPPORTED')).toBe('ok');
  });

  it('maps CONTRADICTED and PARTIALLY_SUPPORTED to warn', () => {
    expect(evidenceStatusSeverity('CONTRADICTED')).toBe('warn');
    expect(evidenceStatusSeverity('PARTIALLY_SUPPORTED')).toBe('warn');
  });

  it('maps NO_SOURCE_FOUND and needs_research to todo (never "false")', () => {
    expect(evidenceStatusSeverity('NO_SOURCE_FOUND')).toBe('todo');
    expect(evidenceStatusSeverity('needs_research')).toBe('todo');
  });
});

describe('sourceQualityLabel', () => {
  it('labels primary/secondary/general/unknown distinctly', () => {
    expect(sourceQualityLabel('primary')).toMatch(/primary/i);
    expect(sourceQualityLabel('secondary')).toMatch(/secondary/i);
    expect(sourceQualityLabel('general')).toMatch(/general/i);
    expect(sourceQualityLabel('unknown')).toBe('Unknown');
  });

  it('reports "Not cited" for a null quality rather than a fabricated grade', () => {
    expect(sourceQualityLabel(null)).toBe('Not cited');
  });
});

describe('buildSummaryRows', () => {
  it('renders one row per summary stat with the given counts', () => {
    const rows = buildSummaryRows({ total: 14, needsVerification: 5, citationPresent: 7, timeSensitive: 2, primarySourceOpportunities: 3 });
    expect(rows.find((r) => r.label === 'Claims detected')?.value).toBe(14);
    expect(rows.find((r) => r.label === 'Needs verification')?.value).toBe(5);
    expect(rows.find((r) => r.label === 'Citations present')?.value).toBe(7);
    expect(rows.find((r) => r.label === 'Time-sensitive')?.value).toBe(2);
    expect(rows.find((r) => r.label === 'Primary-source opportunities')?.value).toBe(3);
  });
});

describe('verifyClaimsButtonLabel', () => {
  it('shows the claim count in the idle state', () => {
    expect(verifyClaimsButtonLabel('idle', 5)).toBe('Verify Claims (5)');
  });

  it('shows a plain label with zero claims', () => {
    expect(verifyClaimsButtonLabel('idle', 0)).toBe('Verify Claims');
  });

  it('disables-implying label while pending', () => {
    expect(verifyClaimsButtonLabel('pending', 5)).toBe('Researching…');
  });

  it('offers a retry label on error', () => {
    expect(verifyClaimsButtonLabel('error', 5)).toBe('Retry Verify Claims');
  });

  it('offers a re-run label after success', () => {
    expect(verifyClaimsButtonLabel('success', 5)).toBe('Re-run Verify Claims');
  });
});

describe('mergeResearchIntoClaims', () => {
  const claims: Claim[] = [
    {
      id: 'claim-0', text: 'The IRA contribution limit is $7,000.', category: 'TAX', severity: 'WARNING',
      citationPresent: false, citationUrl: null, sourceQuality: null, timeSensitive: true,
      jurisdiction: { relevant: true, stated: false, unclear: true }, primarySourceOpportunity: true,
      recommendedSourceType: 'Government / IRS or Treasury', attributedTo: null, researchStatus: 'not_researched',
    },
  ];

  it('returns an empty map when no results were provided yet (research not run)', () => {
    const map = mergeResearchIntoClaims(claims, undefined);
    expect(map.size).toBe(0);
  });

  it('keys research results by claim id', () => {
    const results: ClaimResearchResult[] = [
      { claimId: 'claim-0', claimText: claims[0].text, status: 'SUPPORTED', sourceConflict: false, sources: [] },
    ];
    const map = mergeResearchIntoClaims(claims, results);
    expect(map.get('claim-0')?.status).toBe('SUPPORTED');
  });

  it('never fabricates a result for a claim the backend did not return', () => {
    const map = mergeResearchIntoClaims(claims, []);
    expect(map.get('claim-0')).toBeUndefined();
  });
});

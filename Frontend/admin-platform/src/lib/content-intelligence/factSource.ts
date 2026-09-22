// Pure presentation-logic helpers behind the "FACT & SOURCE INTELLIGENCE" section of
// ContentIntelligencePanel.tsx (Prompt 3). Kept separate — like locate.ts / originality.ts —
// so they're unit-testable without a DOM harness.
//
// Guiding rule carried over from the backend (claimDetectionService.js / claimResearchProvider.js):
// nothing here ever states a claim is TRUE, FALSE, or "verified" as fact. A researched claim is
// always described as "supported by the reviewed source" (or contradicted/unclear/no source
// found) — never as a factual guarantee. No source, URL, or evidence is ever fabricated here;
// this module only formats what the backend already returned.

export type ClaimCategory =
  | 'GENERAL_FACT' | 'NUMERICAL' | 'STATISTICAL' | 'DATE_SENSITIVE' | 'LEGAL' | 'REGULATORY'
  | 'FINANCIAL' | 'TAX' | 'ECONOMIC' | 'SCIENTIFIC' | 'MEDICAL' | 'IMMIGRATION' | 'GOVERNMENT'
  | 'ORGANIZATION' | 'PERSON_ATTRIBUTION' | 'GEOGRAPHIC' | 'BUSINESS' | 'OTHER';

export type ClaimSeverity = 'CRITICAL' | 'WARNING' | 'SUGGESTION';

export interface Claim {
  id: string;
  text: string;
  category: ClaimCategory;
  severity: ClaimSeverity;
  citationPresent: boolean;
  citationUrl: string | null;
  sourceQuality: 'primary' | 'secondary' | 'general' | 'unknown' | null;
  timeSensitive: boolean;
  jurisdiction: { relevant: boolean; stated: boolean; unclear: boolean };
  primarySourceOpportunity: boolean;
  recommendedSourceType: string | null;
  attributedTo: string | null;
  researchStatus: 'not_researched' | 'researched';
}

export interface FactSourceSummary {
  total: number;
  needsVerification: number;
  citationPresent: number;
  timeSensitive: number;
  primarySourceOpportunities: number;
}

export interface FactSourceIntelligence {
  claims: Claim[];
  summary: FactSourceSummary;
  researchStatus: string;
}

/** Title-case-ish display label for a claim category (TAX -> "Tax", DATE_SENSITIVE -> "Date sensitive"). */
export function categoryLabel(category: ClaimCategory | string): string {
  const words = category.toLowerCase().split('_');
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export type EvidenceStatus = 'SUPPORTED' | 'CONTRADICTED' | 'PARTIALLY_SUPPORTED' | 'UNCLEAR' | 'NO_SOURCE_FOUND' | 'needs_research';

export interface ClaimResearchResult {
  claimId: string;
  claimText: string;
  query?: string;
  status: EvidenceStatus;
  sourceConflict: boolean;
  sources: Array<{
    title: string;
    url: string;
    sourceType: string | null;
    authorityLevel: 'primary' | 'secondary' | 'general' | null;
    publishedAt: string | null;
    relevance: string | null;
    supportsClaim: boolean | null;
    notes: string | null;
  }>;
  note?: string | null;
  provider?: string | null;
  checkedAt?: string;
}

/**
 * Human-readable evidence-status label. Never claims certainty — "Supported by the reviewed
 * source(s)" rather than "True", and NO_SOURCE_FOUND is never rendered as "False".
 */
export function evidenceStatusLabel(status: EvidenceStatus): string {
  switch (status) {
    case 'SUPPORTED': return 'Supported by the reviewed source';
    case 'CONTRADICTED': return 'Contradicted by the reviewed source';
    case 'PARTIALLY_SUPPORTED': return 'Partially supported — sources disagree';
    case 'UNCLEAR': return 'Unclear — sources found but do not directly confirm or deny';
    case 'NO_SOURCE_FOUND': return 'No source found — verify manually';
    case 'needs_research':
    default:
      return 'Needs research';
  }
}

export function evidenceStatusSeverity(status: EvidenceStatus): 'ok' | 'warn' | 'todo' {
  if (status === 'SUPPORTED') return 'ok';
  if (status === 'CONTRADICTED' || status === 'PARTIALLY_SUPPORTED') return 'warn';
  return 'todo';
}

const SOURCE_QUALITY_LABEL: Record<string, string> = {
  primary: 'Primary / authoritative',
  secondary: 'High-quality secondary',
  general: 'General secondary',
  unknown: 'Unknown',
};

export function sourceQualityLabel(quality: string | null): string {
  if (!quality) return 'Not cited';
  return SOURCE_QUALITY_LABEL[quality] || 'Unknown';
}

/** Row-per-summary-stat data for the "FACT & SOURCE REVIEW" header block. */
export function buildSummaryRows(summary: FactSourceSummary): { label: string; value: number }[] {
  return [
    { label: 'Claims detected', value: summary.total },
    { label: 'Needs verification', value: summary.needsVerification },
    { label: 'Citations present', value: summary.citationPresent },
    { label: 'Time-sensitive', value: summary.timeSensitive },
    { label: 'Primary-source opportunities', value: summary.primarySourceOpportunities },
  ];
}

export type VerifyClaimsState = 'idle' | 'pending' | 'success' | 'error';

/** Button label for the explicit, user-triggered claim-research action — never auto-runs. */
export function verifyClaimsButtonLabel(state: VerifyClaimsState, claimCount: number): string {
  if (state === 'pending') return 'Researching…';
  if (state === 'error') return 'Retry Verify Claims';
  if (state === 'success') return 'Re-run Verify Claims';
  if (claimCount === 0) return 'Verify Claims';
  return `Verify Claims (${claimCount})`;
}

/** Merges a research pass's results onto the originally-detected claims, keyed by claim id. */
export function mergeResearchIntoClaims(claims: Claim[], results: ClaimResearchResult[] | undefined): Map<string, ClaimResearchResult> {
  const map = new Map<string, ClaimResearchResult>();
  if (!results) return map;
  for (const r of results) map.set(r.claimId, r);
  return map;
}

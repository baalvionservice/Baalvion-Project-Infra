// Pure presentation-logic helpers behind the "ORIGINALITY & WRITING SIGNALS" section of
// ContentIntelligencePanel.tsx. Kept separate (like locate.ts) so they're unit-testable without
// a DOM harness — this codebase's vitest config runs in a node environment only.
//
// Guiding rule carried over from the backend (articleAnalysisService.js / originalityProvider.js):
// nothing here computes, formats, or implies an "AI probability" or a "human score". A provider
// similarity number, when present, is always labeled an "external provider signal" — never
// treated as a factual authorship determination.

export interface WritingSignalsSummary {
  repeatedPhrasesCount: number;
  repeatedOpeningsCount: number;
  genericWordingCount: number;
  formulaicStructure: string;
  sentenceVariation: 'Good' | 'Warning';
  paragraphVariation: 'Good' | 'Warning';
  punctuationPattern: string;
}

export interface SignalRow { label: string; value: string; warn: boolean }

/** Row-per-signal data for the "Writing signals" list — one line each, matching the spec's example table. */
export function buildSignalRows(signals: WritingSignalsSummary): SignalRow[] {
  return [
    { label: 'Repeated phrases', value: String(signals.repeatedPhrasesCount), warn: signals.repeatedPhrasesCount > 0 },
    { label: 'Repeated openings', value: String(signals.repeatedOpeningsCount), warn: signals.repeatedOpeningsCount > 0 },
    { label: 'Generic wording', value: String(signals.genericWordingCount), warn: signals.genericWordingCount > 0 },
    { label: 'Formulaic structure', value: signals.formulaicStructure, warn: signals.formulaicStructure !== 'Low' },
    { label: 'Sentence variation', value: signals.sentenceVariation, warn: signals.sentenceVariation === 'Warning' },
    { label: 'Paragraph variation', value: signals.paragraphVariation, warn: signals.paragraphVariation === 'Warning' },
    { label: 'Punctuation pattern', value: signals.punctuationPattern, warn: signals.punctuationPattern === 'Warning' },
  ];
}

export interface OriginalityProviderResult {
  provider: string | null;
  status: 'not_configured' | 'checked' | 'error';
  similarity: number | null;
}

/**
 * One display line for the "External originality" block. Never states a percentage as fact —
 * a similarity number is always parenthesized as "(external provider signal)".
 */
export function describeProviderResult(result: OriginalityProviderResult | null): string {
  if (!result) return 'Provider: Not configured';
  if (result.status === 'not_configured') return 'Provider: Not configured';
  if (result.status === 'error') return 'Provider unavailable — the draft is unaffected, try again later.';
  if (result.status === 'checked') {
    const similarityPart = typeof result.similarity === 'number'
      ? ` · Similarity: ${Math.round(result.similarity * 100)}% (external provider signal, not proof of authorship)`
      : '';
    return `Provider: ${result.provider ?? 'external'} · Status: Checked${similarityPart}`;
  }
  return 'Provider: Not configured';
}

export type OriginalityCheckState = 'idle' | 'pending' | 'success' | 'error';

/** Button label for the explicit, user-triggered external check — never auto-runs. */
export function originalityCheckButtonLabel(state: OriginalityCheckState): string {
  if (state === 'pending') return 'Checking…';
  if (state === 'error') return 'Retry Originality Check';
  if (state === 'success') return 'Re-run Originality Check';
  return 'Run Originality Check';
}

/**
 * Maps a provider's similarity number to one of the panel's existing three severities.
 * Only a HIGH, CONFIRMED external match reaches CRITICAL — local writing signals never do
 * (see computeOriginalityStatus in articleAnalysisService.js for the parallel backend rule).
 */
export function severityForProviderSimilarity(similarity: number | null): 'CRITICAL' | 'WARNING' | 'SUGGESTION' | null {
  if (typeof similarity !== 'number') return null;
  if (similarity >= 0.3) return 'CRITICAL';
  if (similarity >= 0.15) return 'WARNING';
  return 'SUGGESTION';
}

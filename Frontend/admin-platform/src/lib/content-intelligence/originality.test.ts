import { describe, it, expect } from 'vitest';
import { buildSignalRows, describeProviderResult, originalityCheckButtonLabel, severityForProviderSimilarity } from './originality';

describe('buildSignalRows', () => {
  it('renders a row per writing signal with counts and labels', () => {
    const rows = buildSignalRows({
      repeatedPhrasesCount: 2,
      repeatedOpeningsCount: 1,
      genericWordingCount: 3,
      formulaicStructure: 'Low',
      sentenceVariation: 'Good',
      paragraphVariation: 'Good',
      punctuationPattern: 'Warning',
    });
    expect(rows.find((r) => r.label === 'Repeated phrases')?.value).toBe('2');
    expect(rows.find((r) => r.label === 'Repeated openings')?.value).toBe('1');
    expect(rows.find((r) => r.label === 'Generic wording')?.value).toBe('3');
    expect(rows.find((r) => r.label === 'Punctuation pattern')?.value).toBe('Warning');
  });

  it('flags warn=true only for signals that are actually present', () => {
    const rows = buildSignalRows({
      repeatedPhrasesCount: 0,
      repeatedOpeningsCount: 0,
      genericWordingCount: 0,
      formulaicStructure: 'Low',
      sentenceVariation: 'Good',
      paragraphVariation: 'Good',
      punctuationPattern: 'Good',
    });
    expect(rows.every((r) => r.warn === false)).toBe(true);
  });

  it('flags formulaic structure and variation signals as warn when not "Low"/"Good"', () => {
    const rows = buildSignalRows({
      repeatedPhrasesCount: 0,
      repeatedOpeningsCount: 0,
      genericWordingCount: 0,
      formulaicStructure: 'High',
      sentenceVariation: 'Warning',
      paragraphVariation: 'Warning',
      punctuationPattern: 'Warning',
    });
    expect(rows.find((r) => r.label === 'Formulaic structure')?.warn).toBe(true);
    expect(rows.find((r) => r.label === 'Sentence variation')?.warn).toBe(true);
    expect(rows.find((r) => r.label === 'Paragraph variation')?.warn).toBe(true);
  });
});

describe('describeProviderResult', () => {
  it('shows "Not configured" when no result exists yet', () => {
    expect(describeProviderResult(null)).toBe('Provider: Not configured');
  });

  it('shows "Not configured" when the provider explicitly reports not_configured', () => {
    expect(describeProviderResult({ provider: null, status: 'not_configured', similarity: null })).toBe('Provider: Not configured');
  });

  it('shows a safe, non-alarming message on provider error without breaking the workflow', () => {
    const text = describeProviderResult({ provider: 'acme', status: 'error', similarity: null });
    expect(text).toMatch(/unavailable/i);
    expect(text).toMatch(/draft is unaffected/i);
  });

  it('labels a checked result with the provider name and marks similarity as a provider signal, not a fact', () => {
    const text = describeProviderResult({ provider: 'acme-originality', status: 'checked', similarity: 0.42 });
    expect(text).toContain('acme-originality');
    expect(text).toContain('Checked');
    expect(text).toContain('42%');
    expect(text).toMatch(/external provider signal/i);
    expect(text).toMatch(/not proof of authorship/i);
  });

  it('never mentions "AI" authorship or a "human score" anywhere in its output', () => {
    const cases = [
      null,
      { provider: null, status: 'not_configured' as const, similarity: null },
      { provider: 'x', status: 'error' as const, similarity: null },
      { provider: 'x', status: 'checked' as const, similarity: 0.9 },
    ];
    for (const c of cases) {
      expect(describeProviderResult(c)).not.toMatch(/ai.generated|human score|ai probability/i);
    }
  });
});

describe('originalityCheckButtonLabel', () => {
  it('reads "Run Originality Check" when idle', () => {
    expect(originalityCheckButtonLabel('idle')).toBe('Run Originality Check');
  });

  it('reads "Checking…" while pending', () => {
    expect(originalityCheckButtonLabel('pending')).toBe('Checking…');
  });

  it('offers a retry after an error', () => {
    expect(originalityCheckButtonLabel('error')).toMatch(/retry/i);
  });

  it('offers a re-run after a successful check', () => {
    expect(originalityCheckButtonLabel('success')).toMatch(/re-run/i);
  });
});

describe('severityForProviderSimilarity', () => {
  it('returns null when there is no similarity number yet', () => {
    expect(severityForProviderSimilarity(null)).toBeNull();
  });

  it('returns CRITICAL only for a high, confirmed similarity', () => {
    expect(severityForProviderSimilarity(0.35)).toBe('CRITICAL');
  });

  it('returns WARNING for a moderate similarity', () => {
    expect(severityForProviderSimilarity(0.2)).toBe('WARNING');
  });

  it('returns SUGGESTION for a low similarity', () => {
    expect(severityForProviderSimilarity(0.05)).toBe('SUGGESTION');
  });
});

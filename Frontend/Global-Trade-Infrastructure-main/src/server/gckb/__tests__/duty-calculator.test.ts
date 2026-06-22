/**
 * @file server/gckb/__tests__/duty-calculator.test.ts
 * @description Pure (no-I/O) unit tests for the duty-estimation core: HS prefix
 * matching, MFN vs FTA-preferential tariff selection, additional duties, the
 * tax-on-(value+duties) base, and landed-cost totals.
 */
import { describe, it, expect } from 'vitest';
import { computeEstimate, hsApplicability, round2, type DutyQuery } from '../duty-calculator';
import type { PolicyView } from '../public-read';
import type { AgreementView } from '../public-read';

const ISO = '2026-01-01T00:00:00.000Z';

function policy(opts: {
  recordKey: string;
  name: string;
  policyType: 'tariff' | 'duty' | 'tax';
  hsCode?: string | null;
  attributes?: Record<string, unknown>;
}): PolicyView {
  return {
    id: opts.recordKey,
    recordKey: opts.recordKey,
    name: opts.name,
    policyType: opts.policyType,
    policyTypeLabel: opts.policyType,
    group: opts.policyType === 'tax' ? 'tax' : 'tariff',
    code: null,
    hsCode: opts.hsCode ?? null,
    productCategory: null,
    authority: null,
    attributes: opts.attributes ?? {},
    tags: [],
    effectiveFrom: null,
    effectiveTo: null,
    version: 1,
    updatedAt: ISO,
  };
}

function agreement(recordKey: string, members: string[], status = 'IN_FORCE'): AgreementView {
  return { id: recordKey, recordKey, name: recordKey, kind: 'FTA', status, memberCountryCodes: members };
}

const baseQuery: DutyQuery = { destinationCountryCode: 'IN', hsCode: '10063010', customsValue: 1000, currency: 'INR' };

describe('round2', () => {
  it('rounds to two places without float drift', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2((1100 * 18) / 100)).toBe(198);
    expect(round2(100.005)).toBe(100.01);
  });
});

describe('hsApplicability', () => {
  it('matches by HS prefix and reports specificity', () => {
    expect(hsApplicability(policy({ recordKey: 'a', name: 'A', policyType: 'tariff', hsCode: '1006' }), '10063010')).toBe(4);
    expect(hsApplicability(policy({ recordKey: 'b', name: 'B', policyType: 'tariff', hsCode: '10' }), '10063010')).toBe(2);
  });
  it('treats a no-HS policy as country-wide (specificity 0)', () => {
    expect(hsApplicability(policy({ recordKey: 'c', name: 'C', policyType: 'tax' }), '10063010')).toBe(0);
  });
  it('excludes a policy that is more specific than, or unrelated to, the query', () => {
    expect(hsApplicability(policy({ recordKey: 'd', name: 'D', policyType: 'tariff', hsCode: '10063010' }), '1006')).toBeNull();
    expect(hsApplicability(policy({ recordKey: 'e', name: 'E', policyType: 'tariff', hsCode: '99' }), '1006')).toBeNull();
  });
  it('reads hsCodes from attributes too', () => {
    expect(hsApplicability(policy({ recordKey: 'f', name: 'F', policyType: 'tariff', attributes: { hsCodes: ['8703', '1006'] } }), '100630')).toBe(4);
  });
});

describe('computeEstimate', () => {
  const mfn = policy({ recordKey: 'IN:tariff:mfn', name: 'MFN Duty', policyType: 'tariff', hsCode: '1006', attributes: { ratePercent: 10 } });
  const gst = policy({ recordKey: 'IN:tax:igst', name: 'IGST', policyType: 'tax', attributes: { taxName: 'IGST', taxType: 'GST', ratePercent: 18 } });

  it('computes BCD, then tax on (value + duties), with totals', () => {
    const est = computeEstimate([mfn, gst], [], baseQuery);
    const bcd = est.lines.find((l) => l.key === 'bcd')!;
    expect(bcd.amount).toBe(100); // 10% of 1000
    const tax = est.lines.find((l) => l.policyType === 'tax')!;
    expect(tax.base).toBe(1100);
    expect(tax.amount).toBe(198); // 18% of 1100
    expect(est.totals.duties).toBe(100);
    expect(est.totals.taxes).toBe(198);
    expect(est.totals.landedCost).toBe(1298);
    expect(est.totals.effectiveDutyRatePercent).toBe(10);
    expect(est.ftaApplied).toBeNull();
  });

  it('picks the longest HS-prefix tariff', () => {
    const broad = policy({ recordKey: 'IN:tariff:ch10', name: 'Chapter 10', policyType: 'tariff', hsCode: '10', attributes: { ratePercent: 5 } });
    const est = computeEstimate([broad, mfn], [], baseQuery);
    expect(est.lines.find((l) => l.key === 'bcd')!.amount).toBe(100); // 1006 (10%) beats 10 (5%)
  });

  it('applies FTA preference when origin qualifies and reports the saving', () => {
    const pref = policy({ recordKey: 'IN:tariff:cepa', name: 'CEPA Preferential', policyType: 'tariff', hsCode: '1006', attributes: { ratePercent: 0, preferentialUnder: 'IND-UAE-CEPA' } });
    const est = computeEstimate([mfn, pref, gst], [agreement('IND-UAE-CEPA', ['IN', 'AE'])], { ...baseQuery, originCountryCode: 'AE' });
    const bcd = est.lines.find((l) => l.key === 'bcd')!;
    expect(bcd.amount).toBe(0);
    expect(bcd.preferential).toBe(true);
    expect(est.ftaApplied).not.toBeNull();
    expect(est.ftaApplied!.mfnDuty).toBe(100);
    expect(est.ftaApplied!.preferentialDuty).toBe(0);
    expect(est.ftaApplied!.saving).toBe(100);
    expect(est.totals.taxes).toBe(180); // 18% of 1000 (no duty)
  });

  it('does NOT apply preference when the origin is not an FTA member', () => {
    const pref = policy({ recordKey: 'IN:tariff:cepa', name: 'CEPA Preferential', policyType: 'tariff', hsCode: '1006', attributes: { ratePercent: 0, preferentialUnder: 'IND-UAE-CEPA' } });
    const est = computeEstimate([mfn, pref, gst], [agreement('IND-UAE-CEPA', ['IN', 'AE'])], { ...baseQuery, originCountryCode: 'US' });
    expect(est.lines.find((l) => l.key === 'bcd')!.amount).toBe(100); // MFN
    expect(est.ftaApplied).toBeNull();
  });

  it('adds an anti-dumping duty on top of the basic duty', () => {
    const antiDumping = policy({ recordKey: 'IN:duty:ad', name: 'Anti-dumping', policyType: 'duty', hsCode: '1006', attributes: { dutyType: 'ANTI_DUMPING', ratePercent: 25 } });
    const est = computeEstimate([mfn, antiDumping, gst], [], baseQuery);
    expect(est.totals.duties).toBe(350); // 100 + 250
    expect(est.totals.taxes).toBe(243); // 18% of 1350
    expect(est.totals.landedCost).toBe(1593);
    expect(est.totals.effectiveDutyRatePercent).toBe(35);
  });

  it('estimates zero duty and notes the gap when no tariff line matches', () => {
    const est = computeEstimate([gst], [], baseQuery);
    expect(est.lines.find((l) => l.key === 'bcd')).toBeUndefined();
    expect(est.totals.duties).toBe(0);
    expect(est.notes.some((n) => n.includes('No tariff line'))).toBe(true);
  });
});

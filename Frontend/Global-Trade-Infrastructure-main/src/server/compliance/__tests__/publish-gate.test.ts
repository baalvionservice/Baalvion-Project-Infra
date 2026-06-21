/**
 * @file server/compliance/__tests__/publish-gate.test.ts
 * @description Unit tests for the pure compliance engines: AI moderation,
 * sanctions screening and the publish-gate combinator. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { moderateContent } from '../moderation-engine';
import { screenSanctions, type SanctionsContext } from '../sanctions-screening';
import { evaluateGate, type GateSignals } from '../publish-gate';

describe('moderateContent', () => {
  it('clears benign content', () => {
    const r = moderateContent({ title: 'Industrial steel coils', description: 'Hot-rolled coils, grade A.' });
    expect(r.decision).toBe('CLEAR');
    expect(r.score).toBe(0);
    expect(r.labels).toHaveLength(0);
  });

  it('blocks prohibited content with a critical label', () => {
    const r = moderateContent({ title: 'Surplus', description: 'Selling an assault rifle, mint condition.' });
    expect(r.decision).toBe('BLOCK');
    expect(r.labels.some((l) => l.code === 'PROHIBITED_WEAPON' && l.severity === 'CRITICAL')).toBe(true);
  });

  it('flags sensitive dual-use goods for review', () => {
    const r = moderateContent({ title: 'Lab gear', description: 'High-speed centrifuge for sale.' });
    expect(r.decision).toBe('REVIEW');
    expect(r.labels.some((l) => l.code === 'SENSITIVE_DUAL_USE')).toBe(true);
  });

  it('flags leaked contact info', () => {
    const r = moderateContent({ description: 'Contact me at seller@example.com for a deal.' });
    expect(r.decision).toBe('REVIEW');
    expect(r.labels.some((l) => l.code === 'CONTACT_LEAK')).toBe(true);
  });

  it('flags off-platform payment solicitation', () => {
    const r = moderateContent({ description: 'Pay via western union only, cash only.' });
    expect(r.labels.some((l) => l.code === 'OFFLINE_PAYMENT')).toBe(true);
    expect(r.decision).toBe('REVIEW');
  });
});

describe('screenSanctions', () => {
  const ctx: SanctionsContext = {
    sanctionedCountries: ['IR', 'KP'],
    highRiskCountries: ['AF'],
    deniedParties: ['darkstar holdings'],
    pepNames: ['ivan petrov'],
  };

  it('passes a clean transaction', () => {
    const r = screenSanctions({ originCountry: 'US', destinationCountry: 'DE' }, ctx);
    expect(r.hit).toBe(false);
    expect(r.requiresReview).toBe(false);
    expect(r.matches).toHaveLength(0);
  });

  it('blocks an embargoed destination country', () => {
    const r = screenSanctions({ originCountry: 'US', destinationCountry: 'kp' }, ctx);
    expect(r.hit).toBe(true);
    expect(r.matches[0].type).toBe('COUNTRY_EMBARGO');
  });

  it('flags a high-risk country for review without blocking', () => {
    const r = screenSanctions({ originCountry: 'AF', destinationCountry: 'US' }, ctx);
    expect(r.hit).toBe(false);
    expect(r.requiresReview).toBe(true);
    expect(r.matches[0].type).toBe('HIGH_RISK_COUNTRY');
  });

  it('blocks a denied party regardless of case', () => {
    const r = screenSanctions({ parties: [{ name: 'DarkStar Holdings', role: 'buyer' }] }, ctx);
    expect(r.hit).toBe(true);
    expect(r.matches[0].type).toBe('DENIED_PARTY');
  });

  it('flags a politically-exposed person for review', () => {
    const r = screenSanctions({ parties: [{ name: 'Ivan Petrov', role: 'beneficiary' }] }, ctx);
    expect(r.requiresReview).toBe(true);
    expect(r.matches[0].type).toBe('PEP');
  });
});

describe('evaluateGate', () => {
  const cleanGoods = { decision: 'ALLOW' as const, prohibited: false, requiresReview: false, requiredLicenses: [], requiredCertificates: [], reasons: [] };
  const cleanSanctions = { hit: false, requiresReview: false, reasons: [] };
  const cleanCountry = { status: 'ALLOWED' as const };
  const cleanModeration = { decision: 'CLEAR' as const, score: 0, reasons: [] };

  function signals(overrides: Partial<GateSignals> = {}): GateSignals {
    return { goods: cleanGoods, sanctions: cleanSanctions, country: cleanCountry, moderation: cleanModeration, ...overrides };
  }

  it('approves when every check passes', () => {
    const plan = evaluateGate(signals());
    expect(plan.decision).toBe('APPROVE');
    expect(plan.blockers).toHaveLength(0);
    expect(plan.checks).toHaveLength(4);
  });

  it('rejects when goods are prohibited', () => {
    const plan = evaluateGate(signals({ goods: { ...cleanGoods, decision: 'DENY', prohibited: true, reasons: ['embargoed item'] } }));
    expect(plan.decision).toBe('REJECT');
    expect(plan.blockers.some((b) => b.startsWith('RESTRICTED_GOODS'))).toBe(true);
  });

  it('rejects on a sanctions hit', () => {
    const plan = evaluateGate(signals({ sanctions: { hit: true, requiresReview: false, reasons: ['denied party'] } }));
    expect(plan.decision).toBe('REJECT');
  });

  it('rejects on an embargoed country', () => {
    const plan = evaluateGate(signals({ country: { status: 'EMBARGOED', reasons: ['KP embargo'] } }));
    expect(plan.decision).toBe('REJECT');
  });

  it('rejects when moderation blocks the content', () => {
    const plan = evaluateGate(signals({ moderation: { decision: 'BLOCK', score: 100, reasons: ['weapon'] } }));
    expect(plan.decision).toBe('REJECT');
  });

  it('reviews when moderation flags but nothing fails', () => {
    const plan = evaluateGate(signals({ moderation: { decision: 'REVIEW', score: 30, reasons: ['dual-use'] } }));
    expect(plan.decision).toBe('REVIEW');
    expect(plan.requiredActions).toContain('MANUAL_REVIEW');
  });

  it('reviews and lists required licenses when goods need them', () => {
    const plan = evaluateGate(signals({ goods: { ...cleanGoods, decision: 'REVIEW', requiresReview: true, requiredLicenses: ['DUAL_USE'] } }));
    expect(plan.decision).toBe('REVIEW');
    expect(plan.requiredActions).toContain('PRESENT_LICENSE:DUAL_USE');
  });

  it('ignores absent signals', () => {
    const plan = evaluateGate({ moderation: cleanModeration });
    expect(plan.checks).toHaveLength(1);
    expect(plan.decision).toBe('APPROVE');
  });
});

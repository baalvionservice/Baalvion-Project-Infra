/**
 * @file server/compliance/publish-gate.ts
 * @description The publish gate: a pure combinator that folds the four compliance
 * checks — restricted goods, sanctions, country rules and AI moderation — into a
 * single publish decision (APPROVE / REVIEW / REJECT) with explicit blockers,
 * warnings and required actions. The service runs the individual screens and
 * feeds their results here; keeping the decision logic pure makes the gate's
 * verdict deterministic and exhaustively testable.
 */

export type PublishDecision = 'APPROVE' | 'REVIEW' | 'REJECT';
export type CheckOutcome = 'PASS' | 'REVIEW' | 'FAIL';

export interface GoodsSignal {
  decision: 'ALLOW' | 'DENY' | 'REVIEW';
  prohibited: boolean;
  requiresReview: boolean;
  requiredLicenses: string[];
  requiredCertificates: string[];
  reasons: string[];
}

export interface SanctionsSignal {
  hit: boolean;
  requiresReview: boolean;
  reasons: string[];
}

export interface CountrySignal {
  status: 'ALLOWED' | 'RESTRICTED' | 'EMBARGOED' | 'UNKNOWN';
  reasons?: string[];
}

export interface ModerationSignal {
  decision: 'CLEAR' | 'REVIEW' | 'BLOCK';
  score: number;
  reasons: string[];
}

export interface GateSignals {
  goods?: GoodsSignal | null;
  sanctions?: SanctionsSignal | null;
  country?: CountrySignal | null;
  moderation?: ModerationSignal | null;
}

export interface GateCheck {
  category: 'RESTRICTED_GOODS' | 'SANCTIONS' | 'COUNTRY_RULES' | 'AI_MODERATION';
  outcome: CheckOutcome;
  reasons: string[];
}

export interface GatePlan {
  decision: PublishDecision;
  checks: GateCheck[];
  blockers: string[];
  warnings: string[];
  requiredActions: string[];
}

function goodsCheck(s: GoodsSignal): GateCheck {
  if (s.prohibited || s.decision === 'DENY') return { category: 'RESTRICTED_GOODS', outcome: 'FAIL', reasons: s.reasons.length ? s.reasons : ['goods are prohibited'] };
  if (s.requiresReview || s.decision === 'REVIEW' || s.requiredLicenses.length > 0 || s.requiredCertificates.length > 0) {
    return { category: 'RESTRICTED_GOODS', outcome: 'REVIEW', reasons: s.reasons };
  }
  return { category: 'RESTRICTED_GOODS', outcome: 'PASS', reasons: [] };
}

function sanctionsCheck(s: SanctionsSignal): GateCheck {
  if (s.hit) return { category: 'SANCTIONS', outcome: 'FAIL', reasons: s.reasons.length ? s.reasons : ['sanctions match'] };
  if (s.requiresReview) return { category: 'SANCTIONS', outcome: 'REVIEW', reasons: s.reasons };
  return { category: 'SANCTIONS', outcome: 'PASS', reasons: [] };
}

function countryCheck(s: CountrySignal): GateCheck {
  if (s.status === 'EMBARGOED') return { category: 'COUNTRY_RULES', outcome: 'FAIL', reasons: s.reasons ?? ['country is embargoed'] };
  if (s.status === 'RESTRICTED' || s.status === 'UNKNOWN') return { category: 'COUNTRY_RULES', outcome: 'REVIEW', reasons: s.reasons ?? [`country status ${s.status}`] };
  return { category: 'COUNTRY_RULES', outcome: 'PASS', reasons: [] };
}

function moderationCheck(s: ModerationSignal): GateCheck {
  if (s.decision === 'BLOCK') return { category: 'AI_MODERATION', outcome: 'FAIL', reasons: s.reasons.length ? s.reasons : ['content blocked by moderation'] };
  if (s.decision === 'REVIEW') return { category: 'AI_MODERATION', outcome: 'REVIEW', reasons: s.reasons };
  return { category: 'AI_MODERATION', outcome: 'PASS', reasons: [] };
}

/** Combine all available signals into a single gate verdict. */
export function evaluateGate(signals: GateSignals): GatePlan {
  const checks: GateCheck[] = [];
  if (signals.goods) checks.push(goodsCheck(signals.goods));
  if (signals.sanctions) checks.push(sanctionsCheck(signals.sanctions));
  if (signals.country) checks.push(countryCheck(signals.country));
  if (signals.moderation) checks.push(moderationCheck(signals.moderation));

  const blockers: string[] = [];
  const warnings: string[] = [];
  for (const c of checks) {
    if (c.outcome === 'FAIL') blockers.push(...c.reasons.map((r) => `${c.category}: ${r}`));
    else if (c.outcome === 'REVIEW') warnings.push(...c.reasons.map((r) => `${c.category}: ${r}`));
  }

  const requiredActions: string[] = [];
  if (signals.goods) {
    for (const lic of signals.goods.requiredLicenses) requiredActions.push(`PRESENT_LICENSE:${lic}`);
    for (const cert of signals.goods.requiredCertificates) requiredActions.push(`PRESENT_CERTIFICATE:${cert}`);
  }

  const hasFail = checks.some((c) => c.outcome === 'FAIL');
  const hasReview = checks.some((c) => c.outcome === 'REVIEW');
  let decision: PublishDecision = 'APPROVE';
  if (hasFail) decision = 'REJECT';
  else if (hasReview) {
    decision = 'REVIEW';
    requiredActions.push('MANUAL_REVIEW');
  }

  return { decision, checks, blockers, warnings, requiredActions: [...new Set(requiredActions)] };
}

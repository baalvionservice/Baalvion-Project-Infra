/**
 * @file server/compliance/moderation-engine.ts
 * @description AI content-moderation engine for listings/lots. The default
 * implementation is a deterministic, explainable classifier: it scans the
 * listing text against a configurable policy (prohibited + sensitive term sets,
 * contact-info leakage, off-platform payment solicitation) and returns a score,
 * a decision and labelled evidence. It is a pure function of (content, policy)
 * so it can be exhaustively unit-tested, and the {@link ModerationModel} seam
 * lets a real ML/LLM classifier be dropped in without touching callers.
 */

export type ModerationDecision = 'CLEAR' | 'REVIEW' | 'BLOCK';
export type LabelSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ModerationLabel {
  code: string; // PROHIBITED_<X> | SENSITIVE_<X> | CONTACT_LEAK | OFFLINE_PAYMENT
  severity: LabelSeverity;
  matched: string[];
  weight: number;
}

export interface ModerationContent {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  attributes?: Record<string, unknown> | null;
}

export interface TermGroup {
  code: string;
  terms: string[];
  severity?: LabelSeverity;
}

export interface ModerationPolicy {
  prohibited: TermGroup[]; // any match → BLOCK
  sensitive: TermGroup[]; // any match → REVIEW
  blockScore: number; // score at/above which the result is BLOCK
  reviewScore: number; // score at/above which the result is REVIEW
  detectContactInfo: boolean;
  detectOfflinePayment: boolean;
}

export interface ModerationResult {
  decision: ModerationDecision;
  score: number; // 0-100
  labels: ModerationLabel[];
  reasons: string[];
}

export interface ModerationModel {
  classify(content: ModerationContent): ModerationResult;
}

const SEVERITY_WEIGHT: Readonly<Record<LabelSeverity, number>> = {
  LOW: 10,
  MEDIUM: 25,
  HIGH: 45,
  CRITICAL: 100,
};

const CONTACT_PATTERNS: RegExp[] = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, // email
  /(?:\+?\d[\s-]?){7,}\d/, // phone-ish run of digits
  /\b(?:https?:\/\/|www\.)\S+/i, // url
];

const OFFLINE_PAYMENT_TERMS = [
  'western union',
  'moneygram',
  'wire transfer to',
  'cash only',
  'pay outside',
  'off platform',
  'off-platform',
  'whatsapp me',
  'telegram me',
  'venmo',
  'zelle',
];

/** A sensible built-in policy. Tenants may override any field via config. */
export function defaultModerationPolicy(): ModerationPolicy {
  return {
    prohibited: [
      { code: 'PROHIBITED_WEAPON', terms: ['assault rifle', 'machine gun', 'grenade', 'landmine', 'ammunition stockpile'], severity: 'CRITICAL' },
      { code: 'PROHIBITED_EXPLOSIVE', terms: ['c4 explosive', 'detonator', 'plastic explosive', 'tnt block'], severity: 'CRITICAL' },
      { code: 'PROHIBITED_NARCOTIC', terms: ['cocaine', 'heroin', 'methamphetamine', 'fentanyl'], severity: 'CRITICAL' },
      { code: 'PROHIBITED_WILDLIFE', terms: ['ivory tusk', 'rhino horn', 'pangolin scale', 'tiger pelt'], severity: 'HIGH' },
      { code: 'PROHIBITED_COUNTERFEIT', terms: ['counterfeit', 'replica rolex', 'fake designer', 'knockoff'], severity: 'HIGH' },
    ],
    sensitive: [
      { code: 'SENSITIVE_DUAL_USE', terms: ['centrifuge', 'night vision', 'drone payload', 'encryption module'], severity: 'MEDIUM' },
      { code: 'SENSITIVE_HAZMAT', terms: ['radioactive', 'toxic chemical', 'corrosive acid', 'flammable gas'], severity: 'MEDIUM' },
      { code: 'SENSITIVE_PHARMA', terms: ['prescription only', 'controlled substance', 'unapproved drug'], severity: 'MEDIUM' },
    ],
    blockScore: 70,
    reviewScore: 25,
    detectContactInfo: true,
    detectOfflinePayment: true,
  };
}

function gatherText(content: ModerationContent): string {
  const parts = [content.title ?? '', content.description ?? '', content.category ?? ''];
  if (content.attributes) {
    for (const value of Object.values(content.attributes)) {
      if (typeof value === 'string' || typeof value === 'number') parts.push(String(value));
    }
  }
  return parts.join(' \n ').toLowerCase();
}

function matchGroup(text: string, group: TermGroup, defaultSeverity: LabelSeverity): ModerationLabel | null {
  const matched = group.terms.filter((t) => text.includes(t.toLowerCase()));
  if (matched.length === 0) return null;
  const severity = group.severity ?? defaultSeverity;
  return { code: group.code, severity, matched, weight: SEVERITY_WEIGHT[severity] * matched.length };
}

/** Classify content with the deterministic heuristic model. */
export function moderateContent(content: ModerationContent, policyOverride?: Partial<ModerationPolicy>): ModerationResult {
  const policy: ModerationPolicy = { ...defaultModerationPolicy(), ...policyOverride };
  const text = gatherText(content);
  const labels: ModerationLabel[] = [];

  for (const group of policy.prohibited) {
    const label = matchGroup(text, group, 'CRITICAL');
    if (label) labels.push(label);
  }
  for (const group of policy.sensitive) {
    const label = matchGroup(text, group, 'MEDIUM');
    if (label) labels.push(label);
  }
  if (policy.detectContactInfo && CONTACT_PATTERNS.some((re) => re.test(text))) {
    labels.push({ code: 'CONTACT_LEAK', severity: 'MEDIUM', matched: ['contact-info'], weight: SEVERITY_WEIGHT.MEDIUM });
  }
  if (policy.detectOfflinePayment) {
    const matched = OFFLINE_PAYMENT_TERMS.filter((t) => text.includes(t));
    if (matched.length > 0) {
      labels.push({ code: 'OFFLINE_PAYMENT', severity: 'HIGH', matched, weight: SEVERITY_WEIGHT.HIGH });
    }
  }

  const score = Math.min(100, labels.reduce((sum, l) => sum + l.weight, 0));
  const hasCritical = labels.some((l) => l.severity === 'CRITICAL');
  let decision: ModerationDecision = 'CLEAR';
  if (hasCritical || score >= policy.blockScore) decision = 'BLOCK';
  else if (score >= policy.reviewScore || labels.length > 0) decision = 'REVIEW';

  const reasons = labels.map((l) => `${l.code} (${l.severity}): ${l.matched.join(', ')}`);
  return { decision, score, labels, reasons };
}

/** The default model: a thin wrapper so callers can depend on the interface. */
export const heuristicModerationModel: ModerationModel = {
  classify: (content) => moderateContent(content),
};

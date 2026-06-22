/**
 * @file server/gckb/duty-calculator.ts
 * @description The landed-cost / import-duty estimation engine. Given a
 * destination country, an HS code and a customs (assessable) value, it computes
 * an itemised duty + tax breakdown from the **published** knowledge base:
 *
 *   customs value
 *     + basic customs duty   (best-matching `tariff` line; longest HS prefix wins)
 *     + additional duties     (`duty` policies — anti-dumping, countervailing, …)
 *     + import taxes          (`tax` policies — VAT / GST, on value + duties)
 *     = landed cost
 *
 * **FTA preference override:** when the goods' origin country and the destination
 * are both in-force members of a free-trade agreement, and a preferential tariff
 * line exists for the HS code under that agreement, the preferential rate replaces
 * the MFN rate and the saving is reported.
 *
 * The pure core (`computeEstimate`) takes already-resolved `PolicyView` /
 * `AgreementView` shapes so it is fully unit-testable with no database; the thin
 * orchestrator (`estimateDuty`) fetches the published policies and delegates.
 *
 * This is an informational estimate from configured reference data — it is not a
 * binding customs assessment.
 */
import { gckbRecordRepository } from '../repositories';
import {
  PolicyView,
  AgreementView,
  searchPublished,
  toPolicyView,
  toAgreementView,
} from './public-read';

export interface DutyQuery {
  destinationCountryCode: string;
  hsCode: string;
  customsValue: number; // major units, in `currency`
  currency: string;
  originCountryCode?: string;
  quantity?: number;
  unit?: string;
}

export interface DutyLine {
  key: string;
  label: string;
  policyType: 'tariff' | 'duty' | 'tax';
  basisLabel: string;
  ratePercent: number | null;
  specific: { amount: number; currency: string; unit?: string } | null;
  base: number;
  amount: number;
  sourceRecordKey: string;
  preferential: boolean;
  ftaCode: string | null;
}

export interface FtaApplication {
  code: string;
  name: string;
  mfnDuty: number;
  preferentialDuty: number;
  saving: number;
}

export interface DutyEstimate {
  query: DutyQuery;
  currency: string;
  customsValue: number;
  lines: DutyLine[];
  totals: {
    duties: number;
    taxes: number;
    landedCost: number;
    effectiveDutyRatePercent: number;
  };
  ftaApplied: FtaApplication | null;
  notes: string[];
  disclaimer: string;
}

const DISCLAIMER =
  'Estimate computed from published reference data. Not a binding customs assessment — verify against the official tariff schedule and a licensed broker before relying on it.';

// ── Pure helpers (exported for unit tests) ───────────────────────────────────

/** Round to 2 decimal places, avoiding binary-float drift at the boundary. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function digits(value: string): string {
  return value.replace(/\D/g, '');
}

/** HS scope of a policy: its promoted hsCode plus any `attributes.hsCodes`. */
function hsScopeOf(policy: PolicyView): string[] {
  const list: string[] = [];
  if (policy.hsCode) list.push(policy.hsCode);
  const fromAttrs = policy.attributes.hsCodes;
  if (Array.isArray(fromAttrs)) for (const c of fromAttrs) if (typeof c === 'string') list.push(c);
  return list;
}

/**
 * How specifically a policy applies to an HS code.
 *  - `null`  → the policy is HS-scoped but does not cover this code (excluded).
 *  - `0`     → the policy is country-wide (no HS scope) — applies, lowest priority.
 *  - `> 0`   → matched HS prefix length — longer prefix = more specific.
 */
export function hsApplicability(policy: PolicyView, queryHs: string): number | null {
  const scope = hsScopeOf(policy);
  if (scope.length === 0) return 0; // country-wide
  const q = digits(queryHs);
  let best = -1;
  for (const candidate of scope) {
    const c = digits(candidate);
    if (c.length > 0 && q.startsWith(c)) best = Math.max(best, c.length);
  }
  return best >= 0 ? best : null;
}

function numAttr(policy: PolicyView, key: string): number | null {
  const v = policy.attributes[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function specificRateOf(policy: PolicyView): { amount: number; currency: string; unit?: string } | null {
  const raw = policy.attributes.specificRate ?? policy.attributes.flat;
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const amount = typeof o.amount === 'number' ? o.amount : null;
    const currency = typeof o.currency === 'string' ? o.currency : null;
    if (amount !== null && currency) {
      const unit = typeof policy.attributes.unit === 'string' ? (policy.attributes.unit as string) : undefined;
      return { amount, currency, unit };
    }
  }
  return null;
}

interface Candidate {
  policy: PolicyView;
  applicability: number;
  preferentialUnder: string | null;
}

function tariffCandidates(policies: PolicyView[], queryHs: string): Candidate[] {
  const out: Candidate[] = [];
  for (const policy of policies) {
    if (policy.policyType !== 'tariff') continue;
    const applicability = hsApplicability(policy, queryHs);
    if (applicability === null) continue;
    const pref = policy.attributes.preferentialUnder;
    out.push({ policy, applicability, preferentialUnder: typeof pref === 'string' && pref ? pref.toUpperCase() : null });
  }
  return out;
}

/** Pick the most specific candidate (longest HS prefix; first wins on a tie). */
function mostSpecific(candidates: Candidate[]): Candidate | null {
  let best: Candidate | null = null;
  for (const c of candidates) {
    if (!best || c.applicability > best.applicability) best = c;
  }
  return best;
}

function tariffAmount(policy: PolicyView, query: DutyQuery): { amount: number; ratePercent: number | null; specific: DutyLine['specific'] } {
  const ratePercent = numAttr(policy, 'ratePercent');
  if (ratePercent !== null) {
    return { amount: round2((query.customsValue * ratePercent) / 100), ratePercent, specific: null };
  }
  const specific = specificRateOf(policy);
  if (specific && query.quantity && query.quantity > 0) {
    return { amount: round2(specific.amount * query.quantity), ratePercent: null, specific };
  }
  return { amount: 0, ratePercent: null, specific };
}

// ── Pure core ────────────────────────────────────────────────────────────────

/**
 * Compute a duty/tax estimate from already-resolved published policies and the
 * destination country's trade agreements. No I/O — fully unit-testable.
 */
export function computeEstimate(
  policies: PolicyView[],
  agreements: AgreementView[],
  query: DutyQuery,
): DutyEstimate {
  const notes: string[] = [];
  const lines: DutyLine[] = [];
  const currency = query.currency.toUpperCase();
  const dest = query.destinationCountryCode.toUpperCase();
  const origin = query.originCountryCode?.toUpperCase();

  // FTAs in force between origin and destination.
  const eligibleFtaCodes = new Set<string>();
  const ftaByCode = new Map<string, AgreementView>();
  if (origin && origin !== dest) {
    for (const agr of agreements) {
      const members = agr.memberCountryCodes.map((m) => m.toUpperCase());
      const inForce = !agr.status || agr.status.toUpperCase() === 'IN_FORCE';
      if (inForce && members.includes(dest) && members.includes(origin)) {
        eligibleFtaCodes.add(agr.recordKey.toUpperCase());
        ftaByCode.set(agr.recordKey.toUpperCase(), agr);
      }
    }
  }

  // ── Basic customs duty: MFN vs preferential ────────────────────────────────
  const candidates = tariffCandidates(policies, query.hsCode);
  const mfn = mostSpecific(candidates.filter((c) => c.preferentialUnder === null));
  const preferential = mostSpecific(candidates.filter((c) => c.preferentialUnder !== null && eligibleFtaCodes.has(c.preferentialUnder!)));

  let ftaApplied: FtaApplication | null = null;
  const chosen = preferential ?? mfn;
  if (chosen) {
    const calc = tariffAmount(chosen.policy, query);
    lines.push({
      key: 'bcd',
      label: chosen.policy.name || 'Basic Customs Duty',
      policyType: 'tariff',
      basisLabel: 'Customs value',
      ratePercent: calc.ratePercent,
      specific: calc.specific,
      base: query.customsValue,
      amount: calc.amount,
      sourceRecordKey: chosen.policy.recordKey,
      preferential: chosen.preferentialUnder !== null,
      ftaCode: chosen.preferentialUnder,
    });
    if (preferential && mfn) {
      const mfnCalc = tariffAmount(mfn.policy, query);
      const fta = ftaByCode.get(preferential.preferentialUnder!);
      ftaApplied = {
        code: preferential.preferentialUnder!,
        name: fta?.name ?? preferential.preferentialUnder!,
        mfnDuty: mfnCalc.amount,
        preferentialDuty: calc.amount,
        saving: round2(mfnCalc.amount - calc.amount),
      };
      notes.push(`FTA preference applied under ${ftaApplied.name}: duty ${ftaApplied.preferentialDuty} vs MFN ${ftaApplied.mfnDuty} (saving ${ftaApplied.saving} ${currency}).`);
    } else if (eligibleFtaCodes.size > 0 && !preferential) {
      notes.push(`Origin ${origin} qualifies under ${[...eligibleFtaCodes].join(', ')}, but no preferential tariff line is on file for HS ${query.hsCode} — MFN rate applied.`);
    }
  } else {
    notes.push(`No tariff line on file for HS ${query.hsCode} in ${dest} — basic customs duty estimated at 0.`);
  }

  // ── Additional duties (anti-dumping, countervailing, safeguard, surcharges) ─
  for (const policy of policies) {
    if (policy.policyType !== 'duty') continue;
    if (hsApplicability(policy, query.hsCode) === null) continue;
    const ratePercent = numAttr(policy, 'ratePercent');
    const specific = specificRateOf(policy);
    let amount = 0;
    if (ratePercent !== null) amount = round2((query.customsValue * ratePercent) / 100);
    else if (specific) amount = round2(specific.amount * (query.quantity && query.quantity > 0 ? query.quantity : 1));
    if (specific && specific.currency.toUpperCase() !== currency) {
      notes.push(`Duty "${policy.name}" is denominated in ${specific.currency}; shown without FX conversion.`);
    }
    const dutyType = typeof policy.attributes.dutyType === 'string' ? (policy.attributes.dutyType as string) : 'Duty';
    lines.push({
      key: `duty:${policy.recordKey}`,
      label: policy.name || dutyType,
      policyType: 'duty',
      basisLabel: ratePercent !== null ? 'Customs value' : 'Per unit',
      ratePercent,
      specific,
      base: query.customsValue,
      amount,
      sourceRecordKey: policy.recordKey,
      preferential: false,
      ftaCode: null,
    });
  }

  const dutiesTotal = round2(lines.reduce((sum, l) => sum + l.amount, 0));
  const taxBase = round2(query.customsValue + dutiesTotal);

  // ── Import taxes (VAT / GST) on value + duties ──────────────────────────────
  for (const policy of policies) {
    if (policy.policyType !== 'tax') continue;
    if (hsApplicability(policy, query.hsCode) === null) continue;
    const ratePercent = numAttr(policy, 'ratePercent');
    if (ratePercent === null) continue;
    const amount = round2((taxBase * ratePercent) / 100);
    lines.push({
      key: `tax:${policy.recordKey}`,
      label: policy.name || (typeof policy.attributes.taxName === 'string' ? (policy.attributes.taxName as string) : 'Import tax'),
      policyType: 'tax',
      basisLabel: 'Customs value + duties',
      ratePercent,
      specific: null,
      base: taxBase,
      amount,
      sourceRecordKey: policy.recordKey,
      preferential: false,
      ftaCode: null,
    });
  }

  const taxesTotal = round2(lines.filter((l) => l.policyType === 'tax').reduce((sum, l) => sum + l.amount, 0));
  const landedCost = round2(query.customsValue + dutiesTotal + taxesTotal);
  const effectiveDutyRatePercent = query.customsValue > 0 ? round2((dutiesTotal / query.customsValue) * 100) : 0;

  return {
    query,
    currency,
    customsValue: round2(query.customsValue),
    lines,
    totals: { duties: dutiesTotal, taxes: taxesTotal, landedCost, effectiveDutyRatePercent },
    ftaApplied,
    notes,
    disclaimer: DISCLAIMER,
  };
}

// ── DB orchestrator ──────────────────────────────────────────────────────────

/** Fetch the destination country's published tariff/duty/tax policies + agreements, then estimate. */
export async function estimateDuty(query: DutyQuery): Promise<DutyEstimate> {
  const countryId = await gckbRecordRepository.findCountryIdByCode(query.destinationCountryCode, null);
  if (!countryId) {
    return {
      query,
      currency: query.currency.toUpperCase(),
      customsValue: round2(query.customsValue),
      lines: [],
      totals: { duties: 0, taxes: 0, landedCost: round2(query.customsValue), effectiveDutyRatePercent: 0 },
      ftaApplied: null,
      notes: [`Country "${query.destinationCountryCode}" is not published in the knowledge base.`],
      disclaimer: DISCLAIMER,
    };
  }

  const [policyRecords, agreementRecords] = await Promise.all([
    searchPublished({ entityType: 'country_policy', countryId }),
    searchPublished({ entityType: 'trade_agreement' }),
  ]);

  const policies = policyRecords
    .map(toPolicyView)
    .filter((p) => p.policyType === 'tariff' || p.policyType === 'duty' || p.policyType === 'tax');
  const agreements = agreementRecords.map(toAgreementView);

  return computeEstimate(policies, agreements, query);
}

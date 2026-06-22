/**
 * @file server/rules/goods-screening.ts
 * @description Goods-restriction screening over the Rule/Policy Engine. Maps a
 * trade-goods description to engine facts, evaluates the `compliance.restricted-goods`
 * rule set (global baseline merged with any tenant override), and interprets the
 * result into an actionable decision plus required licenses/certificates.
 *
 * Every call is audited and emits a RULE_EVALUATED event via ruleService.evaluate —
 * the screening is therefore replayable and forensic by construction.
 */
import { NotFoundError } from '../db/errors';
import { ruleService, type ActorContext } from '../services/rule-service';
import { RESTRICTED_GOODS_KEY } from './baseline';
import { decisionOf, type Decision, type Effect, type EvaluationResult, type Facts } from './types';

export { RESTRICTED_GOODS_KEY };

export interface GoodsScreeningInput {
  hsCode?: string | null;
  productCategory?: string | null;
  originCountry?: string | null;
  destinationCountry?: string | null;
  direction?: 'IMPORT' | 'EXPORT' | 'BOTH';
  quantity?: number;
  value?: number;
  /** Extra free-form facts a tenant rule may reference (merged last, never overrides core facts). */
  metadata?: Record<string, unknown>;
}

export interface GoodsScreeningResult {
  decision: Decision;
  /** True when a hard restriction matched (decision === 'DENY'). */
  prohibited: boolean;
  /** True when clearance needs a manual decision (decision === 'REVIEW'). */
  requiresReview: boolean;
  /** License codes that must be presented (from REQUIRE_LICENSE obligations). */
  requiredLicenses: string[];
  /** Certificate codes that must be presented (from REQUIRE_CERTIFICATE obligations). */
  requiredCertificates: string[];
  /** Keys of the rules that matched, for traceability. */
  matchedRules: string[];
  /** Human-readable messages from the decision-bearing matched effects. */
  reasons: string[];
  /** Raw non-decisional obligations, passed through for callers that need params. */
  obligations: Effect[];
  evaluatedAt: string;
}

const dedupe = (values: string[]): string[] => [...new Set(values.filter((v) => v.length > 0))];

function obligationCode(effect: Effect, paramKey: string): string {
  const fromParams = effect.params?.[paramKey];
  if (typeof fromParams === 'string' && fromParams.length > 0) return fromParams;
  return effect.message ?? effect.type;
}

/** Translate the raw engine result into the screening contract. */
export function interpretScreening(result: EvaluationResult): GoodsScreeningResult {
  const requiredLicenses: string[] = [];
  const requiredCertificates: string[] = [];

  for (const effect of result.obligations) {
    const type = effect.type.toUpperCase();
    if (type === 'REQUIRE_LICENSE') requiredLicenses.push(obligationCode(effect, 'license'));
    else if (type === 'REQUIRE_CERTIFICATE') requiredCertificates.push(obligationCode(effect, 'certificate'));
  }

  const reasons = result.matches
    .flatMap((m) => m.effects)
    .filter((e) => decisionOf(e.type) !== null && typeof e.message === 'string')
    .map((e) => e.message as string);

  return {
    decision: result.decision,
    prohibited: result.decision === 'DENY',
    requiresReview: result.decision === 'REVIEW',
    requiredLicenses: dedupe(requiredLicenses),
    requiredCertificates: dedupe(requiredCertificates),
    matchedRules: result.matches.map((m) => m.ruleKey),
    reasons: dedupe(reasons),
    obligations: result.obligations,
    evaluatedAt: result.evaluatedAt,
  };
}

function buildFacts(input: GoodsScreeningInput): Facts {
  return {
    ...(input.metadata ?? {}),
    hsCode: input.hsCode ?? undefined,
    productCategory: input.productCategory ?? undefined,
    originCountry: input.originCountry ?? undefined,
    destinationCountry: input.destinationCountry ?? undefined,
    direction: input.direction ?? undefined,
    quantity: input.quantity,
    value: input.value,
  };
}

/**
 * Screen a set of goods against the restricted-goods rule set. Throws NotFoundError
 * (mapped to 404 by the HTTP layer) when no baseline or tenant set exists for the key.
 */
export async function screenGoods(ctx: ActorContext, input: GoodsScreeningInput): Promise<GoodsScreeningResult> {
  const result = await ruleService.evaluate(ctx, {
    ruleSetKey: RESTRICTED_GOODS_KEY,
    facts: buildFacts(input),
  });
  return interpretScreening(result);
}

/**
 * Best-effort variant for callers on a hot/critical path (e.g. the trade-compliance
 * gate). Returns null instead of throwing when the rule set is not seeded, so an
 * un-provisioned environment fails OPEN to the caller's existing screening logic.
 */
export async function tryScreenGoods(ctx: ActorContext, input: GoodsScreeningInput): Promise<GoodsScreeningResult | null> {
  try {
    return await screenGoods(ctx, input);
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    throw err;
  }
}

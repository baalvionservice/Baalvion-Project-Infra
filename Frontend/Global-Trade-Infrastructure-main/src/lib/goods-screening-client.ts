/**
 * @file goods-screening-client.ts
 * @description Browser client for restricted-goods screening. Calls the same-origin GTI route
 * handler `POST /api/compliance/goods-screening`, which evaluates the Rule/Policy Engine's
 * `compliance.restricted-goods` set (global baseline merged with the caller's tenant override)
 * and returns the decision plus any required licenses/certificates.
 *
 * Identity + tenant are injected server-side by the auth-gateway (same model as the sanctions
 * client); the browser only sends the goods description.
 */

export type GoodsDecision = 'ALLOW' | 'DENY' | 'REVIEW';

export interface GoodsScreeningResult {
  decision: GoodsDecision;
  /** True when a hard restriction matched (decision === 'DENY'). */
  prohibited: boolean;
  /** True when clearance needs a manual decision (decision === 'REVIEW'). */
  requiresReview: boolean;
  requiredLicenses: string[];
  requiredCertificates: string[];
  matchedRules: string[];
  reasons: string[];
  evaluatedAt: string;
}

export interface GoodsScreeningInput {
  hsCode?: string | null;
  productCategory?: string | null;
  originCountry?: string | null;
  destinationCountry?: string | null;
  direction?: 'IMPORT' | 'EXPORT' | 'BOTH';
  quantity?: number;
  value?: number;
}

function clean(input: GoodsScreeningInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (input.hsCode?.trim()) body.hsCode = input.hsCode.trim();
  if (input.productCategory?.trim()) body.productCategory = input.productCategory.trim();
  if (input.originCountry?.trim()) body.originCountry = input.originCountry.trim();
  if (input.destinationCountry?.trim()) body.destinationCountry = input.destinationCountry.trim();
  if (input.direction) body.direction = input.direction;
  if (typeof input.quantity === 'number') body.quantity = input.quantity;
  if (typeof input.value === 'number') body.value = input.value;
  return body;
}

/**
 * Screen goods against the restricted-goods rule set. Throws an Error (with a human-readable
 * message) on validation / network / upstream failure so the caller can render an error + retry.
 */
export async function screenGoods(input: GoodsScreeningInput): Promise<GoodsScreeningResult> {
  const body = clean(input);
  if (Object.keys(body).length === 0) {
    throw new Error('Provide at least an HS code or a product category to screen.');
  }

  let res: Response;
  try {
    res = await fetch('/api/compliance/goods-screening', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Network error — could not reach the screening service. Please retry.');
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = payload?.error || `Screening service returned ${res.status}.`;
    throw new Error(typeof msg === 'string' ? msg : `Screening service returned ${res.status}.`);
  }

  // GTI routes wrap success as { success, data, error }; tolerate a bare body too.
  const data = (payload?.data ?? payload) as Partial<GoodsScreeningResult> | null;
  if (!data || typeof data.decision !== 'string') {
    throw new Error('Malformed screening response.');
  }
  return {
    decision: data.decision as GoodsDecision,
    prohibited: data.prohibited ?? data.decision === 'DENY',
    requiresReview: data.requiresReview ?? data.decision === 'REVIEW',
    requiredLicenses: data.requiredLicenses ?? [],
    requiredCertificates: data.requiredCertificates ?? [],
    matchedRules: data.matchedRules ?? [],
    reasons: data.reasons ?? [],
    evaluatedAt: data.evaluatedAt ?? new Date().toISOString(),
  };
}

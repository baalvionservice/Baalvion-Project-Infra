export type PaidPlanSlug = "starter" | "growth" | "pro";

// news-service enforces quota as a rolling UTC-day cap (see Backend/services/knowledge/
// news-service/middleware/quota.js `dailyLimitFor`), while plans are marketed as a monthly
// allowance (see src/lib/plans.ts). Translate monthly -> daily by dividing by 30. Free tier
// gets no scope at all — it falls back to news-service's own default daily limit.
const MONTHLY_REQUESTS: Record<PaidPlanSlug, number> = {
  starter: 10_000,
  growth: 100_000,
  pro: 1_000_000,
};

export function dailyQuotaFor(plan: PaidPlanSlug): number {
  return Math.floor(MONTHLY_REQUESTS[plan] / 30);
}

export function dailyQuotaScope(plan: PaidPlanSlug): string {
  return `quota:${dailyQuotaFor(plan)}`;
}

const FREE_DAILY_LIMIT = 100;

/** Best-effort label for a key's current plan, derived from its `quota:<n>` scope. */
export function planLabelFromScopes(scopes: string[] | null | undefined): string {
  const scope = (scopes ?? []).find((s) => /^quota:\d+$/.test(s));
  if (!scope) return "Free";
  const n = Number(scope.split(":")[1]);
  if (n <= FREE_DAILY_LIMIT) return "Free";
  const entry = (Object.entries(MONTHLY_REQUESTS) as Array<[PaidPlanSlug, number]>).find(
    ([plan]) => dailyQuotaFor(plan) === n
  );
  if (!entry) return "Custom";
  const [plan] = entry;
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function dailyLimitFromScopes(scopes: string[] | null | undefined): number {
  const scope = (scopes ?? []).find((s) => /^quota:\d+$/.test(s));
  return scope ? Number(scope.split(":")[1]) : FREE_DAILY_LIMIT;
}

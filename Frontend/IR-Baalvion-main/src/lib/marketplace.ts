// Server-side reader for the investment marketplace (marketplace-service :3062). Public
// discovery only (live opportunities). Runs in RSC / route handlers so the service URL
// stays private. Falls back to an empty list if the service is unreachable.
const MARKETPLACE_URL = process.env.MARKETPLACE_SERVICE_URL || 'http://127.0.0.1:3062';

export interface Opportunity {
  id: string;
  org_id?: string;
  title: string;
  round: string | null;
  amount_sought: string | number | null;
  pre_money_valuation: string | number | null;
  equity_offered_pct: string | number | null;
  min_ticket: string | number | null;
  deadline: string | null;
  published_at: string | null;
  company?: {
    id: string;
    legal_name: string;
    brand_name?: string | null;
    industry_code?: string | null;
    stage?: string | null;
    country?: string | null;
  } | null;
}

export interface OpportunityFilters {
  industry?: string;
  stage?: string;
  country?: string;
  round?: string;
}

export async function getOpportunities(filters: OpportunityFilters = {}): Promise<Opportunity[]> {
  const qs = new URLSearchParams({ limit: '60' });
  for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
  try {
    const res = await fetch(`${MARKETPLACE_URL}/api/v1/opportunities?${qs.toString()}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data?.items) ? json.data.items : [];
  } catch {
    return [];
  }
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  try {
    const res = await fetch(`${MARKETPLACE_URL}/api/v1/opportunities/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

// Distinct filter facets derived from the live set (cheap — discovery is small).
export function deriveFacets(opps: Opportunity[]) {
  const uniq = (xs: (string | null | undefined)[]) => Array.from(new Set(xs.filter(Boolean) as string[])).sort();
  return {
    industries: uniq(opps.map((o) => o.company?.industry_code)),
    stages: uniq(opps.map((o) => o.company?.stage)),
    countries: uniq(opps.map((o) => o.company?.country)),
    rounds: uniq(opps.map((o) => o.round)),
  };
}

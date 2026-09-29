// Shared investor shape + money formatting. Lives here rather than in a page so the directory,
// the profile, the admin table and the sitemap all agree on how a cheque size reads.

export type Investor = {
  id: string;
  name: string;
  firm: string | null;
  title: string | null;
  avatar_url: string | null;
  thesis: string | null;
  focus_sectors: string[];
  stages: string[];
  check_min: number | null;
  check_max: number | null;
  location: string | null;
  portfolio: string[];
  deals_backed: number;
  is_verified: boolean;
  firm_type: string | null;
  region: string | null;
  headquarters: string | null;
  aum_usd: number | null;
  slug?: string;
  country?: string | null;
  country_slug?: string | null;
  state?: string | null;
  state_slug?: string | null;
  city?: string | null;
  city_slug?: string | null;
  // provenance — present on records compiled from public filings
  source?: string | null;
  source_url?: string | null;
  entity_type?: string | null;
  year_founded?: number | null;
  fund_count?: number | null;
  total_raised_usd?: number | null;
  first_filing_date?: string | null;
  last_filing_date?: string | null;
  last_verified_at?: string | null;
  // business contact as filed with the SEC — public, because the filer supplied it for
  // regulatory contact and EDGAR already publishes it
  street?: string | null;
  postal_code?: string | null;
  claimed_at?: string | null;
  // withheld from anonymous payloads — present only once signed in
  website?: string | null;
  linkedin_url?: string | null;
  email?: string | null;
  phone?: string | null;
  enrichment_confidence?: string | null;
};

export const money = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (n >= 1e9) return `$${n / 1e9 % 1 === 0 ? n / 1e9 : (n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${n / 1e6 % 1 === 0 ? n / 1e6 : (n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${n}`;
};

export const checkRange = (inv: Pick<Investor, "check_min" | "check_max">) =>
  inv.check_min != null && inv.check_max != null ? `${money(inv.check_min)} – ${money(inv.check_max)}` : "Flexible";

export const CHECK_BANDS: Record<string, [number, number]> = {
  "Under $250K": [0, 250_000],
  "$250K – $1M": [250_000, 1_000_000],
  "$1M – $5M": [1_000_000, 5_000_000],
  "$5M+": [5_000_000, Infinity],
};

export const checkMatch = (i: Investor, band: string) => {
  const b = CHECK_BANDS[band];
  if (!b) return true;
  const mid = ((i.check_min || 0) + (i.check_max || i.check_min || 0)) / 2;
  return mid >= b[0] && mid < b[1];
};

// Where an investor sits, most specific first — used in rows, headers and breadcrumbs.
export const placeLabel = (i: Pick<Investor, "city" | "state" | "country" | "location">) =>
  [i.city, i.state, i.country].filter(Boolean).join(", ") || i.location || "—";

export const initials = (n = "?") => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

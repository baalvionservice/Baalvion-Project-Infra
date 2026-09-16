// Anonymous reads for the open investor directory. Deliberately does NOT go through
// integrations/supabase/client — that transport carries session cookies, CSRF and a refresh
// loop, none of which a logged-out visitor has. These hit insiders-service's /v1/public/*
// endpoints directly (same-origin /insiders-api proxy in dev), so the directory renders for
// crawlers and first-time founders with no account.
//
// Contact channels (email, phone, website, linkedin, socials) are absent from every payload
// here by design — the backend never sends them unauthenticated. Signed-in pages layer those
// in separately via the authenticated client.

const INSIDERS: string = (import.meta as any).env?.VITE_INSIDERS_URL || "/insiders-api";

export type PublicInvestment = {
  id: string;
  target_company: string;
  round: string | null;
  amount_usd: number | null;
  invested_on: string | null;
  source_name: string | null;
  source_url: string | null;
};

export type PublicNews = {
  id: string;
  headline: string;
  summary: string | null;
  source: string | null;
  sentiment: string | null;
  published_at: string | null;
  url: string | null;
};

export type Place = { country?: string | null; country_slug?: string | null; state?: string | null; state_slug?: string | null; city?: string | null; city_slug?: string | null };

export type InvestorFund = {
  id: string;
  fund_name: string;
  cik: string | null;
  accession_number: string;
  fund_type: string | null;
  industry_group: string | null;
  entity_type: string | null;
  jurisdiction: string | null;
  year_of_inc: number | null;
  total_offering_usd: number | null;
  total_sold_usd: number | null;
  remaining_usd: number | null;
  min_investment_usd: number | null;
  investor_count: number | null;
  first_sale_date: string | null;
  filing_date: string | null;
  is_amendment: boolean;
  city: string | null;
  state_or_country: string | null;
  source_url: string | null;
};

export type InvestorPerson = {
  id: string;
  full_name: string;
  relationships: string[] | null;
  city: string | null;
  state_or_country: string | null;
  filings_count: number;
  first_seen: string | null;
  last_seen: string | null;
};

export type PublicInvestor = Place & {
  id: string;
  name: string;
  firm: string | null;
  title: string | null;
  avatar_url: string | null;
  thesis: string | null;
  focus_sectors: string[];
  stages: string[];
  region: string | null;
  firm_type: string | null;
  location: string | null;
  headquarters: string | null;
  check_min: number | null;
  check_max: number | null;
  aum_usd: number | null;
  portfolio: string[];
  deals_backed: number;
  is_verified: boolean;
  updated_at: string | null;
  slug: string;
  // provenance — where the record came from and when it was last confirmed
  source: string | null;
  source_url: string | null;
  entity_type: string | null;
  year_founded: number | null;
  fund_count: number | null;
  total_raised_usd: number | null;
  first_filing_date: string | null;
  last_filing_date: string | null;
  last_verified_at: string | null;
  // business contact as filed with the SEC
  street: string | null;
  postal_code: string | null;
  phone: string | null;
  claimed_at: string | null;
  recent_investments?: PublicInvestment[];
  news?: PublicNews[];
  funds?: InvestorFund[];
  people?: InvestorPerson[];
};

export type PublicFounder = Place & {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  company_name: string | null;
  company_about: string | null;
  headline: string | null;
  sector: string | null;
  stage: string | null;
  region: string | null;
  location: string | null;
  updated_at: string | null;
  slug: string;
};

export type CompanyFiling = {
  id: string;
  accession_number: string;
  cik: string | null;
  entity_name: string | null;
  industry_group: string | null;
  revenue_range: string | null;
  entity_type: string | null;
  jurisdiction: string | null;
  year_of_inc: number | null;
  total_offering_usd: number | null;
  total_sold_usd: number | null;
  remaining_usd: number | null;
  min_investment_usd: number | null;
  investor_count: number | null;
  has_non_accredited: boolean | null;
  first_sale_date: string | null;
  filing_date: string | null;
  is_amendment: boolean;
  city: string | null;
  state_or_country: string | null;
  source_url: string | null;
};

export type PublicCompany = Place & {
  id: string;
  name: string;
  cik: string | null;
  source: string | null;
  source_url: string | null;
  entity_type: string | null;
  jurisdiction: string | null;
  year_founded: number | null;
  industry_group: string | null;
  revenue_range: string | null;
  location: string | null;
  filing_count: number | null;
  total_raised_usd: number | null;
  largest_round_usd: number | null;
  first_filing_date: string | null;
  last_filing_date: string | null;
  last_verified_at: string | null;
  // national company registers — a registry record carries these instead of filings
  registry_name: string | null;
  registry_number: string | null;
  industry_code: string | null;
  legal_form: string | null;
  status: string | null;
  founded_on: string | null;
  website: string | null;
  employees: number | null;
  street: string | null;
  postal_code: string | null;
  phone: string | null;
  claimed_at: string | null;
  slug: string;
  filings?: CompanyFiling[];
  people?: InvestorPerson[];
};

export type EntityCounts = { countries: number; cities: number; states?: number; sectors?: number };

export type CompanyPage = {
  companies: PublicCompany[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  counts: EntityCounts;
  facets: { countries: Facet[]; states: Facet[]; cities: Facet[]; industries: Facet[] };
};

export type PersonHit = {
  full_name: string;
  relationships: string[] | null;
  city: string | null;
  state_or_country: string | null;
  last_seen: string | null;
  side: "investor" | "company";
  entity_id: string;
  entity_name: string;
  entity_slug: string;
};

export type Affiliation = {
  full_name: string;
  relationships: string[] | null;
  city: string | null;
  state_or_country: string | null;
  filings_count: number;
  first_seen: string | null;
  last_seen: string | null;
  side: "investor" | "company";
  entity_id: string;
  entity_name: string;
  entity_slug: string;
  entity_city: string | null;
  entity_state: string | null;
  entity_country: string | null;
  entity_kind: string | null;
};

export type Person = {
  slug: string;
  full_name: string;
  city: string | null;
  state_or_country: string | null;
  first_seen: string | null;
  last_seen: string | null;
  affiliations: Affiliation[];
};

export type PlaceNode = { name: string; slug: string; investors: number; founders: number };
export type CityNode = PlaceNode;
export type StateNode = PlaceNode & { cities: CityNode[] };
export type CountryNode = PlaceNode & { states: StateNode[]; cities: CityNode[] };
export type Places = {
  countries: CountryNode[];
  totals: { countries: number; cities: number; investors: number; founders: number };
};

export type PlaceQuery = { country?: string; state?: string; city?: string };
export type InvestorQuery = PlaceQuery & { q?: string; type?: string; type_slug?: string; sort?: string; page?: number; limit?: number };

export type Facet = { value: string; n: number };
export type InvestorPage = {
  investors: PublicInvestor[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  counts: EntityCounts;
  facets: { countries: Facet[]; states: Facet[]; cities: Facet[]; types: Facet[] };
};

const qs = (q: Record<string, unknown>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
};

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(`${INSIDERS}${path}`, { headers: { Accept: "application/json" } });
  const body = await r.json().catch(() => null);
  if (!r.ok || !body?.success) throw new Error(body?.message || `Request failed (${r.status})`);
  return body.data as T;
}

// Paged: the directory is far too large to hand the browser in one response.
export async function listPublicInvestors(where: InvestorQuery = {}): Promise<InvestorPage> {
  return getJson<InvestorPage>(`/v1/public/investors${qs(where)}`);
}

export async function listPublicFounders(where: PlaceQuery = {}): Promise<PublicFounder[]> {
  const d = await getJson<{ founders: PublicFounder[] }>(`/v1/public/founders${qs(where)}`);
  return d.founders || [];
}

export async function getPublicFounder(id: string): Promise<PublicFounder | null> {
  try {
    const d = await getJson<{ founder: PublicFounder }>(`/v1/public/founders/${encodeURIComponent(id)}`);
    return d.founder || null;
  } catch {
    return null;
  }
}

export async function listPublicCompanies(
  where: PlaceQuery & { q?: string; industry?: string; industry_slug?: string; sort?: string; page?: number; limit?: number } = {},
): Promise<CompanyPage> {
  return getJson<CompanyPage>(`/v1/public/companies${qs(where)}`);
}

export async function getPublicCompany(id: string): Promise<PublicCompany | null> {
  try {
    const d = await getJson<{ company: PublicCompany }>(`/v1/public/companies/${encodeURIComponent(id)}`);
    return d.company || null;
  } catch {
    return null;
  }
}

// Searches the people named on filings across both sides of the directory at once.
export async function searchPeople(q: string, limit = 30): Promise<PersonHit[]> {
  if (q.trim().length < 2) return [];
  const d = await getJson<{ people: PersonHit[] }>(`/v1/public/people${qs({ q: q.trim(), limit })}`);
  return d.people || [];
}

export async function getPerson(slug: string): Promise<Person | null> {
  try {
    const d = await getJson<{ person: Person }>(`/v1/public/people/${encodeURIComponent(slug)}`);
    return d.person || null;
  } catch {
    return null;
  }
}

export type ClaimInput = {
  entity_type: "investor" | "company";
  entity_id: string;
  claimant_name: string;
  claimant_email: string;
  claimant_role?: string;
  claimant_phone?: string;
  evidence_url?: string;
  message?: string;
};

// Unauthenticated on purpose — see the note in the backend claim controller.
export async function submitClaim(input: ClaimInput): Promise<{ id: string; status: string }> {
  const r = await fetch(`${INSIDERS}/v1/public/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  const body = await r.json().catch(() => null);
  if (!r.ok || !body?.success) throw new Error(body?.message || `Could not send the claim (${r.status})`);
  return body.data.claim;
}

export type Article = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body?: string;
  topic: string | null;
  reading_mins: number | null;
  published_at: string | null;
  updated_at: string | null;
};

export async function listArticles(topic?: string): Promise<{ articles: Article[]; topics: Facet[] }> {
  return getJson<{ articles: Article[]; topics: Facet[] }>(`/v1/public/articles${qs({ topic })}`);
}

export async function getArticle(slug: string): Promise<{ article: Article; related: Article[] } | null> {
  try {
    return await getJson<{ article: Article; related: Article[] }>(`/v1/public/articles/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function listPlaces(): Promise<Places> {
  return getJson<Places>("/v1/public/places");
}

export async function getPublicInvestor(id: string): Promise<PublicInvestor | null> {
  try {
    const d = await getJson<{ investor: PublicInvestor }>(`/v1/public/investors/${encodeURIComponent(id)}`);
    return d.investor || null;
  } catch {
    return null;
  }
}

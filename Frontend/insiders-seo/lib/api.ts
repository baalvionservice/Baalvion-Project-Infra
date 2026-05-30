// Server-side data client for the public SEO site. Fetches the curated, PII-safe public endpoints
// on insiders-service. ISR-cached (revalidate) so new founders/investors get indexed within minutes.
const BASE = (process.env.INSIDERS_API_URL || "http://localhost:3050/v1").replace(/\/$/, "");
export const SITE_URL = (process.env.SITE_URL || "https://insiders.baalvion.com").replace(/\/$/, "");
export const REVALIDATE = 300; // seconds

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: REVALIDATE } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? null) as T;
  } catch {
    return null;
  }
}

export type Founder = {
  id: string; slug: string; username?: string | null; full_name?: string | null; avatar_url?: string | null;
  bio?: string | null; company_name?: string | null; company_about?: string | null; headline?: string | null;
  sector?: string | null; stage?: string | null; region?: string | null; website?: string | null;
  linkedin_url?: string | null; updated_at?: string | null;
};

export type Investment = {
  target_company: string; round?: string | null; amount_usd?: number | null; invested_on?: string | null;
  source_name?: string | null; source_url?: string | null;
};

export type Investor = {
  id: string; slug: string; name?: string | null; firm?: string | null; title?: string | null;
  avatar_url?: string | null; thesis?: string | null; focus_sectors?: string[] | null; stages?: string[] | null;
  region?: string | null; firm_type?: string | null; location?: string | null; website?: string | null;
  linkedin_url?: string | null; deals_backed?: number | null; is_verified?: boolean | null; updated_at?: string | null;
  recent_investments?: Investment[];
};

export const getFounders = async (): Promise<Founder[]> => (await get<{ founders: Founder[] }>("/public/founders"))?.founders ?? [];
export const getInvestors = async (): Promise<Investor[]> => (await get<{ investors: Investor[] }>("/public/investors"))?.investors ?? [];
export const getInvestor = async (id: string): Promise<Investor | null> => (await get<{ investor: Investor }>(`/public/investors/${id}`))?.investor ?? null;
export const getFounder = async (id: string): Promise<Founder | null> => (await get<{ founder: Founder }>(`/public/founders/${id}`))?.founder ?? null;

// slug → entity resolution (slugs are "<kebab-name>-<8hex>"; we match against the live list).
export const findFounderBySlug = async (slug: string) => (await getFounders()).find((f) => f.slug === slug) ?? null;
export const findInvestorBySlug = async (slug: string) => (await getInvestors()).find((i) => i.slug === slug) ?? null;

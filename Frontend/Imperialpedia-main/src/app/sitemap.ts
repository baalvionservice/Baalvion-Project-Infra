import { MetadataRoute } from 'next';
import { env } from '@/config/env';

// Render at request time, never at build time. This route fetches from
// imperialpedia-service + cms-service, and a build-time fetch against an
// unreachable API blocks `next build` (CI timeout). force-dynamic guarantees
// the production build never depends on an external service.
export const dynamic = 'force-dynamic';

// Hard cap on any sitemap fetch so a slow/hung upstream degrades to the static
// routes instead of hanging the request.
const FETCH_TIMEOUT_MS = 4000;

const BASE = env.siteUrl || 'https://imperialpedia.com';
const IS_PROD = process.env.NODE_ENV === 'production';
const IMP = process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || (IS_PROD ? '' : 'http://localhost:3004/api/v1');
const CMS = process.env.NEXT_PUBLIC_CMS_PUBLIC_URL || (IS_PROD ? '' : 'http://localhost:3018/api/v1/public');
const SITE = process.env.NEXT_PUBLIC_CMS_SITE_SLUG || 'imperialpedia';

type Slugged = { slug: string; name?: string; updatedAt?: string; publishedAt?: string };

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  // No absolute base URL configured (production with an unset API env) → fail closed
  // to static routes without attempting a relative fetch (which throws under Node).
  if (!/^https?:\/\//i.test(url)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
// Structured entities (company/country/industry/technology/term/review) — imperialpedia-service.
async function entityItems(type: string): Promise<Slugged[]> {
  const j = await fetchJson(`${IMP}/entities?type=${type}&limit=1000`);
  return ((j?.data as { items?: Slugged[] })?.items ?? []) as Slugged[];
}
// Published editorial content (article/news) — cms-service public delivery API.
async function cmsItems(contentType: string): Promise<Slugged[]> {
  const j = await fetchJson(`${CMS}/${SITE}/content?contentType=${contentType}&limit=1000`);
  return ((j?.data as Slugged[]) ?? []) as Slugged[];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/articles`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/news`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/market`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/explore`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/topics`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/financial-tools`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/financial-tools/compound-interest`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/financial-tools/inflation`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/financial-tools/investment`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/financial-tools/loan`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/financial-tools/portfolio`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/financial-tools/retirement`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/ai-analyst`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/ai-analyst/daily-briefing`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/ai-analyst/macro-summary`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/ai-analyst/earnings-summary`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/ai-analyst/sector-overview`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/ai-analyst/risk-detection`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/stocks`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/bonds`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/etfs`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/crypto`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE}/commodities`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/options`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/market-news`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE}/live-market-news`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE}/earnings`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/calendar`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/indicators`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/economy`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/inflation`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/interest-rates`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/fed`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/gdp`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/fiscal-policy`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/monetary-policy`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/unemployment`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/global`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/world`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/countries`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/companies`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/industries`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/technologies`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/investing`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/personal-finance`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/banking`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/budgeting`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/savings`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/credit`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/credit-cards`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/mortgages`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/loans`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/insurance`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/retirement`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/taxes`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/debt`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/income`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/emergency-fund`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/estate-planning`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/planning`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/real-estate`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/brokers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/robo-advisors`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/reviews`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/community`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/community/discussions`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE}/community/debates`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE}/creators`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/learning-paths`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/transparency`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms-of-service`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/disclaimer`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const [companies, countries, industries, technologies, terms, reviews, articles, news] =
    await Promise.all([
      entityItems('company'),
      entityItems('country'),
      entityItems('industry'),
      entityItems('technology'),
      entityItems('term'),
      entityItems('review'),
      cmsItems('article'),
      cmsItems('news'),
    ]);

  const entRoutes = (items: Slugged[], prefix: string, priority = 0.6): MetadataRoute.Sitemap =>
    items
      .filter((e) => e?.slug)
      .map((e) => ({
        url: `${BASE}${prefix}/${e.slug}`,
        lastModified: e.updatedAt ? new Date(e.updatedAt) : now,
        changeFrequency: 'weekly',
        priority,
      }));

  // Glossary terms live at /terms/{letter}/{slug} (letter from the term title).
  const termRoutes: MetadataRoute.Sitemap = terms
    .filter((t) => t?.slug)
    .map((t) => {
      const c = (t.name || t.slug).charAt(0).toLowerCase();
      const letter = /^[0-9]/.test(c) ? 'num' : c;
      return { url: `${BASE}/terms/${letter}/${t.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 };
    });

  // Review guides + published news live at the root slug (/best-online-brokers, /{news-slug}).
  const reviewRoutes: MetadataRoute.Sitemap = reviews
    .filter((r) => r?.slug)
    .map((r) => ({ url: `${BASE}/${r.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 }));

  const articleRoutes: MetadataRoute.Sitemap = articles
    .filter((a) => a?.slug)
    .map((a) => ({ url: `${BASE}/articles/${a.slug}`, lastModified: a.publishedAt ? new Date(a.publishedAt) : now, changeFrequency: 'weekly', priority: 0.7 }));

  const newsRoutes: MetadataRoute.Sitemap = news
    .filter((n) => n?.slug)
    .map((n) => ({ url: `${BASE}/${n.slug}`, lastModified: n.publishedAt ? new Date(n.publishedAt) : now, changeFrequency: 'daily', priority: 0.8 }));

  const all: MetadataRoute.Sitemap = [
    ...staticRoutes,
    ...entRoutes(companies, '/companies', 0.7),
    ...entRoutes(countries, '/countries'),
    ...entRoutes(industries, '/industries'),
    ...entRoutes(technologies, '/technologies'),
    ...termRoutes,
    ...reviewRoutes,
    ...articleRoutes,
    ...newsRoutes,
  ];

  // Dedupe by URL.
  const seen = new Set<string>();
  return all.filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true)));
}

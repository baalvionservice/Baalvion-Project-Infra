/**
 * CMS content layer — the single source of editorial/static content for Amarisé.
 * Reads the LIVE central cms-service public delivery API (no auth, published-only):
 *   GET /api/v1/public/:slug                       → website info
 *   GET /api/v1/public/:slug/content?...           → list content (published+public)
 *   GET /api/v1/public/:slug/content/:contentSlug  → single content
 *
 * This replaces the in-memory editorial mock (src/lib/mock-data.ts). Every page that
 * used MAISON_STORY / CUSTOMER_SERVICE / CITIES / BUYING_GUIDES / editorials now reads
 * here, so the content is centrally managed from the admin console (/cms/websites/...).
 *
 * Usable directly from Server Components (it `fetch`es dynamically with `cache: 'no-store'`,
 * so content is fetched live per request). Each reader
 * degrades to `null`/`[]` on any failure so a CMS outage never breaks a page render —
 * callers supply their own last-resort fallback copy where appropriate.
 */
import type { CountryCode } from './types';

// Central CMS public delivery base, ending at `/api/v1`. The website is addressed by slug.
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3011/api/v1';
const WEBSITE_SLUG = process.env.NEXT_PUBLIC_CMS_WEBSITE_SLUG || 'amarise-maison-avenue';

const PUBLIC_BASE = `${CMS_URL}/public/${WEBSITE_SLUG}`;

// ── Wire shapes returned by cms-service public delivery ──────────────────────
interface CmsBlock {
  id: string;
  type: string; // 'paragraph' | 'heading' | 'html' | ...
  order?: number;
  content?: Record<string, unknown>;
}

export interface CmsContent {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  contentType?: string;
  featuredImage?: string | null;
  contentBlocks?: CmsBlock[];
  customFields?: Record<string, any>;
  seoMetadata?: { title?: string; description?: string } | null;
  categoryId?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
}

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${PUBLIC_BASE}${path}`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    const json = await res.json();
    return (json && json.data !== undefined ? json.data : fallback) as T;
  } catch (err) {
    // eslint-disable-next-line no-console -- deliberate operator diagnostic: CMS fetch failed, using fallback
    console.error('[cms] fetch failed', path, err);
    return fallback;
  }
}

/** Single content item by slug, or null when absent / unpublished / CMS down. */
export async function getContent(slug: string): Promise<CmsContent | null> {
  return getJson<CmsContent | null>(`/content/${slug}`, null);
}

/** A page of content filtered by contentType and/or `customFields.kind`. */
export async function listContent(opts: {
  contentType?: string;
  kind?: string;
  limit?: number;
  page?: number;
} = {}): Promise<CmsContent[]> {
  const qs = new URLSearchParams();
  if (opts.contentType) qs.set('contentType', opts.contentType);
  if (opts.limit) qs.set('limit', String(opts.limit));
  if (opts.page) qs.set('page', String(opts.page));
  const q = qs.toString();
  const data = await getJson<CmsContent[] | { items?: CmsContent[] }>(
    `/content${q ? `?${q}` : ''}`,
    []
  );
  const items = Array.isArray(data) ? data : data.items || [];
  if (!opts.kind) return items;
  return items.filter((c) => c.customFields?.kind === opts.kind);
}

// ── Block → plain text/paragraph helpers (pages that render prose) ───────────
export interface ProseBlock {
  type: 'heading' | 'paragraph' | 'html';
  text: string;
  level?: number;
}

/** Normalise CMS contentBlocks into a simple prose list the pages can map over. */
export function toProse(content: CmsContent | null): ProseBlock[] {
  if (!content?.contentBlocks) return [];
  return content.contentBlocks
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((b) => {
      const c = b.content || {};
      if (b.type === 'heading')
        return { type: 'heading' as const, text: String((c as any).text ?? ''), level: Number((c as any).level ?? 2) };
      if (b.type === 'html')
        return { type: 'html' as const, text: String((c as any).html ?? '') };
      return { type: 'paragraph' as const, text: String((c as any).text ?? '') };
    });
}

// ── Typed domain readers (contract shared with the seed script) ──────────────

export interface MaisonStoryContent {
  title: string;
  subtitle: string;
  philosophy: string;
  history: { year: string; milestone: string; description: string }[];
  craftsmanship: { title: string; description: string; imageUrl?: string }[];
  sustainability: string;
  institutionalCharter?: string;
}

/** The Maison heritage story (slug `maison-story`, customFields carries the structure). */
export async function getMaisonStory(): Promise<MaisonStoryContent | null> {
  const c = await getContent('maison-story');
  const cf = c?.customFields;
  if (!cf) return null;
  return {
    title: cf.title ?? c!.title,
    subtitle: cf.subtitle ?? '',
    philosophy: cf.philosophy ?? '',
    history: Array.isArray(cf.history) ? cf.history : [],
    craftsmanship: Array.isArray(cf.craftsmanship) ? cf.craftsmanship : [],
    sustainability: cf.sustainability ?? '',
    institutionalCharter: cf.institutionalCharter,
  };
}

export interface CustomerServiceContent {
  shipping: string;
  returns: string;
  faqs: { question: string; answer: string }[];
}

/** Per-country customer-service copy (slug `customer-service`, customFields.byCountry). */
export async function getCustomerService(
  country: CountryCode
): Promise<CustomerServiceContent | null> {
  const c = await getContent('customer-service');
  const byCountry = c?.customFields?.byCountry;
  if (!byCountry) return null;
  return (byCountry[country] || byCountry.us) ?? null;
}

export interface CityContent {
  id: string;
  name: string;
  countryCode: CountryCode;
  description: string;
  heroImage: string;
  trends: { title: string; description: string }[];
  featuredCollections: string[];
  featuredProducts: string[];
}

/** All city editorials (contentType `post`, kind `city`). */
export async function getCities(): Promise<CityContent[]> {
  const items = await listContent({ contentType: 'post', kind: 'city', limit: 50 });
  return items.map((c) => ({
    id: c.slug,
    name: c.customFields?.name ?? c.title,
    countryCode: (c.customFields?.countryCode ?? 'us') as CountryCode,
    description: c.customFields?.description ?? c.excerpt ?? '',
    heroImage: c.customFields?.heroImage ?? c.featuredImage ?? '',
    trends: Array.isArray(c.customFields?.trends) ? c.customFields!.trends : [],
    featuredCollections: c.customFields?.featuredCollections ?? [],
    featuredProducts: c.customFields?.featuredProducts ?? [],
  }));
}

export async function getCity(id: string): Promise<CityContent | null> {
  const c = await getContent(id);
  if (!c || c.customFields?.kind !== 'city') return null;
  return {
    id: c.slug,
    name: c.customFields?.name ?? c.title,
    countryCode: (c.customFields?.countryCode ?? 'us') as CountryCode,
    description: c.customFields?.description ?? c.excerpt ?? '',
    heroImage: c.customFields?.heroImage ?? c.featuredImage ?? '',
    trends: Array.isArray(c.customFields?.trends) ? c.customFields!.trends : [],
    featuredCollections: c.customFields?.featuredCollections ?? [],
    featuredProducts: c.customFields?.featuredProducts ?? [],
  };
}

export interface BuyingGuideContent {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  tips: string[];
  imageUrl: string;
  category: string;
  author: string;
  date: string;
  targetKeyword?: string;
  investmentOutlook?: string;
}

/** Buying guides (contentType `post`, kind `buying-guide`). */
export async function getBuyingGuides(): Promise<BuyingGuideContent[]> {
  const items = await listContent({ contentType: 'post', kind: 'buying-guide', limit: 100 });
  return items.map(mapBuyingGuide);
}

export async function getBuyingGuide(id: string): Promise<BuyingGuideContent | null> {
  const c = await getContent(id);
  if (!c || c.customFields?.kind !== 'buying-guide') return null;
  return mapBuyingGuide(c);
}

function mapBuyingGuide(c: CmsContent): BuyingGuideContent {
  const prose = toProse(c).filter((p) => p.type === 'paragraph').map((p) => p.text);
  return {
    id: c.slug,
    title: c.title,
    excerpt: c.excerpt ?? '',
    content: prose.join('\n\n'),
    tips: Array.isArray(c.customFields?.tips) ? c.customFields!.tips : [],
    imageUrl: c.featuredImage ?? c.customFields?.imageUrl ?? '',
    category: c.customFields?.category ?? 'Artisanal',
    author: c.customFields?.author ?? 'Maison Amarisé',
    date: c.customFields?.date ?? c.publishedAt ?? '',
    targetKeyword: c.customFields?.targetKeyword,
    investmentOutlook: c.customFields?.investmentOutlook,
  };
}

export interface EditorialContent {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: string;
  author: string;
  date: string;
  targetKeyword?: string;
  metaDescription?: string;
}

/** Editorials / journal articles (contentType `news`, kind `editorial`). */
export async function getEditorials(): Promise<EditorialContent[]> {
  const items = await listContent({ contentType: 'news', kind: 'editorial', limit: 100 });
  return items.map(mapEditorial);
}

export async function getEditorial(id: string): Promise<EditorialContent | null> {
  const c = await getContent(id);
  if (!c) return null;
  return mapEditorial(c);
}

export interface MembershipPlanContent {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  tier: string;
  isPopular?: boolean;
  features: string[];
}

/** Membership/subscription tiers (slug `membership-plans`, customFields.plans[]). */
export async function getMembershipPlans(): Promise<MembershipPlanContent[]> {
  const c = await getContent('membership-plans');
  const plans = c?.customFields?.plans;
  if (!Array.isArray(plans)) return [];
  return plans.map((p: any) => ({
    id: String(p.id),
    name: String(p.name),
    price: Number(p.price),
    currency: String(p.currency ?? 'USD'),
    interval: String(p.interval ?? 'yearly'),
    tier: String(p.tier ?? ''),
    isPopular: Boolean(p.isPopular),
    features: Array.isArray(p.features) ? p.features.map(String) : [],
  }));
}

function mapEditorial(c: CmsContent): EditorialContent {
  const prose = toProse(c).filter((p) => p.type === 'paragraph').map((p) => p.text);
  return {
    id: c.slug,
    title: c.title,
    excerpt: c.excerpt ?? '',
    content: prose.join('\n\n'),
    imageUrl: c.featuredImage ?? c.customFields?.imageUrl ?? '',
    category: c.customFields?.category ?? 'Artisanal',
    author: c.customFields?.author ?? 'Elena Vance',
    date: c.customFields?.date ?? c.publishedAt ?? '',
    targetKeyword: c.customFields?.targetKeyword,
    metaDescription: c.seoMetadata?.description ?? c.excerpt ?? '',
  };
}

// ── Homepage (slug `homepage`) ───────────────────────────────────────────────
// The entire storefront landing page is ONE admin-editable CMS document. Every
// image is a URL the owner pastes from the admin Media library (or any URL); a
// missing image degrades gracefully through <BrandImage>. The page falls back to
// HOMEPAGE_FALLBACK (src/lib/mock-data) when the CMS is unseeded or unreachable,
// so the homepage is never blank. All `href` values are country-LESS paths
// (e.g. `/category/new-arrivals-handbags`); the page prepends the active market.
export interface HomepageHero {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  image: string;
}
export interface HomepageCollectionTile {
  title: string;
  subtitle: string;
  image: string;
  href: string;
}
export interface HomepageNewArrivals {
  title: string;
  subtitle: string;
  /** Optional commerce filters — which live products to feature. */
  categoryId?: string;
  collectionId?: string;
  limit: number;
  ctaLabel: string;
  ctaHref: string;
}
export interface HomepageService {
  /** lucide-react icon name, e.g. 'ShieldCheck' | 'Repeat' | 'Gem'. */
  icon: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
}
export interface HomepageTrust {
  title: string;
  body: string;
  badge: string;
  points: string[];
}
export interface HomepageTestimonial {
  quote: string;
  author: string;
  location: string;
}
export interface HomepageContent {
  hero: HomepageHero;
  announcements: string[];
  featuredCollections: HomepageCollectionTile[];
  newArrivals: HomepageNewArrivals;
  services: HomepageService[];
  trust: HomepageTrust;
  testimonials: HomepageTestimonial[];
  pressTitle: string;
  pressSubtitle: string;
}

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** The storefront landing page payload (slug `homepage`, structured customFields). */
export async function getHomepage(): Promise<HomepageContent | null> {
  const c = await getContent('homepage');
  const cf = c?.customFields;
  if (!cf) return null;
  const hero = cf.hero ?? {};
  const na = cf.newArrivals ?? {};
  const trust = cf.trust ?? {};
  const press = cf.press ?? {};
  return {
    hero: {
      eyebrow: hero.eyebrow ?? '',
      title: hero.title ?? c!.title,
      subtitle: hero.subtitle ?? c!.excerpt ?? '',
      ctaLabel: hero.ctaLabel ?? 'Discover the Collection',
      ctaHref: hero.ctaHref ?? '/category/new-arrivals-handbags',
      secondaryCtaLabel: hero.secondaryCtaLabel,
      secondaryCtaHref: hero.secondaryCtaHref,
      image: hero.image ?? c!.featuredImage ?? '',
    },
    announcements: asArray<unknown>(cf.announcements).map(String),
    featuredCollections: asArray<Record<string, unknown>>(cf.featuredCollections).map((t) => ({
      title: String(t.title ?? ''),
      subtitle: String(t.subtitle ?? ''),
      image: String(t.image ?? ''),
      href: String(t.href ?? '#'),
    })),
    newArrivals: {
      title: na.title ?? 'New Arrivals',
      subtitle: na.subtitle ?? '',
      categoryId: na.categoryId || undefined,
      collectionId: na.collectionId || undefined,
      limit: Number(na.limit ?? 8),
      ctaLabel: na.ctaLabel ?? 'Shop All New Arrivals',
      ctaHref: na.ctaHref ?? '/category/new-arrivals-handbags',
    },
    services: asArray<Record<string, unknown>>(cf.services).map((s) => ({
      icon: String(s.icon ?? 'Sparkles'),
      title: String(s.title ?? ''),
      body: String(s.body ?? ''),
      ctaLabel: String(s.ctaLabel ?? 'Learn More'),
      href: String(s.href ?? '#'),
    })),
    trust: {
      title: trust.title ?? '',
      body: trust.body ?? '',
      badge: trust.badge ?? '100% Authentic',
      points: asArray<unknown>(trust.points).map(String),
    },
    testimonials: asArray<Record<string, unknown>>(cf.testimonials).map((t) => ({
      quote: String(t.quote ?? ''),
      author: String(t.author ?? ''),
      location: String(t.location ?? ''),
    })),
    pressTitle: press.title ?? cf.pressTitle ?? 'As Seen In',
    pressSubtitle: press.subtitle ?? cf.pressSubtitle ?? '',
  };
}

// ── Press / Media (slug `press`) ─────────────────────────────────────────────
export interface PressLogo {
  name: string;
  image: string;
  href: string;
}
export interface PressArticle {
  title: string;
  outlet: string;
  date: string;
  excerpt: string;
  href: string;
  image?: string;
}
export interface PressContent {
  title: string;
  subtitle: string;
  logos: PressLogo[];
  articles: PressArticle[];
}

/** Press logos + media coverage (slug `press`, customFields.logos[]/articles[]). */
export async function getPressItems(): Promise<PressContent | null> {
  const c = await getContent('press');
  const cf = c?.customFields;
  if (!cf) return null;
  return {
    title: cf.title ?? c!.title ?? 'Press',
    subtitle: cf.subtitle ?? c!.excerpt ?? '',
    logos: asArray<Record<string, unknown>>(cf.logos).map((l) => ({
      name: String(l.name ?? ''),
      image: String(l.image ?? ''),
      href: String(l.href ?? '#'),
    })),
    articles: asArray<Record<string, unknown>>(cf.articles).map((a) => ({
      title: String(a.title ?? ''),
      outlet: String(a.outlet ?? ''),
      date: String(a.date ?? ''),
      excerpt: String(a.excerpt ?? ''),
      href: String(a.href ?? '#'),
      image: a.image ? String(a.image) : undefined,
    })),
  };
}

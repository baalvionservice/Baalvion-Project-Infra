import type { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

// Hard cap so a slow/hung law-service response falls back to the slug-derived
// title instead of blocking metadata generation and the page render.
const FETCH_TIMEOUT_MS = 4000;

async function fetchCategory(slug: string): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(`${API}/categories`, { next: { revalidate: 3600 }, signal: controller.signal });
    if (!r.ok) return null;
    const j = await r.json();
    const list = Array.isArray(j?.data) ? j.data : (j?.data?.items || []);
    return list.find((c: any) => c.slug === slug) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ categorySlug: string }> },
): Promise<Metadata> {
  const { categorySlug } = await params;
  const cat = await fetchCategory(categorySlug);
  const name = cat?.name || titleCase(categorySlug);
  const title = `${name} Attorneys & Legal Services | Law Elite Network`;
  const description = cat?.description
    || `Find verified ${name} lawyers across 188 countries and read expert ${name} guides on Law Elite Network.`;
  const url = `${SITE}/law/${categorySlug}`;
  return {
    title,
    description,
    keywords: [name, `${name} lawyer`, `${name} attorney`, 'legal advice', 'find a lawyer'],
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url, title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// CollectionPage/BreadcrumbList JSON-LD used to live here, but a layout wraps
// EVERY nested route below it -- including /law/[categorySlug]/[subSlug]/[articleSlug],
// which now has its own (more complete) BreadcrumbList. That meant an article page
// rendered two conflicting BreadcrumbList blocks: the category's 2-level trail from
// here, plus the article's real 4-level one. Moved to page.tsx, which only renders
// for this exact route, not for deeper nested ones.
export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}

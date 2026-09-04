import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Twitter, Flag } from 'lucide-react';
import { cmsGetArticles } from '@/lib/cms';
import { getArticlesByCategorySlug } from '@/data/law-content';
import { resolveArticleImage } from '@/lib/article-art';
import { articleUrl } from '@/lib/article-url';
import { CURRENT_CATEGORY_SLUGS } from '@/lib/category-slugs';
import { AdSlot } from '@/components/ads/AdSlot';

// AdSense-readiness retirement (see category-slugs.ts's CURRENT_CATEGORY_SLUGS
// comment): "Trending Now" below is sourced site-wide (not scoped to the
// current article's own category, unlike "More in Category"), so without this
// it would render on a KEPT-category article page while linking to a
// retired-category one via articleUrl()'s /article/{slug} fallback -- a live,
// indexed page pointing straight into the gap. cms.ts already normalizes
// category.slug via toNewCategorySlug, so no renormalization needed here.
const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
function isKeptCategory(categorySlug: string | undefined): boolean {
  return !categorySlug || currentSlugSet.has(categorySlug);
}

// Same AdSense slot as AD_PLACEMENTS.SIDEBAR_TOP (AdManager.tsx) -- literal
// because that file is 'use client' and its export doesn't survive an import
// into a server component (resolved to a client-ref stub with no keys).
const SIDEBAR_AD_SLOT_ID = '4123514154';

const CARD = 'rounded-lg border border-slate-200 border-t-4 border-t-blue-600 p-5 bg-white';
const LABEL = 'mb-3 text-[11px] font-black uppercase tracking-widest text-blue-700';

interface SidebarArticle {
  id: string;
  slug: string;
  title: string;
  categorySlug?: string;
  categoryName?: string;
  featuredImage?: string;
  views?: number;
}

async function moreInCategory(categorySlug: string | undefined, excludeSlug: string): Promise<SidebarArticle[]> {
  if (!categorySlug) return [];
  const bundled = getArticlesByCategorySlug(categorySlug).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    categorySlug: a.category.slug,
    categoryName: a.category.name,
  }));
  try {
    const cms = await cmsGetArticles(undefined, categorySlug);
    const bySlug = new Map<string, SidebarArticle>();
    for (const a of [...bundled, ...cms.filter((c) => c.slug)]) {
      bySlug.set(a.slug!, {
        id: a.id!,
        slug: a.slug!,
        title: a.title,
        categorySlug: (a as any).category?.slug ?? categorySlug,
        categoryName: (a as any).category?.name,
        featuredImage: (a as any).featuredImage,
      });
    }
    return Array.from(bySlug.values())
      .filter((a) => a.slug !== excludeSlug)
      .slice(0, 4);
  } catch {
    return bundled.filter((a) => a.slug !== excludeSlug).slice(0, 4);
  }
}

async function trending(excludeSlug: string): Promise<SidebarArticle[]> {
  try {
    const cms = await cmsGetArticles();
    return cms
      .filter((a) => a.slug && a.slug !== excludeSlug && (a.views ?? 0) > 0 && isKeptCategory(a.category?.slug))
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      .slice(0, 5)
      .map((a) => ({ id: a.id!, slug: a.slug!, title: a.title, categorySlug: a.category?.slug, categoryName: a.category?.name, views: a.views }));
  } catch {
    return [];
  }
}

function MoreInCategory({ items, categoryLabel }: { items: SidebarArticle[]; categoryLabel: string }) {
  if (items.length === 0) return null;
  return (
    <div className={CARD}>
      <h2 className={LABEL}>More in {categoryLabel}</h2>
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id}>
            <Link href={articleUrl({ slug: a.slug, category: { slug: a.categorySlug } })} className="group flex gap-3">
              <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                <Image
                  src={resolveArticleImage({ featuredImage: a.featuredImage, title: a.title, category: { name: a.categoryName }, id: a.id, slug: a.slug })}
                  alt={a.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <span className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-3">
                {a.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Trending({ items }: { items: SidebarArticle[] }) {
  if (items.length === 0) return null;
  return (
    <div className={CARD}>
      <h2 className={LABEL}>Trending Now</h2>
      <ol className="space-y-3">
        {items.map((a, i) => (
          <li key={a.id}>
            <Link href={articleUrl({ slug: a.slug, category: { slug: a.categorySlug } })} className="group flex items-start gap-3">
              <span className="w-4 shrink-0 text-lg font-black leading-none text-blue-600/30">{i + 1}</span>
              <span className="text-sm font-semibold leading-snug text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                {a.title}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FollowUs() {
  return (
    <div className={CARD}>
      <h2 className={LABEL}>Follow Law Elite Network</h2>
      <ul className="space-y-2.5">
        <li>
          <a
            href="https://www.linkedin.com/company/law-elite-network"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors"
          >
            <Linkedin className="h-4 w-4 text-blue-600" /> Follow on LinkedIn
          </a>
        </li>
        <li>
          <a
            href="https://x.com/lawelitenetwork"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors"
          >
            <Twitter className="h-4 w-4 text-blue-600" /> Follow on X
          </a>
        </li>
      </ul>
    </div>
  );
}

function HaveATip() {
  return (
    <div className={CARD}>
      <h2 className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-900">Spotted an error?</h2>
      <p className="mb-3 text-xs leading-relaxed text-slate-500">
        Every guide is fact-checked, but mistakes happen. Let us know and we'll review it.
      </p>
      <Link href="/corrections" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline">
        <Flag className="h-3.5 w-3.5" /> Report a correction
      </Link>
    </div>
  );
}

// Mirrors imperialpedia.com's ArticleSidebar layout with this site's own
// data throughout -- "More in Category"/"Trending" are live CMS queries,
// "Follow Us" links only the accounts Law Elite Network actually owns.
export async function ArticleSidebar({
  categorySlug,
  categoryLabel,
  excludeSlug,
}: {
  categorySlug?: string;
  categoryLabel: string;
  excludeSlug: string;
}) {
  const [moreItems, trendingItems] = await Promise.all([
    moreInCategory(categorySlug, excludeSlug),
    trending(excludeSlug),
  ]);

  return (
    <aside className="min-w-0 space-y-6 lg:sticky lg:top-32 lg:self-start">
      <MoreInCategory items={moreItems} categoryLabel={categoryLabel} />
      <Trending items={trendingItems} />
      <FollowUs />
      <HaveATip />
      {/* One unit, not two stacked with only a small card between them. */}
      <AdSlot slotId={SIDEBAR_AD_SLOT_ID} format="vertical" placement="sidebar" />
    </aside>
  );
}

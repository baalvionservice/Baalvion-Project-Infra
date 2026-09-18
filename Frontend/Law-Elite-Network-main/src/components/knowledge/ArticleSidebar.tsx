import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Mail, BookOpen } from 'lucide-react';
import { cmsGetArticles } from '@/lib/cms';
import { getArticlesByCategorySlug } from '@/data/law-content';
import { resolveArticleImage } from '@/lib/article-art';
import { articleUrl } from '@/lib/article-url';
import { CURRENT_CATEGORY_SLUGS } from '@/lib/category-slugs';
import { AdSlot } from '@/components/ads/AdSlot';

const SIDEBAR_AD_SLOT_ID = '4123514154';

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
      .slice(0, 5);
  } catch {
    return bundled.filter((a) => a.slug !== excludeSlug).slice(0, 5);
  }
}

export async function ArticleSidebar({
  categorySlug,
  categoryLabel,
  excludeSlug,
}: {
  categorySlug?: string;
  categoryLabel: string;
  excludeSlug: string;
}) {
  const articles = await moreInCategory(categorySlug, excludeSlug);

  return (
    <div className="space-y-8">
      {/* ── Card 1: Confidential Legal Tips Scoop Box ───────────── */}
      <div className="bg-[#0C0F17] text-white p-5 md:p-6 border-t-4 border-[#E13131]">
        <div className="flex items-center gap-2 text-[#E13131] text-[11px] font-black uppercase tracking-widest mb-3">
          <Shield className="w-4 h-4 text-[#E13131]" />
          <span>CONFIDENTIAL LEGAL TIPS</span>
        </div>

        <h3 className="font-headline font-black text-base md:text-lg uppercase tracking-tight text-white leading-snug mb-2">
          HAVE A LAWSUIT SCOOP OR LEAKED COURT DOCUMENT?
        </h3>

        <p className="text-slate-400 text-xs leading-relaxed mb-5">
          Our journalists review sealed filings, whistleblower leaks, and case intel confidentially.
        </p>

        <a
          href="mailto:tips@lawelitenetwork.com"
          className="bg-[#E13131] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider py-3 px-4 w-full flex items-center justify-center gap-2 transition-colors"
        >
          <Mail className="w-4 h-4" />
          SUBMIT CONFIDENTIAL SCOOP
        </a>
      </div>

      {/* ── Card 2: Advertisement ────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 p-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">
          ADVERTISEMENT
        </span>
        <div className="min-h-[250px] flex items-center justify-center bg-white border border-dashed border-slate-200">
          <AdSlot
            slotId={SIDEBAR_AD_SLOT_ID}
            format="rectangle"
            placement="sidebar-top"
            minHeight="250px"
          />
        </div>
      </div>

      {/* ── Card 3: More in Category ─────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center">
            <div className="h-[3px] w-12 bg-[#E13131]" />
            <div className="h-[3px] flex-1 bg-slate-200" />
          </div>
          <h4 className="font-headline font-black text-xs uppercase tracking-wider text-slate-900 mt-2">
            MORE IN {categoryLabel.toUpperCase()}
          </h4>
        </div>

        <div className="divide-y divide-slate-100">
          {articles.length > 0 ? (
            articles.map((item) => (
              <Link
                key={item.id}
                href={articleUrl({ slug: item.slug, category: { slug: item.categorySlug } })}
                className="group flex items-start gap-3 py-3"
              >
                <div className="relative w-14 h-14 flex-shrink-0 bg-slate-100 border border-slate-200 overflow-hidden">
                  {item.featuredImage ? (
                    <Image
                      src={resolveArticleImage({
                        featuredImage: item.featuredImage,
                        title: item.title,
                        category: { name: item.categoryName },
                        id: item.id,
                        slug: item.slug,
                      })}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-blue-50">
                      <BookOpen className="w-6 h-6 text-blue-800/60" />
                    </div>
                  )}
                </div>
                <h5 className="font-headline font-bold text-xs md:text-sm text-slate-900 group-hover:text-[#E13131] leading-snug line-clamp-2 transition-colors">
                  {item.title}
                </h5>
              </Link>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-2">No additional articles in this section yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

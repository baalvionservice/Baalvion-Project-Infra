"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { categoriesPublicApi, subcategoriesPublicApi } from '@/lib/api/client';
import {
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Search as SearchIcon,
  UserPlus,
  LayoutDashboard,
  Linkedin,
} from 'lucide-react';
import { LawEliteMark } from '@/components/icons/LawEliteMark';
import SearchBar from '../search/SearchBar';
import { cn } from '@/lib/utils';
import { isSubcategoryPopulated } from '@/lib/subcategory-or-article';
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';
import { CMS_ONLY_CATEGORIES } from '@/lib/cms-only-categories';
import { useAuth } from '@/hooks/useAuth';
import { sharedSignInUrl } from '@/lib/shared-auth';

// The top nav bar has room for ~11 items (Home/News/World + up to 8 topics) inside
// a max-w-7xl container. Full category names ("Property & Real Estate", "Employment
// & Labor") don't fit there even at wide viewports -- the row would need ~1400px of
// text alone -- so they wrapped to two cramped lines. Short labels here are for this
// bar ONLY; the mega-menu heading, page H1, and breadcrumbs still use the full name.
// AdSense-readiness retirement (see category-slugs.ts's CURRENT_CATEGORY_SLUGS
// comment): shrunk to the 3 live practice areas -- `categories` below is
// already filtered to CURRENT_CATEGORY_SLUGS, so the retired 13 never reach
// this map, but their entries were removed rather than left as dead weight.
const NAV_SHORT_LABEL: Record<string, string> = {
  'maritime-offshore-injury-law': 'Maritime Injury',
  'cruise-ship-passenger-vessel-accidents': 'Cruise Ship Accidents',
  'personal-injury-lawyer': 'Personal Injury',
};

/**
 * seed-data.json's `categories` array predates the AdSense-readiness
 * retirement and still lists all 8 now-retired practice areas -- none of the
 * 3 currently-live ones, which were created directly in the CMS (see
 * cms-only-categories.ts) and were never in law-service's /categories API or
 * this bundled seed file to begin with. That's not just an outage fallback
 * gap: law-service's live /categories response ALSO never contains these 3
 * (they don't exist there, hiccup or not), so the old "live API -> else
 * seedCategories()" logic left the desktop topic bar and mobile drawer
 * permanently empty -- every path converged on zero categories, which is
 * what made the nav look broken/under-construction after the retirement
 * narrowed the live set down to only CMS-only categories.
 *
 * localCategories() is the guaranteed-non-empty baseline now: every entry
 * CURRENT_CATEGORY_SLUGS lists that has a CMS_ONLY_CATEGORIES record (today,
 * all 3 do). Real law-service categories (if the live set ever includes one
 * again) still load and merge in via the effect below -- this baseline is
 * what renders immediately and what a live-API failure/empty-response
 * degrades to, replacing the old, permanently-empty seedCategories() path.
 */
function localCategories(): any[] {
  return CURRENT_CATEGORY_SLUGS
    .map((slug) => CMS_ONLY_CATEGORIES[slug])
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
}

/**
 * @fileOverview Public masthead — editorial newsroom navigation.
 * Two-tier layout: a white brand/utility row over a navy section bar with a
 * subcategory mega-menu. Typographic + structural cues borrow from
 * Investopedia (clean black-on-white masthead) and CNBC (dark section bar).
 */
export function PublicNavbar() {
  const { isAuthenticated, role } = useAuth();
  const [categories, setCategories] = useState<any[]>(localCategories());
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  // Which top-level category the full-screen mobile drawer has drilled into --
  // null shows the flat category list (drawer "home"), matching the two-screen
  // pattern of simple mobile nav menus (list -> tap -> subtopics) instead of
  // every category accordion-expanding in place at once.
  const [mobileDrawerCategory, setMobileDrawerCategory] = useState<string | null>(null);

  // Full-screen overlay: lock background scroll while it's open.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
    setMobileDrawerCategory(null);
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          categoriesPublicApi.list(),
          subcategoriesPublicApi.list(),
        ]);
        const rawCats = catRes.data?.data || [];
        const subs = subRes.data?.data || [];
        // law-service's bulk /categories list can include stray/legacy/pre-rename
        // rows that have no real page (they 404 -- see [categorySlug]/page.tsx's
        // fetchCategory). This nav renders every one it's given as a clickable
        // link site-wide, so restrict to the curated practice-area hubs and
        // normalize old slugs the same way sitemap.ts/article-url.ts already do.
        const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
        const liveCats = rawCats
          .map((c: any) => ({ ...c, slug: toNewCategorySlug(c.slug) }))
          .filter((c: any) => currentSlugSet.has(c.slug));
        // Merge live law-service categories over the local CMS_ONLY_CATEGORIES
        // baseline (by slug) rather than replacing it outright -- today none of
        // the 3 live categories exist in law-service at all, so liveCats is
        // always empty and this is a no-op, but a real law-service category
        // among the live set in the future gets its live id/description
        // without the nav ever regressing to empty in the meantime.
        const bySlug = new Map(localCategories().map((c) => [c.slug, c]));
        liveCats.forEach((c: any) => bySlug.set(c.slug, c));
        setCategories(Array.from(bySlug.values()));
        setSubcategories(subs);
      } catch {
        // Live law-service/subcategories fetch failed -- categories state
        // already holds the localCategories() baseline from useState's
        // initializer, so leave it as-is rather than re-setting it. No
        // subcategory data source exists locally, so the mega-menu just shows
        // no subtopics for now, same as a category with none populated.
      }
    };
    load();
  }, []);

  const activeCategoryData = useMemo(
    () => categories.find((c) => c.id === activeCategory),
    [activeCategory, categories],
  );

  // Hide subcategories with no articles yet -- otherwise every menu click leads
  // to a dead end ("No articles yet"); see docs/empty-subcategories.md for the
  // content backlog these represent.
  const filteredSubcategories = useMemo(() => {
    if (!activeCategory || !activeCategoryData) return [];
    return subcategories.filter(
      (sub) =>
        String(sub.category_id || sub.categoryId) === String(activeCategory) &&
        isSubcategoryPopulated(activeCategoryData.slug, sub.slug),
    );
  }, [activeCategory, activeCategoryData, subcategories]);

  // Same "hide empty topics" rule as the desktop mega-menu, applied per
  // category so the mobile drawer's top-level list only shows a drill-down
  // chevron on categories that actually have somewhere to drill into.
  const categoriesWithSubcategories = useMemo(() => {
    const set = new Set<string>();
    for (const cat of categories) {
      const has = subcategories.some(
        (sub) =>
          String(sub.category_id || sub.categoryId) === String(cat.id) &&
          isSubcategoryPopulated(cat.slug, sub.slug),
      );
      if (has) set.add(cat.id);
    }
    return set;
  }, [categories, subcategories]);

  const mobileDrawerCategoryData = useMemo(
    () => categories.find((c) => c.id === mobileDrawerCategory),
    [mobileDrawerCategory, categories],
  );
  const mobileDrawerSubcategories = useMemo(() => {
    if (!mobileDrawerCategory || !mobileDrawerCategoryData) return [];
    return subcategories.filter(
      (sub) =>
        String(sub.category_id || sub.categoryId) === String(mobileDrawerCategory) &&
        isSubcategoryPopulated(mobileDrawerCategoryData.slug, sub.slug),
    );
  }, [mobileDrawerCategory, mobileDrawerCategoryData, subcategories]);

  const dashboardHref =
    role === 'admin' ? '/admin/dashboard' : role === 'lawyer' ? '/lawyer/dashboard' : '/dashboard';

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-white shadow-[0_1px_0_rgba(15,23,42,0.08)]">
      {/* Brand accent hairline — zero-height overlay so the header stays 96px. */}
      <div className="absolute top-0 inset-x-0 h-[3px] z-20 bg-gradient-to-r from-[#0B1F3A] via-blue-700 to-news-600" />

      {/* ── Tier 1: brand + utilities ─────────────────────────────── */}
      <div className="border-b border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl h-[60px] flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-md bg-[#0F2440] flex items-center justify-center shadow-sm group-hover:bg-blue-900 transition-colors">
              <LawEliteMark variant="white" className="w-6 h-6" />
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className="font-headline text-[1.35rem] font-extrabold tracking-tight text-slate-900 leading-none">
                Law Elite
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.34em] text-news-600">
                Network
              </span>
            </div>
          </Link>

          <div className="hidden md:block flex-1 max-w-md mx-4">
            <SearchBar variant="navbar" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <Link href={dashboardHref}>
                <button className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-[#0B1F3A] text-white text-[12px] font-bold tracking-wide hover:bg-blue-800 transition-colors">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </button>
              </Link>
            ) : (
              <button
                onClick={() => window.location.assign(sharedSignInUrl())}
                className="hidden sm:inline-flex items-center gap-2 px-4 h-9 rounded-md bg-[#0B1F3A] text-white text-[12px] font-bold tracking-wide hover:bg-blue-800 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Sign In
              </button>
            )}

            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center text-slate-700"
              aria-label="Toggle search"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => (isMobileMenuOpen ? closeMobileMenu() : setIsMobileMenuOpen(true))}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-slate-900"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="md:hidden border-t border-slate-100 px-4 py-3 bg-white">
            <SearchBar variant="navbar" />
          </div>
        )}
      </div>

      {/* ── Tier 2: navy section bar (desktop) ────────────────────── */}
      <nav className="hidden lg:block bg-[#0B1F3A]" aria-label="Topic sections">
        <div className="container mx-auto px-6 max-w-7xl h-9 flex items-center overflow-x-auto no-scrollbar">
          <Link
            href="/"
            className="flex items-center h-full px-3 shrink-0 whitespace-nowrap text-[12px] font-bold uppercase tracking-wider text-white/90 hover:text-white border-b-[3px] border-transparent hover:border-news-600 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/news"
            className="flex items-center h-full px-3 shrink-0 whitespace-nowrap text-[12px] font-bold uppercase tracking-wider text-white/90 hover:text-white border-b-[3px] border-transparent hover:border-news-600 transition-colors"
          >
            Legal News
          </Link>
          {categories.slice(0, 8).map((cat) => (
            <div
              key={cat.id}
              className="h-full flex items-center shrink-0"
              onMouseEnter={() => setActiveCategory(cat.id)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <Link
                href={`/${cat.slug}`}
                className={cn(
                  'flex items-center gap-1 h-full px-3 whitespace-nowrap text-[12px] font-bold uppercase tracking-wider border-b-[3px] transition-colors',
                  activeCategory === cat.id
                    ? 'text-white border-news-600'
                    : 'text-white/80 hover:text-white border-transparent hover:border-news-600/60',
                )}
              >
                {NAV_SHORT_LABEL[cat.slug] || cat.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Mega-menu */}
        {activeCategory && activeCategoryData && (
          <div
            className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
            onMouseEnter={() => setActiveCategory(activeCategory)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <div className="container mx-auto max-w-7xl px-6 py-8">
              <div className="grid grid-cols-12 gap-10">
                <div className="col-span-3 border-r border-slate-100 pr-8">
                  <span className="kicker">Browse Topic</span>
                  <h3 className="font-headline text-2xl font-extrabold text-slate-900 mt-3 mb-2">
                    {activeCategoryData.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-5">
                    {activeCategoryData.description ||
                      'Plain-language guides and explainers across this practice area.'}
                  </p>
                  <Link
                    href={`/${activeCategoryData.slug}`}
                    onClick={() => setActiveCategory(null)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-blue-700 hover:text-news-600 transition-colors"
                  >
                    View all {filteredSubcategories.length} guides
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="col-span-9">
                  <div className="grid grid-cols-3 gap-x-8 gap-y-1 max-h-[320px] overflow-y-auto pr-2">
                    {filteredSubcategories.length > 0 ? (
                      filteredSubcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/${activeCategoryData.slug}?sub=${sub.slug}`}
                          onClick={() => setActiveCategory(null)}
                          className="group flex items-center justify-between py-2.5 border-b border-slate-50 hover:border-slate-200 transition-colors"
                        >
                          <span className="text-[14px] font-semibold text-slate-700 group-hover:text-news-600 transition-colors">
                            {sub.name}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))
                    ) : (
                      <p className="col-span-3 py-8 text-sm text-slate-500">
                        Guides for this topic are being added.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Mobile drawer: full-screen, two-screen (list -> drill in) ── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[10000] bg-white flex flex-col">
          {/* Drawer header: brand + close, same row every screen so the drawer never re-flows height. */}
          <div className="flex items-center justify-between h-[60px] px-4 border-b border-slate-100 shrink-0">
            <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#0F2440] flex items-center justify-center">
                <LawEliteMark variant="white" className="w-5 h-5" />
              </div>
              <span className="font-headline text-[1.05rem] font-extrabold tracking-tight text-slate-900">
                Law Elite
              </span>
            </Link>
            <button
              onClick={closeMobileMenu}
              className="w-9 h-9 flex items-center justify-center text-slate-900"
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 shrink-0">
            <SearchBar variant="navbar" />
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {!mobileDrawerCategory ? (
              // ── Screen 1: flat top-level list ──
              <nav aria-label="Mobile navigation">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Legal News', href: '/news' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between h-14 px-5 text-[15px] font-bold text-slate-900 border-b border-slate-100 active:bg-slate-50"
                  >
                    {item.label}
                  </Link>
                ))}
                {categories.map((cat) =>
                  categoriesWithSubcategories.has(cat.id) ? (
                    <button
                      key={cat.id}
                      onClick={() => setMobileDrawerCategory(cat.id)}
                      className="w-full flex items-center justify-between h-14 px-5 text-[15px] font-bold text-slate-900 border-b border-slate-100 active:bg-slate-50"
                    >
                      {cat.name}
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                  ) : (
                    <Link
                      key={cat.id}
                      href={`/${cat.slug}`}
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between h-14 px-5 text-[15px] font-bold text-slate-900 border-b border-slate-100 active:bg-slate-50"
                    >
                      {cat.name}
                    </Link>
                  ),
                )}
              </nav>
            ) : (
              // ── Screen 2: subtopics of the tapped category ──
              <nav aria-label={`${mobileDrawerCategoryData?.name} topics`}>
                <button
                  onClick={() => setMobileDrawerCategory(null)}
                  className="w-full flex items-center gap-2 h-14 px-5 text-[15px] font-bold text-slate-900 border-b border-slate-100 active:bg-slate-50"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                  {mobileDrawerCategoryData?.name}
                </button>
                <Link
                  href={`/${mobileDrawerCategoryData?.slug}`}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between h-12 px-5 text-[13px] font-bold text-blue-700 border-b border-slate-100 active:bg-slate-50"
                >
                  View all {mobileDrawerCategoryData?.name} guides
                  <ChevronRight className="w-4 h-4" />
                </Link>
                {mobileDrawerSubcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/${mobileDrawerCategoryData?.slug}?sub=${sub.slug}`}
                    onClick={closeMobileMenu}
                    className="flex items-center h-12 px-5 text-[14px] font-semibold text-slate-700 border-b border-slate-50 active:bg-slate-50"
                  >
                    {sub.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Drawer footer: sign-in (hidden sm:inline-flex in the tier-1 row above, so
              this is its only surface on a true mobile viewport) + social, mirroring the
              account/follow block most editorial-site mobile menus close on. */}
          <div className="shrink-0 border-t border-slate-100 px-5 py-4 flex items-center justify-between">
            {isAuthenticated ? (
              <Link
                href={dashboardHref}
                onClick={closeMobileMenu}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            ) : (
              <button
                onClick={() => {
                  closeMobileMenu();
                  window.location.assign(sharedSignInUrl());
                }}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"
              >
                <UserPlus className="w-4 h-4" /> Sign In
              </button>
            )}
            <div className="flex items-center gap-4">
              <Link
                href="https://www.linkedin.com/company/law-elite-network"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Law Elite Network on LinkedIn"
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <Linkedin className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link
                href="https://x.com/lawelitenetwork"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Law Elite Network on X"
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { categoriesPublicApi, subcategoriesPublicApi } from '@/lib/api/client';
import {
  Scale,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Search as SearchIcon,
  UserPlus,
  LayoutDashboard,
} from 'lucide-react';
import SearchBar from '../search/SearchBar';
import { cn } from '@/lib/utils';
import seedData from '../../../docs/seed-data.json';
import { useAuth } from '@/hooks/useAuth';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { sharedSignInUrl } from '@/lib/shared-auth';

/**
 * @fileOverview Public masthead — editorial newsroom navigation.
 * Two-tier layout: a white brand/utility row over a navy section bar with a
 * subcategory mega-menu. Typographic + structural cues borrow from
 * Investopedia (clean black-on-white masthead) and CNBC (dark section bar).
 */
export function PublicNavbar() {
  const { isAuthenticated, role } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          categoriesPublicApi.list(),
          subcategoriesPublicApi.list(),
        ]);
        const cats = catRes.data?.data || [];
        const subs = subRes.data?.data || [];
        if (cats.length > 0) {
          setCategories(cats);
          setSubcategories(subs);
        } else {
          setCategories((seedData as any).categories || []);
          setSubcategories((seedData as any).subcategories || []);
        }
      } catch {
        setCategories((seedData as any).categories || []);
        setSubcategories((seedData as any).subcategories || []);
      }
    };
    load();
  }, []);

  const filteredSubcategories = useMemo(() => {
    if (!activeCategory) return [];
    return subcategories.filter(
      (sub) => String(sub.category_id || sub.categoryId) === String(activeCategory),
    );
  }, [activeCategory, subcategories]);

  const activeCategoryData = useMemo(
    () => categories.find((c) => c.id === activeCategory),
    [activeCategory, categories],
  );

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
            <div className="w-10 h-10 rounded-md bg-[#0B1F3A] flex items-center justify-center shadow-sm group-hover:bg-blue-800 transition-colors">
              <Scale className="text-white w-5 h-5" />
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
            <Link
              href="/lawyers"
              className="hidden lg:inline-flex items-center text-[13px] font-semibold text-slate-700 hover:text-news-600 transition-colors"
            >
              Find a Lawyer
            </Link>
            <span className="hidden lg:block w-px h-5 bg-slate-200" />

            <LanguageSwitcher />

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
              onClick={() => setIsMobileMenuOpen((v) => !v)}
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
        <div className="container mx-auto px-6 max-w-7xl h-9 flex items-center">
          <Link
            href="/"
            className="flex items-center h-full px-3 text-[12px] font-bold uppercase tracking-wider text-white/90 hover:text-white border-b-[3px] border-transparent hover:border-news-600 transition-colors"
          >
            Home
          </Link>
          {categories.slice(0, 8).map((cat) => (
            <div
              key={cat.id}
              className="h-full flex items-center"
              onMouseEnter={() => setActiveCategory(cat.id)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <Link
                href={`/law/${cat.slug}`}
                className={cn(
                  'flex items-center gap-1 h-full px-3 text-[12px] font-bold uppercase tracking-wider border-b-[3px] transition-colors',
                  activeCategory === cat.id
                    ? 'text-white border-news-600'
                    : 'text-white/80 hover:text-white border-transparent hover:border-news-600/60',
                )}
              >
                {cat.name}
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
                      'Expert-reviewed guides and explainers across this practice area.'}
                  </p>
                  <Link
                    href={`/law/${activeCategoryData.slug}`}
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
                          href={`/law/${activeCategoryData.slug}?sub=${sub.slug}`}
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
                      <p className="col-span-3 py-8 text-sm text-slate-400">
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

      {/* ── Mobile drawer ─────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white shadow-2xl max-h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-4 space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-3 px-2 text-sm font-bold text-slate-900 border-b border-slate-100"
            >
              Home
            </Link>
            <Link
              href="/lawyers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-3 px-2 text-sm font-bold text-slate-900 border-b border-slate-100"
            >
              Find a Lawyer
            </Link>
            <p className="pt-4 pb-2 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-news-600">
              Topics
            </p>
            {categories.map((cat) => (
              <details key={cat.id} className="group border-b border-slate-50">
                <summary className="flex items-center justify-between py-3 px-2 cursor-pointer list-none">
                  <span className="text-sm font-bold text-slate-900">{cat.name}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pb-3 pl-3 grid grid-cols-1 gap-0.5">
                  <Link
                    href={`/law/${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-1.5 text-xs font-bold text-blue-700"
                  >
                    View all guides →
                  </Link>
                  {subcategories
                    .filter((sub) => String(sub.category_id || sub.categoryId) === String(cat.id))
                    .map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/law/${cat.slug}?sub=${sub.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="py-1.5 text-xs font-medium text-slate-500 hover:text-news-600"
                      >
                        {sub.name}
                      </Link>
                    ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

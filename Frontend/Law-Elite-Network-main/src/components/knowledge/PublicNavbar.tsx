
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { categoriesPublicApi, subcategoriesPublicApi } from '@/lib/api/client';
import {
  Gavel,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import SearchBar from '../search/SearchBar';
import { cn } from '@/lib/utils';
import seedData from '../../../docs/seed-data.json';
import { useAuth } from '@/hooks/useAuth';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export function PublicNavbar() {
  const { isAuthenticated, role } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncLedger = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          categoriesPublicApi.list(),
          subcategoriesPublicApi.list()
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
    syncLedger();
  }, []);

  const filteredSubcategories = useMemo(() => {
    if (!activeCategory) return [];
    return subcategories.filter(sub =>
      String(sub.category_id || sub.categoryId) === String(activeCategory)
    );
  }, [activeCategory, subcategories]);

  const activeCategoryData = useMemo(() => {
    return categories.find(c => c.id === activeCategory);
  }, [activeCategory, categories]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999] bg-white border-b border-slate-100 shadow-sm h-16 md:h-20">
      <div className="container mx-auto px-6 h-full max-w-7xl flex items-center justify-between gap-8">

        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
            <Gavel className="text-white w-5 h-5" />
          </div>
          <div className="hidden lg:flex flex-col -space-y-1">
            <span className="text-xl font-bold tracking-tighter text-slate-900 font-serif italic leading-none">
              Law <span className="text-blue-600">Elite</span>
            </span>
            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-1">Network</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1 h-full">
          {categories.length > 0 ? (
            categories.slice(0, 8).map((cat) => (
              <div
                key={cat.id}
                className="h-full flex items-center px-1"
                onMouseEnter={() => setActiveCategory(cat.id)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link
                  href={`/law/${cat.slug}`}
                  className={cn(
                    "px-3 h-full flex items-center text-[10px] xl:text-[11px] font-bold uppercase tracking-widest transition-all relative",
                    activeCategory === cat.id ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {cat.name}
                </Link>
              </div>
            ))
          ) : (
            <div className="flex gap-4 animate-pulse">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-4 w-20 bg-slate-50 rounded" />)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:block w-48">
            <SearchBar variant="navbar" />
          </div>

          <LanguageSwitcher />

          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Link href={role === 'admin' ? '/admin/dashboard' : role === 'lawyer' ? '/lawyer/dashboard' : '/dashboard'}>
                <button className="flex items-center gap-2 px-4 h-10 rounded-xl bg-[#0B1F3A] text-white text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-blue-900 transition-all">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="px-5 h-10 rounded-xl border border-slate-200 text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Sign In
                </button>
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-900"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {activeCategory && activeCategoryData && (
        <div
          className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          onMouseEnter={() => setActiveCategory(activeCategory)}
          onMouseLeave={() => setActiveCategory(null)}
        >
          <div className="container mx-auto max-w-7xl px-6 py-12">
            <div className="grid grid-cols-12 gap-12">
              <div className="col-span-4 space-y-6 border-r border-slate-100 pr-12">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-bold uppercase tracking-widest">Active Pillar</span>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 font-serif italic">{activeCategoryData.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed italic font-medium">
                  {activeCategoryData.description || "Expert-verified strategic guides across the global legal ecosystem."}
                </p>
                <div className="pt-4 border-t border-slate-50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Discovery Signal</p>
                  <div className="flex items-center gap-2 text-blue-600">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{filteredSubcategories.length} Specializations Loaded</span>
                  </div>
                </div>
              </div>

              <div className="col-span-8">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                  {filteredSubcategories.length > 0 ? (
                    filteredSubcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/law/${activeCategoryData.slug}?sub=${sub.slug}`}
                        onClick={() => setActiveCategory(null)}
                        className="group/item flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                      >
                        <span className="text-[13px] font-bold text-slate-700 group-hover/item:text-blue-700 transition-colors">
                          {sub.name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-xs italic text-slate-400 font-medium">No specialized guides identified for this pillar.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-2xl h-[calc(100vh-64px)] overflow-y-auto animate-in slide-in-from-top duration-300">
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Jurisdictional Pillars</h4>
              {categories.map((cat) => (
                <details key={cat.id} className="group/details border-b border-slate-50 last:border-0">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{cat.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-open/details:rotate-90 transition-transform" />
                  </summary>
                  <div className="pl-6 pb-4 space-y-2">
                    {subcategories
                      .filter(sub => String(sub.category_id || sub.categoryId) === String(cat.id))
                      .map(sub => (
                        <Link
                          key={sub.id}
                          href={`/law/${cat.slug}?sub=${sub.slug}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-1 text-xs font-medium text-slate-500 hover:text-blue-600 italic"
                        >
                          {sub.name}
                        </Link>
                      ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

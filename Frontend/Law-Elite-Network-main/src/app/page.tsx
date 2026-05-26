"use client";

import React, { useEffect, useState } from 'react';
import { categoriesPublicApi, articlesPublicApi } from '@/lib/api/client';
import { Hero } from '@/components/knowledge/Hero';
import { CategoryGrid } from '@/components/knowledge/CategoryGrid';
import { TrendingArticles } from '@/components/knowledge/TrendingArticles';
import { FeaturedArticles } from '@/components/knowledge/FeaturedArticles';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { PopularTopics } from '@/components/knowledge/PopularTopics';
import { TrustSection } from '@/components/knowledge/TrustSection';
import { Sparkles, TrendingUp, Award, Zap } from 'lucide-react';

const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Business & Corporate', slug: 'business-corporate', icon: 'Building2', description: 'Strategic counsel for enterprise governance and commerce.' },
  { id: 2, name: 'Criminal Law', slug: 'criminal-law', icon: 'ShieldAlert', description: 'Expert defense strategies and litigation protocols.' },
  { id: 3, name: 'Family & Personal', slug: 'family-personal', icon: 'Users', description: 'Navigation of domestic relations and immigration law.' },
  { id: 4, name: 'Property & Real Estate', slug: 'property-real-estate', icon: 'Home', description: 'Legal frameworks for property and land acquisition.' },
  { id: 5, name: 'Tax & Finance', slug: 'tax-finance', icon: 'Banknote', description: 'Audit of taxation, banking, and capital markets.' },
  { id: 6, name: 'Employment & Labor', slug: 'employment-labor', icon: 'Briefcase', description: 'Workplace rights and labor dispute resolution.' },
  { id: 7, name: 'Technology & IP', slug: 'technology-ip', icon: 'Cpu', description: 'Data privacy, AI ethics, and IP protection.' },
];

export default function KnowledgeHomePage() {
  const [categories, setCategories] = useState<any[]>(FALLBACK_CATEGORIES);
  const [trendingArticles, setTrendingArticles] = useState<any[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    categoriesPublicApi.list()
      .then(res => {
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0) setCategories(data);
      })
      .catch(() => {});

    articlesPublicApi.list({ sortBy: 'views', order: 'desc', limit: 6, status: 'published' })
      .then(res => {
        const items = res.data?.data?.items || res.data?.data || [];
        setTrendingArticles(items);
      })
      .catch(() => {})
      .finally(() => setTrendingLoading(false));

    articlesPublicApi.list({ limit: 4, status: 'published' })
      .then(res => {
        const items = res.data?.data?.items || res.data?.data || [];
        setFeaturedArticles(items);
      })
      .catch(() => {})
      .finally(() => setFeaturedLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Hero />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

        <section className="mb-20 md:mb-32 -mt-10 md:-mt-16 relative z-20">
          <PopularTopics />
        </section>

        <section className="mb-20 md:mb-32 space-y-12 md:space-y-16">
          <div className="text-center space-y-4 px-4">
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Domain Discovery
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">Explore by Category</h2>
            <p className="text-slate-500 text-base md:text-lg font-medium italic max-w-2xl mx-auto leading-relaxed">
              Navigate specialized intelligence across our primary professional pillars.
            </p>
          </div>
          <CategoryGrid categories={categories} />
        </section>

        <section className="bg-slate-50/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-20 md:py-24 rounded-3xl md:rounded-[4rem] border-y border-slate-100 relative overflow-hidden mb-20 md:mb-32">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/40 rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="max-w-7xl mx-auto space-y-12 md:space-y-16 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-600 font-bold uppercase text-[10px] tracking-[0.3em]">Trending Now</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">High-Velocity Intelligence</h2>
              </div>
              <p className="text-slate-400 text-sm md:text-base font-medium italic max-w-sm md:text-right leading-relaxed">
                Real-time synthesis of the most-audited legal dossiers within the global network.
              </p>
            </div>
            {trendingLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 rounded-3xl bg-white border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <TrendingArticles articles={trendingArticles} />
            )}
          </div>
        </section>

        <section className="mb-20 md:mb-32 space-y-12 md:space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-8 px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                <Award className="w-6 h-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Featured Strategic Guides</h2>
            </div>
            <Zap className="w-5 h-5 text-amber-500 animate-pulse hidden sm:block" />
          </div>
          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 px-4">
              {[1, 2].map(i => (
                <div key={i} className="h-72 rounded-3xl bg-slate-50 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : (
            <FeaturedArticles articles={featuredArticles} />
          )}
        </section>

        <section className="mb-16">
          <TrustSection />
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}

import React from 'react';
import { notFound } from 'next/navigation';
import { FileText } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { getCountryBySlug, getArticlesByCountrySlug } from '@/data/countries';

export default async function CountryPage(
  { params }: { params: Promise<{ country: string }> },
) {
  const { country: countrySlug } = await params;
  const country = getCountryBySlug(countrySlug);
  if (!country) notFound();

  const articles = await getArticlesByCountrySlug(countrySlug);

  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[96px]">
      <main className="pb-24">
        <section className="border-b border-slate-200 bg-slate-50/60">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12 md:py-16">
            <span className="kicker">Worldwide Coverage</span>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.02] mt-3">
              {country.name}
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mt-4">
              Legal guides and explainers specific to {country.name}.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-10">
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
              {articles.map((article) => (
                <ArticleCard key={article.id || article.slug} article={article} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-5 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1.5">
                <h4 className="font-headline text-xl font-bold text-slate-900">No {country.name} guides yet</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Country-specific coverage for {country.name} is being added.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

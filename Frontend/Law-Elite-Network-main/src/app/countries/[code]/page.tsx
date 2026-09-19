import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { PersonCard } from '@/components/people/PersonCard';
import { CaseCard } from '@/components/legal/CaseCard';
import { COUNTRIES } from '@/lib/countries';
import { getAllPeople } from '@/data/people';
import { getAllLegalCases } from '@/data/legal-cases';
import { getArticlesForEntity } from '@/lib/entity-articles';
import { articleUrl } from '@/lib/article-url';

export const revalidate = 86400;

export default async function CountryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const country = COUNTRIES.find((c) => c.code === upperCode);
  if (!country) notFound();

  const people = getAllPeople().filter((p) => p.countryCode === upperCode);
  const cases = getAllLegalCases().filter((c) => c.countryCode === upperCode);
  const articles = await getArticlesForEntity('country', upperCode);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Country</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">{country.name}</h1>
          </header>

          <section className="mb-16">
            <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-6">People</h2>
            {people.length === 0 ? (
              <p className="text-slate-500 text-sm">No profiled people connected to {country.name} yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                {people.map((p) => <PersonCard key={p.slug} person={p} />)}
              </div>
            )}
          </section>

          {cases.length > 0 && (
            <section className="mb-16">
              <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-6">Legal Cases</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map((c) => <CaseCard key={c.slug} legalCase={c} />)}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-6">Latest News</h2>
            {articles.length === 0 ? (
              <p className="text-slate-500 text-sm">No published articles mention {country.name} yet.</p>
            ) : (
              <ul className="space-y-4">
                {articles.map((article) => (
                  <li key={article.slug}>
                    <Link href={articleUrl(article)} className="text-[15.5px] font-semibold text-slate-900 hover:text-news-600 transition-colors">
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

import React from 'react';
import { notFound } from 'next/navigation';
import { FileText } from 'lucide-react';
import type { Metadata } from 'next';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { getCountryBySlug, getArticlesByCountrySlug } from '@/data/countries';
import { getCountryProfile } from '@/data/country-profiles';
import { articleUrl } from '@/lib/article-url';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export async function generateMetadata(
  { params }: { params: Promise<{ country: string }> },
): Promise<Metadata> {
  const { country: countrySlug } = await params;
  const country = getCountryBySlug(countrySlug);
  if (!country) return { robots: { index: false, follow: false } };
  const title = `${country.name} Legal Guides | Law Elite Network`;
  const description = `Plain-language legal guides and explainers specific to ${country.name}.`;
  const url = `${SITE}/countries/${countrySlug}`;
  // Indexed only once this country has real jurisdiction-specific articles --
  // see the matching check (and full rationale) in ./layout.tsx's
  // generateMetadata, which this must stay consistent with.
  const articles = await getArticlesByCountrySlug(countrySlug);
  // images set explicitly: a page-level openGraph/twitter object replaces
  // (not merges with) the root layout's, so without this the root's
  // generated /opengraph-image fallback is silently dropped and a shared
  // link renders with no image on WhatsApp/social previews -- see the same
  // note in ../page.tsx.
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: { index: articles.length > 0, follow: true },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630, alt: 'Law Elite Network — Global Legal Intelligence' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`${SITE}/twitter-image`] },
  };
}

export default async function CountryPage(
  { params }: { params: Promise<{ country: string }> },
) {
  const { country: countrySlug } = await params;
  const country = getCountryBySlug(countrySlug);
  if (!country) notFound();

  const articles = await getArticlesByCountrySlug(countrySlug);
  const profile = getCountryProfile(countrySlug);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Countries', item: `${SITE}/countries` },
      { '@type': 'ListItem', position: 3, name: country.name, item: `${SITE}/countries/${countrySlug}` },
    ],
  };

  // Only emit CollectionPage/hasPart when there is real content to enumerate --
  // an empty hasPart on a page with zero guides would contradict the page's
  // own "No guides yet" empty state (Phase J: JSON-LD must not overstate content).
  const collectionLd = articles.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${country.name} Legal Guides`,
    description: `Plain-language legal guides and explainers specific to ${country.name}.`,
    url: `${SITE}/countries/${countrySlug}`,
    hasPart: articles.map((a) => ({
      '@type': 'Article',
      headline: a.title,
      url: `${SITE}${articleUrl(a)}`,
    })),
  } : null;

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    {collectionLd && (
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
    )}
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
          {/* Written jurisdiction-overview content, when researched for this
              country (see src/data/country-profiles.ts) -- same descriptionHtml
              pattern used for practice-area hubs in [categorySlug]/page.tsx. */}
          {profile && (
            <div className="container mx-auto px-4 sm:px-6 max-w-7xl pb-4">
              <div
                className="prose-legal max-w-3xl"
                dangerouslySetInnerHTML={{ __html: profile.introHtml }}
              />
            </div>
          )}
        </section>

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-10">
          {articles.length > 0 ? (
            <>
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-8">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
                  <h2 className="font-headline text-xl md:text-2xl font-extrabold text-slate-900 m-0">
                    {country.name} Guides
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
                {articles.map((article) => (
                  <ArticleCard key={article.id || article.slug} article={article} />
                ))}
              </div>
            </>
          ) : !profile ? (
            <div className="py-24 text-center space-y-5 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1.5">
                <h4 className="font-headline text-xl font-bold text-slate-900">No {country.name} guides yet</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Country-specific coverage for {country.name} is being added.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <PublicFooter />
    </div>
    </>
  );
}

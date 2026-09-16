import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { buildCitationIndex } from '@/lib/citation-index';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
// Raised off the 5-minute clock: /api/revalidate's revalidateTag() refreshes
// this on publish, so the window is only the no-webhook safety net.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: 'Legislation | Law Elite Network' },
  description: 'A reference index of real Acts, regulations, and directives cited across Law Elite Network’s guides, with links to the official text and the guide that discusses it.',
  alternates: { canonical: `${SITE}/legislation` },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: `${SITE}/legislation`,
    title: 'Legislation | Law Elite Network',
    description: 'A reference index of real Acts, regulations, and directives cited across Law Elite Network’s guides.',
    images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630, alt: 'Law Elite Network' }],
  },
};

/**
 * /legislation -- not a bill tracker (no live legislative-status data source
 * exists here); a real reference index built from the same editor-verified
 * `primarySources` citations already attached to guide articles, grouped via
 * classifySources() in src/lib/citation-index.ts. Every entry here is a real
 * Act, regulation, or directive a guide actually cites.
 */
export default async function LegislationPage() {
  const { primaryLegislation } = await buildCitationIndex();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Legislation',
    description: 'Legislation referenced across Law Elite Network guides.',
    url: `${SITE}/legislation`,
    isPartOf: { '@type': 'WebSite', name: 'Law Elite Network', url: SITE },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Legislation', item: `${SITE}/legislation` },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="pt-[60px] lg:pt-[96px]">
        <section className="border-b border-slate-200 bg-slate-50/60">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-12 md:py-16">
            <span className="kicker">Reference</span>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.02] mt-3">
              Legislation
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mt-4">
              Real Acts, regulations, and directives cited across our guides, collected here as a
              quick-reference index — not a bill tracker. Each entry links to the official text and
              to the guide that discusses it.
            </p>
          </div>
        </section>

        <main className="pb-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl pt-10">
            {primaryLegislation.length === 0 ? (
              <p className="text-slate-500">No legislation is on file yet.</p>
            ) : (
              <ol className="divide-y divide-slate-100 border-t border-b border-slate-100">
                {primaryLegislation.map((entry, i) => (
                  <li key={i} className="py-5">
                    <p className="text-[16px] font-bold text-slate-900">
                      {entry.url ? (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="hover:text-blue-700 hover:underline underline-offset-2 transition-colors"
                        >
                          {entry.label}
                        </a>
                      ) : (
                        entry.label
                      )}
                    </p>
                    <p className="text-[13px] text-slate-500 mt-1.5">
                      Referenced in:{' '}
                      {entry.articles.map((a, j) => (
                        <React.Fragment key={a.href}>
                          {j > 0 && ', '}
                          <Link href={a.href} className="text-blue-700 hover:text-blue-900 hover:underline underline-offset-2">
                            {a.title}
                          </Link>
                        </React.Fragment>
                      ))}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}

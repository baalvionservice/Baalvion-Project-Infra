import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllLawChanges } from '@/data/law-changes';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { articleUrl } from '@/lib/article-url';
import { getArticleBySlug } from '@/data/law-content';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
// Raised off the 5-minute clock: /api/revalidate's revalidateTag() refreshes
// this on publish, so the window is only the no-webhook safety net.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: 'Law Changes | Law Elite Network' },
  description: 'Real, source-verified before-and-after breakdowns of recent legal changes — what changed, who is affected, and the official source.',
  alternates: { canonical: `${SITE}/law-changes` },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: `${SITE}/law-changes`,
    title: 'Law Changes | Law Elite Network',
    description: 'Real, source-verified before-and-after breakdowns of recent legal changes.',
    images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630, alt: 'Law Elite Network' }],
  },
};

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/**
 * /law-changes -- not a live bill/court tracker (no such data source exists
 * here); each entry is real, source-verified analysis added one at a time
 * (see the doc comment on src/data/law-changes.ts), distinct from the
 * citation-aggregated /case-law and /legislation reference indexes.
 */
export default function LawChangesPage() {
  const changes = getAllLawChanges();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Law Changes',
    description: 'Before-and-after breakdowns of real legal changes.',
    url: `${SITE}/law-changes`,
    isPartOf: { '@type': 'WebSite', name: 'Law Elite Network', url: SITE },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Law Changes', item: `${SITE}/law-changes` },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="pt-[60px] lg:pt-[96px]">
        <section className="border-b border-slate-200 bg-slate-50/60">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-12 md:py-16">
            <span className="kicker">Analysis</span>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.02] mt-3">
              Law Changes
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mt-4">
              Source-verified before-and-after breakdowns of real legal changes — not a live
              bill or court tracker. Each entry is researched and added individually, with a
              link to the official text.
            </p>
          </div>
        </section>

        <main className="pb-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl pt-10 space-y-12">
            {changes.length === 0 ? (
              <p className="text-slate-500">No law changes are on file yet.</p>
            ) : (
              changes.map((change) => (
                <article key={change.id} id={change.slug} className="border border-slate-200 rounded-xl p-6 md:p-8 scroll-mt-32">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500 mb-3">
                    <span className="font-bold uppercase tracking-wide text-blue-700">{change.jurisdiction}</span>
                    <span>{change.topic}</span>
                    <span>Effective: <strong className="text-slate-700">{formatDate(change.effectiveDate)}</strong></span>
                  </div>

                  <h2 className="font-headline text-2xl font-extrabold text-slate-900 mb-3">
                    {change.title}
                  </h2>
                  <p className="text-[15px] text-slate-600 leading-relaxed mb-6">{change.summary}</p>

                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-900 mb-3">
                    What Changed
                  </h3>
                  <div className="space-y-4 mb-6">
                    {change.changes.map((c, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px] leading-relaxed">
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                          <span className="block text-[10px] font-bold uppercase tracking-wide text-red-700 mb-1">Before</span>
                          {c.before}
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                          <span className="block text-[10px] font-bold uppercase tracking-wide text-emerald-700 mb-1">After</span>
                          {c.after}
                          {c.note && <span className="block text-[12px] text-emerald-800/70 mt-1">{c.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-900 mb-2">
                    Who Is Affected
                  </h3>
                  <p className="text-[14px] text-slate-600 leading-relaxed mb-6">{change.whoIsAffected}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-slate-100">
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-900 mb-2">Official Source</h3>
                      <ul className="space-y-1">
                        {change.officialSource.map((s, i) => (
                          <li key={i}>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="text-[13px] text-blue-700 hover:text-blue-900 hover:underline underline-offset-2"
                            >
                              {s.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {change.relatedGuideSlugs.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-900 mb-2">Related Guides</h3>
                        <ul className="space-y-1">
                          {change.relatedGuideSlugs.map((slug) => {
                            const article = getArticleBySlug(slug);
                            if (!article) return null;
                            return (
                              <li key={slug}>
                                <Link
                                  href={articleUrl(article)}
                                  className="text-[13px] text-blue-700 hover:text-blue-900 hover:underline underline-offset-2"
                                >
                                  {article.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Scale } from 'lucide-react';
import { articlesPublicApi } from '@/lib/api/client';
import { cmsGetArticles } from '@/lib/cms';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { getAllArticles } from '@/data/law-content';
import { articleUrl } from '@/lib/article-url';

/**
 * Server-side so the A-Z glossary actually has crawlable content. The
 * previous client-only version fell back to docs/seed-data.json (2 sample
 * articles total) instead of the real 45-article bundled library, so 24 of
 * 26 letters rendered "currently being synchronized" with zero real links --
 * exactly the "auto-generated pages with little to no original content"
 * pattern AdSense review flags. Bundled data (via getAllArticles) is now the
 * baseline, with live law-service/CMS results merged on top when reachable.
 */
async function fetchArticlesForLetter(letter: string) {
  const bundled = getAllArticles().filter((a) => a.alphabet === letter);

  let lawArticles: any[] = [];
  let cmsArticles: any[] = [];
  try {
    const res = await articlesPublicApi.list({ alphabet: letter, status: 'published', limit: 200 });
    lawArticles = res.data?.data?.items || res.data?.data || [];
  } catch {
    /* law-service unreachable — bundled data still covers this letter */
  }
  try {
    cmsArticles = await cmsGetArticles(letter);
  } catch {
    /* cms unreachable — bundled data still covers this letter */
  }

  const bySlug = new Map<string, any>();
  for (const a of [...bundled, ...lawArticles, ...cmsArticles]) {
    if (a?.slug) bySlug.set(a.slug, a);
  }
  return Array.from(bySlug.values());
}

export default async function AlphabeticalListingPage(
  { params }: { params: Promise<{ letter: string }> },
) {
  const { letter } = await params;
  const normalizedLetter = letter.toUpperCase();
  const articles = await fetchArticlesForLetter(normalizedLetter);

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-7xl">

          <nav className="mb-12">
            <Link href="/legal" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 hover:text-blue-600 transition-colors group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to A–Z Index
            </Link>
          </nav>

          <header className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-bold uppercase tracking-[0.2em]">Encyclopedia Index</span>
                  <Scale className="w-4 h-4 text-blue-600" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                  Terms Beginning With <span className="text-blue-600 italic">'{normalizedLetter}'</span>
                </h1>
              </div>
            </div>
          </header>

          {articles.length > 0 ? (
            <div className="space-y-12 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-12 gap-y-5 px-1">
                {articles.map((art: any) => (
                  <Link
                    key={art.id}
                    href={articleUrl(art)}
                    className="group block transition-all"
                  >
                    <span className="text-[15px] font-medium text-slate-700 group-hover:text-blue-600 group-hover:underline decoration-2 underline-offset-4 transition-all leading-snug block interactive-lift">
                      {art.title}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-32 pt-12 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3 opacity-30">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                    Audit Verified Intelligence • {articles.length} Strategic Dossiers
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-32 text-center opacity-40">
              <p className="text-sm italic font-medium text-slate-400 uppercase tracking-widest">
                No published guides begin with "{normalizedLetter}" yet.
              </p>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

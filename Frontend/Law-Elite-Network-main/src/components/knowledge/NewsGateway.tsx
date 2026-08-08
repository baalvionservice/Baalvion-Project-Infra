import React from 'react';
import Link from 'next/link';
import { Newspaper, ArrowRight } from 'lucide-react';
import { cmsGetNews } from '@/lib/cms';
import { articleUrl } from '@/lib/article-url';

/**
 * A deliberately small homepage gateway into /news -- the homepage's job is
 * evergreen guides, not the day's headlines, so this stays a single modest
 * card rather than a second copy of the newsroom hero.
 */
export async function NewsGateway() {
  const news = await cmsGetNews(3).catch(() => []);
  if (!news.length) return null;

  return (
    <section className="py-14 border-t border-slate-200">
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Newspaper className="w-4 h-4 text-news-600 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-headline text-lg font-extrabold text-slate-900 m-0">Latest Legal News</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">Stay informed about recent developments.</p>
            </div>
          </div>
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-blue-700 hover:text-news-600 transition-colors shrink-0"
          >
            Visit Legal News <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <ul className="grid sm:grid-cols-3 gap-5">
          {news.slice(0, 3).map((article) => (
            <li key={article.id || article.slug}>
              <Link href={articleUrl(article)} className="group block">
                {article.category?.name && (
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-news-600 mb-1">
                    {article.category.name}
                  </span>
                )}
                <span className="font-headline text-[14px] font-bold text-slate-900 group-hover:text-news-600 transition-colors leading-snug line-clamp-2">
                  {article.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

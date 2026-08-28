import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { articleUrl } from '@/lib/article-url';
import { resolveArticleImage } from '@/lib/article-art';

function GuideCard({ article }: { article: any }) {
  const href = articleUrl(article);
  return (
    <Link href={href} className="group flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={resolveArticleImage(article)}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
      <div className="pt-3">
        {article.category?.name && (
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-news-600 mb-1.5">
            {article.category.name}
          </span>
        )}
        <h3 className="font-headline text-[15px] font-bold leading-snug text-slate-900 group-hover:text-news-600 transition-colors line-clamp-3">
          {article.title}
        </h3>
        {article.author && (
          <p className="mt-1.5 text-[11.5px] text-slate-500">
            By <span className="text-slate-700 font-semibold">{article.author}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

/**
 * Investopedia-style "Latest Articles" grid -- a lean, image-led 4-up row
 * (tag + title + byline, no summary/date) pulling the network's most
 * recently published guides, distinct from the fuller StoryCard used in the
 * hero and category sections below it. Byline kept -- an image with no named
 * author reads as unattributed/AI-generated, which is exactly what an
 * editorial trust signal needs to counter.
 */
export function LatestGuidesGrid({ articles }: { articles: any[] }) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="py-8 border-t border-slate-200">
      <div className="flex items-end justify-between border-b-2 border-slate-900 pb-2 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
          <h2 className="font-headline text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 m-0">
            Latest Legal Guides
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-9">
        {articles.map((a) => (
          <GuideCard key={a.id || a.slug} article={a} />
        ))}
      </div>
    </section>
  );
}

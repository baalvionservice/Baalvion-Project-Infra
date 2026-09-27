import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { Article } from '../types';

interface AuthorArticleListProps {
  articles: Article[];
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Vertical "latest articles" list for an author's profile page — a horizontal
 * thumbnail-left / text-right row per article, divided by a rule, rather than
 * the 3-column card grid `ArticleList` uses on category hubs. Modeled on the
 * masthead-archive pattern (e.g. Page Six author pages): one continuous feed
 * reads as "this person's body of work" better than a grid of equal-weight
 * tiles does, and it's the pattern requested for this page specifically.
 */
export const AuthorArticleList = ({ articles }: AuthorArticleListProps) => {
  if (!articles || articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-black uppercase font-serif text-black dark:text-white">No articles found</p>
        <p className="text-muted-foreground max-w-md text-sm">
          Our content engine is currently being populated with fresh financial insights. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
      {articles.map((article) => {
        const href = article.categorySlug ? `/${article.categorySlug}/${article.slug}` : `/financial-intelligence/${article.slug}`;
        const publishedDate = article.publishedAt ? dateFormatter.format(new Date(article.publishedAt)) : null;
        return (
          <article key={article.id} className="py-6 first:pt-0 group">
            <Link href={href} className="flex flex-row gap-4 sm:gap-6 items-start">
              <div className="relative w-24 h-24 sm:w-[220px] sm:h-[147px] shrink-0 overflow-hidden bg-muted border-2 border-black dark:border-slate-700">
                {article.featuredImage ? (
                  <Image
                    src={article.featuredImage}
                    alt={article.title}
                    fill
                    sizes="(min-width: 640px) 220px, 96px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">No image</span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {article.category && (
                  <span className="text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-widest text-[#c8102e]">
                    {article.category}
                  </span>
                )}
                <h3 className="mt-1 text-base sm:text-xl font-black text-slate-950 dark:text-white leading-snug font-serif group-hover:text-[#c8102e] transition-colors line-clamp-2 sm:line-clamp-none">
                  {article.title}
                </h3>
                {publishedDate && (
                  <span className="block mt-1.5 text-[11px] font-mono font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {publishedDate}
                    {article.readingTime ? ` · ${article.readingTime} min read` : ''}
                  </span>
                )}
                {article.description && (
                  <p className="hidden sm:block mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {article.description}
                  </p>
                )}
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
};

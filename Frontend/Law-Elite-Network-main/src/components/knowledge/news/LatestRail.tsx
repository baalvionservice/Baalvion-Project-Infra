import Link from 'next/link';
import Image from 'next/image';
import { articleUrl } from '@/lib/article-url';
import { resolveArticleImage } from '@/lib/article-art';

interface LatestRailProps {
  articles: any[];
  title?: string;
}

/**
 * Compact "Latest" column: a thumbnail-led stack of recent headlines with
 * category kickers, sat beside the lead story -- same list-plus-hero split
 * as a standard newsroom homepage.
 */
export function LatestRail({ articles, title = 'Essential Reads' }: LatestRailProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <aside>
      <h2 className="font-headline text-sm font-extrabold uppercase tracking-[0.16em] text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-slate-100 pb-2 mb-1">
        {title}
      </h2>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {articles.map((art) => (
          <li key={art.id || art.slug}>
            <Link href={articleUrl(art)} className="group flex items-start gap-3 py-4">
              <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                <Image
                  src={resolveArticleImage(art)}
                  alt={art.title}
                  fill
                  sizes="64px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0">
                {art.category?.name && (
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-news-600 mb-1">
                    {art.category.name}
                  </span>
                )}
                <h3 className="font-headline text-[15px] font-bold leading-snug text-slate-900 dark:text-white group-hover:text-news-600 transition-colors line-clamp-2">
                  {art.title}
                </h3>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

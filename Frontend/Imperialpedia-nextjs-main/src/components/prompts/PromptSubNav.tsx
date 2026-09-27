import Link from 'next/link';
import { groupCategories, categoryLabel } from '@/config/prompt-categories';
import { Flame } from 'lucide-react';

interface Props {
  categories: string[];
  /** Active category slug on a category page, 'trending' on /trending-prompts, or omit for /prompts and article pages. */
  active?: string;
}

/**
 * Sticky sub-navigation bar that sits directly under the fixed site header on every /prompts
 * route (directory, category pages, trending, and individual prompt articles) — a single-row,
 * horizontally-scrolling strip of every category, so a reader can jump categories from anywhere
 * without scrolling back up to the header. Flattens the Seasons/Festivals/People grouping from
 * PromptCategoryTabs into one ordered row (grouping reads well in a grid, not in a nav strip).
 */
export function PromptSubNav({ categories, active }: Props) {
  if (categories.length === 0) return null;
  const flat = groupCategories(categories).flatMap((g) => g.slugs);

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav
        aria-label="Prompt categories"
        className="flex items-center gap-6 overflow-x-auto px-4 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Link
          href="/prompts"
          className={`shrink-0 whitespace-nowrap border-b-2 py-3.5 text-sm font-semibold transition-colors ${
            !active
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All Prompts
        </Link>
        {flat.map((cat) => (
          <Link
            key={cat}
            href={`/prompts/category/${encodeURIComponent(cat)}`}
            className={`shrink-0 whitespace-nowrap border-b-2 py-3.5 text-sm font-semibold transition-colors ${
              active === cat
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {categoryLabel(cat)}
          </Link>
        ))}
        <Link
          href="/trending-prompts"
          className={`ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 py-3.5 text-sm font-semibold transition-colors ${
            active === 'trending'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-orange-600/80 hover:text-orange-600 dark:text-orange-400/80 dark:hover:text-orange-400'
          }`}
        >
          <Flame size={14} /> Trending
        </Link>
      </nav>
    </div>
  );
}

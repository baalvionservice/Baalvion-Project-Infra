import Link from 'next/link';
import { groupCategories, categoryLabel, categoryColor } from '@/config/prompt-categories';

interface Props {
  categories: string[];
  /** The active category slug, if this render is a category page. Omit on /prompts and /trending-prompts. */
  active?: string;
}

/**
 * Colorful pill grid linking to each category's own dedicated page, organized into the same
 * Seasons / Festivals & Occasions / People & Style taxonomy as PromptHomeContent (see
 * config/prompt-categories.ts) instead of a flat alphabetical list — each group gets a small
 * caption and its own row, so "Autumn" and "Diwali" don't sit side by side with no logic to it.
 * Wraps onto as many lines as needed rather than a horizontal-scroll strip, which reads badly
 * on mobile once there are more than 4-5 categories.
 */
export function PromptCategoryTabs({ categories, active }: Props) {
  if (categories.length === 0) return null;
  const groups = groupCategories(categories);

  return (
    <nav aria-label="Prompt categories" className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/prompts"
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${!active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
        >
          All
        </Link>
      </div>
      {groups.map(({ group, slugs }) => (
        <div key={group.id} className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70 mr-1">
            {group.label}
          </span>
          {slugs.map((cat) => {
            const color = categoryColor(cat);
            const isActive = active === cat;
            return (
              <Link
                key={cat}
                href={`/prompts/category/${encodeURIComponent(cat)}`}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${isActive ? `${color.solid} text-white` : `${color.bg} ${color.text} hover:opacity-80`}`}
              >
                {categoryLabel(cat)}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

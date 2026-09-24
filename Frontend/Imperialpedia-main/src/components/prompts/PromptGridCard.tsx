import Link from 'next/link';
import { Flame } from 'lucide-react';
import { type FlatPromptCard } from '@/lib/data/prompts-live';
import { categoryColor, categoryLabel } from '@/config/prompt-categories';
import { CopyPromptButton } from '@/components/prompts/CopyPromptButton';

interface Props {
  card: FlatPromptCard;
  priority?: boolean;
}

/** One card per individual prompt (not per roundup post) — the library-grid pattern used by
 * PromptPlum and similar prompt directories: single image, category badge, title, a truncated
 * preview of the actual prompt text, and a copy button that works right from the grid without
 * opening the post. Links through to the post's anchored section (`#prompt-N`) so a card never
 * dead-ends anywhere other than the full prompt it represents. */
export function PromptGridCard({ card, priority = false }: Props) {
  const { item, postSlug, postCategory, isTrending, index } = card;
  const color = categoryColor(postCategory);
  const image = item.images[0];
  const preview = item.prompt_text.length > 140 ? `${item.prompt_text.slice(0, 137)}...` : item.prompt_text;

  return (
    <Link href={`/prompts/${postSlug}#prompt-${index + 1}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[4/5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.alt || item.heading}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading={priority ? 'eager' : 'lazy'}
        />
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          {postCategory && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${color.bg} ${color.text}`}>
              {categoryLabel(postCategory)}
            </span>
          )}
          {isTrending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[11px] font-bold text-white">
              <Flame size={10} className="text-orange-400" /> Trending
            </span>
          )}
        </div>
      </div>

      <h3 className="font-headline mt-3 text-sm font-bold leading-snug text-foreground group-hover:underline line-clamp-2">
        {item.heading}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{preview}</p>

      <div className="mt-2.5">
        <CopyPromptButton slug={postSlug} promptText={item.prompt_text} compact />
      </div>
    </Link>
  );
}

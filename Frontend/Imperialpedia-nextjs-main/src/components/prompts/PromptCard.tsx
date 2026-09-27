import Link from 'next/link';
import { Flame } from 'lucide-react';
import { promptCollageImages, promptCardImage, type Prompt } from '@/lib/data/prompts-live';

interface Props {
  prompt: Prompt;
  /** Position badge (e.g. "#1") shown top-left — used on /trending-prompts. */
  rank?: number;
  priority?: boolean;
}

/**
 * AuraPrompt-style card: a 3-image collage strip (one real image per prompt inside the post,
 * not a repeated single image) with the bold headline below it — no gradient overlay, no text
 * on top of the image. Falls back to a single image if the post has fewer than 3 items.
 */
export function PromptCard({ prompt, rank, priority = false }: Props) {
  const collage = promptCollageImages(prompt, 3);
  const images = collage.length > 0 ? collage : [promptCardImage(prompt)].filter((img): img is NonNullable<typeof img> => Boolean(img));
  const count = prompt.items?.length ?? 0;

  return (
    <Link href={`/prompts/${prompt.slug}`} className="group block">
      <div className="relative flex gap-0.5 overflow-hidden rounded-md bg-muted aspect-[3/2]">
        {images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={img.url}
            alt={img.alt || prompt.title}
            className="h-full flex-1 object-cover transition-transform duration-300 group-hover:scale-105"
            loading={priority ? 'eager' : 'lazy'}
          />
        ))}
        {(rank != null || prompt.is_trending) && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[11px] font-bold text-white">
            {rank != null ? `#${rank}` : <><Flame size={10} className="text-orange-400" /> Trending</>}
          </span>
        )}
      </div>
      <h3 className="font-headline mt-3 text-base font-bold leading-snug text-foreground group-hover:underline line-clamp-2">
        {prompt.title}
      </h3>
      {count > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">{count} prompt{count === 1 ? '' : 's'} inside</p>
      )}
    </Link>
  );
}

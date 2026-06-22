'use client';

/**
 * @file components/search/ResultCard.tsx
 * @description PROMPT 8 — a single catalogue hit: image, title, brand, the
 * Country/Category facet chips it matched on, and its indicative price.
 */
import { ImageIcon, MapPin, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { SearchHit } from '@/lib/search-client';

export function ResultCard({ hit }: { hit: SearchHit }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {hit.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hit.imageUrl}
            alt={hit.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        {hit.hsCode && (
          <span className="absolute left-2 top-2 rounded bg-background/80 px-2 py-0.5 text-[10px] font-bold tabular-nums tracking-wider backdrop-blur">
            HS {hit.hsCode}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {hit.brand && (
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{hit.brand}</p>
        )}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug">{hit.title}</h3>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {hit.country && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <MapPin className="h-3 w-3" />
              {hit.country}
            </Badge>
          )}
          {hit.category && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Tag className="h-3 w-3" />
              {hit.category}
            </Badge>
          )}
        </div>

        <div className="flex items-end justify-between pt-2">
          <div>
            {hit.price !== null ? (
              <p className="text-lg font-black tracking-tight">{formatCurrency(hit.price, hit.currency ?? 'USD')}</p>
            ) : (
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request quote</p>
            )}
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {hit.entityType.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    </article>
  );
}

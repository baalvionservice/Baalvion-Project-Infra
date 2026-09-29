'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterOption = { value: string; label: string; count?: number };
export type FilterGroup = { key: string; label: string; options: FilterOption[] };

/**
 * Faceted filters down the left, the way a job board is read.
 *
 * Every option comes from live postings and carries its count, so nothing here leads to
 * an empty result. Selections live in the URL rather than in component state: the
 * server render stays authoritative, the back button behaves, and a filtered view is a
 * link someone can send to a friend.
 *
 * Groups render as native <details>, so the whole list is in the DOM for a crawler and
 * works with JavaScript off.
 */
export function JobFilterSidebar({ groups }: { groups: FilterGroup[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = (key: string) => searchParams.get(key);
  const anyActive = groups.some((g) => active(g.key)) || searchParams.get('q') || searchParams.get('where');

  const toggle = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) params.delete(key);
    else params.set(key, value);
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <aside className="lg:sticky lg:top-24" aria-label="Filter jobs">
      {/*
        Built to the reference's filter spec: bold black group headers at 1rem, every
        group closed off by a 1px #c2c2c2 rule, options as a checkbox-style list, and the
        clear action centred below.
          .section3__filter-category-button { color:#000; font-weight:bold; font-size:1rem;
                                              border-bottom:1px solid #c2c2c2 }
          .section3__filter-list            { padding:18px 15px; border-bottom:1px solid #c2c2c2 }
          .section3__filter-list-item       { display:flex; align-items:center; gap:10px }
      */}
      <h2 className="border-b border-[#c2c2c2] pb-4 text-base font-bold">Filter results</h2>

      {groups.filter((g) => g.options.length > 0).map((group) => {
        const selected = active(group.key);
        return (
          <details key={group.key} className="group border-b border-[#c2c2c2]" open={Boolean(selected)}>
            <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-base font-bold [&::-webkit-details-marker]:hidden">
              <span>{group.label}</span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>

            <ul className="max-h-64 space-y-2.5 overflow-y-auto pb-4 pr-1">
              {group.options.map((option) => {
                const isOn = selected === option.value;
                return (
                  <li key={option.value} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggle(group.key, option.value)}
                      aria-pressed={isOn}
                      className="flex w-full items-center gap-2.5 text-left text-[15px] leading-snug"
                    >
                      {/* A real checkbox shape, as the reference uses — this is a
                          multi-value filter visually, even though one value applies. */}
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center border border-black',
                          isOn && 'bg-black',
                        )}
                        aria-hidden
                      >
                        {isOn && <Check className="h-3 w-3 text-white" />}
                      </span>
                      <span className={cn('flex-1 truncate', isOn && 'font-bold')}>{option.label}</span>
                      {option.count !== undefined && (
                        <span className="shrink-0 tabular-nums text-muted-foreground">{option.count}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}

      {anyActive && (
        <div className="mt-7 flex justify-center">
          <Link
            href={pathname}
            className="border border-black px-5 py-2 text-sm font-bold transition-colors hover:bg-black hover:text-white"
          >
            Clear filters
          </Link>
        </div>
      )}
    </aside>
  );
}

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { List, ChevronDown, ChevronUp } from 'lucide-react';
import { articleUrl } from '@/lib/article-url';

export interface SeriesEntry {
  slug: string;
  title: string;
  categorySlug?: string;
  /** Optional chapter grouping (e.g. "Saving for College") -- undefined renders as a flat top-level entry. */
  sectionTitle?: string;
  /** Global position across the whole series -- drives sort order and "Next up". */
  order: number;
  current: boolean;
}

export interface SeriesInfo {
  title: string;
  entries: SeriesEntry[];
}

type Group = { key: string; sectionTitle: string | null; items: SeriesEntry[] };

/** Groups the flat, order-sorted entry list into chapters, preserving each chapter's first-appearance position. Entries with no sectionTitle become their own single-item group (rendered as a plain link, no chevron). */
function groupEntries(entries: SeriesEntry[]): Group[] {
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const groups: Group[] = [];
  const bySection = new Map<string, Group>();
  let ungroupedIndex = 0;

  for (const entry of sorted) {
    if (!entry.sectionTitle) {
      groups.push({ key: `solo-${ungroupedIndex++}`, sectionTitle: null, items: [entry] });
      continue;
    }
    let group = bySection.get(entry.sectionTitle);
    if (!group) {
      group = { key: entry.sectionTitle, sectionTitle: entry.sectionTitle, items: [] };
      bySection.set(entry.sectionTitle, group);
      groups.push(group);
    }
    group.items.push(entry);
  }
  return groups;
}

function ItemLink({ entry, index, isNext }: { entry: SeriesEntry; index?: number; isNext: boolean }) {
  const content = (
    <>
      {index !== undefined && (
        <span className="text-[12px] text-slate-400 w-5 shrink-0 tabular-nums">{index}.</span>
      )}
      <span className="min-w-0">
        <span className={entry.current ? 'text-slate-900 font-semibold' : 'group-hover:text-blue-700'}>
          {entry.title}
        </span>
        {entry.current && (
          <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">
            Current article
          </span>
        )}
      </span>
      {isNext && (
        <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wide text-white bg-blue-600 rounded px-2 py-0.5">
          Next up
        </span>
      )}
    </>
  );

  if (entry.current) {
    return <span className="flex items-center gap-3 px-5 py-2.5 text-[14px]">{content}</span>;
  }

  return (
    <Link
      href={articleUrl({ slug: entry.slug, category: { slug: entry.categorySlug } })}
      className="group flex items-center gap-3 px-5 py-2.5 text-[14px] text-blue-700 hover:bg-slate-50 transition-colors"
    >
      {content}
    </Link>
  );
}

function SectionGroup({ group, nextUpSlug }: { group: Group; nextUpSlug: string | null }) {
  const containsCurrent = group.items.some((e) => e.current);
  const [open, setOpen] = useState(containsCurrent);

  if (group.sectionTitle === null) {
    const entry = group.items[0];
    return (
      <li className="border-t border-slate-100 first:border-t-0">
        <ItemLink entry={entry} isNext={entry.slug === nextUpSlug} />
      </li>
    );
  }

  return (
    <li className="border-t border-slate-100 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-3 px-5 py-2.5 text-[14px] font-bold text-left transition-colors ${
          open ? 'text-slate-900' : 'text-blue-700 hover:bg-slate-50'
        }`}
      >
        {group.sectionTitle}
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
        )}
      </button>
      {open && (
        <ol>
          {group.items.map((entry, i) => (
            <li key={entry.slug} className="border-t border-slate-100">
              <ItemLink entry={entry} index={i + 1} isNext={entry.slug === nextUpSlug} />
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

/**
 * "Part of the Series" disclosure -- two levels, matching the reference this
 * was modeled on: a collapsible outer box (collapsed by default), containing
 * flat top-level entries and/or named, independently collapsible chapters.
 * The chapter containing the current article auto-expands; others start
 * collapsed. The entry right after the current one in overall series order
 * gets a "Next up" badge. Data resolution (resolveSeriesInfo) lives in
 * ArticleView.tsx, same as resolveReviewedBy/resolveFactCheckedBy -- this
 * file only renders the already-resolved result.
 */
export function SeriesNotice({ series }: { series: SeriesInfo | null }) {
  const [open, setOpen] = useState(false);
  if (!series) return null;

  const sorted = [...series.entries].sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex((e) => e.current);
  const nextUpSlug = currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1].slug : null;
  const groups = groupEntries(series.entries);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <List className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Part of the Series</p>
            <p className="text-[15px] font-bold text-slate-900 truncate">{series.title}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ol className="border-t border-slate-100">
          {groups.map((group) => (
            <SectionGroup key={group.key} group={group} nextUpSlug={nextUpSlug} />
          ))}
        </ol>
      )}
    </div>
  );
}

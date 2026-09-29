'use client';

import { Pencil, SearchX } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { STATUS_COLOR } from './UploadsTable';
import type { ContentItem } from '@/lib/types/cms-content.types';

interface Props {
  query: string;
  results: ContentItem[];
  totalMatches: number;
  topicLabelById: Map<string, string>;
  regionLabelById: Map<string, string>;
  activeIndex: number;
  onSelect: (item: ContentItem) => void;
}

const CARD = '#181C22';
const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';

export default function SearchJumpDropdown({
  query, results, totalMatches, topicLabelById, regionLabelById, activeIndex, onSelect,
}: Props) {
  return (
    <div
      className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-96 overflow-y-auto rounded-lg border shadow-2xl"
      style={{ background: CARD, borderColor: BORDER }}
    >
      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
          <SearchX className="h-4 w-4" style={{ color: MUTED }} />
          <p className="text-xs" style={{ color: MUTED }}>No headlines match &quot;{query}&quot;</p>
        </div>
      ) : (
        <>
          {results.map((item, i) => {
            const topic = item.categoryIds.map((id) => topicLabelById.get(id)).find(Boolean);
            const region = item.categoryIds.map((id) => regionLabelById.get(id)).find(Boolean);
            const color = STATUS_COLOR[item.status] ?? MUTED;
            return (
              <button
                key={item.id}
                onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
                className="flex w-full items-center gap-3 border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-white/5"
                style={{ borderColor: BORDER, background: i === activeIndex ? 'rgba(255,255,255,0.06)' : undefined }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm" style={{ color: TEXT }}>{item.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px]" style={{ color: MUTED }}>
                    <span className="rounded px-1 py-px font-semibold uppercase tracking-wide" style={{ color, background: `${color}1A` }}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                    <span style={{ color: item.readingTimeMinutes ? MUTED : '#EF4444' }}>
                      {item.readingTimeMinutes ? `${item.readingTimeMinutes} min read` : 'No content yet'}
                    </span>
                    {[topic, region].filter(Boolean).join(' • ')}
                    {' · '}Updated {formatDate(item.updatedAt, 'MMM d, HH:mm')}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ color: TEXT, background: '#2D7FF91A' }}>
                  <Pencil className="h-3 w-3" /> Edit
                </span>
              </button>
            );
          })}
          {totalMatches > results.length && (
            <p className="px-3 py-2 text-center text-[11px]" style={{ color: MUTED }}>
              +{totalMatches - results.length} more match{totalMatches - results.length === 1 ? '' : 'es'} — keep typing to narrow it down
            </p>
          )}
        </>
      )}
    </div>
  );
}

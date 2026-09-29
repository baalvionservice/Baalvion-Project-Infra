'use client';

import type { ContentItem, ContentWorkflowStatus } from '@/lib/types/cms-content.types';

// Terminal-style compact "time ago" — "5m", "2h", "3d" — not date-fns's verbose default.
function compactTimeAgo(iso: string): string {
  const diffSec = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return `${Math.round(diffHr / 24)}d`;
}

interface Props {
  items: ContentItem[];
  topicLabelById: Map<string, string>;
  regionLabelById: Map<string, string>;
  onSelect: (id: string) => void;
}

const STATUS_META: Partial<Record<ContentWorkflowStatus, { label: string; color: string }>> = {
  published: { label: 'Published', color: '#16C784' },
  draft: { label: 'Draft Saved', color: '#F59E0B' },
  pending_review: { label: 'In Review', color: '#2D7FF9' },
  scheduled: { label: 'Scheduled', color: '#2D7FF9' },
  archived: { label: 'Archived', color: '#9CA3AF' },
};

export default function LiveFeed({ items, topicLabelById, regionLabelById, onSelect }: Props) {
  const feed = [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 12);

  if (!feed.length) {
    return <p className="py-8 text-center text-xs" style={{ color: '#9CA3AF' }}>No newsroom activity yet.</p>;
  }

  return (
    <div className="space-y-0.5">
      {feed.map((item) => {
        const meta = STATUS_META[item.status] ?? { label: item.status, color: '#9CA3AF' };
        const topic = item.categoryIds.map((id) => topicLabelById.get(id)).find(Boolean);
        const region = item.categoryIds.map((id) => regionLabelById.get(id)).find(Boolean);
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
          >
            <span className="mt-0.5 w-8 shrink-0 font-mono text-[11px]" style={{ color: '#9CA3AF' }}>
              {compactTimeAgo(item.updatedAt)}
            </span>
            <span
              className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: meta.color, background: `${meta.color}1A` }}
            >
              {meta.label}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm" style={{ color: '#F5F7FA' }}>{item.title}</p>
              {(topic || region) && (
                <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                  {[topic, region].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

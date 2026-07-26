'use client';

import { ExternalLink, Pencil } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import type { ContentItem, ContentWorkflowStatus } from '@/lib/types/cms-content.types';

interface Props {
  items: ContentItem[];
  topicLabelById: Map<string, string>;
  regionLabelById: Map<string, string>;
  authorNameById: Map<number, string>;
  websiteId: string;
  websiteDomain?: string | null;
}

export const STATUS_COLOR: Partial<Record<ContentWorkflowStatus, string>> = {
  published: '#16C784',
  draft: '#F59E0B',
  pending_review: '#2D7FF9',
  scheduled: '#2D7FF9',
  archived: '#9CA3AF',
  changes_requested: '#EF4444',
};

export default function UploadsTable({ items, topicLabelById, regionLabelById, authorNameById, websiteId, websiteDomain }: Props) {
  if (!items.length) {
    return <p className="py-8 text-center text-xs" style={{ color: '#9CA3AF' }}>Nothing in this range.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
            <th className="px-3 py-2 font-medium">Headline</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Topics</th>
            <th className="px-3 py-2 font-medium">Region</th>
            <th className="px-3 py-2 font-medium">Source</th>
            <th className="px-3 py-2 font-medium">Author</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 font-medium">Updated</th>
            <th className="px-3 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const topics = item.categoryIds.map((id) => topicLabelById.get(id)).filter((v): v is string => !!v);
            const region = item.categoryIds.map((id) => regionLabelById.get(id)).find(Boolean);
            const author = item.author.fullName || authorNameById.get(item.author.id) || '—';
            const color = STATUS_COLOR[item.status] ?? '#9CA3AF';
            return (
              <tr key={item.id} className="border-t" style={{ borderColor: '#242A33' }}>
                <td className="max-w-xs truncate px-3 py-2.5" style={{ color: '#F5F7FA' }}>{item.title}</td>
                <td className="px-3 py-2.5">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color, background: `${color}1A` }}
                  >
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {topics.length ? topics.map((t) => (
                      <span key={t} className="rounded px-1.5 py-0.5 text-[10px]" style={{ color: '#9CA3AF', background: '#242A33' }}>
                        {t}
                      </span>
                    )) : <span style={{ color: '#9CA3AF' }}>—</span>}
                  </div>
                </td>
                <td className="px-3 py-2.5" style={{ color: '#9CA3AF' }}>{region ?? '—'}</td>
                <td className="px-3 py-2.5" style={{ color: '#9CA3AF' }}>{item.externalSourceName || 'Newsroom'}</td>
                <td className="px-3 py-2.5" style={{ color: '#9CA3AF' }}>{author}</td>
                <td className="whitespace-nowrap px-3 py-2.5" style={{ color: '#9CA3AF' }}>{formatDate(item.createdAt, 'MMM d, HH:mm')}</td>
                <td className="whitespace-nowrap px-3 py-2.5" style={{ color: '#9CA3AF' }}>{formatDate(item.updatedAt, 'MMM d, HH:mm')}</td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-end gap-2">
                    <a
                      href={`/cms/websites/${websiteId}/content/${item.id}`}
                      className="rounded p-1 transition-colors hover:bg-white/10"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" style={{ color: '#9CA3AF' }} />
                    </a>
                    {item.status === 'published' && websiteDomain && (
                      <a
                        href={`https://${websiteDomain}/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 transition-colors hover:bg-white/10"
                        title="View live"
                      >
                        <ExternalLink className="h-3.5 w-3.5" style={{ color: '#9CA3AF' }} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

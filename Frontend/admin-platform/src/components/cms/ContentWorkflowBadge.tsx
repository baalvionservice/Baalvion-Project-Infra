'use client';

import { Badge } from '@/components/ui/badge';
import type { ContentWorkflowStatus } from '@/lib/types/cms-content.types';

const STATUS_MAP: Record<
  ContentWorkflowStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending_review: { label: 'Pending Review', variant: 'default' },
  changes_requested: { label: 'Changes Requested', variant: 'destructive' },
  compliance_review: { label: 'Compliance Review', variant: 'outline' },
  approved: { label: 'Approved', variant: 'default' },
  scheduled: { label: 'Scheduled', variant: 'outline' },
  published: { label: 'Published', variant: 'default' },
  archived: { label: 'Archived', variant: 'secondary' },
};

const STATUS_COLORS: Record<ContentWorkflowStatus, string> = {
  draft: '',
  pending_review: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  changes_requested: '',
  compliance_review: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400',
  approved: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  scheduled: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
  published: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  archived: '',
};

interface Props {
  status: ContentWorkflowStatus;
  className?: string;
}

export default function ContentWorkflowBadge({ status, className }: Props) {
  const cfg = STATUS_MAP[status];
  const color = STATUS_COLORS[status];

  return (
    <Badge
      variant={cfg.variant}
      className={`text-xs ${color} ${className ?? ''}`}
    >
      {cfg.label}
    </Badge>
  );
}

import type { ContentWorkflowStatus } from '@/lib/types/cms-content.types';

// The product surfaces a 7-stage pipeline. Two stages are renamed from the backend enum:
//   pending_review     → "In Review"
//   changes_requested  → "Rejected"
export interface PipelineStageMeta {
  status: ContentWorkflowStatus;
  label: string;
  dot: string; // bg color for the column dot
  ring: string; // column header accent
}

export const PIPELINE_STAGES: PipelineStageMeta[] = [
  { status: 'draft', label: 'Draft', dot: 'bg-zinc-400', ring: 'border-zinc-400/40' },
  { status: 'pending_review', label: 'In Review', dot: 'bg-amber-400', ring: 'border-amber-400/40' },
  { status: 'approved', label: 'Approved', dot: 'bg-blue-400', ring: 'border-blue-400/40' },
  { status: 'scheduled', label: 'Scheduled', dot: 'bg-violet-400', ring: 'border-violet-400/40' },
  { status: 'published', label: 'Published', dot: 'bg-green-400', ring: 'border-green-400/40' },
  { status: 'changes_requested', label: 'Rejected', dot: 'bg-rose-400', ring: 'border-rose-400/40' },
  { status: 'compliance_review', label: 'Compliance', dot: 'bg-indigo-400', ring: 'border-indigo-400/40' },
  { status: 'archived', label: 'Archived', dot: 'bg-zinc-500', ring: 'border-zinc-500/40' },
];

export const STAGE_LABEL: Record<ContentWorkflowStatus, string> = PIPELINE_STAGES.reduce(
  (acc, s) => ({ ...acc, [s.status]: s.label }),
  {} as Record<ContentWorkflowStatus, string>,
);

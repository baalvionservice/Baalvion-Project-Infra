import type { CmsRole } from './cms-website.types';
import type { ContentWorkflowStatus } from './cms-content.types';

export type WorkflowAction =
  | 'submit_for_review'
  | 'approve'
  | 'request_changes'
  | 'submit_for_compliance'
  | 'compliance_approve'
  | 'compliance_reject'
  | 'publish'
  | 'schedule'
  | 'unpublish'
  | 'archive'
  | 'restore_to_draft';

export interface WorkflowTransitionDef {
  from: ContentWorkflowStatus;
  to: ContentWorkflowStatus;
  action: WorkflowAction;
  requiredRoles: CmsRole[];
  label: string;
  requiresNote?: boolean;
}

export const WORKFLOW_TRANSITIONS: WorkflowTransitionDef[] = [
  {
    from: 'draft',
    to: 'pending_review',
    action: 'submit_for_review',
    requiredRoles: ['cms_admin', 'cms_editor', 'cms_author', 'cms_contributor'],
    label: 'Submit for Review',
  },
  {
    from: 'pending_review',
    to: 'approved',
    action: 'approve',
    requiredRoles: ['cms_admin', 'cms_editor', 'cms_reviewer', 'cms_publisher'],
    label: 'Approve',
  },
  {
    from: 'pending_review',
    to: 'changes_requested',
    action: 'request_changes',
    requiredRoles: ['cms_admin', 'cms_editor', 'cms_reviewer'],
    label: 'Request Changes',
    requiresNote: true,
  },
  {
    from: 'changes_requested',
    to: 'pending_review',
    action: 'submit_for_review',
    requiredRoles: ['cms_admin', 'cms_editor', 'cms_author', 'cms_contributor'],
    label: 'Resubmit for Review',
  },
  {
    from: 'approved',
    to: 'compliance_review',
    action: 'submit_for_compliance',
    requiredRoles: ['cms_admin', 'cms_editor', 'cms_reviewer'],
    label: 'Send to Compliance',
  },
  {
    from: 'compliance_review',
    to: 'approved',
    action: 'compliance_approve',
    requiredRoles: ['cms_admin', 'cms_compliance'],
    label: 'Compliance Approve',
  },
  {
    from: 'compliance_review',
    to: 'changes_requested',
    action: 'compliance_reject',
    requiredRoles: ['cms_admin', 'cms_compliance'],
    label: 'Compliance Reject',
    requiresNote: true,
  },
  {
    from: 'approved',
    to: 'published',
    action: 'publish',
    requiredRoles: ['cms_admin', 'cms_publisher'],
    label: 'Publish Now',
  },
  {
    from: 'approved',
    to: 'scheduled',
    action: 'schedule',
    requiredRoles: ['cms_admin', 'cms_publisher'],
    label: 'Schedule',
    requiresNote: false,
  },
  {
    from: 'draft',
    to: 'published',
    action: 'publish',
    requiredRoles: ['cms_admin', 'cms_editor', 'cms_publisher'],
    label: 'Publish Directly',
  },
  {
    from: 'published',
    to: 'archived',
    action: 'archive',
    requiredRoles: ['cms_admin', 'cms_editor'],
    label: 'Archive',
  },
  {
    from: 'scheduled',
    to: 'draft',
    action: 'restore_to_draft',
    requiredRoles: ['cms_admin', 'cms_editor', 'cms_publisher'],
    label: 'Cancel Schedule',
  },
  {
    from: 'archived',
    to: 'draft',
    action: 'restore_to_draft',
    requiredRoles: ['cms_admin', 'cms_editor'],
    label: 'Restore to Draft',
  },
  {
    from: 'published',
    to: 'draft',
    action: 'unpublish',
    requiredRoles: ['cms_admin', 'cms_editor', 'cms_publisher'],
    label: 'Unpublish',
  },
];

export interface WorkflowApprovalRequest {
  id: string;
  contentId: string;
  contentTitle: string;
  contentType: string;
  websiteId: string;
  websiteName: string;
  fromStatus: ContentWorkflowStatus;
  toStatus: ContentWorkflowStatus;
  action: WorkflowAction;
  requestedBy: { id: number; fullName: string; avatarUrl: string | null };
  reviewedBy?: { id: number; fullName: string; avatarUrl: string | null };
  note?: string;
  reviewNote?: string;
  requestedAt: string;
  reviewedAt?: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface WorkflowTransitionPayload {
  contentId: string;
  action: WorkflowAction;
  note?: string;
  scheduledAt?: string;
}

export interface WorkflowStatsForWebsite {
  websiteId: string;
  pending: number;
  changesRequested: number;
  approved: number;
  scheduled: number;
  published: number;
  draft: number;
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { UserCheck, Inbox, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import { initials, formatRelative } from '@/lib/utils/format';
import { CMS_ROLE_LEVEL } from '@/lib/types/cms-website.types';
import { cmsRoleLabel } from '@/lib/cms/permissions';
import { useWebsiteMembers } from '@/lib/queries/cms-websites.queries';
import { useWorkflowApprovals } from '@/lib/queries/cms-workflow.queries';
import type { WebsiteMember } from '@/lib/types/cms-website.types';

interface Props {
  websiteId: string;
  canonicalId: string;
}

// Roles allowed to review/approve content (reviewer authority and above).
const MIN_REVIEW_LEVEL = CMS_ROLE_LEVEL.cms_reviewer;

// The backend has no reviewer-assignment column, so routing assignments are persisted
// locally per website. This keeps the queue actionable without a fake backend write.
const assignKey = (websiteId: string) => `cms:reviewer-assign:${websiteId}`;

type Assignments = Record<string, number>; // approvalId → reviewer userId

function loadAssignments(websiteId: string): Assignments {
  try {
    return JSON.parse(localStorage.getItem(assignKey(websiteId)) || '{}');
  } catch {
    return {};
  }
}

export default function ReviewerPanel({ websiteId, canonicalId }: Props) {
  const { data: members, isLoading: membersLoading } = useWebsiteMembers(canonicalId);
  const { data: approvals, isLoading: approvalsLoading } = useWorkflowApprovals({
    websiteId,
    status: 'pending',
    limit: 100,
  });

  const [assignments, setAssignments] = useState<Assignments>({});
  useEffect(() => {
    setAssignments(loadAssignments(websiteId));
  }, [websiteId]);

  const reviewers = useMemo<WebsiteMember[]>(
    () => (members ?? []).filter((m) => CMS_ROLE_LEVEL[m.cmsRole] >= MIN_REVIEW_LEVEL),
    [members],
  );

  const pending = approvals?.data ?? [];

  const setAssignment = (approvalId: string, userId: number) => {
    const next = { ...assignments, [approvalId]: userId };
    setAssignments(next);
    try {
      localStorage.setItem(assignKey(websiteId), JSON.stringify(next));
    } catch {
      /* storage unavailable — keep in-memory */
    }
  };

  // Workload = assigned-pending count per reviewer.
  const workload = useMemo(() => {
    const map = new Map<number, number>();
    Object.values(assignments).forEach((uid) => map.set(uid, (map.get(uid) ?? 0) + 1));
    return map;
  }, [assignments]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Reviewer roster */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-amber-500" />
            Reviewers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {membersLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : reviewers.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No reviewers yet. Give a member the Reviewer, Editor or Admin role.
            </p>
          ) : (
            reviewers.map((r) => (
              <div key={r.userId} className="flex items-center gap-2.5 rounded-md border p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={r.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[11px]">{initials(r.user.fullName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{r.user.fullName}</p>
                  <p className="text-[10px] text-muted-foreground">{cmsRoleLabel(r.cmsRole)}</p>
                </div>
                <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
                  <Inbox className="h-3 w-3" />
                  {workload.get(r.userId) ?? 0}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pending queue with reviewer assignment */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-yellow-500" />
            Awaiting review
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {pending.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {approvalsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : pending.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              Nothing is waiting for review. 🎉
            </p>
          ) : (
            pending.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-2 rounded-md border p-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/cms/websites/${websiteId}/content/${req.contentId}`}
                    className="text-xs font-medium hover:underline"
                  >
                    {req.contentTitle}
                  </Link>
                  <p className="text-[10px] text-muted-foreground">
                    by {req.requestedBy.fullName} · {formatRelative(req.requestedAt)}
                  </p>
                </div>
                <Select
                  value={assignments[req.id] ? String(assignments[req.id]) : undefined}
                  onValueChange={(v) => setAssignment(req.id, Number(v))}
                >
                  <SelectTrigger
                    className={cn(
                      'h-8 w-full text-xs sm:w-44',
                      !assignments[req.id] && 'text-muted-foreground',
                    )}
                  >
                    <SelectValue placeholder="Assign reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewers.map((r) => (
                      <SelectItem key={r.userId} value={String(r.userId)} className="text-xs">
                        {r.user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { formatRelative } from '@/lib/utils/format';
import { PIPELINE_STAGES } from '@/lib/cms/workflow-status';
import { WORKFLOW_TRANSITIONS } from '@/lib/types/cms-workflow.types';
import { useContentList } from '@/lib/queries/cms-content.queries';
import { useWorkflowTransition } from '@/lib/queries/cms-workflow.queries';
import { useCmsPermissions } from '@/lib/queries/cms-permissions.queries';
import type { ContentItem, ContentWorkflowStatus } from '@/lib/types/cms-content.types';
import type { WorkflowTransitionDef } from '@/lib/types/cms-workflow.types';

interface Props {
  websiteId: string;
  canonicalId: string;
}

interface PendingAction {
  item: ContentItem;
  transition: WorkflowTransitionDef;
}

export default function WorkflowPipeline({ websiteId, canonicalId }: Props) {
  const perms = useCmsPermissions(canonicalId);
  const { data, isLoading } = useContentList({
    websiteId: canonicalId,
    sortBy: 'updatedAt',
    sortDir: 'desc',
    limit: 100,
  });
  const transition = useWorkflowTransition();

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [note, setNote] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');

  const grouped = useMemo(() => {
    const map = new Map<ContentWorkflowStatus, ContentItem[]>();
    PIPELINE_STAGES.forEach((s) => map.set(s.status, []));
    (data?.data ?? []).forEach((item) => {
      if (map.has(item.status)) map.get(item.status)!.push(item);
    });
    return map;
  }, [data]);

  const allowedTransitions = (status: ContentWorkflowStatus): WorkflowTransitionDef[] =>
    WORKFLOW_TRANSITIONS.filter(
      (t) =>
        t.from === status &&
        (perms.isManager || (perms.myRole != null && t.requiredRoles.includes(perms.myRole))),
    );

  const runTransition = (item: ContentItem, t: WorkflowTransitionDef) => {
    if (t.action === 'schedule' || t.requiresNote) {
      setPending({ item, transition: t });
      setNote('');
      setScheduleAt('');
      return;
    }
    transition.mutate({ contentId: item.id, action: t.action });
  };

  const confirmPending = () => {
    if (!pending) return;
    const { item, transition: t } = pending;
    transition.mutate(
      {
        contentId: item.id,
        action: t.action,
        note: note.trim() || undefined,
        scheduledAt: t.action === 'schedule' && scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
      },
      { onSuccess: () => setPending(null) },
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Move content through the publishing pipeline. Available moves depend on your role.
      </p>

      <div className="flex gap-3 overflow-x-auto pb-3">
        {PIPELINE_STAGES.map((stage) => {
          const items = grouped.get(stage.status) ?? [];
          return (
            <div key={stage.status} className="w-72 shrink-0">
              <div className={cn('mb-2 flex items-center justify-between rounded-md border-l-2 px-2 py-1.5', stage.ring)}>
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', stage.dot)} />
                  <span className="text-xs font-semibold">{stage.label}</span>
                </div>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] tabular-nums">
                  {items.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                ) : items.length === 0 ? (
                  <div className="rounded-md border border-dashed py-6 text-center text-[11px] text-muted-foreground">
                    Empty
                  </div>
                ) : (
                  items.map((item) => {
                    const moves = allowedTransitions(item.status);
                    return (
                      <Card key={item.id} className="group p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/cms/websites/${websiteId}/content/${item.id}`}
                            className="line-clamp-2 text-xs font-medium hover:underline"
                          >
                            {item.title}
                          </Link>
                          {moves.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {moves.map((t) => (
                                  <DropdownMenuItem
                                    key={t.action + t.to}
                                    onClick={() => runTransition(item, t)}
                                    className="text-xs"
                                  >
                                    <ChevronRight className="mr-1.5 h-3.5 w-3.5" />
                                    {t.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="capitalize">{item.type.replace(/_/g, ' ')}</span>
                          <span>{formatRelative(item.updatedAt)}</span>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Note / schedule dialog for transitions that require input */}
      <Dialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{pending?.transition.label}</DialogTitle>
            <DialogDescription className="text-xs">{pending?.item.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {pending?.transition.action === 'schedule' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Publish date &amp; time</Label>
                <Input
                  type="datetime-local"
                  className="h-9 text-sm"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                />
              </div>
            )}
            {pending?.transition.requiresNote && (
              <div className="space-y-1.5">
                <Label className="text-xs">Note {pending.transition.requiresNote ? '(required)' : ''}</Label>
                <textarea
                  className="min-h-[80px] w-full resize-none rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add a note for the author…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={
                transition.isPending ||
                (pending?.transition.action === 'schedule' && !scheduleAt) ||
                (pending?.transition.requiresNote && !note.trim())
              }
              onClick={confirmPending}
            >
              {transition.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

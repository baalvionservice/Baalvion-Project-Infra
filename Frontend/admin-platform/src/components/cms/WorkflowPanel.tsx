'use client';

import { useState } from 'react';
import { ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ContentWorkflowBadge from './ContentWorkflowBadge';
import { WORKFLOW_TRANSITIONS } from '@/lib/types/cms-workflow.types';
import { useWorkflowTransition } from '@/lib/queries/cms-workflow.queries';
import type { ContentWorkflowStatus } from '@/lib/types/cms-content.types';
import type { WorkflowTransitionDef } from '@/lib/types/cms-workflow.types';
import type { CmsRole } from '@/lib/types/cms-website.types';

interface Props {
  contentId: string;
  currentStatus: ContentWorkflowStatus;
  userRole?: CmsRole;
  scheduledAt?: string | null;
}

export default function WorkflowPanel({ contentId, currentStatus, userRole, scheduledAt }: Props) {
  const { mutate: transition, isPending } = useWorkflowTransition();
  const [confirmTransition, setConfirmTransition] = useState<WorkflowTransitionDef | null>(null);
  const [note, setNote] = useState('');
  const [scheduledDate, setScheduledDate] = useState(scheduledAt ?? '');

  const availableTransitions = WORKFLOW_TRANSITIONS.filter(
    (t) =>
      t.from === currentStatus &&
      (!userRole || t.requiredRoles.includes(userRole))
  );

  const handleConfirm = () => {
    if (!confirmTransition) return;
    transition(
      {
        contentId,
        action: confirmTransition.action,
        note: note || undefined,
        scheduledAt:
          confirmTransition.action === 'schedule' ? scheduledDate : undefined,
      },
      {
        onSuccess: () => {
          setConfirmTransition(null);
          setNote('');
        },
      }
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs text-muted-foreground mb-2">Current Status</p>
        <ContentWorkflowBadge status={currentStatus} />
        {scheduledAt && currentStatus === 'scheduled' && (
          <p className="text-xs text-muted-foreground mt-1">
            <Clock className="inline h-3 w-3 mr-1" />
            Scheduled: {new Date(scheduledAt).toLocaleString()}
          </p>
        )}
      </div>

      {availableTransitions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Available Actions</p>
          {availableTransitions.map((t) => (
            <button
              key={t.action}
              onClick={() => { setNote(''); setConfirmTransition(t); }}
              disabled={isPending}
              className="w-full flex items-center justify-between rounded-lg border p-3 text-left text-xs hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{t.label}</span>
              </div>
              <ContentWorkflowBadge status={t.to} />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No actions available for your role at this status.
        </p>
      )}

      {/* Confirm dialog */}
      <Dialog
        open={!!confirmTransition}
        onOpenChange={(o) => !o && setConfirmTransition(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{confirmTransition?.label}</DialogTitle>
            <DialogDescription>
              Move content from{' '}
              <strong className="capitalize">{currentStatus.replace(/_/g, ' ')}</strong> to{' '}
              <strong className="capitalize">
                {confirmTransition?.to.replace(/_/g, ' ')}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {confirmTransition?.action === 'schedule' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
            )}

            {(confirmTransition?.requiresNote || confirmTransition?.action === 'request_changes') && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  Note {confirmTransition.requiresNote ? '(required)' : '(optional)'}
                </label>
                <textarea
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-xs min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add a note for the content author..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            )}

            {!confirmTransition?.requiresNote && confirmTransition?.action !== 'schedule' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Note (optional)</label>
                <textarea
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-xs min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Optional note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmTransition(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={
                isPending ||
                (confirmTransition?.requiresNote && !note.trim()) ||
                (confirmTransition?.action === 'schedule' && !scheduledDate)
              }
            >
              {isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

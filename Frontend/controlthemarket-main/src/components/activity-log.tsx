'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';
import {
  FilePen,
  Send,
  Star,
  UserPlus,
  CheckCircle,
  XCircle,
  ChevronsRight,
  ShieldAlert,
} from 'lucide-react';
import type { Submission, Evaluation } from '@/lib/types';

interface ActivityLogProps {
  submission: Submission;
  evaluation?: Evaluation;
  isAdminOverride?: boolean;
}

export function ActivityLog({ submission, evaluation, isAdminOverride }: ActivityLogProps) {
  const activityEvents: {
    icon: React.ElementType;
    title: string;
    timestamp: string;
    description?: string;
  }[] = [];

  // Base events
  if (submission.assignedAt) {
    activityEvents.push({
      icon: UserPlus,
      title: 'Task Assigned',
      timestamp: submission.assignedAt,
      description: 'The task was assigned to the candidate.',
    });
  }

  if (submission.submittedAt) {
    activityEvents.push({
      icon: Send,
      title: 'Initial Submission',
      timestamp: submission.submittedAt,
      description: `Round ${submission.currentRound || 1} was submitted.`,
    });
  }
  
  if (submission.status === 'in-review' && submission.lastUpdated !== submission.submittedAt) {
    activityEvents.push({
      icon: FilePen,
      title: 'Review Started',
      timestamp: submission.lastUpdated,
      description: 'The submission is now being reviewed.',
    });
  }

  if (submission.resubmittedAt) {
    activityEvents.push({
      icon: Send,
      title: 'Work Resubmitted',
      timestamp: submission.resubmittedAt,
      description: 'The candidate submitted a new version of their work.',
    });
  }

  if (evaluation?.evaluatedAt) {
    activityEvents.push({
      icon: Star,
      title: 'Evaluation Completed',
      timestamp: evaluation.evaluatedAt,
      description: `Final Score: ${evaluation.score}/100`,
    });
  }

  // Final decision events
  const evaluatedAtTime = evaluation ? new Date(evaluation.evaluatedAt).getTime() : 0;
  const lastUpdatedTime = new Date(submission.lastUpdated).getTime();

  // Only show these if they happened after the evaluation
  if (lastUpdatedTime > evaluatedAtTime) {
      if (submission.status === 'shortlisted') {
        activityEvents.push({
          icon: CheckCircle,
          title: 'Candidate Shortlisted',
          timestamp: submission.lastUpdated,
          description: 'This candidate was moved to the shortlist.',
        });
      } else if (submission.status === 'rejected') {
        activityEvents.push({
          icon: XCircle,
          title: 'Candidate Rejected',
          timestamp: submission.lastUpdated,
          description: 'This candidate was not selected to move forward.',
        });
      } else if (submission.status === 'moved-to-next-round') {
        activityEvents.push({
          icon: ChevronsRight,
          title: 'Moved to Next Round',
          timestamp: submission.lastUpdated,
          description: 'The candidate has been advanced to the next round.',
        });
      }
  }

  if (isAdminOverride) {
      activityEvents.push({
          icon: ShieldAlert,
          title: 'Admin Override',
          timestamp: new Date().toISOString(), // Mocking current time for the override view
          description: 'An admin is currently viewing or modifying this record.'
      });
  }


  const sortedEvents = activityEvents.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>A timeline of all actions for this task.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6">
           {sortedEvents.map((event, index) => (
            <div key={index} className="flex items-start gap-4 pb-8 last:pb-0">
              {index < sortedEvents.length - 1 && (
                <div className="absolute left-[34px] top-2 h-full w-px -translate-x-1/2 bg-border" />
              )}
              <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <event.icon className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="flex-1 -translate-y-1">
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.timestamp), 'PPp')}
                </p>
                {event.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          ))}
          {sortedEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity to show yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

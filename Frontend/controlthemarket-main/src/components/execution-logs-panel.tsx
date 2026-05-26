
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
    CheckCircle,
    XCircle,
    ChevronsRight,
    ShieldAlert,
    Clock,
    AlertTriangle,
    ScrollText,
} from 'lucide-react';
import type { Submission, Evaluation, ActivityStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';

interface ExecutionLogsPanelProps {
  submission: Submission;
  evaluation?: Evaluation;
  isAdminOverride?: boolean;
}

type LogEvent = {
  timestamp: string;
  description: string;
  status: ActivityStatus;
};

const getStatusVariant = (status: ActivityStatus) => {
    switch (status) {
        case 'Success': return 'default';
        case 'Failed': return 'destructive';
        case 'Pending': return 'warning';
        default: return 'outline';
    }
}

export function ExecutionLogsPanel({ submission, evaluation, isAdminOverride }: ExecutionLogsPanelProps) {
  const events: LogEvent[] = [];

  // Mock events based on submission data
  if (submission.assignedAt) {
    events.push({
      timestamp: submission.assignedAt,
      description: 'Task assigned to candidate.',
      status: 'Success',
    });
  }

  if (submission.submittedAt) {
    events.push({
      timestamp: submission.submittedAt,
      description: `Submission received for round ${submission.currentRound || 1}.`,
      status: 'Success',
    });
  }
  
  if (submission.validationStatus && submission.validationStatus !== 'Pending') {
     events.push({
      timestamp: submission.submittedAt!, // Assume it happens right after submission
      description: `Auto-validation completed. Status: ${submission.validationStatus}.`,
      status: submission.validationStatus === 'Invalid' ? 'Failed' : submission.validationStatus === 'Warning' ? 'Pending' : 'Success',
    });
  }

  if (submission.testCaseStatus && submission.testCaseStatus !== 'Pending') {
     events.push({
      timestamp: submission.submittedAt!, // Assume it happens right after submission
      description: `API/Backend tests completed. Status: ${submission.testCaseStatus}.`,
      status: submission.testCaseStatus === 'Failed' ? 'Failed' : submission.testCaseStatus === 'Warning' ? 'Pending' : 'Success',
    });
  }
  
  if (submission.autoScoringStatus === 'Completed' && submission.autoScore !== undefined) {
    events.push({
      timestamp: submission.submittedAt!,
      description: `Auto-scoring completed. Score: ${submission.autoScore}.`,
      status: 'Success',
    });
  }
  
  if (submission.status === 'in-review') {
      events.push({
          timestamp: submission.lastUpdated,
          description: `Submission review started by evaluator.`,
          status: 'Pending'
      });
  }

  if (evaluation?.evaluatedAt) {
    events.push({
      timestamp: evaluation.evaluatedAt,
      description: `Manual evaluation completed. Final score: ${evaluation.score}.`,
      status: 'Success',
    });
  }
  
  if (isAdminOverride) {
      events.push({
          timestamp: new Date().toISOString(),
          description: 'Admin session started. Logs may show override actions.',
          status: 'Pending'
      });
  }

  const sortedEvents = events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Execution Logs
        </CardTitle>
        <CardDescription>A detailed log of all automated and manual events.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead className="text-right">Timestamp</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedEvents.length > 0 ? sortedEvents.map((event, index) => (
                        <TableRow key={index}>
                            <TableCell><Badge variant={getStatusVariant(event.status)}>{event.status}</Badge></TableCell>
                            <TableCell className="text-sm">{event.description}</TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">{format(new Date(event.timestamp), 'PPp')}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                No log entries found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}

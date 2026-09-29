'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils/format';
import type { AuditEvent } from '@/lib/api/audit-center';

const SEVERITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  info: 'secondary',
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
};

const OUTCOME_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  success: 'success',
  deny: 'warning',
  failure: 'destructive',
};

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant={SEVERITY_VARIANT[severity] ?? 'outline'} className="capitalize">
      {severity}
    </Badge>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  return (
    <Badge variant={OUTCOME_VARIANT[outcome] ?? 'outline'} className="capitalize">
      {outcome}
    </Badge>
  );
}

interface AuditEventsTableProps {
  events: AuditEvent[];
  isLoading: boolean;
  total: number;
}

export default function AuditEventsTable({ events, isLoading, total }: AuditEventsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border py-20 text-center">
        <p className="text-sm text-muted-foreground">No audit events match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <p className="text-xs text-muted-foreground">
          Showing {events.length} of {total.toLocaleString()} events
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">Time</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead className="w-28">Severity</TableHead>
            <TableHead className="w-28">Outcome</TableHead>
            <TableHead className="w-40">Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e) => (
            <TableRow key={e.eventId}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDateTime(e.occurredAt)}
              </TableCell>
              <TableCell className="font-mono text-xs">{e.action}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {e.actorId ?? '—'}
              </TableCell>
              <TableCell className="text-xs">
                {e.resourceType ? (
                  <span>
                    <span className="text-foreground">{e.resourceType}</span>
                    {e.resourceId && (
                      <span className="text-muted-foreground font-mono"> · {e.resourceId}</span>
                    )}
                  </span>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <SeverityBadge severity={e.severity} />
              </TableCell>
              <TableCell>
                <OutcomeBadge outcome={e.outcome} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {e.sourceService ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play, LogIn, Loader2, CheckCircle, XCircle, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import cronJobsData from '@/lib/data/cron-jobs.json';
import { format, formatDistanceToNow } from 'date-fns';

type CronJobStatus = 'Success' | 'Running' | 'Failed' | 'Paused';

const statusConfig: Record<
  CronJobStatus,
  { icon: React.ElementType; color: string }
> = {
  Success: { icon: CheckCircle, color: 'text-green-500' },
  Running: { icon: Loader2, color: 'text-blue-500 animate-spin' },
  Failed: { icon: XCircle, color: 'text-red-500' },
  Paused: { icon: PauseCircle, color: 'text-yellow-500' },
};

export default function CronJobsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cron Jobs</CardTitle>
        <CardDescription>
          Scheduled tasks that run automatically in the background.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronJobsData.map((job) => {
                const StatusIcon = statusConfig[job.status as CronJobStatus].icon;
                const statusColor = statusConfig[job.status as CronJobStatus].color;
                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="font-medium">{job.name}</div>
                      <div className="text-sm text-muted-foreground">{job.description}</div>
                    </TableCell>
                    <TableCell>{job.frequency}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(job.lastRun), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(job.nextRun), 'Pp')}
                    </TableCell>
                    <TableCell>{job.duration}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn('h-4 w-4', statusColor)} />
                        <span>{job.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                         <Button variant="outline" size="sm"><Play className="mr-1 h-4 w-4" /> Run Now</Button>
                         <Switch defaultChecked={job.status !== 'Paused'} aria-label={`Pause ${job.name}`} />
                         <Button variant="link" size="sm">View Logs</Button>
                       </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

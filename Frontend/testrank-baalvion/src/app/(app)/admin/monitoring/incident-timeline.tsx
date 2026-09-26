
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { SystemIncident, IncidentStatus } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { AlertOctagon } from 'lucide-react';

interface IncidentTimelineProps {
  incidents: SystemIncident[];
}

const getStatusVariant = (status: IncidentStatus) => {
    switch (status) {
        case 'Ongoing': return 'destructive';
        case 'Investigating': return 'warning';
        case 'Resolved': return 'default';
        default: return 'outline';
    }
};

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5" />
            Recent Incidents
        </CardTitle>
        <CardDescription>A log of recent system downtime and service degradation events.</CardDescription>
      </CardHeader>
      <CardContent>
         <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {incidents.length > 0 ? incidents.map((incident) => (
                        <TableRow key={incident.id}>
                            <TableCell className="font-medium">{incident.serviceName}</TableCell>
                            <TableCell><Badge variant={getStatusVariant(incident.status)}>{incident.status}</Badge></TableCell>
                            <TableCell className="max-w-xs truncate">{incident.description}</TableCell>
                            <TableCell>{formatDistanceToNow(new Date(incident.startTime), { addSuffix: true })}</TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="sm">View Details</Button></TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No incidents reported in the last 7 days.
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

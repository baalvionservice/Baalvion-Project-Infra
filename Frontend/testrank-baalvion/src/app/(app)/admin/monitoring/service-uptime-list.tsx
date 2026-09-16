
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
import type { ServiceStatus, ServiceStatusState } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Server, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ServiceUptimeListProps {
  services: ServiceStatus[];
}

const getStatusInfo = (status: ServiceStatusState) => {
  switch (status) {
    case 'Running':
      return { icon: CheckCircle, color: 'text-green-500', label: 'Running' };
    case 'Degraded':
      return { icon: AlertTriangle, color: 'text-yellow-500', label: 'Degraded' };
    case 'Down':
      return { icon: XCircle, color: 'text-red-500', label: 'Down' };
  }
};

const getUptimeColor = (uptime: number) => {
    if (uptime > 99.9) return "bg-green-500";
    if (uptime > 99) return "bg-yellow-500";
    return "bg-red-500";
}

export function ServiceUptimeList({ services }: ServiceUptimeListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Service Status
        </CardTitle>
        <CardDescription>An overview of the operational status of all system services.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uptime (90d)</TableHead>
                        <TableHead>Last Downtime</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.map((service) => {
                         const statusInfo = getStatusInfo(service.status);
                         return (
                            <TableRow key={service.id}>
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell>
                                    <Badge variant={service.status === 'Running' ? 'default' : service.status === 'Degraded' ? 'warning' : 'destructive'} className="gap-2">
                                        <statusInfo.icon className="h-3 w-3" />
                                        {statusInfo.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Progress value={service.uptimePercentage || 0} className="w-24 h-2" indicatorClassName={getUptimeColor(service.uptimePercentage || 0)} />
                                        <span>{service.uptimePercentage?.toFixed(3) ?? 'N/A'}%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {service.lastDowntime ? formatDistanceToNow(new Date(service.lastDowntime), { addSuffix: true }) : 'N/A'}
                                </TableCell>
                            </TableRow>
                         )
                    })}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}

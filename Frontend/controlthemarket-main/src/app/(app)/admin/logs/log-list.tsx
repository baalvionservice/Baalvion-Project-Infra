
'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, AlertTriangle, Info, XCircle } from 'lucide-react';
import type { SystemLog, LogSeverity } from '@/lib/types';
import { LogDetailsDialog } from './log-details-dialog';

const severities: (LogSeverity | 'All')[] = ["All", "Info", "Warning", "Error"];
const services: string[] = ["All", "API", "Auth", "Database", "TaskQueue", "IntegrationService", "Frontend"];

const getSeverityVariant = (severity: LogSeverity) => {
    switch(severity) {
        case 'Error': return 'destructive';
        case 'Warning': return 'warning';
        case 'Info': return 'secondary';
        default: return 'outline';
    }
};

const getSeverityIcon = (severity: LogSeverity) => {
    switch(severity) {
        case 'Error': return <XCircle className="h-4 w-4" />;
        case 'Warning': return <AlertTriangle className="h-4 w-4" />;
        case 'Info': return <Info className="h-4 w-4" />;
        default: return <Info className="h-4 w-4" />;
    }
};

export function SystemLogList({ initialData }: { initialData: SystemLog[] }) {
  const [data] = useState<SystemLog[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<LogSeverity | 'All'>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [viewingLog, setViewingLog] = useState<SystemLog | null>(null);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'All' || item.severity === severityFilter;
      const matchesService = serviceFilter === 'All' || item.service === serviceFilter;
      return matchesSearch && matchesSeverity && matchesService;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [data, searchTerm, severityFilter, serviceFilter]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search log messages..."
                    className="pl-10 min-w-[200px] md:min-w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as LogSeverity | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                    {severities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={(value) => setServiceFilter(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                    {services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant={getSeverityVariant(item.severity)} className="gap-2">
                        {getSeverityIcon(item.severity)}
                        {item.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.service}</TableCell>
                    <TableCell className="max-w-md truncate">{item.message}</TableCell>
                    <TableCell>{format(new Date(item.timestamp), 'PPp')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setViewingLog(item)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <LogDetailsDialog 
        isOpen={!!viewingLog}
        onOpenChange={() => setViewingLog(null)}
        log={viewingLog}
      />
    </>
  );
}

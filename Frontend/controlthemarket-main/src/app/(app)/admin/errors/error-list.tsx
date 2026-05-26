
'use client';

import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
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
import { Search, AlertTriangle, Info, ShieldQuestion, CheckCircle, CircleOff, Eye } from 'lucide-react';
import type { SystemError, ErrorSeverity } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ErrorDetailsDialog } from './error-details-dialog';

type StatusFilter = 'All' | 'Open' | 'Resolved' | 'Ignored';
const severities: (ErrorSeverity | 'All')[] = ["All", "Critical", "Warning", "Minor"];
const statuses: StatusFilter[] = ["All", "Open", "Resolved", "Ignored"];

const getSeverityVariant = (severity: ErrorSeverity) => {
    switch (severity) {
        case 'Critical': return 'destructive';
        case 'Warning': return 'warning';
        case 'Minor': return 'secondary';
    }
};

const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
        case 'Critical': return <AlertTriangle className="h-4 w-4" />;
        case 'Warning': return <ShieldQuestion className="h-4 w-4" />;
        case 'Minor': return <Info className="h-4 w-4" />;
    }
};

export function ErrorList({ initialData }: { initialData: SystemError[] }) {
  const [data, setData] = useState<SystemError[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [viewingError, setViewingError] = useState<SystemError | null>(null);
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.message.toLowerCase().includes(searchTerm.toLowerCase()) || item.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'All' || item.severity === severityFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesSeverity && matchesStatus;
    }).sort((a, b) => new Date(b.lastOccurred).getTime() - new Date(a.lastOccurred).getTime());
  }, [data, searchTerm, severityFilter, statusFilter]);

  const handleStatusChange = (errorId: string, newStatus: 'Resolved' | 'Ignored' | 'Open') => {
    setData(prev => prev.map(item => item.id === errorId ? { ...item, status: newStatus } : item));
    toast({
        title: `Error ${newStatus}`,
        description: `Error ID ${errorId} has been marked as ${newStatus}.`
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search error messages..."
              className="pl-10 min-w-[200px] md:min-w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as ErrorSeverity | 'All')}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by severity" /></SelectTrigger>
            <SelectContent>{severities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Error</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Last Occurred</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium truncate max-w-xs">{item.type}</p>
                      <p className="text-xs text-muted-foreground">{item.service}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityVariant(item.severity)} className="gap-1.5">
                        {getSeverityIcon(item.severity)} {item.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Open' ? 'outline' : 'secondary'}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>{item.frequency}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(item.lastOccurred), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="sm" onClick={() => setViewingError(item)}><Eye className="mr-2 h-4 w-4"/>Details</Button>
                       <Button variant="ghost" size="sm" onClick={() => handleStatusChange(item.id, 'Resolved')} disabled={item.status === 'Resolved'}><CheckCircle className="mr-2 h-4 w-4"/>Resolve</Button>
                       <Button variant="ghost" size="sm" onClick={() => handleStatusChange(item.id, 'Ignored')} disabled={item.status === 'Ignored'}><CircleOff className="mr-2 h-4 w-4"/>Ignore</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No errors found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <ErrorDetailsDialog 
        isOpen={!!viewingError}
        onOpenChange={() => setViewingError(null)}
        error={viewingError}
      />
    </>
  );
}

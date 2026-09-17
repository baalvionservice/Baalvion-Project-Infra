
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Play, Square, XCircle } from 'lucide-react';
import type { SandboxStatus } from '@/lib/types';
import type { SandboxSessionData } from './page';
import { useToast } from '@/hooks/use-toast';
import { useSubmissions } from '@/contexts/submissions-context';

const sessionStatuses: (SandboxStatus | 'All')[] = ["All", "Active", "Idle", "Completed", "Error", "Not Started"];

const getStatusVariant = (status: SandboxStatus): 'default' | 'destructive' | 'warning' | 'outline' | 'secondary' => {
    switch (status) {
        case 'Active': return 'default';
        case 'Error': return 'destructive';
        case 'Idle': return 'warning';
        case 'Completed': return 'secondary';
        case 'Not Started': return 'outline';
        default: return 'outline';
    }
};

export function ExecutionList({ initialData }: { initialData: SandboxSessionData[] }) {
  const [data, setData] = useState<SandboxSessionData[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SandboxStatus | 'All'>('All');
  const { toast } = useToast();
  const { updateSubmission } = useSubmissions();

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [data, searchTerm, statusFilter]);
  
  const handleSessionAction = (submissionId: string, action: 'start' | 'terminate') => {
    const session = data.find(d => d.submissionId === submissionId);
    if (!session) return;
    
    let newStatus: SandboxStatus;
    let toastDescription: string;

    if (action === 'start') {
        newStatus = 'Active';
        toastDescription = `Sandbox for ${session.candidate.name}'s submission has been started.`;
    } else { // terminate
        newStatus = 'Completed';
        toastDescription = `Sandbox for ${session.candidate.name}'s submission has been terminated.`;
    }
    
    setData(prev => prev.map(item => 
        item.submissionId === submissionId ? { ...item, status: newStatus, lastActivity: new Date().toISOString() } : item
    ));
    updateSubmission(submissionId, { sandboxStatus: newStatus });
    toast({
        title: 'Action Successful',
        description: toastDescription
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
             <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search candidate or task..."
                    className="pl-10 min-w-[200px] md:min-w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SandboxStatus | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    {sessionStatuses.map(status => <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
      </div>

       <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Session Status</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.submissionId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar><AvatarImage src={item.candidate.profile?.avatarUrl} alt={item.candidate.name} /><AvatarFallback>{item.candidate.name.charAt(0)}</AvatarFallback></Avatar>
                        <span className="font-medium">{item.candidate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{item.task.title}</div>
                    <div className="text-sm text-muted-foreground">{item.task.roleCategory}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.status)} className="capitalize">
                        {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(item.lastActivity), 'PPp')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSessionAction(item.submissionId, 'start')} disabled={item.status === 'Active'}>
                        <Play className="mr-2 h-4 w-4"/>
                        Start
                    </Button>
                     <Button variant="ghost" size="sm" onClick={() => handleSessionAction(item.submissionId, 'terminate')} disabled={!['Active', 'Idle'].includes(item.status)}>
                        <Square className="mr-2 h-4 w-4"/>
                        Terminate
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/submissions/${item.submissionId}`}>View Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No sandbox sessions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

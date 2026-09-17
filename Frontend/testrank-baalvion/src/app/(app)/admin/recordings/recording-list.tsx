
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
import { Search, Play, Pause, Download, Video } from 'lucide-react';
import type { RecordingDashboardData } from './page';
import { useToast } from '@/hooks/use-toast';
import { useSubmissions } from '@/contexts/submissions-context';

type RecordingStatus = 'Recording' | 'Paused' | 'Completed' | 'Not Started';
const statuses: (RecordingStatus | 'All')[] = ["All", "Recording", "Paused", "Completed", "Not Started"];

const getStatusVariant = (status?: RecordingStatus): 'default' | 'destructive' | 'warning' | 'outline' | 'secondary' => {
    switch (status) {
        case 'Recording': return 'default';
        case 'Paused': return 'warning';
        case 'Completed': return 'secondary';
        case 'Not Started': return 'outline';
        default: return 'outline';
    }
};

export function RecordingList({ data }: { data: RecordingDashboardData[] }) {
  const [tableData, setTableData] = useState<RecordingDashboardData[]>(data);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecordingStatus | 'All'>('All');
  const { toast } = useToast();
  const { updateSubmission } = useSubmissions();

  const filteredData = useMemo(() => {
    return tableData.filter(item => {
      const matchesSearch = item.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.recordingStatus === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [tableData, searchTerm, statusFilter]);
  
  const handleAction = (submissionId: string, action: 'start' | 'pause') => {
    const session = tableData.find(d => d.id === submissionId);
    if (!session) return;
    
    let newStatus: RecordingStatus;
    let toastDescription: string;

    if (action === 'start') {
        newStatus = 'Recording';
        toastDescription = `Recording started for ${session.candidate.name}'s session.`;
    } else { // pause
        newStatus = 'Paused';
        toastDescription = `Recording paused for ${session.candidate.name}'s session.`;
    }
    
    setTableData(prev => prev.map(item => 
        item.id === submissionId ? { ...item, recordingStatus: newStatus } : item
    ));
    updateSubmission(submissionId, { recordingStatus: newStatus });
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
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RecordingStatus | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    {statuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
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
              <TableHead>Recording Status</TableHead>
              <TableHead>Submitted On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar><AvatarImage src={item.candidate.profile?.avatarUrl} alt={item.candidate.name} /><AvatarFallback>{item.candidate.name.charAt(0)}</AvatarFallback></Avatar>
                        <span className="font-medium">{item.candidate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{item.task.title}</div>
                    <div className="text-sm text-muted-foreground">{item.company.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.recordingStatus)}>
                        {item.recordingStatus || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(item.submittedAt), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                     <Button variant="ghost" size="sm" onClick={() => handleAction(item.id, 'start')} disabled={item.recordingStatus === 'Recording'}>
                        <Play className="mr-2 h-4 w-4"/> Start
                    </Button>
                     <Button variant="ghost" size="sm" onClick={() => handleAction(item.id, 'pause')} disabled={item.recordingStatus !== 'Recording'}>
                        <Pause className="mr-2 h-4 w-4"/> Pause
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/submissions/${item.id}`}>
                          <Video className="mr-2 h-4 w-4"/> View
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" disabled={item.recordingStatus !== 'Completed'}>
                        <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No recorded sessions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

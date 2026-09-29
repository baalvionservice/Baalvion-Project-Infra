

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Search, Play, Square, Monitor, Pause, Video, Radio, Check, X } from 'lucide-react';
import type { LiveSessionStatus } from '@/lib/types';
import type { LiveSessionData } from './page';
import { useToast } from '@/hooks/use-toast';
import { useSubmissions } from '@/contexts/submissions-context';
import { cn } from '@/lib/utils';
import { LiveSessionViewerDialog } from './live-session-viewer-dialog';

const sessionStatuses: (LiveSessionStatus | 'All')[] = ["All", "Active", "Scheduled", "Completed", "Cancelled", "Not Started", "Paused", "Requested", "Denied"];

const getStatusVariant = (status: LiveSessionStatus): 'default' | 'destructive' | 'warning' | 'outline' | 'secondary' => {
    switch (status) {
        case 'Active': return 'default';
        case 'Paused': 
        case 'Requested':
        case 'Scheduled':
            return 'warning';
        case 'Cancelled': 
        case 'Denied':
            return 'destructive';
        case 'Completed': return 'secondary';
        case 'Not Started': return 'outline';
        default: return 'outline';
    }
};

const getStatusBorder = (status: LiveSessionStatus): string => {
    switch (status) {
        case 'Active': return 'border-green-500';
        case 'Paused': 
        case 'Requested':
        case 'Scheduled': 
            return 'border-yellow-500';
        case 'Cancelled':
        case 'Denied':
             return 'border-destructive';
        case 'Completed':
             return 'border-border';
        default: return 'border-border';
    }
}

export function LiveSessionGrid({ initialData }: { initialData: LiveSessionData[] }) {
  const { submissions, updateSubmission } = useSubmissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LiveSessionStatus | 'All'>('All');
  const [viewingSession, setViewingSession] = useState<LiveSessionData | null>(null);
  const { toast } = useToast();

  const liveCodingData = useMemo(() => {
    return initialData.map(session => {
        const submission = submissions.find(s => s.id === session.submissionId);
        return {
            ...session,
            status: submission?.liveSessionStatus || 'Not Started',
            lastActivity: submission?.lastUpdated || new Date().toISOString(),
        }
    })
  }, [submissions, initialData]);

  const filteredData = useMemo(() => {
    return liveCodingData.filter(item => {
      const matchesSearch = item.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        const statusOrder = { Requested: -1, Active: 0, Paused: 1, Scheduled: 2, 'Not Started': 3, Completed: 4, Denied: 5, Cancelled: 6 };
        const statusA = statusOrder[a.status] ?? 99;
        const statusB = statusOrder[b.status] ?? 99;
        if (statusA !== statusB) return statusA - statusB;
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });
  }, [liveCodingData, searchTerm, statusFilter]);

  const handleApproval = (submissionId: string, candidateName: string, approve: boolean) => {
      if (approve) {
          updateSubmission(submissionId, { liveSessionStatus: 'Scheduled' });
          toast({ title: "Session Approved", description: `Live session for ${candidateName} has been scheduled.` });
      } else {
          updateSubmission(submissionId, { liveSessionStatus: 'Denied' });
          toast({ title: "Session Denied", description: `Live session request from ${candidateName} has been denied.`, variant: 'destructive' });
      }
  }

  return (
    <>
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
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LiveSessionStatus | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    {sessionStatuses.map(status => <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredData.length > 0 ? (
               filteredData.map((item) => (
                   <Card key={item.submissionId} className={cn('flex flex-col border-2', getStatusBorder(item.status))}>
                       <CardHeader>
                           <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                    <Avatar><AvatarImage src={item.candidate.profile?.avatarUrl} alt={item.candidate.name} /><AvatarFallback>{item.candidate.name.charAt(0)}</AvatarFallback></Avatar>
                                    <span className="font-medium">{item.candidate.name}</span>
                                </div>
                                <Badge variant={getStatusVariant(item.status)} className="capitalize">
                                    {item.status === 'Active' && <Radio className="mr-2 h-4 w-4 animate-pulse" />}
                                    {item.status}
                                </Badge>
                           </div>
                       </CardHeader>
                       <CardContent className="flex-grow space-y-4">
                            <div className="aspect-video bg-black rounded-md flex items-center justify-center text-muted-foreground">
                                <Video className="h-10 w-10" />
                            </div>
                            <div>
                                <h4 className="font-semibold truncate">{item.task.title}</h4>
                                <p className="text-sm text-muted-foreground">{item.task.roleCategory}</p>
                            </div>
                       </CardContent>
                       <CardFooter className="flex justify-end gap-2">
                           {item.status === 'Requested' ? (
                            <div className="flex w-full gap-2">
                                <Button size="sm" onClick={() => handleApproval(item.submissionId, item.candidate.name, true)} className="w-full">
                                    <Check className="mr-2 h-4 w-4" /> Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleApproval(item.submissionId, item.candidate.name, false)} className="w-full">
                                    <X className="mr-2 h-4 w-4" /> Deny
                                </Button>
                            </div>
                           ) : (
                            <Button variant="secondary" size="sm" onClick={() => setViewingSession(item)}>
                               <Monitor className="mr-2"/> Join Session
                           </Button>
                           )}
                       </CardFooter>
                   </Card>
               ))
           ) : (
                <div className="col-span-full text-center py-16">
                    <h3 className="text-xl font-semibold">No Sessions Found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters.</p>
                </div>
           )}
       </div>
    </div>
    <LiveSessionViewerDialog
        isOpen={!!viewingSession}
        onOpenChange={() => setViewingSession(null)}
        session={viewingSession}
    />
    </>
  );
}

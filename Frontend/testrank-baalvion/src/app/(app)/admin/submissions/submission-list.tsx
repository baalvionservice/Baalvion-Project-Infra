
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, MoreHorizontal, ArrowUpDown, Calendar as CalendarIcon, Star, XCircle, FileWarning, History, Undo2, RefreshCw } from 'lucide-react';
import type { SubmissionStatus, User, RoleCategory, ValidationStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { AdminSubmissionData } from './page';
import { cn } from '@/lib/utils';
import { CandidateHistoryDialog } from '@/components/shared/candidate-history-dialog';
import { useSubmissions } from '@/contexts/submissions-context';


type SortKey = 'candidate.name' | 'score' | 'applicationDate';
type SortDirection = 'asc' | 'desc';

const statuses: (SubmissionStatus | 'All')[] = ["All", "assigned", "in-progress", "pending", "in-review", "evaluated", "shortlisted", "rejected", "resubmitted", "moved-to-next-round", "flagged"];
const roles: (RoleCategory | 'All')[] = ["All", "Engineering", "Design", "Marketing", "Business", "Data"];
const validationStatuses: (ValidationStatus | 'All')[] = ["All", "Valid", "Invalid", "Warning", "Pending"];
const autoScoringStatuses: ('Pending' | 'Completed' | 'Failed' | 'All')[] = ["All", "Pending", "Completed", "Failed"];


export const getStatusVariant = (status: SubmissionStatus): 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'purple' => {
     switch (status) {
      case 'shortlisted': return 'default';
      case 'moved-to-next-round': return 'purple';
      case 'in-review':
      case 'evaluated':
        return 'secondary';
      case 'pending':
      case 'resubmitted':
      case 'in-progress':
        return 'warning';
      case 'rejected': 
      case 'flagged':
        return 'destructive';
      default: return 'outline';
    }
}

export function AdminSubmissionsList({ data }: { data: AdminSubmissionData[] }) {
  const { toast } = useToast();
  const { updateSubmission } = useSubmissions();
  const [tableData, setTableData] = useState<AdminSubmissionData[]>(data);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<RoleCategory | 'All'>('All');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortKey, setSortKey] = useState<SortKey>('applicationDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [historyCandidate, setHistoryCandidate] = useState<User | null>(null);
  const [validationStatusFilter, setValidationStatusFilter] = useState<ValidationStatus | 'All'>('All');
  const [autoScoringStatusFilter, setAutoScoringStatusFilter] = useState<('Pending' | 'Completed' | 'Failed' | 'All')>('All');

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    const filtered = tableData.filter(item => {
      const matchesSearch = item.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.company.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesRole = roleFilter === 'All' || item.task.roleCategory === roleFilter;
      const matchesValidation = validationStatusFilter === 'All' || item.validationStatus === validationStatusFilter;
      const matchesAutoScoring = autoScoringStatusFilter === 'All' || item.autoScoringStatus === autoScoringStatusFilter;

      const matchesDate = (() => {
        if (!dateRange?.from) return true;
        const itemDate = new Date(item.applicationDate);
        itemDate.setHours(0,0,0,0);
        if (dateRange.to) {
            return itemDate >= dateRange.from && itemDate <= dateRange.to;
        }
        return itemDate.getTime() === dateRange.from.getTime();
      })();
      return matchesSearch && matchesStatus && matchesRole && matchesDate && matchesValidation && matchesAutoScoring;
    });

    return filtered.sort((a, b) => {
      let valA, valB;
      if (sortKey === 'candidate.name') {
        valA = a.candidate.name;
        valB = b.candidate.name;
      } else if (sortKey === 'score') {
        valA = a.score || 0;
        valB = b.score || 0;
      } else { // applicationDate
        valA = new Date(a.applicationDate).getTime();
        valB = new Date(b.applicationDate).getTime();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tableData, searchTerm, statusFilter, roleFilter, dateRange, sortKey, sortDirection, validationStatusFilter, autoScoringStatusFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleStatusChange = (ids: string[], status: SubmissionStatus) => {
    setTableData(prev => prev.map(item => ids.includes(item.id) ? {...item, status} : item));
    ids.forEach(id => {
      updateSubmission(id, { status });
    });
  };
  
  const handleBulkAction = (action: 'approve' | 'reject' | 'flag' | 'reset') => {
    if (selectedRows.size === 0) return;
    
    let newStatus: SubmissionStatus;
    let actionVerb: string;

    if (action === 'approve') {
        newStatus = 'shortlisted';
        actionVerb = 'approved (shortlisted)';
    } else if (action === 'reject') {
        newStatus = 'rejected';
        actionVerb = 'rejected';
    } else if (action === 'flag') {
        newStatus = 'flagged';
        actionVerb = 'flagged for review';
    } else { // reset
        newStatus = 'pending';
        actionVerb = 'reset to pending';
    }
    
    handleStatusChange(Array.from(selectedRows), newStatus);
    
    toast({
        title: 'Bulk Action Successful',
        description: `${selectedRows.size} submission(s) have been ${actionVerb}.`
    });
    setSelectedRows(new Set());
  }

  const handleRowAction = (action: 'approve' | 'reject' | 'flag' | 'revalidate', id: string) => {
    const submission = tableData.find(d => d.id === id);
    if (!submission) return;

    if (action === 'revalidate') {
        toast({
            title: 'Revalidation Started (Mock)',
            description: `Submission from ${submission.candidate.name} is being revalidated.`,
        });
        return;
    }

    let newStatus: SubmissionStatus;
    let toastDescription: string;

    if (action === 'approve') {
        newStatus = 'shortlisted';
        toastDescription = `Submission for ${submission.candidate.name} has been approved.`;
    } else if (action === 'reject') {
        newStatus = 'rejected';
        toastDescription = `Submission for ${submission.candidate.name} has been rejected.`;
    } else {
        newStatus = 'flagged';
        toastDescription = `Submission for ${submission.candidate.name} has been flagged.`;
    }
    
    handleStatusChange([id], newStatus);
    toast({ title: 'Action Successful', description: toastDescription });
  };
  
  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredAndSortedData.length) {
        setSelectedRows(new Set());
    } else {
        setSelectedRows(new Set(filteredAndSortedData.map(item => item.id)));
    }
  }

  const getValidationStatusVariant = (status?: ValidationStatus): 'default' | 'destructive' | 'warning' | 'outline' => {
    switch (status) {
        case 'Valid': return 'default';
        case 'Invalid': return 'destructive';
        case 'Warning': return 'warning';
        case 'Pending': return 'outline';
        default: return 'outline';
    }
  };
  
  const getAutoScoringStatusVariant = (status?: 'Pending' | 'Completed' | 'Failed'): 'default' | 'destructive' | 'warning' | 'outline' => {
    switch (status) {
        case 'Completed': return 'default';
        case 'Failed': return 'destructive';
        case 'Pending': return 'warning';
        default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
             <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search candidate, task, or company..."
                    className="pl-10 min-w-[200px] md:min-w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SubmissionStatus | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    {statuses.map(status => <SelectItem key={status} value={status} className="capitalize">{status.replace('-', ' ')}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={validationStatusFilter} onValueChange={(value) => setValidationStatusFilter(value as ValidationStatus | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by validation" />
                </SelectTrigger>
                <SelectContent>
                    {validationStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={autoScoringStatusFilter} onValueChange={(value) => setAutoScoringStatusFilter(value as any)}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Auto-Scoring" />
                </SelectTrigger>
                <SelectContent>
                    {autoScoringStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleCategory | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                    {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
            </Select>
             <Popover>
                <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal md:w-[240px]", !dateRange && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Filter by date</span>)}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
                </PopoverContent>
            </Popover>
          </div>
          {selectedRows.size > 0 && (
             <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => handleBulkAction('approve')}>
                    <Star className="mr-2 h-4 w-4" /> Approve ({selectedRows.size})
                </Button>
                <Button variant="outline" onClick={() => handleBulkAction('reject')}>
                    <XCircle className="mr-2 h-4 w-4" /> Reject ({selectedRows.size})
                </Button>
                 <Button variant="destructive" onClick={() => handleBulkAction('flag')}>
                    <FileWarning className="mr-2 h-4 w-4" /> Flag ({selectedRows.size})
                </Button>
                <Button variant="outline" onClick={() => handleBulkAction('reset')}>
                    <Undo2 className="mr-2 h-4 w-4" /> Reset ({selectedRows.size})
                </Button>
             </div>
          )}
      </div>

       <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                  <Checkbox checked={selectedRows.size > 0 && selectedRows.size === filteredAndSortedData.length} onCheckedChange={toggleSelectAll} aria-label="Select all"/>
              </TableHead>
              <TableHead>
                 <Button variant="ghost" onClick={() => handleSort('candidate.name')}>Candidate<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Task / Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Validation</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('score')}>Score<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Auto Score</TableHead>
              <TableHead className="hidden lg:table-cell">
                <Button variant="ghost" onClick={() => handleSort('applicationDate')}>Submitted<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.length > 0 ? (
              filteredAndSortedData.map((item) => (
                <TableRow key={item.id} data-state={selectedRows.has(item.id) && "selected"}>
                  <TableCell>
                      <Checkbox checked={selectedRows.has(item.id)} onCheckedChange={() => toggleRow(item.id)} aria-label="Select row"/>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar><AvatarImage src={item.candidate.profile?.avatarUrl} alt={item.candidate.name} /><AvatarFallback>{item.candidate.name.charAt(0)}</AvatarFallback></Avatar>
                        <span className="font-medium">{item.candidate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>{item.task.title}</div>
                    <div className="text-sm text-muted-foreground">{item.company.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.status)} className="capitalize">{item.status.replace('-', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.validationStatus ? (
                        <Badge variant={getValidationStatusVariant(item.validationStatus)}>{item.validationStatus}</Badge>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{item.score ? `${item.score}/100` : 'N/A'}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-col gap-1 items-start">
                        {item.autoScore ? (
                            <span className="font-semibold">{item.autoScore}/100</span>
                        ) : (
                            <span className="text-muted-foreground">N/A</span>
                        )}
                        {item.autoScoringStatus && (
                            <Badge variant={getAutoScoringStatusVariant(item.autoScoringStatus)}>{item.autoScoringStatus}</Badge>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{format(new Date(item.applicationDate), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild><Link href={`/admin/submissions/${item.id}`}>View / Override</Link></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setHistoryCandidate(item.candidate)}><History className="mr-2 h-4 w-4"/>View History</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRowAction('revalidate', item.id)}><RefreshCw className="mr-2 h-4 w-4"/>Revalidate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRowAction('approve', item.id)}><Star className="mr-2 h-4 w-4"/>Approve</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRowAction('reject', item.id)} className="text-destructive focus:text-destructive"><XCircle className="mr-2 h-4 w-4"/>Reject</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRowAction('flag', item.id)} className="text-destructive focus:text-destructive"><FileWarning className="mr-2 h-4 w-4"/>Flag</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">No submissions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <CandidateHistoryDialog isOpen={!!historyCandidate} onOpenChange={() => setHistoryCandidate(null)} candidate={historyCandidate}/>
    </div>
  );
}


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
import { Search, MoreHorizontal, ArrowUpDown, Calendar as CalendarIcon, Star, XCircle, Undo2, ChevronRight, History, GitCompare, FileWarning, Award } from 'lucide-react';
import type { SubmissionStatus, RoleCategory, User, LiveSessionStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { EvaluationData } from './page';
import { cn } from '@/lib/utils';
import { CandidateHistoryDialog } from '@/components/shared/candidate-history-dialog';
import { useSubmissions } from '@/contexts/submissions-context';


type SortKey = 'candidate.name' | 'score' | 'applicationDate';
type SortDirection = 'asc' | 'desc';

const statuses: (SubmissionStatus | 'All')[] = ["All", "pending", "in-review", "evaluated", "shortlisted", "rejected", "resubmitted", "moved-to-next-round", "flagged"];
const roles: (RoleCategory | 'All')[] = ["All", "Engineering", "Design", "Marketing", "Business", "Data"];

export const getStatusVariant = (status: SubmissionStatus): 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'purple' => {
     switch (status) {
      case 'shortlisted':
        return 'default'; 
      case 'moved-to-next-round':
        return 'purple';
      case 'in-review':
      case 'evaluated':
        return 'secondary';
      case 'pending':
      case 'resubmitted':
        return 'warning';
      case 'rejected':
      case 'flagged':
        return 'destructive';
      default:
        return 'outline';
    }
  }

const getRoleCategoryVariant = (roleCategory: RoleCategory): 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'purple' => {
    switch (roleCategory) {
        case 'Engineering': return 'secondary';
        case 'Design': return 'purple';
        case 'Marketing': return 'warning';
        case 'Business': return 'default'; // primary
        case 'Data': return 'outline';
        default: return 'outline';
    }
}

const getLiveSessionStatusVariant = (status?: LiveSessionStatus): 'default' | 'destructive' | 'warning' | 'outline' | 'secondary' => {
    switch (status) {
        case 'Active': return 'default';
        case 'Paused': return 'warning';
        case 'Cancelled': return 'destructive';
        case 'Scheduled': return 'warning';
        case 'Completed': return 'secondary';
        case 'Not Started': return 'outline';
        default: return 'outline';
    }
};

export function CompanySubmissionsList({ data }: { data: EvaluationData[] }) {
  const { toast } = useToast();
  const { updateSubmission } = useSubmissions();
  const [tableData, setTableData] = useState<EvaluationData[]>(data);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<RoleCategory | 'All'>('All');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortKey, setSortKey] = useState<SortKey>('applicationDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [historyCandidate, setHistoryCandidate] = useState<User | null>(null);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    const filtered = tableData.filter(item => {
      const matchesSearch = item.candidate.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesRole = roleFilter === 'All' || item.task.roleCategory === roleFilter;
      const matchesDate = (() => {
        if (!dateRange?.from) return true;
        const itemDate = new Date(item.applicationDate);
        itemDate.setHours(0,0,0,0);
        if (dateRange.to) {
            return itemDate >= dateRange.from && itemDate <= dateRange.to;
        }
        return itemDate.getTime() === dateRange.from.getTime();
      })();
      return matchesSearch && matchesStatus && matchesRole && matchesDate;
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
  }, [tableData, searchTerm, statusFilter, roleFilter, dateRange, sortKey, sortDirection]);

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
  
  const handleBulkAction = (action: 'shortlist' | 'reject' | 'move-to-next-round') => {
    if (selectedRows.size === 0) return;
    
    let newStatus: SubmissionStatus;
    let actionVerb: string;

    if (action === 'shortlist') {
        newStatus = 'shortlisted';
        actionVerb = 'shortlisted';
    } else if (action === 'reject') {
        newStatus = 'rejected';
        actionVerb = 'rejected';
    } else {
        newStatus = 'moved-to-next-round';
        actionVerb = 'moved to the next round';
    }
    
    handleStatusChange(Array.from(selectedRows), newStatus);
    
    toast({
        title: 'Bulk Action Successful',
        description: `${selectedRows.size} candidate(s) have been ${actionVerb}.`
    });
    setSelectedRows(new Set());
  }

  const handleRowAction = (action: 'shortlist' | 'reject' | 'undo' | 'move-to-next-round' | 'flag', id: string) => {
    const candidateName = tableData.find(d => d.id === id)?.candidate.name;
    let newStatus: SubmissionStatus;
    let toastTitle: string;
    let toastDescription: string;

    if (action === 'undo') {
        newStatus = 'pending';
        toastTitle = 'Action Undone';
        toastDescription = `${candidateName}'s status has been reset to Pending.`;
    } else if (action === 'move-to-next-round') {
        newStatus = 'moved-to-next-round';
        toastTitle = 'Candidate Advanced';
        toastDescription = `${candidateName} has been moved to the next round.`;
    } else if (action === 'flag') {
        newStatus = 'flagged';
        toastTitle = 'Submission Flagged';
        toastDescription = `${candidateName}'s submission has been flagged for review.`;
    } else {
        newStatus = action === 'shortlist' ? 'shortlisted' : 'rejected';
        toastTitle = `Candidate ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`;
        toastDescription = `${candidateName} has been ${newStatus}.`;
    }
    handleStatusChange([id], newStatus);
    toast({ title: toastTitle, description: toastDescription });
  };
  
  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
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

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 md:flex-row justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
             <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by candidate name..."
                    className="pl-10 min-w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleCategory | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                    {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SubmissionStatus | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    {statuses.map(status => <SelectItem key={status} value={status} className="capitalize">{status.replace('-', ' ')}</SelectItem>)}
                </SelectContent>
            </Select>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal md:w-[240px]",
                        !dateRange && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                        dateRange.to ? (
                        <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                        </>
                        ) : (
                        format(dateRange.from, "LLL dd, y")
                        )
                    ) : (
                        <span>Filter by date</span>
                    )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
          </div>
          {selectedRows.size > 0 && (
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleBulkAction('shortlist')}>
                    <Star className="mr-2 h-4 w-4" /> Shortlist ({selectedRows.size})
                </Button>
                <Button variant="destructive" onClick={() => handleBulkAction('reject')}>
                    <XCircle className="mr-2 h-4 w-4" /> Reject ({selectedRows.size})
                </Button>
                <Button variant="outline" onClick={() => handleBulkAction('move-to-next-round')}>
                    <ChevronRight className="mr-2 h-4 w-4" /> Next Round ({selectedRows.size})
                </Button>
                {selectedRows.size > 1 && (
                  <Button asChild variant="outline">
                    <Link href={`/company/compare?ids=${Array.from(selectedRows).join(',')}`}>
                      <GitCompare className="mr-2 h-4 w-4" /> Compare ({selectedRows.size})
                    </Link>
                  </Button>
                )}
             </div>
          )}
      </div>

      {/* Table */}
       <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedRows.size > 0 && selectedRows.size === filteredAndSortedData.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
              </TableHead>
              <TableHead>
                 <Button variant="ghost" onClick={() => handleSort('candidate.name')}>
                    Candidate
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Applied Position</TableHead>
              <TableHead>Eval Status</TableHead>
              <TableHead>Live Session</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('score')}>
                    Score
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.length > 0 ? (
              filteredAndSortedData.map((item) => (
                <TableRow key={item.id} data-state={selectedRows.has(item.id) && "selected"}>
                  <TableCell>
                      <Checkbox
                        checked={selectedRows.has(item.id)}
                        onCheckedChange={() => toggleRow(item.id)}
                        aria-label="Select row"
                      />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={item.candidate.profile?.avatarUrl} alt={item.candidate.name} />
                            <AvatarFallback>{item.candidate.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{item.candidate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={getRoleCategoryVariant(item.task.roleCategory)}>{item.task.roleCategory}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.status)} className="capitalize">{item.status.replace('-', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                      <Badge variant={getLiveSessionStatusVariant(item.liveSessionStatus)} className="capitalize">
                          {item.liveSessionStatus || 'N/A'}
                      </Badge>
                  </TableCell>
                  <TableCell>
                    {item.skillMatchResult ? (
                        <Badge variant="secondary" className="gap-1">
                            <Award className="h-3 w-3"/>
                            {item.skillMatchResult.skillBadge}
                        </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{item.score ? `${item.score}/100` : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/company/submissions/${item.id}`}>Review Submission</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setHistoryCandidate(item.candidate)}>
                            <History className="mr-2 h-4 w-4"/>
                            View History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {item.task.multiRound && (
                            <DropdownMenuItem onClick={() => handleRowAction('move-to-next-round', item.id)}>
                                <ChevronRight className="mr-2 h-4 w-4"/>
                                Move to Next Round
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleRowAction('shortlist', item.id)}>
                            <Star className="mr-2 h-4 w-4"/>
                            Shortlist
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRowAction('reject', item.id)} className="text-destructive focus:text-destructive">
                            <XCircle className="mr-2 h-4 w-4"/>
                            Reject
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleRowAction('undo', item.id)}>
                            <Undo2 className="mr-2 h-4 w-4"/>
                            Undo Action
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Send Feedback</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleRowAction('flag', item.id)} className="text-destructive focus:text-destructive">
                            <FileWarning className="mr-2 h-4 w-4"/>
                            Flag for Review
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No evaluations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CandidateHistoryDialog
        isOpen={!!historyCandidate}
        onOpenChange={() => setHistoryCandidate(null)}
        candidate={historyCandidate}
      />
    </div>
  );
}

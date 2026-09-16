
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MoreHorizontal, Calendar as CalendarIcon, User, Briefcase, Building } from 'lucide-react';
import type { ActivityActionType, ActivityStatus, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { ActivityWithDetails } from './page';
import { cn } from '@/lib/utils';

const actionTypes: (ActivityActionType | 'All')[] = ["All", "submission", "task_update", "status_change", "login", "override", "user_created", "company_created"];
const statuses: (ActivityStatus | 'All')[] = ["All", "Success", "Failed", "Pending"];
const performerRoles: (UserRole | 'All')[] = ["All", "candidate", "company", "admin"];

const getActionTypeVariant = (actionType: ActivityActionType) => {
    switch (actionType) {
        case 'override': return 'purple';
        case 'login':
        case 'submission': 
            return 'secondary';
        case 'task_update':
        case 'status_change':
            return 'warning';
        default: return 'outline';
    }
}
const getStatusVariant = (status: ActivityStatus) => {
    switch(status) {
        case 'Success': return 'default';
        case 'Failed': return 'destructive';
        case 'Pending': return 'warning';
        default: return 'outline';
    }
}

export function ActivityList({ data }: { data: ActivityWithDetails[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<ActivityActionType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const isRecent = (timestamp: string) => {
    if (!currentTime) return false;
    const fiveMinutes = 5 * 60 * 1000;
    return currentTime.getTime() - new Date(timestamp).getTime() < fiveMinutes;
  }

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const performerName = item.performer?.name.toLowerCase() || '';
      const targetName = item.targetEntity?.name?.toLowerCase() || item.targetEntity.id.toLowerCase();
      const matchesSearch = performerName.includes(searchTerm.toLowerCase()) || targetName.includes(searchTerm.toLowerCase());
      
      const matchesActionType = actionTypeFilter === 'All' || item.actionType === actionTypeFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesRole = roleFilter === 'All' || item.performer?.role === roleFilter;

      const matchesDate = (() => {
        if (!dateRange?.from) return true;
        const itemDate = new Date(item.timestamp);
        itemDate.setHours(0,0,0,0);
        if (dateRange.to) {
            return itemDate >= dateRange.from && itemDate <= dateRange.to;
        }
        return itemDate.getTime() === dateRange.from.getTime();
      })();

      return matchesSearch && matchesActionType && matchesStatus && matchesRole && matchesDate;
    });
  }, [data, searchTerm, actionTypeFilter, statusFilter, roleFilter, dateRange]);

  const getTargetIcon = (type: 'Task' | 'User' | 'Company' | 'Submission') => {
      switch(type) {
          case 'Task': return <Briefcase className="h-4 w-4" />;
          case 'User': return <User className="h-4 w-4" />;
          case 'Company': return <Building className="h-4 w-4" />;
          default: return null;
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
         <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search performer or target..."
                className="pl-10 min-w-[200px] md:min-w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <Select value={actionTypeFilter} onValueChange={(value) => setActionTypeFilter(value as ActivityActionType | 'All')}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
                {actionTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ActivityStatus | 'All')}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
                {statuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
        </Select>
         <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'All')}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
                {performerRoles.map(role => <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>)}
            </SelectContent>
        </Select>
         <Popover>
            <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal md:w-[240px]", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Filter by date</span>)}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
            </PopoverContent>
        </Popover>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Performer</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.performer ? (
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={item.performer.profile?.avatarUrl} alt={item.performer.name} />
                                <AvatarFallback>{item.performer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-medium">{item.performer.name}</span>
                                <span className="text-xs text-muted-foreground capitalize">{item.performer.role}</span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionTypeVariant(item.actionType)} className="capitalize">{item.actionType.replace('_', ' ')}</Badge>
                  </TableCell>
                   <TableCell>
                    <div className="flex items-center gap-2">
                        {getTargetIcon(item.targetEntity.type)}
                        <span className="font-medium">{item.targetEntity.name || item.targetEntity.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">{item.description}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <span>{format(new Date(item.timestamp), 'PPp')}</span>
                        {isRecent(item.timestamp) && (
                            <Badge className="bg-green-500 text-primary-foreground hover:bg-green-500/90 animate-pulse">LIVE</Badge>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No activity logs found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

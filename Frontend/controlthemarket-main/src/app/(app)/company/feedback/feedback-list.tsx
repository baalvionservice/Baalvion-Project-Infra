
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, ArrowRight } from 'lucide-react';
import type { FeedbackData } from './page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RoleCategory } from '@/lib/types';

const roles: (RoleCategory | 'All')[] = ["All", "Engineering", "Design", "Marketing", "Business", "Data"];

export function FeedbackList({ data }: { data: FeedbackData[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleCategory | 'All'>('All');

  const filteredData = useMemo(() => {
    return data.filter(item => {
        const matchesSearch = item.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || item.task.roleCategory === roleFilter;
        return matchesSearch && matchesRole;
    }).sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());
  }, [data, searchTerm, roleFilter]);

  const getStatusVariant = (status: FeedbackData['feedbackStatus']) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Draft': return 'secondary';
      case 'Pending': return 'outline';
      default: return 'outline';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
         <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search by candidate or task..."
                className="pl-10 min-w-[200px] md:min-w-[300px]"
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Feedback Status</TableHead>
              <TableHead>Evaluated On</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.submissionId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={item.candidate.profile?.avatarUrl} alt={item.candidate.name} />
                            <AvatarFallback>{item.candidate.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{item.candidate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.task.title}</TableCell>
                  <TableCell>{item.score ? `${item.score}/100` : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.feedbackStatus)}>{item.feedbackStatus}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(item.evaluationDate), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/company/feedback/${item.submissionId}`}>
                            {item.feedbackStatus === 'Completed' ? 'Edit Feedback' : 'Give Feedback'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No candidates awaiting feedback.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

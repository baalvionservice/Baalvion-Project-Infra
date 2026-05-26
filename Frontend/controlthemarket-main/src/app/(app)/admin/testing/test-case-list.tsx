
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
import { Search, RefreshCw, MoreHorizontal } from 'lucide-react';
import type { TestCaseStatus } from '@/lib/types';
import type { SubmissionWithTestData } from './page';
import { useToast } from '@/hooks/use-toast';

const testStatuses: (TestCaseStatus | 'All')[] = ["All", "Passed", "Failed", "Warning", "Pending"];

const getStatusVariant = (status?: TestCaseStatus): 'default' | 'destructive' | 'warning' | 'outline' => {
    switch (status) {
        case 'Passed': return 'default';
        case 'Failed': return 'destructive';
        case 'Warning': return 'warning';
        case 'Pending': return 'outline';
        default: return 'outline';
    }
};

export function TestCaseList({ data }: { data: SubmissionWithTestData[] }) {
  const [tableData, setTableData] = useState<SubmissionWithTestData[]>(data);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestCaseStatus | 'All'>('All');
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return tableData.filter(item => {
      const matchesSearch = item.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.testCaseStatus === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [tableData, searchTerm, statusFilter]);
  
  const handleRerun = (submissionId: string) => {
    toast({
        title: 'Simulation Started',
        description: 'Re-running test cases for submission...'
    });
    // Mock re-run logic
    setTimeout(() => {
        setTableData(prev => prev.map(item => 
            item.id === submissionId ? { ...item, testCaseStatus: 'Passed' } : item
        ));
        toast({
            title: 'Simulation Complete',
            description: 'Test cases passed for submission.'
        });
    }, 2000);
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
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TestCaseStatus | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    {testStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
      </div>

       <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Task / Company</TableHead>
              <TableHead>Test Status</TableHead>
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
                    <Badge variant={getStatusVariant(item.testCaseStatus)}>
                        {item.testCaseStatus || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(item.submittedAt), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleRerun(item.id)}>
                        <RefreshCw className="mr-2 h-4 w-4"/>
                        Re-run
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/submissions/${item.id}`}>View Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No submissions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

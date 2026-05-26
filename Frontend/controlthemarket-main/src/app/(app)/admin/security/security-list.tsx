
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
import { Search, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import type { PlagiarismRisk } from '@/lib/types';
import type { SecurityDashboardData } from './page';
import { useToast } from '@/hooks/use-toast';
import { getStatusVariant } from '../submissions/submission-list';
import { useSubmissions } from '@/contexts/submissions-context';

const riskLevels: (PlagiarismRisk | 'All')[] = ["All", "High", "Medium", "Low", "None"];

const getRiskVariant = (risk?: PlagiarismRisk): 'destructive' | 'warning' | 'default' | 'outline' => {
    switch (risk) {
        case 'High': return 'destructive';
        case 'Medium': return 'warning';
        case 'Low': return 'default';
        default: return 'outline';
    }
};

const getRiskIcon = (risk?: PlagiarismRisk) => {
    switch (risk) {
        case 'High': return <ShieldAlert className="h-4 w-4" />;
        case 'Medium': return <ShieldQuestion className="h-4 w-4" />;
        default: return <ShieldCheck className="h-4 w-4" />;
    }
};

export function AdminSecurityList({ data }: { data: SecurityDashboardData[] }) {
  const [tableData, setTableData] = useState<SecurityDashboardData[]>(data);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<PlagiarismRisk | 'All'>('All');
  const { toast } = useToast();
  const { updateSubmission } = useSubmissions();

  const filteredData = useMemo(() => {
    return tableData.filter(item => {
      const matchesSearch = item.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter === 'All' || item.plagiarismRisk === riskFilter;
      return matchesSearch && matchesRisk;
    }).sort((a, b) => {
        const riskOrder = { 'High': 0, 'Medium': 1, 'Low': 2, 'None': 3 };
        const riskA = riskOrder[a.plagiarismRisk || 'None'];
        const riskB = riskOrder[b.plagiarismRisk || 'None'];
        if (riskA !== riskB) {
            return riskA - riskB;
        }
        return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
    });
  }, [tableData, searchTerm, riskFilter]);

  const handleDismiss = (submissionId: string) => {
    toast({
        title: 'Flag Dismissed',
        description: 'The submission is no longer marked as suspicious.',
    });
    setTableData(prev => prev.map(item =>
        item.id === submissionId ? { ...item, plagiarismRisk: 'None' } : item
    ));
    updateSubmission(submissionId, { plagiarismRisk: 'None' });
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
            <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value as PlagiarismRisk | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                    {riskLevels.map(risk => <SelectItem key={risk} value={risk}>{risk === 'None' ? 'No Risk' : risk}</SelectItem>)}
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
              <TableHead>Submission Status</TableHead>
              <TableHead>Plagiarism Risk</TableHead>
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
                    <Badge variant={getStatusVariant(item.status)} className="capitalize">{item.status.replace('-', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRiskVariant(item.plagiarismRisk)} className="gap-2">
                        {getRiskIcon(item.plagiarismRisk)}
                        {item.plagiarismRisk || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(item.applicationDate), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDismiss(item.id)} disabled={item.plagiarismRisk === 'None'}>
                        Dismiss Flag
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/submissions/${item.id}`}>Investigate</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">No submissions match the current filters.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

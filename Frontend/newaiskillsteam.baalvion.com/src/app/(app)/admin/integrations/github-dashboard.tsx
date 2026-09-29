
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
import { Search, MoreHorizontal, CheckCircle, AlertTriangle, Clock, RefreshCw, X, Eye } from 'lucide-react';
import type { IntegrationStatus, GitHubRepository } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { RepositoryDetailsDialog } from './repository-details-dialog';

const integrationStatuses: (IntegrationStatus | 'All')[] = ["All", "Connected", "Pending", "Error"];

const getStatusVariant = (status: IntegrationStatus): 'default' | 'destructive' | 'warning' | 'outline' => {
    switch (status) {
        case 'Connected': return 'default';
        case 'Error': return 'destructive';
        case 'Pending': return 'warning';
        default: return 'outline';
    }
};

const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
        case 'Connected': return <CheckCircle className="h-4 w-4" />;
        case 'Error': return <AlertTriangle className="h-4 w-4" />;
        case 'Pending': return <Clock className="h-4 w-4" />;
    }
};

export function GitHubIntegrationDashboard({ initialData }: { initialData: GitHubRepository[] }) {
  const [data, setData] = useState<GitHubRepository[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<IntegrationStatus | 'All'>('All');
  const [viewingRepo, setViewingRepo] = useState<GitHubRepository | null>(null);
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.lastSync).getTime() - new Date(a.lastSync).getTime());
  }, [data, searchTerm, statusFilter]);
  
  const handleAction = (repoId: string, action: 'sync' | 'disconnect') => {
    const repo = data.find(d => d.id === repoId);
    if (!repo) return;
    
    if (action === 'sync') {
        toast({
            title: 'Sync Started (Mock)',
            description: `Syncing repository ${repo.name}...`,
        });
        setTimeout(() => {
             setData(prev => prev.map(item => 
                item.id === repoId ? { ...item, lastSync: new Date().toISOString() } : item
            ));
            toast({
                title: 'Sync Complete',
                description: `${repo.name} has been synced.`,
            });
        }, 1500)
    } else { // disconnect
        setData(prev => prev.filter(item => item.id !== repoId));
        toast({
            title: 'Repository Disconnected',
            description: `${repo.name} has been disconnected.`,
        });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1 md:grow-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search repo or owner..."
                        className="pl-10 min-w-[200px] md:min-w-[300px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IntegrationStatus | 'All')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        {integrationStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Repository</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredData.length > 0 ? (
                filteredData.map((item) => (
                    <TableRow key={item.id}>
                    <TableCell>
                        <Link href={item.url} target="_blank" className="font-medium hover:underline">{item.name}</Link>
                    </TableCell>
                    <TableCell>{item.ownerName}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(item.status)} className="gap-1">
                            {getStatusIcon(item.status)}
                            {item.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(item.lastSync), 'PPp')}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setViewingRepo(item)}>
                            <Eye className="mr-2 h-4 w-4"/> View
                        </Button>
                         <Button variant="ghost" size="sm" onClick={() => handleAction(item.id, 'sync')}>
                            <RefreshCw className="mr-2 h-4 w-4"/> Sync
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleAction(item.id, 'disconnect')}>
                            <X className="mr-2 h-4 w-4"/> Disconnect
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No repositories found.</TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </div>
      <RepositoryDetailsDialog
        isOpen={!!viewingRepo}
        onOpenChange={() => setViewingRepo(null)}
        repository={viewingRepo}
      />
    </>
  );
}

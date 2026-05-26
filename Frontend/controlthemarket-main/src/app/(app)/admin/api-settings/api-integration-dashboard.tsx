
'use client';

import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
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
import { Search, Power, PowerOff, Settings2, Trash2, TestTube2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import type { ApiIntegration, ApiIntegrationStatus, ApiIntegrationCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ApiDetailsDialog } from './api-details-dialog';

const apiStatuses: (ApiIntegrationStatus | 'All')[] = ["All", "Active", "Inactive", "Error"];
const apiCategories: (ApiIntegrationCategory | 'All')[] = ["All", "Analytics", "Chat", "Cloud Storage", "DevOps", "Monitoring", "Payments", "Other"];


const getStatusVariant = (status: ApiIntegrationStatus): 'default' | 'destructive' | 'outline' => {
    switch (status) {
        case 'Active': return 'default';
        case 'Error': return 'destructive';
        case 'Inactive': return 'outline';
        default: return 'outline';
    }
};

const getStatusIcon = (status: ApiIntegrationStatus) => {
    switch (status) {
        case 'Active': return <CheckCircle className="h-4 w-4" />;
        case 'Error': return <AlertTriangle className="h-4 w-4" />;
        case 'Inactive': return <Clock className="h-4 w-4" />;
    }
};

export function ApiIntegrationDashboard({ initialData }: { initialData: ApiIntegration[] }) {
  const [data, setData] = useState<ApiIntegration[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApiIntegrationStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<ApiIntegrationCategory | 'All'>('All');
  const [viewingApi, setViewingApi] = useState<ApiIntegration | null>(null);
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => new Date(b.lastSync).getTime() - new Date(a.lastSync).getTime());
  }, [data, searchTerm, statusFilter, categoryFilter]);
  
  const handleAction = (apiId: string, action: 'toggle' | 'delete' | 'test') => {
    const api = data.find(d => d.id === apiId);
    if (!api) return;
    
    if (action === 'test') {
        toast({ title: 'Test Connection (Mock)', description: `Sending a test request to ${api.name}...` });
        setTimeout(() => {
            toast({ title: 'Test Successful', description: `Successfully received a 200 OK response from ${api.name}.` });
        }, 1500)
    } else if (action === 'toggle') {
        const newStatus = api.status === 'Active' ? 'Inactive' : 'Active';
        setData(prev => prev.map(item => item.id === apiId ? { ...item, status: newStatus } : item));
        toast({ title: 'Integration Updated', description: `${api.name} has been ${newStatus === 'Active' ? 'activated' : 'deactivated'}.` });
    } else { // delete
        setData(prev => prev.filter(item => item.id !== apiId));
        toast({ title: 'Integration Deleted', description: `${api.name} has been deleted.` });
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
                        placeholder="Search by name..."
                        className="pl-10 min-w-[200px] md:min-w-[300px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ApiIntegrationStatus | 'All')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        {apiStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as ApiIntegrationCategory | 'All')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                        {apiCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredData.length > 0 ? (
                filteredData.map((item) => (
                    <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(item.status)} className="gap-1">
                            {getStatusIcon(item.status)}
                            {item.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="flex flex-wrap gap-1">
                        {item.subscribedEvents.length > 0 ? item.subscribedEvents.map(event => <Badge key={event} variant="secondary" className="capitalize">{event.replace('.', ' ')}</Badge>) : <span className="text-xs text-muted-foreground">None</span>}
                    </TableCell>
                    <TableCell>{formatDistanceToNow(new Date(item.lastSync), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setViewingApi(item)}><Settings2 className="mr-2 h-4 w-4"/> Edit Settings</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleAction(item.id, 'test')}><TestTube2 className="mr-2 h-4 w-4"/> Test</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleAction(item.id, 'toggle')}>
                           {item.status === 'Active' ? <><PowerOff className="mr-2 h-4 w-4"/> Deactivate</> : <><Power className="mr-2 h-4 w-4"/> Activate</>}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleAction(item.id, 'delete')}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No integrations found.</TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </div>
      <ApiDetailsDialog
        isOpen={!!viewingApi}
        onOpenChange={() => setViewingApi(null)}
        apiIntegration={viewingApi}
      />
    </>
  );
}

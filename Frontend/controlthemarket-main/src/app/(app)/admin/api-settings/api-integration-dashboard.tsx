
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
import { testApiIntegration, updateApiIntegration, deleteApiIntegration } from '@/lib/write-api';

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
  
  const handleAction = async (apiId: string, action: 'toggle' | 'delete' | 'test') => {
    const api = data.find(d => d.id === apiId);
    if (!api) return;

    if (action === 'test') {
        toast({ title: 'Testing connection…', description: `Sending a request to ${api.name}.` });
        try {
            const { data: res } = await testApiIntegration(apiId);
            const ok = res?.ok ?? res?.integration?.status === 'Active';
            if (res?.integration) setData(prev => prev.map(item => item.id === apiId ? { ...item, status: res.integration.status, lastSync: res.integration.lastSync } : item));
            toast({ title: ok ? 'Test Successful' : 'Test Failed', description: res?.detail ?? (ok ? `Connected to ${api.name}.` : `${api.name} did not respond.`), variant: ok ? undefined : 'destructive' });
        } catch (err: any) {
            toast({ title: 'Test failed', description: err?.message ?? 'Could not reach the integration.', variant: 'destructive' });
        }
    } else if (action === 'toggle') {
        const newStatus: ApiIntegrationStatus = api.status === 'Active' ? 'Inactive' : 'Active';
        setData(prev => prev.map(item => item.id === apiId ? { ...item, status: newStatus } : item));
        try {
            await updateApiIntegration(apiId, { status: newStatus });
            toast({ title: 'Integration Updated', description: `${api.name} has been ${newStatus === 'Active' ? 'activated' : 'deactivated'}.` });
        } catch (err: any) {
            setData(prev => prev.map(item => item.id === apiId ? { ...item, status: api.status } : item)); // revert
            toast({ title: 'Update failed', description: err?.message ?? 'Could not update integration.', variant: 'destructive' });
        }
    } else { // delete
        const snapshot = data;
        setData(prev => prev.filter(item => item.id !== apiId));
        try {
            await deleteApiIntegration(apiId);
            toast({ title: 'Integration Deleted', description: `${api.name} has been deleted.` });
        } catch (err: any) {
            setData(snapshot); // revert
            toast({ title: 'Delete failed', description: err?.message ?? 'Could not delete integration.', variant: 'destructive' });
        }
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


'use client';

import React, { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
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
import { Search, MoreHorizontal, Power, PowerOff, Send, Eye, Trash2 } from 'lucide-react';
import type { Webhook, WebhookStatus, WebhookEvent } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { WebhookDetailsDialog } from './webhook-details-dialog';
import { testWebhook, updateWebhook, deleteWebhook } from '@/lib/write-api';

const webhookStatuses: (WebhookStatus | 'All')[] = ["All", "Active", "Inactive", "Error"];
const webhookEvents: (WebhookEvent | 'All')[] = ["All", "submission.created", "submission.evaluated", "task.published", "user.created"];

const getStatusVariant = (status: WebhookStatus): 'default' | 'destructive' | 'outline' => {
    switch (status) {
        case 'Active': return 'default';
        case 'Error': return 'destructive';
        case 'Inactive': return 'outline';
        default: return 'outline';
    }
};

export function WebhookList({ initialData }: { initialData: Webhook[] }) {
  const [data, setData] = useState<Webhook[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WebhookStatus | 'All'>('All');
  const [eventFilter, setEventFilter] = useState<WebhookEvent | 'All'>('All');
  const [viewingWebhook, setViewingWebhook] = useState<Webhook | null>(null);
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesEvent = eventFilter === 'All' || item.events.includes(eventFilter);
      return matchesSearch && matchesStatus && matchesEvent;
    }).sort((a, b) => new Date(b.lastTriggered || 0).getTime() - new Date(a.lastTriggered || 0).getTime());
  }, [data, searchTerm, statusFilter, eventFilter]);
  
  const handleAction = async (webhookId: string, action: 'trigger' | 'toggle' | 'delete') => {
    const webhook = data.find(d => d.id === webhookId);
    if (!webhook) return;

    if (action === 'trigger') {
        setData(prev => prev.map(item =>
            item.id === webhookId ? { ...item, lastTriggered: new Date().toISOString() } : item
        ));
        try {
            const { data: res } = await testWebhook(webhookId);
            toast({
                title: res?.delivered ? 'Webhook Delivered' : 'Webhook Delivery Failed',
                description: res?.delivered ? `A signed test event reached ${webhook.name}.` : `${webhook.name} did not return a 2xx response.`,
                variant: res?.delivered ? undefined : 'destructive',
            });
        } catch (err: any) {
            toast({ title: 'Trigger failed', description: err?.message ?? 'Could not send test event.', variant: 'destructive' });
        }
    } else if (action === 'toggle') {
        const newStatus: WebhookStatus = webhook.status === 'Active' ? 'Inactive' : 'Active';
        setData(prev => prev.map(item => item.id === webhookId ? { ...item, status: newStatus } : item));
        try {
            await updateWebhook(webhookId, { status: newStatus });
            toast({ title: 'Webhook Updated', description: `${webhook.name} has been ${newStatus === 'Active' ? 'activated' : 'deactivated'}.` });
        } catch (err: any) {
            setData(prev => prev.map(item => item.id === webhookId ? { ...item, status: webhook.status } : item)); // revert
            toast({ title: 'Update failed', description: err?.message ?? 'Could not update webhook.', variant: 'destructive' });
        }
    } else { // delete
        const snapshot = data;
        setData(prev => prev.filter(item => item.id !== webhookId));
        try {
            await deleteWebhook(webhookId);
            toast({ title: 'Webhook Deleted', description: `${webhook.name} has been deleted.` });
        } catch (err: any) {
            setData(snapshot); // revert
            toast({ title: 'Delete failed', description: err?.message ?? 'Could not delete webhook.', variant: 'destructive' });
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
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as WebhookStatus | 'All')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        {webhookStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={eventFilter} onValueChange={(value) => setEventFilter(value as WebhookEvent | 'All')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by event" />
                    </SelectTrigger>
                    <SelectContent>
                        {webhookEvents.map(event => <SelectItem key={event} value={event} className="capitalize">{event.replace('.', ' ')}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Webhook Name</TableHead>
                <TableHead>Target URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredData.length > 0 ? (
                filteredData.map((item) => (
                    <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-xs">{item.url}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="flex flex-wrap gap-1">
                        {item.events.map(event => <Badge key={event} variant="secondary" className="capitalize">{event.replace('.', ' ')}</Badge>)}
                    </TableCell>
                    <TableCell>{item.lastTriggered ? formatDistanceToNow(new Date(item.lastTriggered), { addSuffix: true }) : 'Never'}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setViewingWebhook(item)}><Eye className="mr-2 h-4 w-4"/> View Logs</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleAction(item.id, 'trigger')}><Send className="mr-2 h-4 w-4"/> Trigger Now</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleAction(item.id, 'toggle')}>
                           {item.status === 'Active' ? <><PowerOff className="mr-2 h-4 w-4"/> Deactivate</> : <><Power className="mr-2 h-4 w-4"/> Activate</>}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleAction(item.id, 'delete')}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No webhooks found.</TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </div>
      <WebhookDetailsDialog
        isOpen={!!viewingWebhook}
        onOpenChange={() => setViewingWebhook(null)}
        webhook={viewingWebhook}
      />
    </>
  );
}

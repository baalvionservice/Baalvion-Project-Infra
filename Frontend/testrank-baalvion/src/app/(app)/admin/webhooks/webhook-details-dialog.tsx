
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getWebhookTriggerLogs } from '@/lib/api';
import type { Webhook, WebhookTriggerLog } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ServerCrash, CheckCircle } from 'lucide-react';

interface WebhookDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  webhook: Webhook | null;
}

export function WebhookDetailsDialog({ isOpen, onOpenChange, webhook }: WebhookDetailsDialogProps) {
  const [logs, setLogs] = useState<WebhookTriggerLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && webhook) {
      const fetchLogs = async () => {
        setLoading(true);
        const logData = await getWebhookTriggerLogs(webhook.id);
        setLogs(logData);
        setLoading(false);
      };
      fetchLogs();
    }
  }, [isOpen, webhook]);

  if (!webhook) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{webhook.name}</DialogTitle>
          <DialogDescription>
            Details and recent trigger history for this webhook.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 mt-4">
            <div>
                <h4 className="font-medium mb-2">Endpoint URL</h4>
                <div className="rounded-md border p-3 text-sm bg-muted text-muted-foreground font-mono truncate">{webhook.url}</div>
            </div>
             <div>
                <h4 className="font-medium mb-2">Subscribed Events</h4>
                <div className="flex flex-wrap gap-2">
                    {webhook.events.map(event => <Badge key={event} variant="secondary">{event}</Badge>)}
                </div>
            </div>
            <div>
                 <h4 className="font-medium mb-2">Recent Triggers</h4>
                <div className="rounded-md border">
                    <ScrollArea className="h-64">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Payload</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : logs.length > 0 ? (
                                    logs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                <Badge variant={log.status === 'Success' ? 'default' : 'destructive'} className="gap-1">
                                                    {log.status === 'Success' ? <CheckCircle className="h-3 w-3" /> : <ServerCrash className="h-3 w-3" />}
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</TableCell>
                                            <TableCell>
                                                <pre className="text-xs bg-muted/50 p-2 rounded-md font-mono">{log.payload}</pre>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow><TableCell colSpan={3} className="h-24 text-center">No trigger history found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

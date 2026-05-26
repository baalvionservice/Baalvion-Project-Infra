'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import webhookLogs from '@/lib/data/webhooks.json';
import { format } from 'date-fns';

interface WebhookLogViewerProps {
    onViewPayload: (payload: string) => void;
}

export default function WebhookLogViewer({ onViewPayload }: WebhookLogViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Log Viewer</CardTitle>
        <CardDescription>
          Recent incoming webhook events from integrated services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhookLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.timestamp), 'PPpp')}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{log.source}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{log.eventType}</TableCell>
                  <TableCell>{log.responseCode}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'Success' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => onViewPayload(log.payload)}>
                      View Raw Payload
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

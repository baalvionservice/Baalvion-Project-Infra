
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, User, Download, ShieldCheck, Bug } from 'lucide-react';
import type { SystemError, ErrorSeverity } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ErrorDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  error: SystemError | null;
}

const getSeverityVariant = (severity?: ErrorSeverity) => {
    switch(severity) {
        case 'Critical': return 'destructive';
        case 'Warning': return 'warning';
        case 'Minor': return 'secondary';
        default: return 'outline';
    }
};

export function ErrorDetailsDialog({ isOpen, onOpenChange, error }: ErrorDetailsDialogProps) {
  const { toast } = useToast();

  if (!error) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${type} copied to clipboard!` });
  };
  
  const mockHistory = [
    { status: 'Open', time: error.lastOccurred },
    { status: 'Detected', time: new Date(new Date(error.lastOccurred).setDate(new Date(error.lastOccurred).getDate() - 1)).toISOString() },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{error.type}</DialogTitle>
              <DialogDescription>
                Error ID: {error.id}
              </DialogDescription>
            </div>
            <Badge variant={getSeverityVariant(error.severity)} className="text-base">
                {error.severity}
            </Badge>
          </div>
        </DialogHeader>
        <div className="mt-4 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                 <div className="space-y-1 rounded-md border p-3">
                    <h4 className="font-medium text-muted-foreground">Service</h4>
                    <p>{error.service}</p>
                </div>
                 <div className="space-y-1 rounded-md border p-3">
                    <h4 className="font-medium text-muted-foreground">Status</h4>
                    <p>{error.status}</p>
                </div>
                 <div className="space-y-1 rounded-md border p-3">
                    <h4 className="font-medium text-muted-foreground">Frequency</h4>
                    <p>{error.frequency} times</p>
                </div>
                 <div className="space-y-1 rounded-md border p-3">
                    <h4 className="font-medium text-muted-foreground">Affected Users</h4>
                    <p>{error.affectedUsers}</p>
                </div>
            </div>
             <div>
                <h4 className="font-medium mb-2">Error Message</h4>
                <div className="rounded-md border p-4 bg-muted text-sm font-mono whitespace-pre-wrap">
                    <p>{error.message}</p>
                </div>
            </div>
            <div>
                <h4 className="font-medium mb-2">Stack Trace</h4>
                <div className="rounded-md border p-4 bg-muted text-sm font-mono whitespace-pre-wrap">
                    <p>{error.stackTrace}</p>
                </div>
            </div>
             <div>
                <h4 className="font-medium mb-2">History (Mock)</h4>
                 <div className="space-y-2 text-sm text-muted-foreground">
                    {mockHistory.map(item => (
                        <p key={item.time}>- Marked as <span className="font-semibold text-foreground">{item.status}</span> on {format(new Date(item.time), 'PPPp')}</p>
                    ))}
                </div>
            </div>
        </div>
        <DialogFooter className="mt-6 flex flex-wrap-reverse justify-end gap-2">
            <Button variant="outline" onClick={() => handleCopy(error.message, 'Message')}><Copy className="mr-2 h-4 w-4" /> Copy Message</Button>
            <Button variant="outline" onClick={() => handleCopy(error.stackTrace, 'Stack Trace')}><Copy className="mr-2 h-4 w-4" /> Copy Stack Trace</Button>
            <Button variant="outline"><Bug className="mr-2 h-4 w-4" /> Assign (Mock)</Button>
            <Button><ShieldCheck className="mr-2 h-4 w-4" /> Mark as Resolved</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

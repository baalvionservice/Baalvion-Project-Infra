
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
import { Copy, Download } from 'lucide-react';
import type { SystemLog, LogSeverity } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface LogDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  log: SystemLog | null;
}

const getSeverityVariant = (severity?: LogSeverity) => {
    switch(severity) {
        case 'Error': return 'destructive';
        case 'Warning': return 'warning';
        case 'Info': return 'secondary';
        default: return 'outline';
    }
};

export function LogDetailsDialog({ isOpen, onOpenChange, log }: LogDetailsDialogProps) {
  const { toast } = useToast();

  if (!log) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    toast({ title: 'Log copied to clipboard!' });
  };
  
  const handleDownload = () => {
    toast({ title: 'Download started (mock)' });
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">Log Details</DialogTitle>
              <DialogDescription>
                Log ID: {log.id}
              </DialogDescription>
            </div>
            <Badge variant={getSeverityVariant(log.severity)} className="text-base">
                {log.severity}
            </Badge>
          </div>
        </DialogHeader>
        <div className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h4 className="font-medium mb-1">Service</h4>
                    <p className="text-sm text-muted-foreground">{log.service}</p>
                </div>
                 <div>
                    <h4 className="font-medium mb-1">Timestamp</h4>
                    <p className="text-sm text-muted-foreground">{format(new Date(log.timestamp), 'PPPp')}</p>
                </div>
            </div>
            <div>
                <h4 className="font-medium mb-2">Full Message</h4>
                <div className="rounded-md border p-4 bg-muted text-sm font-mono whitespace-pre-wrap">
                    {log.message}
                </div>
            </div>
        </div>
        <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" /> Copy Log
            </Button>
            <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Download
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

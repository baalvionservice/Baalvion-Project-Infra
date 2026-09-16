

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSubmissions } from '@/contexts/submissions-context';
import type { LiveSessionStatus } from '@/lib/types';
import { LiveSessionData } from './page';
import { Video, Play, Pause, Square, Radio } from 'lucide-react';
import { useMemo } from 'react';

interface LiveSessionViewerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  session: LiveSessionData | null;
}

const getStatusVariant = (status: LiveSessionStatus): 'default' | 'destructive' | 'warning' | 'outline' | 'secondary' => {
    switch (status) {
        case 'Active': return 'default';
        case 'Paused': 
        case 'Scheduled': 
        case 'Requested':
            return 'warning';
        case 'Cancelled': 
        case 'Denied':
            return 'destructive';
        case 'Completed': return 'secondary';
        case 'Not Started': return 'outline';
        default: return 'outline';
    }
};

export function LiveSessionViewerDialog({ isOpen, onOpenChange, session }: LiveSessionViewerDialogProps) {
  const { submissions, updateSubmission } = useSubmissions();
  const { toast } = useToast();
  
  // Get the most up-to-date session info from context
  const liveSession = useMemo(() => {
    if (!session) return null;
    const currentSubmission = submissions.find(s => s.id === session.submissionId);
    return {
        ...session,
        status: currentSubmission?.liveSessionStatus || 'Not Started',
    };
  }, [session, submissions]);

  const handleSessionAction = (action: 'Active' | 'Paused' | 'Completed') => {
    if (!liveSession) return;
    updateSubmission(liveSession.submissionId, { liveSessionStatus: action });
    toast({
        title: `Session ${action}`,
        description: `Session for ${liveSession.candidate.name} is now ${action.toLowerCase()}.`
    });
  };

  if (!liveSession) return null;
  
  const sessionStatus = liveSession.status;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Live Session: {liveSession.candidate.name}</DialogTitle>
          <DialogDescription>
            Task: {liveSession.task.title}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="aspect-video bg-black rounded-md flex items-center justify-center text-muted-foreground relative">
                <Video className="h-24 w-24" />
                {sessionStatus === 'Paused' && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col gap-2">
                        <Pause className="h-16 w-16 text-yellow-400" />
                        <p className="text-yellow-400 font-semibold">Session Paused</p>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between rounded-md border p-4">
                <div className="flex items-center gap-4">
                    <h4 className="font-semibold">Session Status</h4>
                    <Badge variant={getStatusVariant(sessionStatus)} className="text-base capitalize">
                        {sessionStatus === 'Active' && <Radio className="mr-2 h-4 w-4 animate-pulse" />}
                        {sessionStatus}
                    </Badge>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleSessionAction('Active')} disabled={sessionStatus === 'Active' || sessionStatus === 'Completed'}>
                        <Play className="mr-2 h-4 w-4"/>Resume
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSessionAction('Paused')} disabled={sessionStatus !== 'Active'}>
                        <Pause className="mr-2 h-4 w-4"/>Pause
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleSessionAction('Completed')} disabled={!['Active', 'Paused', 'Scheduled'].includes(sessionStatus)}>
                        <Square className="mr-2 h-4 w-4"/>Stop
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSubmissionsByUser, getAllEvaluations, getTask, getUsers } from '@/lib/api';
import type { User, Submission, Evaluation, Task } from '@/lib/types';
import { format } from 'date-fns';
import { FileText, Star, Briefcase, Loader2, User as UserIcon } from 'lucide-react';
import { getStatusVariant } from '@/app/(app)/company/submissions/submission-list';

interface HistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: User | null;
}

type HistoryItem = Submission & {
  task?: Task;
  evaluation?: Evaluation;
};

export function CandidateHistoryDialog({ isOpen, onOpenChange, candidate }: HistoryDialogProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [evaluators, setEvaluators] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && candidate) {
      const fetchHistory = async () => {
        setLoading(true);
        const [submissions, allEvaluations, allUsers] = await Promise.all([
            getSubmissionsByUser(candidate.id),
            getAllEvaluations(),
            getUsers()
        ]);
        
        const taskIds = [...new Set(submissions.map(s => s.taskId))];
        const taskPromises = taskIds.map(id => getTask(id));
        const tasks = (await Promise.all(taskPromises)).filter(Boolean) as Task[];

        const evaluatorMap: Record<string, string> = {};
        allUsers.forEach(u => { evaluatorMap[u.id] = u.name });
        setEvaluators(evaluatorMap);

        const historyItems = submissions
          .map(sub => {
            const task = tasks.find(t => t.id === sub.taskId);
            const evaluation = allEvaluations.find(e => e.submissionId === sub.id);
            return { ...sub, task, evaluation };
          })
          .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

        setHistory(historyItems);
        setLoading(false);
      };
      fetchHistory();
    }
  }, [isOpen, candidate]);

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={candidate.profile?.avatarUrl} alt={candidate.name} />
              <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{candidate.name}'s Evaluation History</DialogTitle>
              <DialogDescription>A complete log of all tasks and evaluations.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="relative pl-6">
              {history.map((item, index) => (
                <div key={item.id} className="flex items-start gap-4 pb-8 last:pb-0">
                  {index < history.length - 1 && (
                    <div className="absolute left-[35px] top-2 h-full w-px -translate-x-1/2 bg-border" />
                  )}
                  <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Briefcase className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 -translate-y-1.5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-medium">{item.task?.title}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(item.lastUpdated), 'PPp')}</p>
                        </div>
                        <Badge variant={getStatusVariant(item.status)} className="capitalize mt-2 sm:mt-0 w-fit">{item.status.replace('-', ' ')}</Badge>
                    </div>

                    {item.task?.multiRound && item.currentRound && (
                        <p className="text-sm text-muted-foreground">Round {item.currentRound}</p>
                    )}

                    {item.evaluation && (
                      <div className="rounded-md border bg-muted/50 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-semibold">
                            <Star className="h-4 w-4 text-yellow-500" />
                            Evaluation
                          </div>
                           <p className="font-bold text-base">{item.evaluation.score}/100</p>
                        </div>
                        <p className="mt-2 text-muted-foreground italic">"{item.evaluation.feedback}"</p>
                        <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                            <UserIcon className="h-3 w-3" />
                            <span>{evaluators[item.evaluation.evaluatedBy] || item.evaluation.evaluatedBy}</span>
                            <span>on {format(new Date(item.evaluation.evaluatedAt), 'PP')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
               {history.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No history found for this candidate.</p>}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

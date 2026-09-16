
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, GitCommit, Clock } from 'lucide-react';
import type { GitHubRepository } from '@/lib/types';
import { format } from 'date-fns';

interface RepositoryDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  repository: GitHubRepository | null;
}

export function RepositoryDetailsDialog({ isOpen, onOpenChange, repository }: RepositoryDetailsDialogProps) {
  if (!repository) return null;

  const mockActivities = [
      { id: 1, message: 'pushed to main', author: 'Alice', time: '2 hours ago' },
      { id: 2, message: 'created pull request #12', author: 'Alice', time: '3 hours ago' },
      { id: 3, message: 'pushed to feat/dark-mode', author: 'Alice', time: '5 hours ago' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div>
              <DialogTitle className="text-2xl">{repository.name}</DialogTitle>
              <DialogDescription>
                Owned by: {repository.ownerName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Commits</CardTitle>
                    <GitCommit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{repository.commitCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Branches</CardTitle>
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{repository.branchCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold">{format(new Date(repository.lastSync), 'PPp')}</div>
                </CardContent>
            </Card>
        </div>
        <div className="mt-4 space-y-4">
            <div>
                <h4 className="font-medium mb-2">Last Commit</h4>
                <div className="rounded-md border p-4 text-sm bg-muted">
                    <code>{repository.lastCommitMessage}</code>
                </div>
            </div>
            <div>
                <h4 className="font-medium mb-2">Recent Activity (Mock)</h4>
                <div className="rounded-md border p-4 text-sm text-muted-foreground space-y-2">
                    {mockActivities.map(activity => (
                        <p key={activity.id}><span className="font-semibold text-foreground">{activity.author}</span> {activity.message} - <span className="text-xs">{activity.time}</span></p>
                    ))}
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

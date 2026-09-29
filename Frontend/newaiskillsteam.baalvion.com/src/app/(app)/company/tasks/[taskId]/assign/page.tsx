
'use client';

import { getTask, getUsers } from '@/lib/api';
import { notFound, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AssignTaskForm } from './assign-task-form';
import type { User, Task } from '@/lib/types';
import { useSubmissions } from '@/contexts/submissions-context';
import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

export default function AssignTaskPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const [task, setTask] = useState<Task | null>(null);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { submissions } = useSubmissions();

  useEffect(() => {
    if (taskId) {
      const fetchData = async () => {
          setLoading(true);
          const taskData = await getTask(taskId);
          if (!taskData) {
              notFound();
              return;
          }
          setTask(taskData);

          const allUsers = await getUsers();
          const candidateUsers = allUsers.filter((user): user is User & { role: 'candidate' } => user.role === 'candidate');
          setCandidates(candidateUsers);
          setLoading(false);
      };
      fetchData();
    }
  }, [taskId]);

  const assignedCandidateIds = useMemo(() => {
    return submissions
        .filter(s => s.taskId === taskId)
        .map(s => s.userId);
  }, [submissions, taskId]);
  
  if (loading || !task) {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Assign Task
          </h2>
          <p className="text-muted-foreground">Assign "{task.title}" to one or more candidates.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Select Candidates or Invite New Ones</CardTitle>
          <CardDescription>
            Choose from existing candidates on the platform, or invite new candidates by entering their email addresses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssignTaskForm candidates={candidates} task={task} assignedCandidateIds={assignedCandidateIds} />
        </CardContent>
      </Card>
    </div>
  );
}

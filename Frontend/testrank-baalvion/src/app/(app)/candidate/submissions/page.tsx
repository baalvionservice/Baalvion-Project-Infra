
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useSubmissions } from '@/contexts/submissions-context';
import { SubmissionList } from './submission-list';
import * as api from '@/lib/api';
import type { Submission, Task, Evaluation } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export type SubmissionWithDetails = Submission & {
  task?: Task;
  evaluation?: Evaluation;
};

export default function SubmissionsPage() {
  const { user } = useAuth();
  const { submissions: allSubmissions } = useSubmissions();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        const [tasksData, evalsData] = await Promise.all([
            api.getTasks(),
            api.getAllEvaluations(),
        ]);
        setTasks(tasksData);
        setEvaluations(evalsData);
        setLoading(false);
    }
    fetchData();
  }, []);
  
  const submissionsForUser = useMemo(() => {
    if (!user) return [];
    return allSubmissions.filter(sub => sub.userId === user.id);
  }, [allSubmissions, user]);

  const submissionsWithDetails: SubmissionWithDetails[] = useMemo(() => {
    return submissionsForUser.map((submission) => {
      const task = tasks.find(t => t.id === submission.taskId);
      const evaluation = evaluations.find(e => e.submissionId === submission.id);
      return { ...submission, task, evaluation };
    });
  }, [submissionsForUser, tasks, evaluations]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          My Tasks
        </h2>
      </div>
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <SubmissionList submissions={submissionsWithDetails} />
      )}
    </div>
  );
}

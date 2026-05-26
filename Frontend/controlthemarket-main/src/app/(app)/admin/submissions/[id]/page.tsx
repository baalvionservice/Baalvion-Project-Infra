

'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getSubmission, getTask, getUser, getEvaluationBySubmission } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { OverrideForm } from './override-form';
import type { Submission, Task, User as Candidate, Evaluation } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ExecutionLogsPanel } from '@/components/execution-logs-panel';
import { ValidationResultPanel } from './validation-result-panel';
import { TestCasePanel } from './test-case-panel';
import { AiEvaluationPanel } from './ai-evaluation-panel';
import { SandboxWorkspacePanel } from './sandbox-workspace-panel';
import { LiveCodingWorkspacePanel } from './live-coding-workspace-panel';
import { AntiCheatingIndicatorPanel } from './anti-cheating-panel';
import { RecordingPanel } from './recording-panel';
import { SkillMatchResultPanel } from './skill-match-result-panel';
import { DomainAccessPanel } from '@/app/(app)/company/submissions/[id]/domain-access-panel';


export type SubmissionWithRelations = Submission & {
  task?: Task;
  candidate?: Candidate;
  evaluation?: Evaluation;
};

export default function AdminManageSubmissionPage() {
  const params = useParams();
  const submissionId = params.id as string;
  const [submission, setSubmission] = useState<SubmissionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (submissionId) {
      async function fetchData() {
        const subData = await getSubmission(submissionId);
        if (!subData) {
          notFound();
          return;
        }
        const taskData = await getTask(subData.taskId);
        const candidateData = await getUser(subData.userId);
        const evalData = await getEvaluationBySubmission(subData.id);

        setSubmission({
          ...subData,
          task: taskData,
          candidate: candidateData,
          evaluation: evalData,
        });
        setLoading(false);
      }
      fetchData();
    }
  }, [submissionId]);
  
  if (loading || !submission) {
    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  const { task, candidate, evaluation } = submission;
  
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Manage Submission
            </h2>
             <div className="text-muted-foreground flex items-center gap-4">
                <Link href="#" className="flex items-center gap-2 hover:underline">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={candidate?.profile?.avatarUrl} />
                        <AvatarFallback>{candidate?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{candidate?.name}</span>
                </Link>
                <span>|</span>
                <Link href="#" className="hover:underline">Task: {task?.title}</Link>
            </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Control Panel</CardTitle>
                    <CardDescription>
                        Modify scores, feedback, and submission status. All changes are final.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OverrideForm submission={submission} />
                </CardContent>
            </Card>
            <LiveCodingWorkspacePanel submission={submission} />
            <RecordingPanel submission={submission} />
        </div>
        <div className="space-y-6">
            <DomainAccessPanel submission={submission} />
            <SkillMatchResultPanel submission={submission} />
            <AiEvaluationPanel submission={submission} />
            <AntiCheatingIndicatorPanel submission={submission} />
            <SandboxWorkspacePanel submission={submission} />
            <ValidationResultPanel submission={submission} />
            <TestCasePanel submission={submission} />
            <ExecutionLogsPanel submission={submission} evaluation={evaluation} isAdminOverride={true} />
        </div>
      </div>
    </div>
  );
}

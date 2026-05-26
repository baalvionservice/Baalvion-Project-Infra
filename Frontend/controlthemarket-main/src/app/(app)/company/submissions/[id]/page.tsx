

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { getSubmission, getTask, getEvaluationBySubmission, getCompany, getUser } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ExternalLink, Github, FileText, User, Briefcase, MessageSquare, Star, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EvaluationForm } from './evaluation-form';
import type { Submission, Task, User as Candidate, Evaluation, SubmissionContentType, Company } from '@/lib/types';
import { ActivityLog } from '@/components/activity-log';
import { Progress } from '@/components/ui/progress';
import { AiEvaluationPanel } from './ai-evaluation-panel';
import { SkillMatchResultPanel } from './skill-match-result-panel';
import { RecordingPanel } from './recording-panel';
import { DomainAccessPanel } from './domain-access-panel';


export type SubmissionWithRelations = Submission & {
  task?: Task;
  candidate?: Candidate;
  evaluation?: Evaluation;
  company?: Company;
};

export default function SubmissionReviewPage() {
  const params = useParams();
  const submissionId = params.id as string;
  const [submission, setSubmission] = useState<SubmissionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (submissionId) {
      async function fetchData() {
        const subData = await getSubmission(submissionId);
        if (!subData) {
          notFound();
          return;
        }
        const [taskData, candidateData, evalData] = await Promise.all([
            getTask(subData.taskId),
            getUser(subData.userId),
            getEvaluationBySubmission(subData.id)
        ]);

        const companyData = taskData ? await getCompany(taskData.companyId) : undefined;

        setSubmission({
          ...subData,
          task: taskData,
          candidate: candidateData,
          evaluation: evalData,
          company: companyData,
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
  
  const getSubmissionIcon = (type: SubmissionContentType | undefined) => {
    switch(type) {
        case 'link': return <Github className="h-4 w-4 text-muted-foreground" />;
        case 'file': return <FileText className="h-4 w-4 text-muted-foreground" />;
        case 'externalLink': return <ExternalLink className="h-4 w-4 text-muted-foreground" />;
        default: return null;
    }
  }

  const ScoreCircle = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 20; // 2 * pi * radius
    const offset = circumference - (score / 100) * circumference;
  
    let colorClass = 'text-primary';
    if (score < 50) colorClass = 'text-destructive';
    else if (score < 80) colorClass = 'text-yellow-500';
  
    return (
      <div className="relative h-24 w-24">
        <svg className="h-full w-full" viewBox="0 0 50 50">
          <circle
            className="text-muted"
            strokeWidth="5"
            stroke="currentColor"
            fill="transparent"
            r="20"
            cx="25"
            cy="25"
          />
          <circle
            className={colorClass}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="20"
            cx="25"
            cy="25"
            transform="rotate(-90 25 25)"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
          {score}
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Review Submission
            </h2>
            <p className="text-muted-foreground">
                Task: {task?.title}
            </p>
        </div>
        <Badge variant="outline" className="text-base py-1 px-3 capitalize">
          {submission.status.replace('-', ' ')}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Panel</CardTitle>
                <CardDescription>Provide feedback and a score for this submission using the criteria below.</CardDescription>
              </CardHeader>
              <CardContent>
                <EvaluationForm submission={submission} />
              </CardContent>
            </Card>
            
            <RecordingPanel submission={submission} />

            {evaluation && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                           <CheckCircle className="h-6 w-6 text-green-500" />
                           <span>Existing Evaluation</span>
                        </CardTitle>
                        <CardDescription>
                            This submission was evaluated on {format(new Date(evaluation.evaluatedAt), 'PPp')}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex-shrink-0">
                                <ScoreCircle score={evaluation.score} />
                            </div>
                            <div className="w-full space-y-4">
                               {evaluation.criteriaScores && Object.entries(evaluation.criteriaScores).map(([key, value]) => (
                                    <div key={key} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{key}</span>
                                            <span className="text-muted-foreground">{value * 10}/100</span>
                                        </div>
                                        <Progress value={value * 10} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Feedback Provided</h4>
                            <p className="text-muted-foreground italic">"{evaluation.feedback}"</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={candidate?.profile?.avatarUrl} />
                            <AvatarFallback>{candidate?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{candidate?.name}</span>
                    </CardTitle>
                     <CardDescription>
                        Submitted on {submission.submittedAt ? format(new Date(submission.submittedAt), 'PPp') : 'N/A'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="#">View Candidate Profile</Link>
                    </Button>
                </CardContent>
            </Card>
            <DomainAccessPanel submission={submission} />
            <SkillMatchResultPanel submission={submission} />
            <AiEvaluationPanel submission={submission} />
            <Card>
                <CardHeader>
                    <CardTitle>Submission Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                   <div className="font-medium flex items-center gap-2 capitalize">
                        {getSubmissionIcon(submission.content?.type)}
                        <span>{submission.content?.type === 'link' ? 'GitHub Repo' : (submission.content?.type === 'externalLink' ? 'External Link' : 'File Upload')}</span>
                    </div>
                    {submission.content?.value && (
                        <Button asChild variant="secondary" className="w-full">
                             <Link href={submission.content.value} target="_blank" rel="noopener noreferrer">
                                View Submission <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
            <ActivityLog submission={submission} evaluation={evaluation} />
        </div>
      </div>
    </div>
  );
}

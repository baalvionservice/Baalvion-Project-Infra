

'use client';

import React from 'react';
import { useSubmissions } from '@/contexts/submissions-context';
import { mockTasks, mockEvaluations, mockCompanies } from '@/lib/mock-data';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useMemo } from 'react';
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
import { Star, MessageSquare, Briefcase, ExternalLink, FileText, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts';
import { ActivityLog } from '@/components/activity-log';
import type { SubmissionStatus, Company } from '@/lib/types';
import { SkillMatchResultPanel } from './skill-match-result-panel';
import { DomainAccessCard } from './domain-access-card';


const statusSteps = ['assigned', 'in-progress', 'pending', 'in-review', 'evaluated'];

export default function SubmissionDetailPage() {
  const params = useParams();
  const submissionId = params.id as string;
  const { submissions, updateSubmission } = useSubmissions();
  const router = useRouter();
  
  const submission = useMemo(() => submissions.find(s => s.id === submissionId), [submissions, submissionId]);

  const task = useMemo(() => submission ? mockTasks.find(t => t.id === submission.taskId) : undefined, [submission]);
  const evaluation = useMemo(() => submission ? mockEvaluations.find(e => e.submissionId === submission.id) : undefined, [submission]);
  const company = useMemo(() => task ? mockCompanies.find(c => c.id === task.companyId) : undefined, [task]);

  if (!submission || !task) {
     return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Submission Not Found
        </h2>
        <p className="text-muted-foreground">The submission you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/candidate/submissions">Go to My Tasks</Link>
        </Button>
      </div>
     )
  }

  const currentRoundNumber = submission.currentRound || 1;
  const isFinalRound = task.multiRound ? currentRoundNumber === task.rounds?.length : true;

  const handleProceedToNextRound = () => {
    if (task.multiRound && !isFinalRound) {
        updateSubmission(submission.id, {
            currentRound: currentRoundNumber + 1,
            status: 'assigned',
        });
        router.push(`/candidate/tasks/${task.id}`);
    }
  }

  let currentStepIndex = statusSteps.indexOf(submission.status);
  if (['shortlisted', 'rejected', 'moved-to-next-round'].includes(submission.status)) {
    currentStepIndex = statusSteps.indexOf('evaluated');
  } else if (submission.status === 'resubmitted') {
    currentStepIndex = statusSteps.indexOf('pending');
  }
  const currentStep = currentStepIndex;

  const isFinalState = ['evaluated', 'shortlisted', 'rejected', 'moved-to-next-round'].includes(submission.status);
  
  const canProceed = isFinalState && task.multiRound && !isFinalRound;

  const getTimestampForStep = (step: string) => {
    switch(step) {
        case 'assigned':
            return submission.assignedAt ? `Assigned: ${format(new Date(submission.assignedAt), 'PPp')}` : 'Not assigned yet';
        case 'in-progress':
             if (submission.status === 'in-progress') return `Last updated: ${format(new Date(submission.lastUpdated), 'PPp')}`;
             return 'In Progress';
        case 'pending':
            if (submission.resubmittedAt) return `Resubmitted: ${format(new Date(submission.resubmittedAt), 'PPp')}`;
            if (submission.submittedAt) return `Submitted: ${format(new Date(submission.submittedAt), 'PPp')}`;
            return 'Not submitted yet';
        case 'in-review':
            return submission.status === 'in-review' ? 'Currently under review' : 'Awaiting review';
        case 'evaluated':
            if (evaluation?.evaluatedAt) return `Evaluated: ${format(new Date(evaluation.evaluatedAt), 'PPp')}`;
            return 'Awaiting evaluation';
        default:
            return '';
    }
}

  const getStatusVariant = (status: SubmissionStatus): 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'purple' => {
     switch (status) {
      case 'shortlisted': return 'default';
      case 'moved-to-next-round': return 'purple';
      case 'in-review':
      case 'evaluated':
        return 'secondary';
      case 'pending':
      case 'resubmitted':
      case 'in-progress':
        return 'warning';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Task Status: {task?.title}
            </h2>
            <p className="text-muted-foreground">
                Review your submission details, track its progress, and see feedback. Last updated on {format(new Date(submission.lastUpdated), 'PPp')}.
            </p>
        </div>
        {canProceed && (
             <Button onClick={handleProceedToNextRound}>
                Proceed to Round {currentRoundNumber + 1} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                <CardTitle>Your Progress</CardTitle>
                <CardDescription>
                    {task.multiRound && submission.currentRound
                        ? `Currently on Round ${submission.currentRound} of ${task?.rounds?.length || 1}.`
                        : `Follow the status of your submission.`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 overflow-x-auto">
                    <TooltipProvider>
                        <div className="flex items-start min-w-[500px]">
                            {statusSteps.map((step, index) => {
                                const isCompletedStep = currentStep > index;
                                const isCurrentStep = currentStep === index;
                                const isFutureStep = currentStep < index;

                                return (
                                    <React.Fragment key={step}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex flex-col items-center text-center">
                                                    <div
                                                        className={cn(
                                                            'flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition-all',
                                                            isCompletedStep && 'bg-primary text-primary-foreground',
                                                            isCurrentStep && 'bg-primary/20 text-primary ring-2 ring-primary',
                                                            isFutureStep && 'bg-muted text-muted-foreground'
                                                        )}
                                                    >
                                                        {isCompletedStep ? <CheckCircle className="h-6 w-6" /> : index + 1}
                                                    </div>
                                                    <p className={cn(
                                                        "mt-2 w-20 text-xs capitalize",
                                                        isCurrentStep && "font-semibold text-primary",
                                                        isFutureStep && "text-muted-foreground"
                                                    )}>
                                                        {step.replace('-', ' ')}
                                                    </p>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{getTimestampForStep(step)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        
                                        {index < statusSteps.length - 1 && (
                                            <div className={cn(
                                                "flex-1 h-1 mt-5 rounded-full mx-2",
                                                isCompletedStep ? "bg-primary" : "bg-muted"
                                            )} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </TooltipProvider>
                </CardContent>
            </Card>

            {evaluation && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Evaluation</span>
                            <Badge variant={"default"}>Completed</Badge>
                        </CardTitle>
                        <CardDescription>
                            Evaluated on {format(new Date(evaluation.evaluatedAt), 'PPP')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <h4 className="font-semibold flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Score</h4>
                            <p className="text-2xl font-bold">{evaluation.score}/100</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Feedback</h4>
                            <p className="text-muted-foreground italic">"{evaluation.feedback}"</p>
                        </div>
                    </CardContent>
                </Card>
            )}

             <SkillMatchResultPanel submission={submission} />

        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Task Details</span>
                        <Badge variant="outline">{task.difficulty}</Badge>
                    </CardTitle>
                    <CardDescription>
                        Assigned on {format(new Date(submission.assignedAt), 'PPP')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <h4 className="font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4" /> Role</h4>
                        <p className="text-muted-foreground">{task.roleCategory}</p>
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Your Submission</h4>
                        {submission.content ? (
                            <Button asChild variant="outline" size="sm">
                                <Link href={submission.content.value} target="_blank" rel="noopener noreferrer">
                                    View Submission for Round {currentRoundNumber} <ExternalLink className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <p className="text-sm text-muted-foreground">Not submitted yet.</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Status</h4>
                        <Badge variant={getStatusVariant(submission.status)} className="capitalize">{submission.status.replace('-', ' ')}</Badge>
                    </div>
                </CardContent>
            </Card>
            
            <DomainAccessCard submission={submission} company={company} />

            <ActivityLog submission={submission} evaluation={evaluation} />
        </div>
      </div>
    </div>
  );
}

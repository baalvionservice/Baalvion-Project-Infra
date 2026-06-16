
'use client';

import { sanitizeRichHtml } from '@/lib/sanitize';
import { useState, useEffect, useMemo } from 'react';
import { getTask, getCompany } from '@/lib/api';
import { notFound, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import {
  Briefcase,
  Calendar,
  Clock,
  Award,
  BookOpen,
  Target,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertTriangle,
  Paperclip,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { SubmissionForm } from './submission-form';
import type { Task, Company, Submission, TaskPriority } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useSubmissions } from '@/contexts/submissions-context';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { findSubmissionByTask, updateSubmission, assignTaskToUser } = useSubmissions();
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (taskId) {
      async function fetchData() {
        setLoading(true);
        const taskData = await getTask(taskId);
        if (taskData) {
          setTask(taskData);
          const companyData = await getCompany(taskData.companyId);
          setCompany(companyData || null);
        } else {
          notFound();
        }
        setLoading(false);
      }
      fetchData();
    }
  }, [taskId]);

  const submission = useMemo(() => {
    if (!user || !task) return undefined;
    return findSubmissionByTask(task.id, user.id);
  }, [task, user, findSubmissionByTask]);

  const handleStartTask = async () => {
    if (!user || !task) return;
    setStarting(true);
    try {
      if (!submission) {
        // Self-service start on an open task: create the candidate's submission row.
        await assignTaskToUser({ taskId: task.id, userId: user.id });
      } else if (submission.status === 'assigned') {
        await updateSubmission(submission.id, { status: 'in-progress' });
      }
    } finally {
      setStarting(false);
    }
  };

  const isTaskStarted = useMemo(() => {
    if (!submission) return false;
    return submission.status !== 'assigned';
  }, [submission]);

  const currentRoundNumber = useMemo(() => submission?.currentRound || 1, [submission]);

  if (loading || !task) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getPriorityVariant = (priority?: TaskPriority) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'warning';
      default: return 'outline';
    }
  };

  const renderTaskContent = () => {
    if (task.multiRound && task.rounds) {
      return (
         <Accordion type="single" collapsible className="w-full" defaultValue={`item-${currentRoundNumber - 1}`}>
          {task.rounds.map((round, index) => {
            const isCurrentRound = round.roundNumber === currentRoundNumber;
            const isCompletedRound = round.roundNumber < currentRoundNumber;

            return (
                <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className={cn("text-lg rounded-md px-4 hover:no-underline hover:bg-muted/50", isCurrentRound && "bg-muted/50")}>
                    <div className="flex items-center gap-4">
                    <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full font-bold",
                        isCurrentRound && "bg-primary text-primary-foreground animate-pulse",
                        isCompletedRound && "bg-primary/50 text-primary-foreground",
                        !isCurrentRound && !isCompletedRound && "bg-muted text-muted-foreground",
                    )}>{round.roundNumber}</span>
                    <span>Round {round.roundNumber}: Instructions</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="border-l-2 border-primary/20 ml-6 pl-10 space-y-8 pt-6 pb-2">
                    <div className="space-y-4">
                        <div className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(round.instructions) }} />
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2 text-primary"><Target className="h-5 w-5" /> Expected Outputs</h4>
                        <div className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(round.expectedOutputs) }} />
                    </div>
                    {round.timeLimitMinutes && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" /> 
                        <span>Time Limit for this round: {round.timeLimitMinutes} minutes</span>
                    </div>
                    )}
                </AccordionContent>
                </AccordionItem>
            );
        })}
        </Accordion>
      );
    }
    
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-xl"><BookOpen className="h-5 w-5 text-primary" /> Instructions</h3>
                <div className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(task.instructions) }} />
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-xl"><Target className="h-5 w-5 text-primary" /> Expected Outputs</h3>
                <div className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(task.expectedOutputs) }} />
            </div>
        </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/30">
      {/* Hero Section */}
      <section className="relative h-64 w-full bg-muted">
        {task.imageUrl && <Image src={task.imageUrl} alt={task.title} layout="fill" objectFit="cover" className="opacity-20" data-ai-hint={task.imageHint}/>}
        <div className="absolute inset-0 bg-gradient-to-t from-muted/30 to-transparent" />
        <div className="container relative h-full flex flex-col justify-end pb-8">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
            {task.title}
          </h1>
           <div className="mt-2 flex items-center gap-2">
            {company && (
                 <Link href="#" className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={company.logoUrl} alt={company.name} />
                        <AvatarFallback>{company.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-muted-foreground hover:underline">{company.name}</span>
                </Link>
            )}
          </div>
        </div>
      </section>

      {/* Key Details Bar */}
      <section className="sticky top-0 z-30 border-b border-t bg-background/80 backdrop-blur-lg">
          <div className="container grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-center">
              <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-xs text-muted-foreground">Role</span>
                  <Badge variant="secondary">{task.roleCategory}</Badge>
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-xs text-muted-foreground">Difficulty</span>
                  <Badge variant="outline">{task.difficulty}</Badge>
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-xs text-muted-foreground">Time Limit</span>
                  <span className="font-semibold text-sm flex items-center gap-1.5"><Clock className="h-4 w-4"/> {task.timeLimitMinutes ? `${task.timeLimitMinutes} min` : 'N/A'}</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-xs text-muted-foreground">Deadline</span>
                  <span className="font-semibold text-sm flex items-center gap-1.5"><Calendar className="h-4 w-4"/> {format(new Date(task.deadline), 'PPP')}</span>
              </div>
          </div>
      </section>

      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
            <div className="space-y-8">
                <Card>
                    <CardContent className="p-6 md:p-8 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold font-headline mb-4">Task Overview</h2>
                            <p className="text-muted-foreground max-w-prose">{task.description}</p>
                        </div>
                        
                        <Separator />

                        {renderTaskContent()}

                        {task.projectFile && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2 text-xl mb-4"><Paperclip className="h-5 w-5 text-primary"/> Resources</h3>
                                    <p className="text-muted-foreground mb-4">Download the necessary files for this task.</p>
                                    <Button asChild variant="secondary" className="w-full justify-start text-left">
                                        <Link href={task.projectFile.url} download>
                                            <Download className="mr-2 h-4 w-4" />
                                            <span>{task.projectFile.name}</span>
                                        </Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {isTaskStarted ? (
                    <SubmissionForm task={task} />
                ) : (
                    <div className="text-center">
                        <Button size="lg" onClick={handleStartTask} disabled={starting}>
                            {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Start Task
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

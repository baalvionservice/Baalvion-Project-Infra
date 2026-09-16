
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useSubmissions } from '@/contexts/submissions-context';
import { useMemo, useState, useEffect } from 'react';
import * as api from '@/lib/api';
import type { Task, Evaluation } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, FileText, CheckCircle, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CandidateDashboard() {
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
  
  const submissions = useMemo(() => {
    if (!user) return [];
    // Ensure this filters submissions for the current user
    return allSubmissions.filter(sub => sub.userId === user.id);
  }, [allSubmissions, user]);

  const stats = useMemo(() => {
    const total = submissions.length;
    if (total === 0) return { total: 0, submitted: 0, pending: 0, completionPercentage: 0 };
    
    const submitted = submissions.filter(s => ['pending', 'in-review', 'evaluated', 'shortlisted', 'rejected', 'resubmitted'].includes(s.status)).length;
    const pending = total - submitted;
    const completionPercentage = total > 0 ? Math.round((submitted / total) * 100) : 0;

    return { total, submitted, pending, completionPercentage };
  }, [submissions]);

  const submissionsWithDetails = useMemo(() => {
    return submissions.map((submission) => {
      const task = tasks.find(t => t.id === submission.taskId);
      const evaluation = evaluations.find(e => e.submissionId === submission.id);
      return { ...submission, task, evaluation };
    }).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  },[submissions, tasks, evaluations]);

  if (loading || !user) {
    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Welcome back, {user.name.split(' ')[0]}!
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {user.consentAccepted && user.consentAcceptedAt && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Consent Status
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-500">Accepted</div>
              {user.consentAcceptedAt && <p className="text-xs text-muted-foreground">on {format(new Date(user.consentAcceptedAt), 'PPP')}</p>}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {stats.submitted}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>You've submitted {stats.submitted} of {stats.total} assigned tasks.</CardDescription>
        </CardHeader>
        <CardContent>
            <Progress value={stats.completionPercentage} className="mb-2"/>
            <p className="text-right text-sm text-muted-foreground">{stats.completionPercentage}% complete</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Here's a look at your most recently updated tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissionsWithDetails.slice(0, 5).map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.task?.title}</TableCell>
                  <TableCell>
                    <Badge variant={
                      sub.status === 'evaluated' || sub.status === 'shortlisted' ? 'default' :
                      sub.status === 'in-review' || sub.status === 'pending' || sub.status === 'resubmitted' ? 'secondary' : 
                      sub.status === 'rejected' ? 'destructive' : 'outline'
                    }>
                      {sub.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sub.evaluation ? `${sub.evaluation.score}/100` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/candidate/submissions/${sub.id}`}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Play,
  Pause,
  Settings,
  Percent,
  Star,
  CheckCircle,
  XCircle,
  FileCheck2,
  FlaskConical,
} from 'lucide-react';
import type { AutomatedSubmission } from './page';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { TestCaseStatus, ValidationStatus } from '@/lib/types';


const getStatusVariant = (status?: 'Valid' | 'Invalid' | 'Warning' | 'Passed' | 'Failed' | 'Pending'): 'default' | 'destructive' | 'warning' | 'outline' => {
    switch (status) {
        case 'Valid':
        case 'Passed': 
            return 'default';
        case 'Invalid':
        case 'Failed':
             return 'destructive';
        case 'Warning': 
            return 'warning';
        case 'Pending': 
            return 'outline';
        default: return 'outline';
    }
};

const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
}

export function AutomationDashboard({ submissions }: { submissions: AutomatedSubmission[] }) {
    
    const stats = useMemo(() => {
        const total = submissions.length;
        if (total === 0) {
            return { total, avgScore: 0, validationPassRate: 0, testPassRate: 0 };
        }
        
        const avgScore = Math.round(submissions.reduce((acc, s) => acc + (s.autoScore || 0), 0) / total);
        const validationPasses = submissions.filter(s => s.validationStatus === 'Valid').length;
        const testPasses = submissions.filter(s => s.testCaseStatus === 'Passed').length;
        
        return {
            total,
            avgScore,
            validationPassRate: Math.round((validationPasses / total) * 100),
            testPassRate: Math.round((testPasses / total) * 100),
        };
    }, [submissions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Automation Control Panel</CardTitle>
                    <CardDescription>Manage the automated evaluation service.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg"><Play className="mr-2" /> Start Automation</Button>
                    <Button size="lg" variant="destructive"><Pause className="mr-2"/> Stop Automation</Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/admin/settings">
                            <Settings className="mr-2"/> Configure Rules
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recently Processed Submissions</CardTitle>
                    <CardDescription>A live feed of the latest automated evaluations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Validation</TableHead>
                                <TableHead>Test Cases</TableHead>
                                <TableHead>Auto-Score</TableHead>
                                <TableHead>Processed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.slice(0, 5).map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={sub.candidateAvatar} />
                                                    <AvatarFallback>{sub.candidateName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{sub.candidateName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[150px] truncate">{sub.taskTitle}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(sub.validationStatus)}>{sub.validationStatus || 'N/A'}</Badge>
                                        </TableCell>
                                         <TableCell>
                                            <Badge variant={getStatusVariant(sub.testCaseStatus)}>{sub.testCaseStatus || 'N/A'}</Badge>
                                        </TableCell>
                                        <TableCell className={cn("font-bold", getScoreColor(sub.autoScore || 0))}>
                                            {sub.autoScore || 'N/A'}
                                        </TableCell>
                                        <TableCell>{format(new Date(sub.processedAt), 'PPp')}</TableCell>
                                    </TableRow>
                                ))}
                                {submissions.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No submissions have been processed yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5"/>Automation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-2"><FileCheck2 className="h-4 w-4" /> Submissions Processed</span>
                        <span className="font-bold text-lg">{stats.total}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-2"><Star className="h-4 w-4" /> Average Auto-Score</span>
                        <span className="font-bold text-lg">{stats.avgScore}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Validation Pass Rate</span>
                        <span className="font-bold text-lg">{stats.validationPassRate}%</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> Test Case Pass Rate</span>
                        <span className="font-bold text-lg">{stats.testPassRate}%</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

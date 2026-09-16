
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, FileCheck2, Bot } from 'lucide-react';
import type { Submission } from '@/lib/types';
import { Button } from '@/components/ui/button';

type ValidationCheck = {
    name: string;
    status: 'Passed' | 'Failed' | 'Warning';
    details: string;
};

const mockValidationChecks: ValidationCheck[] = [
    { name: 'Linting Check', status: 'Passed', details: 'No linting errors found.' },
    { name: 'Code Complexity', status: 'Passed', details: 'Cyclomatic complexity is within acceptable limits.' },
    { name: 'Dependency Audit', status: 'Warning', details: 'Found 2 low-severity vulnerabilities in dependencies.' },
    { name: 'Plagiarism Scan', status: 'Passed', details: 'No significant overlap found with public repositories.' },
    { name: 'File Type Check', status: 'Passed', details: 'Submission file type is valid.' },
];

const getStatusIcon = (status: ValidationCheck['status']) => {
    switch (status) {
        case 'Passed': return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'Failed': return <XCircle className="h-5 w-5 text-destructive" />;
        case 'Warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
};

const getOverallStatusVariant = (status?: Submission['validationStatus']) => {
    switch (status) {
        case 'Valid': return 'default';
        case 'Invalid': return 'destructive';
        case 'Warning': return 'warning';
        default: return 'outline';
    }
};

export function ValidationResultPanel({ submission }: { submission: Submission }) {
  // In a real app, checks would be fetched or calculated based on the submission.
  const checks = mockValidationChecks;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5" />
            Auto-Validation Results
        </CardTitle>
        <CardDescription>
            Automated checks performed on the submission content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border p-4">
            <div>
                <h4 className="font-semibold">Overall Status</h4>
                <p className="text-sm text-muted-foreground">Based on the configured validation rules.</p>
            </div>
            <Badge variant={getOverallStatusVariant(submission.validationStatus)} className="text-base">
                {submission.validationStatus || 'Pending'}
            </Badge>
        </div>
        <div className="space-y-3">
            {checks.map(check => (
                <div key={check.name} className="flex items-start gap-4">
                    <div>{getStatusIcon(check.status)}</div>
                    <div className="flex-1">
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-muted-foreground">{check.details}</p>
                    </div>
                </div>
            ))}
        </div>
        <Button variant="outline" className="w-full">
            <Bot className="mr-2 h-4 w-4" />
            Re-run All Checks
        </Button>
      </CardContent>
    </Card>
  );
}

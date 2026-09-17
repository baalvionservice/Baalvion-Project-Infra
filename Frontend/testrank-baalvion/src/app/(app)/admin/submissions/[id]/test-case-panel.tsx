
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, FlaskConical, Loader2, RefreshCw } from 'lucide-react';
import type { Submission, TestCase, TestCaseStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { getTestCasesBySubmission } from '@/lib/api';

const getStatusIcon = (status: TestCaseStatus) => {
    switch (status) {
        case 'Passed': return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'Failed': return <XCircle className="h-5 w-5 text-destructive" />;
        case 'Warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        case 'Pending': return <Loader2 className="h-5 w-5 animate-spin" />;
    }
};

const getOverallStatusVariant = (status?: TestCaseStatus) => {
    switch (status) {
        case 'Passed': return 'default';
        case 'Failed': return 'destructive';
        case 'Warning': return 'warning';
        default: return 'outline';
    }
};

export function TestCasePanel({ submission }: { submission: Submission }) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestCases = async () => {
      setLoading(true);
      const cases = await getTestCasesBySubmission(submission.id);
      setTestCases(cases);
      setLoading(false);
    };
    fetchTestCases();
  }, [submission.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Backend/API Test Simulation
        </CardTitle>
        <CardDescription>
            Simulated results from automated API and backend tests.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border p-4">
            <div>
                <h4 className="font-semibold">Overall Test Status</h4>
                <p className="text-sm text-muted-foreground">Based on all executed API test cases.</p>
            </div>
            <Badge variant={getOverallStatusVariant(submission.testCaseStatus)} className="text-base">
                {submission.testCaseStatus || 'Pending'}
            </Badge>
        </div>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
              {testCases.map(tc => (
                  <div key={tc.id} className="flex items-start gap-4">
                      <div>{getStatusIcon(tc.status)}</div>
                      <div className="flex-1">
                          <p className="font-medium">{tc.name}</p>
                          <p className="text-sm text-muted-foreground">{tc.description}</p>
                          <p className="text-xs mt-1"><span className="font-semibold">Expected:</span> {tc.expectedOutcome}</p>
                          <p className="text-xs"><span className="font-semibold">Actual:</span> {tc.actualOutcome}</p>
                      </div>
                  </div>
              ))}
              {testCases.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No API test cases found for this submission.</p>}
          </div>
        )}
        <Button variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Re-run All API Tests
        </Button>
      </CardContent>
    </Card>
  );
}

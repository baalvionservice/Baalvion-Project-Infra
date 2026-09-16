
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';
import type { Submission } from '@/lib/types';

export function ControlTheMarketResultPanel({ submission }: { submission: Submission }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    ControlTheMarket Result
                </CardTitle>
                <CardDescription>
                    Final assessment based on overall performance.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-between rounded-md border p-4">
                    <div>
                        <h4 className="font-semibold">Final Assessment</h4>
                    </div>
                    {submission.skillMatchResult ? (
                        <Badge variant={submission.skillMatchResult.result === 'pass' ? 'default' : 'destructive'} className="text-base capitalize">
                            {submission.skillMatchResult.result}
                        </Badge>
                    ) : (
                        <Badge variant="outline">Pending</Badge>
                    )}
                </div>
                 <div className="flex items-center justify-between rounded-md border p-4">
                    <div>
                        <h4 className="font-semibold">Skill Badge Awarded</h4>
                    </div>
                    {submission.skillMatchResult?.skillBadge ? (
                        <Badge variant="secondary" className="text-base">
                            {submission.skillMatchResult.skillBadge}
                        </Badge>
                    ) : (
                         <Badge variant="outline">Not Awarded</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Award } from 'lucide-react';
import type { Submission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSubmissions } from '@/contexts/submissions-context';

export function ControlTheMarketResultPanel({ submission }: { submission: Submission }) {
    const { toast } = useToast();
    const { updateSubmission } = useSubmissions();
    const [isUpdating, setIsUpdating] = useState(false);
    const canGetResult = submission.status === 'evaluated' && !submission.skillMatchResult;

    const handleGetResult = () => {
        setIsUpdating(true);
        toast({ title: "Finalizing your result..." });
        
        setTimeout(() => {
            const result = Math.random() > 0.3 ? 'pass' : 'fail'; // 70% pass rate
            const newBadge = result === 'pass' ? 'React Pro' : 'Needs Improvement';
            updateSubmission(submission.id, {
                skillMatchResult: {
                    result: result,
                    skillBadge: newBadge,
                }
            });
            setIsUpdating(false);
            toast({ title: "Result Finalized!", description: `You have been awarded the '${newBadge}' badge.` });
        }, 1500);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    ControlTheMarket Result
                </CardTitle>
                <CardDescription>
                    Your final assessment and any badges awarded.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {canGetResult ? (
                     <Button onClick={handleGetResult} disabled={isUpdating} className="w-full">
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
                        Get Final Result (Demo)
                    </Button>
                ) : (
                    <>
                        <div className="flex items-center justify-between rounded-md border p-4">
                            <div><h4 className="font-semibold">Final Assessment</h4></div>
                            {submission.skillMatchResult ? (
                                <Badge variant={submission.skillMatchResult.result === 'pass' ? 'default' : 'destructive'} className="text-base capitalize">
                                    {submission.skillMatchResult.result}
                                </Badge>
                            ) : (<Badge variant="outline">Pending</Badge>)}
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-4">
                            <div><h4 className="font-semibold">Skill Badge</h4></div>
                            {submission.skillMatchResult?.skillBadge ? (
                                <Badge variant="secondary" className="text-base">{submission.skillMatchResult.skillBadge}</Badge>
                            ) : (<Badge variant="outline">Not Awarded</Badge>)}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}


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
import { Loader2, Award, RefreshCw, Check, X } from 'lucide-react';
import type { Submission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSubmissions } from '@/contexts/submissions-context';

export function SkillMatchResultPanel({ submission }: { submission: Submission }) {
    const { toast } = useToast();
    const { updateSubmission } = useSubmissions();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateResult = (result: 'pass' | 'fail') => {
        setIsUpdating(true);
        toast({ title: "Updating SkillMatch Pro Result..." });
        
        // Mock API call
        setTimeout(() => {
            const newBadge = result === 'pass' ? 'React Pro' : 'Needs Improvement';
            updateSubmission(submission.id, {
                skillMatchResult: {
                    result: result,
                    skillBadge: newBadge,
                }
            });
            setIsUpdating(false);
            toast({ title: "Result Updated!", description: `Candidate marked as '${result}' with badge '${newBadge}'.` });
        }, 1000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    SkillMatch Pro Result
                </CardTitle>
                <CardDescription>
                    Mock integration for final skill assessment and badging.
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
                        <h4 className="font-semibold">Skill Badge</h4>
                    </div>
                    {submission.skillMatchResult?.skillBadge ? (
                        <Badge variant="secondary" className="text-base">
                            {submission.skillMatchResult.skillBadge}
                        </Badge>
                    ) : (
                         <Badge variant="outline">Not Awarded</Badge>
                    )}
                </div>
                
                <div className="flex gap-2">
                    <Button onClick={() => handleUpdateResult('pass')} disabled={isUpdating} variant="outline" className="w-full">
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4 text-green-500" />}
                        Mark as Pass
                    </Button>
                     <Button onClick={() => handleUpdateResult('fail')} disabled={isUpdating} variant="destructive" className="w-full">
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                        Mark as Fail
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

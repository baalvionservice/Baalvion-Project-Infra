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
import { Loader2, Bot, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import type { Submission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type ConfidenceLevel = 'High' | 'Medium' | 'Low';
type AiResult = {
    confidence: ConfidenceLevel;
    strengths: string[];
    weaknesses: string[];
};

const getConfidenceVariant = (confidence?: ConfidenceLevel) => {
    switch (confidence) {
        case 'High': return 'default';
        case 'Medium': return 'warning';
        case 'Low': return 'destructive';
        default: return 'outline';
    }
}
const getStatusVariant = (status?: Submission['autoScoringStatus']) => {
    switch (status) {
        case 'Completed': return 'default';
        case 'Failed': return 'destructive';
        case 'Pending': return 'outline';
        default: return 'outline';
    }
};

export function AiEvaluationPanel({ submission }: { submission: Submission }) {
    const [isLoading, setIsLoading] = useState(false);
    const [aiResult, setAiResult] = useState<AiResult | null>(null);
    const { toast } = useToast();

    const handleRunAnalysis = () => {
        setIsLoading(true);
        toast({ title: "AI Analysis Running", description: "This will take a moment..."});
        // Mock AI processing
        setTimeout(() => {
            const mockConfidence: ConfidenceLevel[] = ['High', 'Medium', 'Low'];
            const mockStrengths = ['Clean Code', 'Good Component Structure', 'Clear Logic'];
            const mockWeaknesses = ['Missing Edge Case Handling', 'Could be more performant'];

            setAiResult({
                confidence: mockConfidence[Math.floor(Math.random() * 3)],
                strengths: mockStrengths.slice(0, Math.floor(Math.random() * 3) + 1),
                weaknesses: mockWeaknesses.slice(0, Math.floor(Math.random() * 2) + 1),
            });
            setIsLoading(false);
            toast({ title: "AI Analysis Complete" });
        }, 2000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Evaluation (Placeholder)
                </CardTitle>
                <CardDescription>
                    A mock placeholder for AI-driven submission analysis.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-between rounded-md border p-4">
                    <div>
                        <h4 className="font-semibold">AI Score</h4>
                        <p className="text-sm text-muted-foreground">Based on automated analysis.</p>
                    </div>
                    <p className="text-3xl font-bold text-primary">{submission.autoScore || 'N/A'}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Evaluation Status</span>
                    <Badge variant={getStatusVariant(submission.autoScoringStatus)}>
                        {submission.autoScoringStatus || 'Pending'}
                    </Badge>
                </div>

                {aiResult && (
                    <div className="space-y-4 rounded-md border p-4">
                         <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">AI Confidence Level</span>
                            <Badge variant={getConfidenceVariant(aiResult.confidence)}>
                                {aiResult.confidence}
                            </Badge>
                        </div>
                        <div className="space-y-2">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" /> Strengths
                            </h5>
                            <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                {aiResult.strengths.map(s => <li key={s}>{s}</li>)}
                            </ul>
                        </div>
                         <div className="space-y-2">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-500" /> Areas for Improvement
                            </h5>
                            <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                {aiResult.weaknesses.map(w => <li key={w}>{w}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
               
                <Button onClick={handleRunAnalysis} disabled={isLoading} variant="outline" className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    {aiResult ? 'Re-run AI Analysis' : 'Run AI Analysis'}
                </Button>
            </CardContent>
        </Card>
    );
}

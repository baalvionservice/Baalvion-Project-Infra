'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, Zap } from 'lucide-react';
import { useAi } from '@/hooks/use-ai';

export default function GrowthOpportunities() {
    const { predictions } = useAi();
    const opportunities = predictions.growthOpportunities;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb className="text-yellow-400" /> Growth Opportunities</CardTitle>
                <CardDescription>AI-identified areas with high potential for business growth.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {opportunities.map(opp => (
                    <Card key={opp.id} className="bg-muted/50">
                        <CardHeader className="pb-2">
                             <div className="flex justify-between items-start">
                                <CardTitle className="text-base">{opp.title}</CardTitle>
                                 <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    <span>{opp.confidence}% Confidence</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground">{opp.description}</p>
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-2">
                            <div>
                                <p className="text-xs text-muted-foreground">Estimated Impact</p>
                                <p className="font-bold text-green-600 flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {opp.estimatedImpact}</p>
                            </div>
                            <Button size="sm" variant="outline">Explore Scenario</Button>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
}

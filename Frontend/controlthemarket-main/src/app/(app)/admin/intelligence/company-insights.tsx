
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import type { CompanyInsight } from '@/lib/types';
import { Progress } from "@/components/ui/progress";

interface CompanyInsightsProps {
  insights: CompanyInsight[];
}

export function CompanyInsights({ insights }: CompanyInsightsProps) {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Company Performance Insights</CardTitle>
            <CardDescription>
                An overview of each company's candidate performance and skill distribution.
            </CardDescription>
        </CardHeader>
        <CardContent>
             <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {insights.map(item => (
                    <Card key={item.company.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={item.company.logoUrl} alt={item.company.name} />
                                    <AvatarFallback>{item.company.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg">{item.company.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <Users className="h-4 w-4" /> {item.candidateCount} candidates
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Avg. Candidate Score</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">{item.avgCandidateScore}/100</p>
                                </div>
                                <Progress value={item.avgCandidateScore} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Skill Analysis</p>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    <div className="flex flex-wrap gap-1">
                                        {item.topSkills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                    <div className="flex flex-wrap gap-1">
                                        {item.skillGaps.map(skill => <Badge key={skill} variant="destructive">{skill}</Badge>)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                 {insights.length === 0 && (
                    <div className="col-span-full text-center py-10">
                        <p className="text-muted-foreground">No company insights available yet.</p>
                    </div>
                 )}
            </div>
        </CardContent>
    </Card>
  );
}


'use client';

import { useMemo } from 'react';
import type { Evaluation } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { GlobalCriteriaRadarChart } from '../analytics/charts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PlatformInsightsProps {
  allEvaluations: Evaluation[];
}

export function PlatformInsights({ allEvaluations }: PlatformInsightsProps) {
  const { topSkills, skillGaps } = useMemo(() => {
    const criteriaTotals: { [key: string]: { total: number; count: number } } = {};
    allEvaluations.forEach(ev => {
      if (ev.criteriaScores) {
        Object.entries(ev.criteriaScores).forEach(([criterion, score]) => {
          if (!criteriaTotals[criterion]) {
            criteriaTotals[criterion] = { total: 0, count: 0 };
          }
          criteriaTotals[criterion].total += score;
          criteriaTotals[criterion].count++;
        });
      }
    });

    const sortedCriteria = Object.entries(criteriaTotals)
        .map(([name, { total, count }]) => ({ name, score: total / count }))
        .sort((a,b) => b.score - a.score);

    return {
        topSkills: sortedCriteria.slice(0, 3).map(c => c.name),
        skillGaps: sortedCriteria.slice(-3).map(c => c.name),
    };
  }, [allEvaluations]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Platform Skill Analysis</CardTitle>
                <CardDescription>
                    Average performance across all evaluation criteria platform-wide.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <GlobalCriteriaRadarChart evaluations={allEvaluations} />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Key Skill Trends</CardTitle>
                <CardDescription>
                    The most common strengths and areas for improvement across all candidates.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Common Strengths
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {topSkills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                    </div>
                </div>
                 <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        Common Skill Gaps
                    </h4>
                     <div className="flex flex-wrap gap-2">
                        {skillGaps.map(skill => <Badge key={skill} variant="destructive">{skill}</Badge>)}
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

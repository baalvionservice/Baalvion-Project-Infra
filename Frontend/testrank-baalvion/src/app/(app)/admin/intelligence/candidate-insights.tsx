
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, Minus, Trophy, Sparkles } from 'lucide-react';
import type { CandidateInsight } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CandidateInsightsProps {
  insights: CandidateInsight[];
}

const getTrendInfo = (trend: CandidateInsight['trend']) => {
  switch (trend) {
    case 'improving':
      return { icon: ArrowUp, color: 'text-green-500', label: 'Improving' };
    case 'declining':
      return { icon: ArrowDown, color: 'text-red-500', label: 'Declining' };
    case 'stable':
      return { icon: Minus, color: 'text-gray-500', label: 'Stable' };
    default:
      return { icon: Sparkles, color: 'text-blue-500', label: 'New' };
  }
};

const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500/20 text-green-700';
    if (score >= 75) return 'bg-yellow-500/20 text-yellow-700';
    if (score > 0) return 'bg-red-500/20 text-red-700';
    return 'bg-muted';
};

const getPercentileInfo = (percentileRank: number): { label: string; className: string } => {
    if (percentileRank <= 10) return { label: 'Top 10%', className: 'bg-yellow-400/20 text-yellow-700' };
    if (percentileRank <= 25) return { label: 'Top 25%', className: 'bg-slate-300/40 text-slate-700' };
    if (percentileRank <= 50) return { label: 'Top 50%', className: 'bg-orange-400/20 text-orange-700' };
    return { label: 'Bottom 50%', className: 'bg-muted text-muted-foreground' };
  };


export function CandidateInsights({ insights }: CandidateInsightsProps) {
  return (
     <Card>
        <CardHeader>
            <CardTitle>Candidate Performance Insights</CardTitle>
            <CardDescription>
                An overview of all candidates, their performance trends, and key skill areas.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <TooltipProvider>
            <div className="rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Avg. Score</TableHead>
                    <TableHead>Percentile</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Top Skill</TableHead>
                    <TableHead>Weakest Skill</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {insights.length > 0 ? (
                    insights.map((item) => {
                        const trendInfo = getTrendInfo(item.trend);
                        return (
                        <TableRow key={item.candidate.id}>
                            <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                <AvatarImage src={item.candidate.profile?.avatarUrl} alt={item.candidate.name} />
                                <AvatarFallback>{item.candidate.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                <p className="font-medium">{item.candidate.name}</p>
                                <p className="text-sm text-muted-foreground">{item.evaluationCount} evaluation(s)</p>
                                </div>
                            </div>
                            </TableCell>
                            <TableCell>
                                <Badge className={cn('text-base', getScoreColor(item.aggregatedScore))}>{item.aggregatedScore}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn(getPercentileInfo(item.percentileRank).className)}>
                                    <Trophy className="mr-2 h-4 w-4" />
                                    {getPercentileInfo(item.percentileRank).label}
                                </Badge>
                            </TableCell>
                             <TableCell>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={cn("flex items-center gap-2", trendInfo.color)}>
                                            <trendInfo.icon className="h-4 w-4" />
                                            <span className="font-medium capitalize">{trendInfo.label}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Performance trend based on recent evaluations</p></TooltipContent>
                                </Tooltip>
                             </TableCell>
                             <TableCell>
                                <Badge variant="secondary">{item.topSkill || '-'}</Badge>
                             </TableCell>
                            <TableCell>
                                <Badge variant="destructive">{item.weakestSkill || '-'}</Badge>
                            </TableCell>
                        </TableRow>
                        );
                    })
                    ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        No candidate insights available yet.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
            </TooltipProvider>
        </CardContent>
    </Card>
  );
}

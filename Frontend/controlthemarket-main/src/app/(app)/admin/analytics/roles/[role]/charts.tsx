
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell, Line, LineChart, YAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useMemo } from 'react';
import type { Submission, Evaluation, Task, Company } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, subDays, startOfDay } from 'date-fns';

// --- Types ---
interface LeaderboardProps {
    data: {
        candidateId: string;
        candidateName: string;
        score: number;
        avatarUrl?: string;
    }[];
}

// --- Chart Components ---
export const RoleStatusDistributionChart = ({ submissions }: { submissions: Submission[] }) => {
    const statusConfig = {
        shortlisted: { label: 'Shortlisted', color: 'hsl(var(--chart-1))' },
        rejected: { label: 'Rejected', color: 'hsl(var(--chart-2))' },
        pending: { label: 'Pending', color: 'hsl(var(--chart-3))' },
        'in-review': { label: 'In Review', color: 'hsl(var(--chart-4))' },
        evaluated: { label: 'Evaluated', color: 'hsl(var(--chart-5))' },
        'moved-to-next-round': { label: 'Next Round', color: 'hsl(var(--purple))' },
        assigned: { label: 'Assigned', color: 'hsl(var(--muted))' },
        'in-progress': { label: 'In Progress', color: 'hsl(var(--secondary))' },
        resubmitted: { label: 'Resubmitted', color: 'hsl(var(--warning))' },
        flagged: { label: 'Flagged', color: 'hsl(var(--destructive))'}
    };

    const chartData = useMemo(() => {
        const statusCounts = submissions.reduce((acc, sub) => {
            const statusLabel = statusConfig[sub.status as keyof typeof statusConfig]?.label || sub.status;
            acc[statusLabel] = (acc[statusLabel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
            fill: `var(--color-${status.toLowerCase().replace(/ /g, '-')})`,
        }));
    }, [submissions]);

    const chartConfig = Object.fromEntries(
        Object.entries(statusConfig).map(([, value]) => [value.label, value])
    ) as ChartConfig;
    
    return (
         <Card>
            <CardHeader>
                <CardTitle>Submission Status Distribution</CardTitle>
                <CardDescription>Current stage of all submissions in this role.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-[300px]">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="count" hideLabel />} />
                        <Pie data={chartData} dataKey="count" nameKey="status" innerRadius={60}>
                           {chartData.map((entry) => (
                                <Cell key={entry.status} fill={entry.fill} />
                            ))}
                        </Pie>
                        <ChartLegend
                            content={<ChartLegendContent nameKey="status" />}
                            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export const RoleCriteriaRadarChart = ({ evaluations }: { evaluations: Evaluation[] }) => {
    const chartData = useMemo(() => {
        if (!evaluations.length) return [];
        const criteriaTotals: { [key: string]: { total: number; count: number } } = {};

        evaluations.forEach(ev => {
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

        return Object.entries(criteriaTotals).map(([name, { total, count }]) => ({
            subject: name,
            score: Math.round((total / count)),
            fullMark: 10,
        }));
    }, [evaluations]);
    
    const chartConfig = {
        score: { label: "Avg. Score", color: "hsl(var(--primary))" },
    } satisfies ChartConfig;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Average Score by Criterion</CardTitle>
                <CardDescription>Average scores for each evaluation area in this role.</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
                <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                    <RadarChart data={chartData}>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} />
                        <Radar name="Average Score" dataKey="score" stroke="var(--color-score)" fill="var(--color-score)" fillOpacity={0.6} />
                    </RadarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export const RoleSubmissionTrendChart = ({ submissions }: { submissions: Submission[] }) => {
    const chartData = useMemo(() => {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = subDays(new Date(), i);
            return startOfDay(date);
        }).reverse();

        const submissionsByDay = last30Days.map(date => {
            const count = submissions.filter(sub => 
                sub.submittedAt && startOfDay(new Date(sub.submittedAt)).getTime() === date.getTime()
            ).length;
            return {
                date: format(date, 'MMM d'),
                count: count
            };
        });
        return submissionsByDay;
    }, [submissions]);

    const chartConfig = {
        count: { label: 'Submissions', color: 'hsl(var(--primary))' },
    } satisfies ChartConfig;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Submission Trend (Last 30 Days)</CardTitle>
                <CardDescription>Volume of submissions for this role over the past month.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <YAxis />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Line dataKey="count" type="monotone" stroke="var(--color-count)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};


export function RoleLeaderboard({ data }: LeaderboardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Performing Candidates</CardTitle>
                <CardDescription>Leaderboard of the highest-scoring candidates for this role.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Candidate</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((candidate, index) => (
                            <TableRow key={candidate.candidateId}>
                                <TableCell className="font-bold text-lg text-muted-foreground w-[50px] text-center">{index + 1}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={candidate.avatarUrl} alt={candidate.candidateName} />
                                            <AvatarFallback>{candidate.candidateName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{candidate.candidateName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-lg text-primary">{candidate.score}</TableCell>
                            </TableRow>
                        ))}
                         {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No evaluated candidates found for this role.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { useMemo } from "react";
import type { Submission, Evaluation } from "@/lib/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Types ---
interface AnalyticsChartsProps {
  submissions: Submission[];
  evaluations: Evaluation[];
}

export interface LeaderboardProps {
  data: ({
    candidateId: string;
    candidateName: string;
    score: number;
    avatarUrl?: string;
  } | null)[];
}

// --- Chart Components ---

// Bar Chart: Average score per evaluation criterion
const CriteriaScoreChart = ({ evaluations }: { evaluations: Evaluation[] }) => {
  const chartData = useMemo(() => {
    if (!evaluations.length) return [];
    const criteriaTotals: { [key: string]: { total: number; count: number } } =
      {};

    evaluations.forEach((ev) => {
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
      name,
      averageScore: Math.round((total / count) * 10), // scale to 100
    }));
  }, [evaluations]);

  const chartConfig = {
    averageScore: { label: "Avg. Score", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Score by Criterion</CardTitle>
        <CardDescription>
          Performance across different evaluation criteria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} margin={{ bottom: 40 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis domain={[0, 100]} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="averageScore"
              fill="var(--color-averageScore)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

// Pie Chart: Distribution of candidate status
const StatusDistributionChart = ({
  submissions,
}: {
  submissions: Submission[];
}) => {
  const statusConfig = {
    shortlisted: { label: "Shortlisted", color: "hsl(var(--chart-1))" },
    rejected: { label: "Rejected", color: "hsl(var(--chart-2))" },
    pending: { label: "Pending", color: "hsl(var(--chart-3))" },
    "in-review": { label: "In Review", color: "hsl(var(--chart-4))" },
    evaluated: { label: "Evaluated", color: "hsl(var(--chart-5))" },
    "moved-to-next-round": { label: "Next Round", color: "hsl(var(--purple))" },
    assigned: { label: "Assigned", color: "hsl(var(--muted))" },
    "in-progress": { label: "In Progress", color: "hsl(var(--secondary))" },
    resubmitted: { label: "Resubmitted", color: "hsl(var(--warning))" },
  };

  const chartData = useMemo(() => {
    const statusCounts = submissions.reduce((acc, sub) => {
      const statusLabel =
        statusConfig[sub.status as keyof typeof statusConfig]?.label ||
        sub.status;
      acc[statusLabel] = (acc[statusLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      fill: `var(--color-${status.toLowerCase().replace(/ /g, "-")})`,
    }));
  }, [submissions]);

  const chartConfig = Object.fromEntries(
    Object.entries(statusConfig).map(([, value]) => [value.label, value])
  ) as ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Status Distribution</CardTitle>
        <CardDescription>
          Current stage of all candidates in the pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="count" hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
            >
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
};

// Line Chart: Score Trends
const ScoreTrendChart = ({ evaluations }: { evaluations: Evaluation[] }) => {
  const chartData = useMemo(() => {
    if (evaluations.length < 2) return [];
    return evaluations
      .sort(
        (a, b) =>
          new Date(a.evaluatedAt).getTime() - new Date(b.evaluatedAt).getTime()
      )
      .map((ev, index) => ({
        name: `Eval #${index + 1}`,
        score: ev.score,
      }));
  }, [evaluations]);

  const chartConfig = {
    score: { label: "Score", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  if (chartData.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score Trend</CardTitle>
          <CardDescription>
            Not enough data to display score trends over time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">
            Requires at least 2 evaluations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation Score Trend</CardTitle>
        <CardDescription>
          Shows the scores of evaluations over time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis domain={[0, 100]} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="score"
              type="monotone"
              stroke="var(--color-score)"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

// --- Main Components ---
export function AnalyticsCharts({
  submissions,
  evaluations,
}: AnalyticsChartsProps) {
  return (
    <div className="space-y-6">
      <CriteriaScoreChart evaluations={evaluations} />
      <StatusDistributionChart submissions={submissions} />
      <ScoreTrendChart evaluations={evaluations} />
    </div>
  );
}

export function Leaderboard({ data }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
        <CardDescription>
          Leaderboard of the highest-scoring candidates.
        </CardDescription>
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
            {data
              .filter(
                (candidate): candidate is NonNullable<typeof candidate> =>
                  candidate !== null
              )
              .map((candidate, index) => (
                <TableRow key={candidate.candidateId}>
                  <TableCell className="font-bold text-lg text-muted-foreground w-[50px] text-center">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={candidate.avatarUrl}
                          alt={candidate.candidateName}
                        />
                        <AvatarFallback>
                          {candidate.candidateName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {candidate.candidateName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg text-primary">
                    {candidate.score}
                  </TableCell>
                </TableRow>
              ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No evaluated candidates found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

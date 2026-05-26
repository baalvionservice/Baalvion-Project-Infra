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
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
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
import type { Submission, Evaluation, Task, Company, User } from "@/lib/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subDays, startOfDay } from "date-fns";

// --- Types ---
interface LeaderboardProps {
  data: {
    candidateId: string;
    candidateName: string;
    score: number;
    avatarUrl?: string;
  }[];
}

interface PercentileDistributionProps {
  data: {
    tier: string;
    count: number;
  }[];
}

// --- Chart Components ---
export const GlobalStatusDistributionChart = ({
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
    flagged: { label: "Flagged", color: "hsl(var(--destructive))" },
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
        <CardTitle>Submission Status Distribution</CardTitle>
        <CardDescription>
          Current stage of all submissions platform-wide.
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

export const GlobalTasksByCompanyChart = ({
  tasks,
  companies,
}: {
  tasks: Task[];
  companies: Company[];
}) => {
  const chartData = useMemo(() => {
    const tasksPerCompany = companies.map((company) => ({
      name: company.name,
      taskCount: tasks.filter((task) => task.companyId === company.id).length,
    }));
    return tasksPerCompany.filter((c) => c.taskCount > 0);
  }, [tasks, companies]);

  const chartConfig = {
    taskCount: { label: "Tasks", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks Created by Company</CardTitle>
        <CardDescription>
          Number of tasks each company has posted.
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
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="taskCount" fill="var(--color-taskCount)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const GlobalCriteriaRadarChart = ({
  evaluations,
}: {
  evaluations: Evaluation[];
}) => {
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
      subject: name,
      score: Math.round(total / count),
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
        <CardDescription>
          Platform-wide average scores for each evaluation area.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 10]} />
            <Radar
              name="Average Score"
              dataKey="score"
              stroke="var(--color-score)"
              fill="var(--color-score)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const GlobalSubmissionTrendChart = ({
  submissions,
}: {
  submissions: Submission[];
}) => {
  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return startOfDay(date);
    }).reverse();

    const submissionsByDay = last30Days.map((date) => {
      const count = submissions.filter(
        (sub) =>
          sub.submittedAt &&
          startOfDay(new Date(sub.submittedAt)).getTime() === date.getTime()
      ).length;
      return {
        date: format(date, "MMM d"),
        count: count,
      };
    });
    return submissionsByDay;
  }, [submissions]);

  const chartConfig = {
    count: { label: "Submissions", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Trend (Last 30 Days)</CardTitle>
        <CardDescription>
          Volume of submissions over the past month.
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
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="count"
              type="monotone"
              stroke="var(--color-count)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export function GlobalLeaderboard({ data }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Candidates</CardTitle>
        <CardDescription>
          Leaderboard of the highest-scoring candidates across all tasks.
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
            {data.map((candidate, index) => (
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

export const SkillLevelDistributionChart = ({ users }: { users: User[] }) => {
  const experienceLevelConfig = {
    Beginner: { label: "Beginner", color: "hsl(var(--chart-1))" },
    Intermediate: { label: "Intermediate", color: "hsl(var(--chart-2))" },
    Advanced: { label: "Advanced", color: "hsl(var(--chart-3))" },
    Expert: { label: "Expert", color: "hsl(var(--chart-4))" },
  };

  const chartData = useMemo(() => {
    const levelCounts = users.reduce((acc, user) => {
      const level = user.profile?.experienceLevel;
      if (level) {
        acc[level] = (acc[level] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(levelCounts).map(([level, count]) => ({
      level,
      count,
      fill: `var(--color-${level.toLowerCase()})`,
    }));
  }, [users]);

  const chartConfig = Object.fromEntries(
    Object.entries(experienceLevelConfig).map(([key, value]) => [key, value])
  ) as ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Skill Level Distribution</CardTitle>
        <CardDescription>
          Distribution of self-assessed skill levels.
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
              nameKey="level"
              innerRadius={60}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.level}
                  fill={
                    chartConfig[entry.level as keyof typeof chartConfig]?.color
                  }
                />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="level" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const PercentileDistributionChart = ({
  data,
}: PercentileDistributionProps) => {
  const chartConfig = {
    count: { label: "Candidates" },
    "Top 10%": { color: "hsl(var(--chart-1))" },
    "Top 25%": { color: "hsl(var(--chart-2))" },
    "Top 50%": { color: "hsl(var(--chart-3))" },
    "Bottom 50%": { color: "hsl(var(--chart-4))" },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Percentile Rank Distribution</CardTitle>
        <CardDescription>
          How candidates are distributed across percentile tiers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: 20 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="tier"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar dataKey="count" layout="vertical" radius={4}>
              {data.map((entry) => (
                <Cell
                  key={entry.tier}
                  fill={
                    (chartConfig[entry.tier as keyof typeof chartConfig] as any)
                      ?.color || "hsl(var(--chart-1))"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const AverageScoreTrendChart = ({
  evaluations,
}: {
  evaluations: Evaluation[];
}) => {
  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return startOfDay(date);
    }).reverse();

    const scoresByDay = last30Days.map((date) => {
      const evalsOnDay = evaluations.filter(
        (ev) =>
          ev.evaluatedAt &&
          startOfDay(new Date(ev.evaluatedAt)).getTime() === date.getTime()
      );
      const averageScore =
        evalsOnDay.length > 0
          ? Math.round(
              evalsOnDay.reduce((acc, curr) => acc + curr.score, 0) /
                evalsOnDay.length
            )
          : 0;
      return {
        date: format(date, "MMM d"),
        averageScore: averageScore > 0 ? averageScore : null, // show gaps for days with no evaluations
      };
    });
    return scoresByDay;
  }, [evaluations]);

  const chartConfig = {
    averageScore: { label: "Average Score", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Score Trend (Last 30 Days)</CardTitle>
        <CardDescription>
          Average evaluation scores over the past month.
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
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis domain={[0, 100]} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              connectNulls
              dataKey="averageScore"
              type="monotone"
              stroke="var(--color-averageScore)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const ValidationStatusChart = ({
  submissions,
}: {
  submissions: Submission[];
}) => {
  const statusConfig = {
    Valid: { label: "Valid", color: "hsl(var(--chart-1))" },
    Invalid: { label: "Invalid", color: "hsl(var(--chart-2))" },
    Warning: { label: "Warning", color: "hsl(var(--chart-3))" },
    Pending: { label: "Pending", color: "hsl(var(--chart-4))" },
  };

  const chartData = useMemo(() => {
    const statusCounts = submissions.reduce((acc, sub) => {
      const status = sub.validationStatus || "Pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      fill: statusConfig[status as keyof typeof statusConfig]?.color,
    }));
  }, [submissions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation Status</CardTitle>
        <CardDescription>
          Distribution of automated validation results.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer
          config={statusConfig as ChartConfig}
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

export const TestCaseStatusChart = ({
  submissions,
}: {
  submissions: Submission[];
}) => {
  const statusConfig = {
    Passed: { label: "Passed", color: "hsl(var(--chart-1))" },
    Failed: { label: "Failed", color: "hsl(var(--chart-2))" },
    Warning: { label: "Warning", color: "hsl(var(--chart-3))" },
    Pending: { label: "Pending", color: "hsl(var(--chart-4))" },
  };

  const chartData = useMemo(() => {
    const statusCounts = submissions.reduce((acc, sub) => {
      const status = sub.testCaseStatus || "Pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      fill: statusConfig[status as keyof typeof statusConfig]?.color,
    }));
  }, [submissions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Case Status</CardTitle>
        <CardDescription>
          Distribution of backend test case results.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer
          config={statusConfig as ChartConfig}
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

export const PlagiarismRiskChart = ({
  submissions,
}: {
  submissions: Submission[];
}) => {
  const riskConfig = {
    High: { label: "High", color: "hsl(var(--chart-2))" },
    Medium: { label: "Medium", color: "hsl(var(--chart-3))" },
    Low: { label: "Low", color: "hsl(var(--chart-1))" },
    None: { label: "None", color: "hsl(var(--chart-5))" },
  };

  const chartData = useMemo(() => {
    const riskCounts = submissions.reduce((acc, sub) => {
      const risk = sub.plagiarismRisk || "None";
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(riskCounts).map(([risk, count]) => ({
      risk,
      count,
      fill: riskConfig[risk as keyof typeof riskConfig]?.color,
    }));
  }, [submissions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plagiarism Risk</CardTitle>
        <CardDescription>
          Distribution of plagiarism check results.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer
          config={riskConfig as ChartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="count" hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="risk"
              innerRadius={60}
            >
              {chartData.map((entry) => (
                <Cell key={entry.risk} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="risk" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

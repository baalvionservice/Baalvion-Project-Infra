import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Users, CheckCircle, Percent } from "lucide-react";
import { AnalyticsCharts, Leaderboard } from "./charts";
import {
  getTasksByCompany,
  getSubmissions,
  getAllEvaluations,
  getUsers,
} from "@/lib/api";
import { getScopedUserId } from "@/lib/server-auth";
import type { Submission, Evaluation } from "@/lib/types";

export default async function AnalyticsPage() {
  const allUsers = await getUsers();
  const scopedId = await getScopedUserId();
  const user =
    (scopedId && allUsers.find((u) => String(u.id) === String(scopedId))) ||
    allUsers.find((u) => u.role === "company");
  if (!user || !user.companyId) return <div>Company not found</div>;

  const tasks = await getTasksByCompany(user.companyId);
  const allSubmissions = await getSubmissions();
  const allEvaluations = await getAllEvaluations();

  const companyTaskIds = new Set(tasks.map((task) => task.id));
  const companySubmissions = allSubmissions.filter((sub) =>
    companyTaskIds.has(sub.taskId)
  );
  const companySubmissionIds = new Set(companySubmissions.map((sub) => sub.id));
  const companyEvaluations = allEvaluations.filter((evals) =>
    companySubmissionIds.has(evals.submissionId)
  );

  const evaluatedCount = companyEvaluations.length;
  const totalSubmissions = companySubmissions.filter(
    (s) => s.status !== "assigned" && s.status !== "in-progress"
  ).length;
  const completionRate =
    totalSubmissions > 0
      ? Math.round((evaluatedCount / totalSubmissions) * 100)
      : 0;

  const averageScore =
    companyEvaluations.length > 0
      ? Math.round(
          companyEvaluations.reduce((acc, curr) => acc + curr.score, 0) /
            companyEvaluations.length
        )
      : 0;

  const shortlistedCount = companySubmissions.filter(
    (s) => s.status === "shortlisted"
  ).length;

  const candidatesInCompany = allUsers.filter((u) =>
    companySubmissions.some((s) => s.userId === u.id)
  );

  const leaderboardData = candidatesInCompany
    .map((candidate) => {
      const candidateSubmissions = companySubmissions.filter(
        (s) => s.userId === candidate.id
      );
      const candidateSubmissionIds = new Set(
        candidateSubmissions.map((s) => s.id)
      );
      const candidateEvaluations = companyEvaluations.filter((ev) =>
        candidateSubmissionIds.has(ev.submissionId)
      );

      if (candidateEvaluations.length === 0) {
        return null;
      }

      const totalScore = candidateEvaluations.reduce(
        (acc, curr) => acc + curr.score,
        0
      );
      const averageScore = Math.round(totalScore / candidateEvaluations.length);

      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        score: averageScore,
        avatarUrl: candidate.profile?.avatarUrl,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => (b?.score || 0) - (a?.score || 0))
    .slice(0, 5);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Evaluation Analytics
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Evaluations Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{evaluatedCount}</div>
            <p className="text-xs text-muted-foreground">
              Total candidate submissions reviewed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{averageScore}</div>
            <p className="text-xs text-muted-foreground">
              Across all completed evaluations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Shortlisted Candidates
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{shortlistedCount}</div>
            <p className="text-xs text-muted-foreground">
              Top performers from your tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Of submissions that have been evaluated
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AnalyticsCharts
            submissions={companySubmissions}
            evaluations={companyEvaluations}
          />
        </div>
        <div className="lg:col-span-2">
          <Leaderboard data={leaderboardData} />
        </div>
      </div>
    </div>
  );
}

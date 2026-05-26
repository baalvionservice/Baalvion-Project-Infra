import {
  getCompanies,
  getSubmissions,
  getTasks,
  getUsers,
  getAllEvaluations,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Code,
  Palette,
  Megaphone,
  Database,
  Briefcase,
  Monitor,
  Server,
  Layers,
  Settings,
  Smartphone,
  PenTool,
  Image,
  Zap,
  TrendingUp,
  Search,
  FileText,
  BarChart,
  Users,
  Target,
  Building,
  Brain,
  BarChart3,
  Star,
  CheckCircle,
} from "lucide-react";
import {
  RoleStatusDistributionChart,
  RoleSubmissionTrendChart,
  RoleCriteriaRadarChart,
  RoleLeaderboard,
} from "./charts";
import type { RoleCategory } from "@/lib/types";
import { notFound } from "next/navigation";

const ROLE_ICONS: Record<RoleCategory, React.ElementType> = {
  Engineering: Code,
  Frontend: Monitor,
  Backend: Server,
  "Full Stack": Layers,
  DevOps: Settings,
  Mobile: Smartphone,
  Design: Palette,
  "UI/UX Design": PenTool,
  "Graphic Design": Image,
  "Product Design": Zap,
  "Motion Design": TrendingUp,
  Marketing: Megaphone,
  "Digital Marketing": Search,
  SEO: FileText,
  "Content Marketing": BarChart,
  "Performance Marketing": Target,
  Business: Briefcase,
  Sales: Users,
  Operations: Building,
  "Business Development": Target,
  Strategy: Brain,
  Data: Database,
  "Data Analyst": BarChart3,
  "Data Scientist": Brain,
  "Machine Learning Engineer": Brain,
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function RoleAnalyticsPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const roleName = capitalize(role) as RoleCategory;

  if (!Object.keys(ROLE_ICONS).includes(roleName)) {
    notFound();
  }

  const Icon = ROLE_ICONS[roleName];

  const [allUsers, allCompanies, allTasks, allSubmissions, allEvaluations] =
    await Promise.all([
      getUsers(),
      getCompanies(),
      getTasks(),
      getSubmissions(),
      getAllEvaluations(),
    ]);

  // Filter data for the specific role
  const roleTasks = allTasks.filter((t) => t.roleCategory === roleName);
  const roleTaskIds = new Set(roleTasks.map((t) => t.id));
  const roleSubmissions = allSubmissions.filter((s) =>
    roleTaskIds.has(s.taskId)
  );
  const roleSubmissionIds = new Set(roleSubmissions.map((s) => s.id));
  const roleEvaluations = allEvaluations.filter((e) =>
    roleSubmissionIds.has(e.submissionId)
  );

  const candidateIdsInRole = new Set(roleSubmissions.map((s) => s.userId));
  const roleCandidates = allUsers.filter((u) => candidateIdsInRole.has(u.id));

  // Calculate metrics
  const totalTasks = roleTasks.length;
  const totalSubmissions = roleSubmissions.length;
  const evaluatedCount = roleEvaluations.length;
  const averageScore =
    evaluatedCount > 0
      ? Math.round(
          roleEvaluations.reduce((acc, curr) => acc + curr.score, 0) /
            evaluatedCount
        )
      : 0;

  const leaderboardData = roleEvaluations
    .map((ev) => {
      const submission = roleSubmissions.find((s) => s.id === ev.submissionId);
      const candidate = roleCandidates.find((u) => u.id === submission?.userId);
      return {
        candidateId: candidate?.id || ev.id,
        candidateName: candidate?.name || "Unknown",
        score: ev.score,
        avatarUrl: candidate?.profile?.avatarUrl,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
            <Icon className="h-8 w-8 text-muted-foreground" />
            {roleName} Analytics
          </h2>
          <p className="text-muted-foreground">
            An overview of all activity within the {roleName} vertical.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Submissions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluations</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{evaluatedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {averageScore > 0 ? `${averageScore}%` : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <RoleSubmissionTrendChart submissions={roleSubmissions} />
          <RoleCriteriaRadarChart evaluations={roleEvaluations} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <RoleStatusDistributionChart submissions={roleSubmissions} />
          <RoleLeaderboard data={leaderboardData} />
        </div>
      </div>
    </div>
  );
}

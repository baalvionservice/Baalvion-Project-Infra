import {
  getTasksByCompany,
  getSubmissions,
  getAllEvaluations,
  getUsers,
  getCompany,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  Briefcase,
  PlusCircle,
  Clock,
  Star,
  Monitor,
  Users,
  XCircle,
  FileCheck,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { TopCandidates } from "./top-candidates";
import type { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// For prototype, we'll use a hardcoded user ID. In a real app, this would come from auth.
const CURRENT_USER_ID = "user-2";

export default async function CompanyDashboard() {
  const allUsers = await getUsers();
  const user = allUsers.find((u) => u.id === CURRENT_USER_ID);
  if (!user || !user.companyId) return <div>Company not found</div>;

  const [company, tasks, allSubmissions, allEvaluations] = await Promise.all([
    getCompany(user.companyId),
    getTasksByCompany(user.companyId),
    getSubmissions(),
    getAllEvaluations(),
  ]);

  const companyTaskIds = new Set(tasks.map((task) => task.id));
  const usersMap = new Map(allUsers.map((u) => [u.id, u]));
  const tasksMap = new Map(tasks.map((t) => [t.id, t]));

  const companySubmissions = allSubmissions.filter((sub) =>
    companyTaskIds.has(sub.taskId)
  );
  const companySubmissionIds = new Set(companySubmissions.map((s) => s.id));
  const companyEvaluations = allEvaluations.filter((ev) =>
    companySubmissionIds.has(ev.submissionId)
  );

  // Metrics calculation
  const publishedTasksCount = tasks.filter(
    (t) => t.status === "published"
  ).length;
  const pendingReviewCount = companySubmissions.filter((s) =>
    ["pending", "in-review", "resubmitted"].includes(s.status)
  ).length;
  const shortlistedCount = companySubmissions.filter(
    (s) => s.status === "shortlisted"
  ).length;
  const evaluatedCount = companyEvaluations.length;

  const submissionsWithDetails = companySubmissions
    .filter((s) => ["pending", "in-review", "resubmitted"].includes(s.status))
    .sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )
    .slice(0, 5)
    .map((submission) => {
      const task = tasksMap.get(submission.taskId);
      const candidate = usersMap.get(submission.userId);
      return { ...submission, task, candidate };
    });

  // Calculate top candidates
  const candidatesInCompany = allUsers.filter((u) =>
    companySubmissions.some((s) => s.userId === u.id)
  );

  const topCandidates = candidatesInCompany
    .map((candidate) => {
      const candidateSubmissions = companySubmissions.filter(
        (s) => s.userId === candidate.id
      );
      const candidateSubmissionIds = new Set(
        candidateSubmissions.map((s) => s.id)
      );
      const evaluations = companyEvaluations.filter((ev) =>
        candidateSubmissionIds.has(ev.submissionId)
      );

      if (evaluations.length === 0) {
        return null;
      }

      const totalScore = evaluations.reduce((acc, curr) => acc + curr.score, 0);
      const averageScore = Math.round(totalScore / evaluations.length);

      return {
        candidate,
        score: averageScore,
      };
    })
    .filter((c): c is { candidate: User; score: number } => c !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-start justify-between space-y-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 hidden sm:flex">
            <AvatarImage src={company?.logoUrl} />
            <AvatarFallback>{company?.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-headline text-3xl font-bold tracking-tight">
                {company?.name || "Company"} Dashboard
              </h2>
              {company?.isVerified && (
                <Badge
                  variant="default"
                  className="gap-1.5 pl-2 pr-3 text-base"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Manage your company's tasks, review submissions, and track
              candidate performance.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/company/tasks/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Task
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Published Tasks
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{publishedTasksCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{pendingReviewCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Shortlisted Candidates
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{shortlistedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Evaluations Completed
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{evaluatedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,300px] gap-6">
        <Card className="grid overflow-x-auto">
          <CardHeader>
            <CardTitle>Action Required: Pending Reviews</CardTitle>
            <CardDescription>
              The newest submissions awaiting your evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissionsWithDetails.length > 0 ? (
                  submissionsWithDetails.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.candidate?.name}
                      </TableCell>
                      <TableCell>{sub.task?.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sub.status === "resubmitted"
                              ? "warning"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {sub.status.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/company/submissions/${sub.id}`}>
                            Review <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No submissions are currently awaiting review.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div>
          <TopCandidates candidates={topCandidates} />
        </div>
      </div>
    </div>
  );
}

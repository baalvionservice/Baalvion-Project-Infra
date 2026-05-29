import {
  getSubmissions,
  getUsers,
  getTasksByCompany,
  getAllEvaluations,
} from "@/lib/api";
import { getScopedUserId } from "@/lib/server-auth";
import { CompanySubmissionsList } from "./submission-list";
import type {
  Submission,
  Task,
  User,
  Evaluation,
  RoleCategory,
  LiveSessionStatus,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Clock, CheckCircle, Star, XCircle } from "lucide-react";

export type EvaluationData = {
  id: string; // submissionId
  candidate: User;
  task: {
    id: string;
    title: string;
    roleCategory: RoleCategory;
    multiRound?: boolean;
    timeLimitMinutes?: number;
  };
  status: Submission["status"];
  liveSessionStatus?: LiveSessionStatus;
  skillMatchResult?: Submission["skillMatchResult"];
  score?: number;
  applicationDate: string;
  timeSpentMinutes?: number;
};

export default async function CompanySubmissionsPage() {
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
  const companySubmissions = allSubmissions.filter(
    (sub) =>
      companyTaskIds.has(sub.taskId) &&
      sub.status !== "assigned" &&
      sub.status !== "in-progress"
  );

  const evaluationData: EvaluationData[] = companySubmissions
    .map((submission) => {
      const candidate = allUsers.find((u) => u.id === submission.userId);
      const task = tasks.find((t) => t.id === submission.taskId);
      const evaluation = allEvaluations.find(
        (e) => e.submissionId === submission.id
      );

      if (!candidate || !task) return null;

      return {
        id: submission.id,
        candidate: candidate,
        task: {
          id: task.id,
          title: task.title,
          roleCategory: task.roleCategory,
          multiRound: task.multiRound,
          timeLimitMinutes: task.timeLimitMinutes,
        },
        status: submission.status,
        liveSessionStatus: submission.liveSessionStatus,
        skillMatchResult: submission.skillMatchResult,
        score: evaluation?.score,
        applicationDate: submission.submittedAt || submission.assignedAt,
        timeSpentMinutes: submission.timeSpentMinutes,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const totalCandidates = new Set(evaluationData.map((e) => e.candidate.id))
    .size;
  const pending = evaluationData.filter(
    (e) =>
      e.status === "pending" ||
      e.status === "in-review" ||
      e.status === "resubmitted"
  ).length;
  const completed = evaluationData.filter(
    (e) =>
      e.status === "evaluated" ||
      e.status === "shortlisted" ||
      e.status === "rejected" ||
      e.status === "moved-to-next-round"
  ).length;
  const shortlisted = evaluationData.filter(
    (e) => e.status === "shortlisted"
  ).length;
  const rejected = evaluationData.filter((e) => e.status === "rejected").length;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Candidate Submissions
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Candidates
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Evaluations
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Evaluations
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shortlisted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Pipeline</CardTitle>
          <CardDescription>
            Review and evaluate all candidates assigned to your company's tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanySubmissionsList data={evaluationData} />
        </CardContent>
      </Card>
    </div>
  );
}

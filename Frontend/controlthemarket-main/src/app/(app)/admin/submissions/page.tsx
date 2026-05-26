import {
  getSubmissions,
  getUsers,
  getTasks,
  getCompanies,
  getAllEvaluations,
} from "@/lib/api";
import { AdminSubmissionsList } from "./submission-list";
import type { Submission, Task, User, Evaluation, Company } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type AdminSubmissionData = {
  id: string; // submissionId
  candidate: User;
  task: Task;
  company: Company;
  status: Submission["status"];
  validationStatus?: Submission["validationStatus"];
  score?: number;
  autoScore?: number;
  autoScoringStatus?: Submission["autoScoringStatus"];
  applicationDate: string;
};

export default async function AdminSubmissionsPage() {
  const [allSubmissions, allUsers, allTasks, allCompanies, allEvaluations] =
    await Promise.all([
      getSubmissions(),
      getUsers(),
      getTasks(),
      getCompanies(),
      getAllEvaluations(),
    ]);

  const evaluationData: AdminSubmissionData[] = allSubmissions
    .map((submission) => {
      const candidate = allUsers.find((u) => u.id === submission.userId);
      const task = allTasks.find((t) => t.id === submission.taskId);
      const company = allCompanies.find((c) => c.id === submission.companyId);
      const evaluation = allEvaluations.find(
        (e) => e.submissionId === submission.id
      );

      if (!candidate || !task || !company) return null;

      return {
        id: submission.id,
        candidate: candidate,
        task: task,
        company: company,
        status: submission.status,
        validationStatus: submission.validationStatus,
        score: evaluation?.score,
        autoScore: submission.autoScore,
        autoScoringStatus: submission.autoScoringStatus,
        applicationDate: submission.submittedAt || submission.assignedAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Global Submissions
          </h2>
          <p className="text-muted-foreground">
            View, manage, and override all submissions across the platform.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Candidate Submissions</CardTitle>
          <CardDescription>
            Use the filters to narrow down the list and perform bulk actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminSubmissionsList data={evaluationData} />
        </CardContent>
      </Card>
    </div>
  );
}

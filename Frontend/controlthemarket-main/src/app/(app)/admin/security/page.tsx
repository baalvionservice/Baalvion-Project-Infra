import { getSubmissions, getUsers, getTasks, getCompanies } from "@/lib/api";
import { AdminSecurityList } from "./security-list";
import type {
  Submission,
  Task,
  User,
  Company,
  PlagiarismRisk,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type SecurityDashboardData = {
  id: string; // submissionId
  candidate: User;
  task: Task;
  company: Company;
  status: Submission["status"];
  plagiarismRisk?: PlagiarismRisk;
  applicationDate: string;
};

export default async function AdminSecurityPage() {
  const [allSubmissions, allUsers, allTasks, allCompanies] = await Promise.all([
    getSubmissions(),
    getUsers(),
    getTasks(),
    getCompanies(),
  ]);

  const securityData: SecurityDashboardData[] = allSubmissions
    .map((submission) => {
      const candidate = allUsers.find((u) => u.id === submission.userId);
      const task = allTasks.find((t) => t.id === submission.taskId);
      const company = allCompanies.find((c) => c.id === submission.companyId);

      if (!candidate || !task || !company) return null;

      return {
        id: submission.id,
        candidate: candidate,
        task: task,
        company: company,
        status: submission.status,
        plagiarismRisk: submission.plagiarismRisk,
        applicationDate: submission.submittedAt || submission.assignedAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Security & Anti-Cheating
          </h2>
          <p className="text-muted-foreground">
            Monitor submissions for potential academic dishonesty.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Suspicious Submissions</CardTitle>
          <CardDescription>
            Review submissions flagged by the automated anti-cheating system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminSecurityList data={securityData} />
        </CardContent>
      </Card>
    </div>
  );
}

import { getSubmissions, getUsers, getTasks, getCompanies } from "@/lib/api";
import { AutomationDashboard } from "./automation-dashboard";
import type { Submission, Task, User, Company } from "@/lib/types";

export type AutomatedSubmission = {
  id: string;
  candidateName: string;
  candidateAvatar?: string;
  taskTitle: string;
  companyName: string;
  autoScore?: number;
  validationStatus?: Submission["validationStatus"];
  testCaseStatus?: Submission["testCaseStatus"];
  processedAt: string;
};

export default async function EvaluationAutomationPage() {
  const [allSubmissions, allUsers, allTasks, allCompanies] = await Promise.all([
    getSubmissions(),
    getUsers(),
    getTasks(),
    getCompanies(),
  ]);

  const automatedSubmissions: AutomatedSubmission[] = allSubmissions
    .filter(
      (s) =>
        s.autoScoringStatus === "Completed" || s.autoScoringStatus === "Failed"
    )
    .map((submission) => {
      const candidate = allUsers.find((u) => u.id === submission.userId);
      const task = allTasks.find((t) => t.id === submission.taskId);
      const company = allCompanies.find((c) => c.id === submission.companyId);

      if (!candidate || !task || !company) return null;

      return {
        id: submission.id,
        candidateName: candidate.name,
        candidateAvatar: candidate.profile?.avatarUrl,
        taskTitle: task.title,
        companyName: company.name,
        autoScore: submission.autoScore,
        validationStatus: submission.validationStatus,
        testCaseStatus: submission.testCaseStatus,
        processedAt: submission.lastUpdated,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort(
      (a, b) =>
        new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
    );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Evaluation Automation Hub
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage all automated evaluation processes.
          </p>
        </div>
      </div>
      <AutomationDashboard submissions={automatedSubmissions} />
    </div>
  );
}

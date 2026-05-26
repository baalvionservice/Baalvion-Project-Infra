import { getSubmissions, getUsers, getTasks, getCompanies } from "@/lib/api";
import { TestCaseList } from "./test-case-list";
import type {
  Submission,
  Task,
  User,
  Company,
  TestCaseStatus,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type SubmissionWithTestData = {
  id: string; // submissionId
  candidate: User;
  task: Task;
  company: Company;
  status: Submission["status"];
  testCaseStatus?: TestCaseStatus;
  submittedAt: string;
};

export default async function BackendTestingDashboardPage() {
  const [allSubmissions, allUsers, allTasks, allCompanies] = await Promise.all([
    getSubmissions(),
    getUsers(),
    getTasks(),
    getCompanies(),
  ]);

  const testData: SubmissionWithTestData[] = allSubmissions
    .map((submission) => {
      const candidate = allUsers.find((u) => u.id === submission.userId);
      const task = allTasks.find((t) => t.id === submission.taskId);
      const company = allCompanies.find((c) => c.id === submission.companyId);

      if (!candidate || !task || !company || !submission.submittedAt)
        return null;

      return {
        id: submission.id,
        candidate: candidate,
        task: task,
        company: company,
        status: submission.status,
        testCaseStatus: submission.testCaseStatus,
        submittedAt: submission.submittedAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Backend Testing
          </h2>
          <p className="text-muted-foreground">
            Overview of automated backend test case results across all
            submissions.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>API Test Results</CardTitle>
          <CardDescription>
            Filter submissions by their overall API test case status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestCaseList data={testData} />
        </CardContent>
      </Card>
    </div>
  );
}

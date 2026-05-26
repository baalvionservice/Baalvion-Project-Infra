import {
  getSubmissions,
  getUsers,
  getTasksByCompany,
  getAllEvaluations,
} from "@/lib/api";
import { FeedbackList } from "./feedback-list";
import type {
  Submission,
  Task,
  User,
  Evaluation,
  RoleCategory,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// For prototype, we'll use a hardcoded user ID. In a real app, this would come from auth.
const CURRENT_USER_ID = "user-2";

export type FeedbackData = {
  submissionId: string;
  candidate: User;
  task: {
    id: string;
    title: string;
    roleCategory: RoleCategory;
  };
  score?: number;
  feedbackStatus: "Pending" | "Draft" | "Completed";
  evaluationDate: string;
};

export default async function FeedbackDashboardPage() {
  const allUsers = await getUsers();
  const user = allUsers.find((u) => u.id === CURRENT_USER_ID);
  if (!user || !user.companyId) return <div>Company not found</div>;

  const [tasks, allSubmissions, allEvaluations] = await Promise.all([
    getTasksByCompany(user.companyId),
    getSubmissions(),
    getAllEvaluations(),
  ]);

  const companyTaskIds = new Set(tasks.map((task) => task.id));

  const evaluatedSubmissions = allSubmissions.filter(
    (sub) =>
      companyTaskIds.has(sub.taskId) &&
      ["evaluated", "shortlisted", "rejected"].includes(sub.status)
  );

  const feedbackData: FeedbackData[] = evaluatedSubmissions
    .map((submission) => {
      const candidate = allUsers.find((u) => u.id === submission.userId);
      const task = tasks.find((t) => t.id === submission.taskId);
      const evaluation = allEvaluations.find(
        (e) => e.submissionId === submission.id
      );

      if (!candidate || !task || !evaluation) return null;

      let feedbackStatus: "Pending" | "Draft" | "Completed" = "Pending";
      if (
        evaluation.criteriaComments &&
        Object.keys(evaluation.criteriaComments).length > 0
      ) {
        feedbackStatus = "Completed"; // Simple mock logic: if comments exist, it's completed
      }

      return {
        submissionId: submission.id,
        candidate: candidate,
        task: {
          id: task.id,
          title: task.title,
          roleCategory: task.roleCategory,
        },
        score: evaluation?.score,
        feedbackStatus,
        evaluationDate: evaluation.evaluatedAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Candidate Feedback
          </h2>
          <p className="text-muted-foreground">
            Provide detailed, criteria-based feedback to your candidates.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Evaluated Candidates</CardTitle>
          <CardDescription>
            Select a candidate to provide or edit their detailed feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackList data={feedbackData} />
        </CardContent>
      </Card>
    </div>
  );
}

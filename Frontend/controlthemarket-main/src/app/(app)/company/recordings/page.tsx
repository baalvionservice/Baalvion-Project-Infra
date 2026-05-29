import { getSubmissions, getUsers, getTasksByCompany } from "@/lib/api";
import { getScopedUserId } from "@/lib/server-auth";
import { RecordingList } from "./recording-list";
import type { Submission, Task, User, Company } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type RecordingDashboardData = {
  id: string; // submissionId
  candidate: User;
  task: Task;
  recordingStatus?: Submission["recordingStatus"];
  submittedAt: string;
};

export default async function CompanySessionRecordingsPage() {
  const allUsers = await getUsers();
  const scopedId = await getScopedUserId();
  const user =
    (scopedId && allUsers.find((u) => String(u.id) === String(scopedId))) ||
    allUsers.find((u) => u.role === "company");
  if (!user || !user.companyId) return <div>Company not found</div>;

  const [allSubmissions, allTasks] = await Promise.all([
    getSubmissions(),
    getTasksByCompany(user.companyId),
  ]);

  const recordingData: RecordingDashboardData[] = allSubmissions
    .map((submission) => {
      const candidate = allUsers.find((u) => u.id === submission.userId);
      const task = allTasks.find((t) => t.id === submission.taskId);

      if (!candidate || !task || !submission.submittedAt) return null;

      return {
        id: submission.id,
        candidate: candidate,
        task: task,
        recordingStatus: submission.recordingStatus,
        submittedAt: submission.submittedAt,
      };
    })
    .filter(
      (item): item is NonNullable<typeof item> =>
        item !== null && item.recordingStatus === "Completed"
    );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Session Recordings
          </h2>
          <p className="text-muted-foreground">
            Review recorded candidate sessions for evaluation and anti-cheating
            purposes.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Recorded Sessions</CardTitle>
          <CardDescription>
            Filter submissions to find specific session recordings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecordingList data={recordingData} />
        </CardContent>
      </Card>
    </div>
  );
}


import { getSubmissions, getUsers, getTasks } from "@/lib/api";
import { LiveSessionGrid } from "./live-session-list";
import type { Submission, Task, User, LiveSessionStatus } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type LiveSessionData = {
  submissionId: string;
  candidate: User;
  task: Task;
  status: LiveSessionStatus;
  lastActivity: string;
};

export default async function LiveSessionDashboardPage() {
  const [
    allSubmissions,
    allUsers,
    allTasks,
  ] = await Promise.all([
    getSubmissions(),
    getUsers(),
    getTasks(),
  ]);

  const sessionData: LiveSessionData[] = allSubmissions
    .map(submission => {
        const candidate = allUsers.find(u => u.id === submission.userId);
        const task = allTasks.find(t => t.id === submission.taskId);

        if (!candidate || !task) return null;

        return {
            submissionId: submission.id,
            candidate: candidate,
            task: task,
            status: submission.liveSessionStatus || 'Not Started',
            lastActivity: submission.lastUpdated,
        };
    })
    .filter((item): item is LiveSessionData => item !== null);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
         <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Live Session Monitoring
            </h2>
            <p className="text-muted-foreground">
                Monitor and manage all active, paused, and scheduled candidate sessions.
            </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Session Dashboard</CardTitle>
            <CardDescription>
                An overview of all live screen sharing sessions on the platform.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <LiveSessionGrid initialData={sessionData} />
        </CardContent>
      </Card>
    </div>
  );
}

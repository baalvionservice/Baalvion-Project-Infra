

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

// For prototype, we'll use a hardcoded user ID. In a real app, this would come from auth.
const CURRENT_USER_ID = 'user-2';

export type LiveSessionData = {
  submissionId: string;
  candidate: User;
  task: Task;
  status: LiveSessionStatus;
  lastActivity: string;
};

export default async function CompanyLiveSessionDashboardPage() {
  const [
    allSubmissions,
    allUsers,
    allTasks,
  ] = await Promise.all([
    getSubmissions(),
    getUsers(),
    getTasks(),
  ]);

  const user = allUsers.find((u) => u.id === CURRENT_USER_ID);
  if (!user || !user.companyId) return <div>Company not found</div>;

  const sessionData: LiveSessionData[] = allSubmissions
    .map(submission => {
        const candidate = allUsers.find(u => u.id === submission.userId);
        // For company, we only show tasks from this company
        const task = allTasks.find(t => t.id === submission.taskId && t.companyId === user?.companyId);

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
                Monitor and manage active candidate sessions for your company's tasks.
            </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Session Dashboard</CardTitle>
            <CardDescription>
                An overview of all live screen sharing sessions.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <LiveSessionGrid initialData={sessionData} />
        </CardContent>
      </Card>
    </div>
  );
}

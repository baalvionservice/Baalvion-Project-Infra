
import { getSubmissions, getUsers, getTasks } from "@/lib/api";
import { ExecutionList } from "./execution-list";
import type { Submission, Task, User, SandboxStatus } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type SandboxSessionData = {
  submissionId: string;
  candidate: User;
  task: Task;
  status: SandboxStatus;
  lastActivity: string;
};

export default async function ExecutionEnvironmentPage() {
  const [
    allSubmissions,
    allUsers,
    allTasks,
  ] = await Promise.all([
    getSubmissions(),
    getUsers(),
    getTasks(),
  ]);

  const sessionData: SandboxSessionData[] = allSubmissions
    .map(submission => {
        const candidate = allUsers.find(u => u.id === submission.userId);
        const task = allTasks.find(t => t.id === submission.taskId);

        if (!candidate || !task) return null;

        return {
            submissionId: submission.id,
            candidate: candidate,
            task: task,
            status: submission.sandboxStatus || 'Not Started',
            lastActivity: submission.lastUpdated,
        };
    })
    .filter((item): item is SandboxSessionData => item !== null);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
         <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Sandbox Execution Environment
            </h2>
            <p className="text-muted-foreground">
                Monitor and manage secure execution environments for candidate submissions.
            </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Sandbox Sessions</CardTitle>
            <CardDescription>
                An overview of all active and inactive sandbox sessions.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ExecutionList initialData={sessionData} />
        </CardContent>
      </Card>
    </div>
  );
}

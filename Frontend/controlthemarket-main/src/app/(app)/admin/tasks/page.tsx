
import { getTasks, getSubmissions, getCompanies } from "@/lib/api";
import { AdminTaskList } from "./task-list";
import type { TaskWithDetails } from './task-list';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ManageTasksPage() {
  const tasks = await getTasks();
  const submissions = await getSubmissions();
  const companies = await getCompanies();

  const tasksWithDetails: TaskWithDetails[] = tasks.map(task => {
    const company = companies.find(c => c.id === task.companyId);
    return {
        ...task,
        submissionCount: submissions.filter(sub => sub.taskId === task.id).length,
        companyName: company?.name || "N/A"
    }
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
            Manage All Tasks
            </h2>
            <p className="text-muted-foreground">
                View, edit, and manage all tasks across the platform.
            </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>All Platform Tasks</CardTitle>
            <CardDescription>
                Use the filters to find specific tasks and perform actions.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <AdminTaskList tasks={tasksWithDetails} />
        </CardContent>
      </Card>
    </div>
  );
}

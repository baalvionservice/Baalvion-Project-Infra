

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { getTasksByCompany, getSubmissions, getUsers } from "@/lib/api";
import { CompanyTaskList } from "./task-list";
import type { TaskWithSubmissionCount } from './task-list';

export default async function ManageTasksPage() {
  // In a real app, user would be derived from session.
  // We are mocking getting the current user, then their tasks.
  const allUsers = await getUsers();
  const currentUser = allUsers.find(u => u.role === 'company');
  if (!currentUser || !currentUser.companyId) {
    // Handle case where no company user is found or they have no company
    return <div>Could not load company tasks. User not found or not associated with a company.</div>;
  }
  
  const tasks = await getTasksByCompany(currentUser.companyId);
  const submissions = await getSubmissions();

  const tasksWithSubmissionCount: TaskWithSubmissionCount[] = tasks.map(task => ({
    ...task,
    submissionCount: submissions.filter(sub => sub.taskId === task.id).length
  }));

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Manage Tasks
        </h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/company/tasks/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Task
            </Link>
          </Button>
        </div>
      </div>
      <CompanyTaskList tasks={tasksWithSubmissionCount} />
    </div>
  );
}

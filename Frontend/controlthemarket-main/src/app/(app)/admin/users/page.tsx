
import { getUsers, getSubmissions, getTasks, getCompanies } from "@/lib/api";
import { AdminUsersList } from "./user-list";
import type { User, Company, Submission, Task } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type AdminUserData = User & {
  taskCount: number;
  submissionCount: number;
  companyName?: string;
};

export default async function ManageUsersPage() {
  const [allUsers, allSubmissions, allTasks, allCompanies] = await Promise.all([
    getUsers(),
    getSubmissions(),
    getTasks(),
    getCompanies(),
  ]);

  const userData: AdminUserData[] = allUsers.map(user => {
    let taskCount = 0;
    let submissionCount = 0;

    if (user.role === 'candidate') {
      submissionCount = allSubmissions.filter(sub => sub.userId === user.id).length;
    } else if (user.role === 'company' && user.companyId) {
      taskCount = allTasks.filter(task => task.companyId === user.companyId).length;
    }

    return {
      ...user,
      taskCount,
      submissionCount,
      companyName: user.companyId ? allCompanies.find(c => c.id === user.companyId)?.name : undefined,
    };
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Manage Users
          </h2>
          <p className="text-muted-foreground">
            View, edit, and manage all users on the platform.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Platform Users</CardTitle>
          <CardDescription>
            Use the filters to find specific users and perform actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUsersList initialData={userData} />
        </CardContent>
      </Card>
    </div>
  );
}

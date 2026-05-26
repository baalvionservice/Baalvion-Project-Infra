
import { getCompanies, getSubmissions, getTasks, getUsers } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Users, Building, Briefcase, FileText } from "lucide-react";
import { AdminCompanyOverview } from "./company-overview";
import type { AdminCompanyData } from '../companies/page';

export default async function AdminDashboard() {
  const [users, companies, tasks, submissions] = await Promise.all([
      getUsers(),
      getCompanies(),
      getTasks(),
      getSubmissions(),
  ]);

  const companyData: AdminCompanyData[] = companies.map(company => {
    const owner = users.find(u => u.id === company.ownerId);
    
    return {
      ...company,
      userCount: users.filter(user => user.companyId === company.id).length,
      taskCount: tasks.filter(task => task.companyId === company.id).length,
      submissionCount: submissions.filter(sub => sub.companyId === company.id).length,
      ownerName: owner?.name || 'N/A',
    };
  });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Admin Dashboard
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Companies
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Submissions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Multi-Company Overview</CardTitle>
          <CardDescription>A summary of all tenants on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminCompanyOverview data={companyData} />
        </CardContent>
      </Card>
    </div>
  );
}


import { getTeams, getUsers, getTasks, getCompanies, getSubmissions } from "@/lib/api";
import { AdminTeamList } from "./team-list";
import type { Team, User, Task, Company } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export type AdminTeamData = Team & {
  company: Company;
  members: User[];
  lead: User;
  taskCount: number;
  submissionCount: number;
};

export default async function ManageTeamsPage() {
  const [allTeams, allUsers, allTasks, allCompanies, allSubmissions] = await Promise.all([
    getTeams(),
    getUsers(),
    getTasks(),
    getCompanies(),
    getSubmissions()
  ]);

  const teamData: AdminTeamData[] = allTeams.map(team => {
    const company = allCompanies.find(c => c.id === team.companyId)!;
    const members = allUsers.filter(u => team.memberIds.includes(u.id));
    const lead = allUsers.find(u => u.id === team.leadId)!;
    
    // Mock: assume tasks can be assigned to teams. In a real app, this relation would exist.
    // For now, let's just assign some tasks to teams for display purposes.
    const teamTasks = allTasks.filter(t => t.companyId === team.companyId);
    const teamTaskIds = new Set(teamTasks.map(t => t.id));
    const submissionCount = allSubmissions.filter(s => teamTaskIds.has(s.taskId)).length;


    return {
      ...team,
      company,
      members,
      lead,
      taskCount: teamTasks.length,
      submissionCount,
    };
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Team Collaboration
          </h2>
          <p className="text-muted-foreground">
            Manage and monitor all teams on the platform.
          </p>
        </div>
         <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Team
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Platform Teams</CardTitle>
          <CardDescription>
            An overview of all teams and their activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTeamList initialData={teamData} />
        </CardContent>
      </Card>
    </div>
  );
}


import { getActivityLogs, getUsers, getTasks, getCompanies } from "@/lib/api";
import { ActivityList } from "./activity-list";
import type { Activity, User, Task, Company } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ActivityWithDetails = Activity & {
  performer?: User;
  targetEntityData?: Task | User | Company;
};

export default async function ActivityLogsPage() {
  const [
    allActivities,
    allUsers,
    allTasks,
    allCompanies,
  ] = await Promise.all([
    getActivityLogs(),
    getUsers(),
    getTasks(),
    getCompanies(),
  ]);

  const entityMaps = {
    User: new Map(allUsers.map(u => [u.id, u])),
    Company: new Map(allCompanies.map(c => [c.id, c])),
    Task: new Map(allTasks.map(t => [t.id, t])),
    Submission: new Map(), // Submissions don't have a simple name to map
  };

  const activityData: ActivityWithDetails[] = allActivities.map(activity => {
    const performer = allUsers.find(u => u.id === activity.performerId);
    let targetEntityData;
    if (activity.targetEntity.type !== 'Submission') {
      targetEntityData = entityMaps[activity.targetEntity.type].get(activity.targetEntity.id);
    }
    
    // Enrich targetEntity with name if available
    const finalTargetEntity = {
      ...activity.targetEntity,
      name: targetEntityData?.name || activity.targetEntity.name,
    };

    return {
      ...activity,
      performer,
      targetEntity: finalTargetEntity,
      targetEntityData
    };
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
         <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Real-Time Monitoring
            </h2>
            <p className="text-muted-foreground">
                Monitor a live feed of all significant actions occurring across the platform.
            </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Live Activity Stream</CardTitle>
            <CardDescription>
                A real-time feed of user actions, system events, and administrative changes.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ActivityList data={activityData} />
        </CardContent>
      </Card>
    </div>
  );
}

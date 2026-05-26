
import { getIntegrationLogs, getUsers, getTasks, getSubmissions, getCompanies } from "@/lib/api";
import { IntegrationLogList } from "./log-list";
import type { IntegrationLog, User, Task, Company, Submission } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type IntegrationLogWithDetails = IntegrationLog & {
  relatedEntityData?: Task | User | Company | Submission;
};

export default async function IntegrationLogsPage() {
  const [
    allLogs,
    allUsers,
    allTasks,
    allSubmissions,
    allCompanies,
  ] = await Promise.all([
    getIntegrationLogs(),
    getUsers(),
    getTasks(),
    getSubmissions(),
    getCompanies(),
  ]);

  const entityMaps = {
    User: new Map(allUsers.map(u => [u.id, u])),
    Company: new Map(allCompanies.map(c => [c.id, c])),
    Task: new Map(allTasks.map(t => [t.id, t])),
    Submission: new Map(allSubmissions.map(s => [s.id, s])),
    System: new Map(),
  };

  const logData: IntegrationLogWithDetails[] = allLogs.map(log => {
    let relatedEntityData;
    if (log.relatedEntity.type !== 'System') {
      relatedEntityData = entityMaps[log.relatedEntity.type]?.get(log.relatedEntity.id);
    }
    
    // Enrich targetEntity with name if available
    const finalRelatedEntity = {
      ...log.relatedEntity,
      name: (relatedEntityData as any)?.name || log.relatedEntity.name,
    };

    return {
      ...log,
      relatedEntity: finalRelatedEntity,
      relatedEntityData,
    };
  });


  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
         <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Integration Logs
            </h2>
            <p className="text-muted-foreground">
                Monitor events and data flow from all third-party integrations.
            </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Live Integration Feed</CardTitle>
            <CardDescription>
                A real-time feed of all webhook, API, and integration events.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <IntegrationLogList data={logData} />
        </CardContent>
      </Card>
    </div>
  );
}

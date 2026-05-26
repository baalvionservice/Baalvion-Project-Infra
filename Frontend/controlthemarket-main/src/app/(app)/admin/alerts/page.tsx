
import { getNotifications, getUsers, getTasks, getCompanies, getSubmissions } from "@/lib/api";
import { NotificationList } from "./alert-list";
import type { Notification, User, Task, Company, Submission } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type NotificationWithDetails = Notification & {
  relatedEntityData?: User | Company | Task | Submission | { id: string; name?: string };
};

export default async function NotificationsPage() {
  const [
    allNotifications,
    allUsers,
    allTasks,
    allCompanies,
    allSubmissions
  ] = await Promise.all([
    getNotifications(),
    getUsers(),
    getTasks(),
    getCompanies(),
    getSubmissions()
  ]);

  const entityMaps = {
    User: new Map(allUsers.map(u => [u.id, u])),
    Company: new Map(allCompanies.map(c => [c.id, c])),
    Task: new Map(allTasks.map(t => [t.id, t])),
    Submission: new Map(allSubmissions.map(s => [s.id, s])),
    System: new Map(),
  };

  const notificationData: NotificationWithDetails[] = allNotifications.map(notification => {
    let relatedEntityData;
    if (notification.relatedEntity.type !== 'System') {
      relatedEntityData = entityMaps[notification.relatedEntity.type]?.get(notification.relatedEntity.id);
    } else {
      relatedEntityData = { id: notification.relatedEntity.id, name: notification.relatedEntity.name };
    }
    
    return {
      ...notification,
      relatedEntityData,
    };
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
         <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Activity Notification Center
            </h2>
            <p className="text-muted-foreground">
                Monitor all system and integration activity notifications.
            </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>
                A real-time feed of user actions, system events, and integration alerts.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <NotificationList initialData={notificationData} />
        </CardContent>
      </Card>
    </div>
  );
}

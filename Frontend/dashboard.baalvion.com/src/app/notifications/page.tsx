"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  DollarSign,
  Settings,
  Users,
  CheckCircle,
  Bell,
  Mail,
  Smartphone,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { dashboardApi } from "@/lib/api-client";
import type { Notification, NotificationType } from "@/lib/types";

// Map live notification types (info/success/warning/error) to the page's display categories.
const TYPE_MAP: Record<string, NotificationType> = {
  warning: "Alert", error: "Alert", success: "Finance", info: "System", team: "Team",
};
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const notificationIcons: Record<NotificationType, React.ElementType> = {
  Alert: AlertTriangle,
  Finance: DollarSign,
  System: Settings,
  Team: Users,
};

const notificationColors: Record<NotificationType, string> = {
  Alert: "text-red-500 bg-red-100 dark:bg-red-950",
  Finance: "text-green-500 bg-green-100 dark:bg-green-950",
  System: "text-blue-500 bg-blue-100 dark:bg-blue-950",
  Team: "text-purple-500 bg-purple-100 dark:bg-purple-950",
};

type FilterType = "All" | "Unread" | NotificationType;

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<FilterType>("All");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.notifications();
        const arr = ((d as { data?: unknown[] })?.data ?? (Array.isArray(d) ? d : [])) as Record<string, unknown>[];
        if (cancelled) return;
        setNotifications(arr.map((n) => ({
          id: String(n.id),
          title: String(n.title ?? ""),
          description: String(n.message ?? n.description ?? ""),
          type: TYPE_MAP[String(n.type ?? "info").toLowerCase()] ?? "System",
          timestamp: String(n.created_at ?? n.createdAt ?? new Date().toISOString()),
          isRead: Boolean(n.read ?? n.isRead ?? false),
        })) as Notification[]);
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDismiss = (notificationId: string) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId));
    toast({
      title: "Notification Dismissed",
    });
  };

  const getCount = (filter: FilterType) => {
    if (filter === "All") return notifications.length;
    if (filter === "Unread")
      return notifications.filter((n) => !n.isRead).length;
    return notifications.filter((n) => n.type === filter).length;
  };

  const unreadCount = getCount("Unread");

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    toast({
      title: "All notifications marked as read",
      description: "Your notification inbox is clear.",
    });
  };

  const filteredNotifications = useMemo(() => {
    if (activeTab === "Unread") {
      return notifications.filter((n) => !n.isRead);
    }
    if (activeTab !== "All") {
      return notifications.filter((n) => n.type === activeTab);
    }
    return notifications;
  }, [activeTab, notifications]);

  const tabs: FilterType[] = [
    "All",
    "Unread",
    "Alert",
    "System",
    "Finance",
    "Team",
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Manage your alerts and communications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as FilterType)}
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab} value={tab}>
                    {tab}{" "}
                    <Badge variant="secondary" className="ml-2">
                      {getCount(tab)}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type];
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 rounded-lg border p-4 group",
                    !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                >
                  <div
                    className={cn(
                      "mt-1 flex h-8 w-8 items-center justify-center rounded-full",
                      notificationColors[notification.type]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div
                      className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-blue-500"
                      title="Unread"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 sm:opacity-100"
                    onClick={() => handleDismiss(notification.id)}
                    aria-label="Dismiss notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h3 className="text-xl font-bold tracking-tight">
                All caught up!
              </h3>
              <p className="text-sm text-muted-foreground">
                You have no notifications in this category.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="email-realtime">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails for important events.
              </p>
            </div>
            <Switch id="email-realtime" defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="critical-sms">Critical Revenue Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get an SMS and email for critical drops.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <Switch id="critical-sms" defaultChecked />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="employee-events">New Employee Events</Label>
              <p className="text-sm text-muted-foreground">
                Notify about new hires and role changes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <Switch id="employee-events" defaultChecked />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="weekly-summary">Weekly Summary Report</Label>
              <p className="text-sm text-muted-foreground">
                Email every Monday at 8 AM.
              </p>
            </div>
            <Switch id="weekly-summary" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="maintenance-alerts">
                System Maintenance Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified about scheduled maintenance.
              </p>
            </div>
            <Switch id="maintenance-alerts" defaultChecked />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Email Digest Preview</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

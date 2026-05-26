import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, AlertTriangle, CreditCard, Globe, Users, Activity } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useNotifications, useMarkNotificationRead } from "@/hooks/usePlatform";
import { notificationApi } from "@/lib/platformClient";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type NotificationType = "proxy" | "billing" | "system" | "team" | "usage";

const iconMap: Record<string, typeof Globe> = {
  proxy: Globe, billing: CreditCard, system: Activity, team: Users, usage: AlertTriangle,
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | NotificationType>("all");
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const qc = useQueryClient();
  const { toast } = useToast();

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      toast({ title: "Error", description: "Failed to mark all read", variant: "destructive" });
    }
  };

  const filtered = filter === "all"
    ? notifications
    : notifications.filter(n => (n.type ?? "system") === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <SEOHead title="Notifications" description="View and manage your notifications." />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="w-6 h-6 text-primary" />Notifications</h1>
          <p className="text-muted-foreground">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="w-4 h-4 mr-1" />Mark All Read</Button>}
      </div>

      <Tabs value={filter} onValueChange={v => setFilter(v as "all" | NotificationType)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="proxy">Proxy</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.map(n => {
          const type = (n.type ?? "system") as NotificationType;
          const Icon = iconMap[type] ?? Activity;
          const isRead = !!n.read;
          return (
            <Card key={n.id} className={`transition-all duration-200 hover:bg-secondary/20 ${!isRead ? "border-primary/30 bg-primary/5" : ""}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${!isRead ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!isRead && <Badge variant="default" className="text-[10px] px-1.5 py-0">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body ?? n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</p>
                </div>
                {!isRead && (
                  <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n.id)}><Check className="w-4 h-4" /></Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card><CardContent className="p-12 text-center"><Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No notifications in this category.</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}

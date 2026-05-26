"use client";

import React, { useEffect, useState } from "react";
import {
  UserAlertsAndNotificationsData,
  UserAlert,
  UserNotification,
} from "@/types/user-system";
import { dashboardService } from "@/services/data/dashboard-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/design-system/typography/text";
import Link from "next/link";
import {
  Bell,
  Zap,
  Activity,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Clock,
  Plus,
  Trash2,
  Target,
  Search,
  Filter,
  Loader2,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * User Alerts & Notifications Dashboard Client.
 * Orchestrates personal monitoring triggers and chronological intelligence dispatches.
 */
export function AlertsNotificationsClient() {
  const [data, setData] = useState<UserAlertsAndNotificationsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await dashboardService.getAlertsAndNotifications();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Failed to sync personal dispatches", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleToggleAlert = (id: string) => {
    if (!data) return;
    setData({
      ...data,
      alerts: data.alerts.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "active" ? "inactive" : "active" }
          : a
      ),
    });
    toast({
      title: "Alert Status Updated",
      description: "Your trigger parameters have been synchronized.",
    });
  };

  const handleDeleteAlert = (id: string) => {
    if (!data) return;
    setData({ ...data, alerts: data.alerts.filter((a) => a.id !== id) });
    toast({ title: "Alert Node Purged", variant: "destructive" });
  };

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Establishing Communication Handshake...
        </Text>
      </div>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "price":
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case "volume":
        return <BarChart3 className="h-4 w-4 text-secondary" />;
      case "sentiment":
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "alert_triggered":
        return <Zap className="h-5 w-5 text-amber-500" />;
      case "news_update":
        return <Activity className="h-5 w-5 text-primary" />;
      case "system":
        return <Info className="h-5 w-5 text-secondary" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
      {/* ALERTS COLUMN */}
      <div className="lg:col-span-7 space-y-8">
        <header className="flex items-center justify-between px-2">
          <div>
            <Text variant="h2" className="text-2xl font-bold">
              Active Alerts
            </Text>
            <Text variant="bodySmall" className="text-muted-foreground">
              Managing {data.alerts.length} personal monitoring nodes.
            </Text>
          </div>
          <Button className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 font-bold h-11 px-6">
            <Plus className="mr-2 h-4 w-4" /> Create Alert
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {data.alerts.map((alert) => (
            <Card
              key={alert.id}
              className={cn(
                "glass-card border-none overflow-hidden group transition-all duration-300",
                alert.status === "active"
                  ? "hover:border-primary/30"
                  : "opacity-60"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div
                      className={cn(
                        "p-3 rounded-2xl bg-background/50 border border-white/5",
                        alert.status === "active"
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {getAlertIcon(alert.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Text variant="body" weight="bold">
                          {alert.asset}
                        </Text>
                        <Badge
                          variant="outline"
                          className="text-[8px] font-bold uppercase tracking-tighter border-white/10 bg-black/20"
                        >
                          {alert.type} Trigger
                        </Badge>
                      </div>
                      <Text
                        variant="caption"
                        className="text-muted-foreground font-mono"
                      >
                        Threshold:{" "}
                        <span className="text-foreground font-bold">
                          {alert.threshold}
                        </span>
                      </Text>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1.5">
                      <Text variant="label" className="text-[8px] opacity-50">
                        Monitoring
                      </Text>
                      <Switch
                        checked={alert.status === "active"}
                        onCheckedChange={() => handleToggleAlert(alert.id)}
                      />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Logic</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          Delete Node
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
            <Target className="h-32 w-32" />
          </div>
          <div className="flex items-start gap-6 relative z-10">
            <div className="p-4 rounded-[1.5rem] bg-primary/10 text-primary shrink-0">
              <Zap className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <Text variant="h4" className="font-bold">
                Pro Alert Precision
              </Text>
              <Text
                variant="bodySmall"
                className="text-muted-foreground leading-relaxed"
              >
                As a Pro member, your alerts utilize the **Institutional Feed
                Buffer**. Typical latency between market execution and your
                mobile notification is under **180ms**.
              </Text>
            </div>
          </div>
        </Card>
      </div>

      {/* NOTIFICATIONS COLUMN */}
      <div className="lg:col-span-5 space-y-8">
        <header className="flex items-center justify-between px-2">
          <div>
            <Text variant="h2" className="text-2xl font-bold">
              Activity Feed
            </Text>
            <Text variant="bodySmall" className="text-muted-foreground">
              Historical records of platform intelligence.
            </Text>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-bold text-xs"
          >
            Mark all read
          </Button>
        </header>

        <div className="space-y-4">
          {data.notifications.map((notif) => (
            <Card
              key={notif.id}
              className="glass-card border-none shadow-xl hover:bg-white/5 transition-colors group"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-5">
                  <div className="p-3 rounded-2xl bg-background/50 border border-white/5 shrink-0 group-hover:scale-110 transition-transform">
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold uppercase tracking-widest border-white/10 bg-black/20"
                      >
                        {notif.type.replace("_", " ")}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                        <Clock className="h-3 w-3" />{" "}
                        {notif.datetime.split(" ")[1]}
                      </div>
                    </div>
                    <div>
                      <Text
                        variant="bodySmall"
                        weight="bold"
                        className="block text-foreground"
                      >
                        {notif.asset}
                      </Text>
                      <Text
                        variant="caption"
                        className="text-muted-foreground leading-relaxed mt-1 block italic"
                      >
                        "{notif.message}"
                      </Text>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-primary font-bold text-[10px] uppercase gap-1 group/btn"
                      >
                        Investigate Node{" "}
                        <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="p-8 rounded-[3rem] bg-secondary/5 border border-secondary/20 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-[1.5rem] bg-secondary/10 flex items-center justify-center text-secondary">
            <Bell className="h-8 w-8" />
          </div>
          <div>
            <Text variant="body" weight="bold">
              Stay Synchronized
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed"
            >
              Enable push notifications in your **Account Settings** to receive
              critical asset triggers directly on your mobile device.
            </Text>
          </div>
          <Button
            variant="link"
            className="text-secondary font-bold text-xs"
            asChild
          >
            <Link href="/settings">Configure Delivery Channels</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

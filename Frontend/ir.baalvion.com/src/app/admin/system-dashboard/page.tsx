"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Shield, Gavel, Bell, FileBarChart } from "lucide-react";
import { pageService } from "@/core/services/page.service";
import { navigationService } from "@/core/services/navigation.service";
import { auditService } from "@/core/services/audit.service";
import { votingService } from "@/core/services/voting.service";
import { boardMaterialsService } from "@/core/services/board-materials.service";
import { notificationService } from "@/core/services/notification.service";
import { subscriptionService } from "@/core/services/subscription.service";
import { reportingService } from "@/core/services/reporting.service";
import { AuditLogEntry } from "@/core/content/schemas";

export default function SystemDashboardPage() {
  const [stats, setStats] = useState({
    pages: 0,
    activeNav: 0,
    activeVotes: 0,
    boardMaterials: 0,
    notifsSent: 0,
    subscribers: 0,
    reports: 0
  });
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSystemState = async () => {
    setIsLoading(true);
    const [pagesRes, navItems, logs, votes, materials, notifs, subs, reports] = await Promise.all([
      pageService.getAllPages(),
      navigationService.getAllItems(),
      auditService.getLogs({ limit: 10 }),
      votingService.getVotes(),
      boardMaterialsService.getMaterials(),
      notificationService.getAllNotifications(),
      subscriptionService.getSubscribers(),
      reportingService.getAllReports()
    ]);

    const pages = pagesRes.data || [];

    const countActiveNav = (items: any[]): number => 
      items.reduce((acc, item) => acc + (item.isActive ? 1 : 0) + (item.children ? countActiveNav(item.children) : 0), 0);

    setStats({
      pages: pages.length,
      activeNav: countActiveNav(navItems),
      activeVotes: votes.filter(v => v.status === 'Open').length,
      boardMaterials: materials.length,
      notifsSent: notifs.filter(n => n.status === 'Sent').length,
      subscribers: subs.length,
      reports: reports.length
    });
    setRecentActivity(logs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSystemState();
    window.addEventListener('storage', loadSystemState);
    window.addEventListener('audit-updated', loadSystemState);
    window.addEventListener('voting-updated', loadSystemState);
    window.addEventListener('notification-updated', loadSystemState);
    window.addEventListener('report-updated', loadSystemState);
    return () => {
      window.removeEventListener('storage', loadSystemState);
      window.removeEventListener('audit-updated', loadSystemState);
      window.removeEventListener('voting-updated', loadSystemState);
      window.removeEventListener('notification-updated', loadSystemState);
      window.removeEventListener('report-updated', loadSystemState);
    };
  }, []);

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Synchronizing distribution state...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health & Governance</h1>
        <p className="text-muted-foreground">Institutional monitoring of platform infrastructure, activity, and distribution.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Broadcasts Sent</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notifsSent}</div>
            <p className="text-xs text-muted-foreground">Distribution Engine: Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reports}</div>
            <p className="text-xs text-muted-foreground">Regulatory Snapshots</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Votes</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVotes}</div>
            <p className="text-xs text-muted-foreground">Ballot Ledger: Ready</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Operational</div>
            <p className="text-xs text-muted-foreground">Compliance Ledger: Online</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Administrative Activity</CardTitle>
            <CardDescription>Live feed of system mutations and role-based actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-4 text-sm border-b pb-3 last:border-0">
                  <div className="mt-1">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-semibold">{log.action}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.module} / {log.userRole}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution Metrics</CardTitle>
            <CardDescription>Performance of the notification engine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <span className="text-sm font-medium">Delivery Success Rate</span>
              <Badge variant="outline">100%</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <span className="text-sm font-medium">Segment: Institutional (P1)</span>
              <Badge variant="secondary">2 Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <span className="text-sm font-medium">Segment: Strategic (P3)</span>
              <Badge variant="secondary">1 Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApprovalsPanel } from "@/components/admin/ApprovalsPanel";
import { VotingPanel } from "@/components/admin/VotingPanel";
import { RegulatoryExportPanel } from "@/components/admin/RegulatoryExportPanel";
import { AuditLogPanel } from "@/components/admin/AuditLogPanel";
import { AlertTriggerPanel } from "@/components/notifications/AlertTriggerPanel";
import { ShieldCheck, Gavel, FileBarChart, History, Activity, Megaphone } from "lucide-react";
import { authService } from "@/core/services/auth.service";
import { UserRole } from "@/core/content/schemas";

export default function AdminDashboardPage() {
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      const { role } = await authService.getCurrentUser();
      setActiveRole(role);
      setIsLoading(false);
    };
    loadRole();
    window.addEventListener('storage', loadRole);
    return () => window.removeEventListener('storage', loadRole);
  }, []);

  if (isLoading) return <div className="p-20 text-center text-muted-foreground">Authenticating command center...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance & Admin Console</h1>
          <p className="text-muted-foreground mt-1">System-wide governance, approvals, and regulatory monitoring.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-full">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Context: {activeRole}</span>
        </div>
      </div>

      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl bg-card border border-border/50">
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> Approvals
          </TabsTrigger>
          <TabsTrigger value="voting" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" /> Resolutions
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Broadcast
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" /> Reports
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="approvals">
            <ApprovalsPanel role={activeRole} />
          </TabsContent>
          
          <TabsContent value="voting">
            <VotingPanel role={activeRole} />
          </TabsContent>

          <TabsContent value="broadcast">
            <AlertTriggerPanel role={activeRole} />
          </TabsContent>

          <TabsContent value="reports">
            <RegulatoryExportPanel role={activeRole} />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

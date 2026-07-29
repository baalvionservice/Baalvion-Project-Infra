/**
 * @file dashboard-shell.tsx
 * @description THE SUPREME DASHBOARD ORCHESTRATOR (client half).
 * Integrates the resizable workspace engine and global navigation.
 * Split out of layout.tsx so the route segment config (`dynamic = 'force-dynamic'`)
 * can live in a Server Component — Next.js does not allow route segment config
 * exports from a 'use client' module.
 */
'use client';

import 'leaflet/dist/leaflet.css';
import { DashboardHeader } from "./header";
import { DashboardSidebar } from "./sidebar";
import { WorkspaceShell } from "./workspace-shell";
import { AiCopilotDrawer } from "./ai-copilot-drawer";
import { RealtimeProvider } from "./realtime-provider";
import { useWorkspaceStore } from "@/modules/workspace/store/workspace-store";
import { TradeQueryProvider } from "@/api/query-provider";
import { cn } from "@/lib/utils";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarCollapsed } = useWorkspaceStore();

  return (
    <TradeQueryProvider>
      <div
        className={cn(
          "min-h-screen w-full bg-background grid transition-all duration-500",
          sidebarCollapsed ? "grid-cols-[80px_1fr]" : "grid-cols-[280px_1fr]"
        )}
      >
        {/* 1. PRIMARY NAVIGATION RAIL */}
        <DashboardSidebar collapsed={sidebarCollapsed} />

        {/* 2. OPERATIONAL WORKSPACE (COMMAND PLANE) */}
        <div className="flex flex-col min-w-0 overflow-hidden bg-background relative">
          <DashboardHeader />

          {/* THE TACTICAL SHELL: Resizable panes & tabs */}
          <WorkspaceShell>
             {children}
          </WorkspaceShell>
        </div>

        {/* OVERLAYS & COGNITIVE CLUSTERS */}
        <AiCopilotDrawer />
        <RealtimeProvider />
      </div>
    </TradeQueryProvider>
  );
}

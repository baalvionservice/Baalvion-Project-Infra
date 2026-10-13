/**
 * @file dashboard-shell.tsx
 * @description The frame around every signed-in page: navigation, top bar and content area.
 * Split out of layout.tsx so the route segment config (`dynamic = 'force-dynamic'`) can live in a
 * Server Component — Next.js does not allow route segment config exports from a 'use client' module.
 *
 * Layout by screen width (the same rules phones, iPads and desktops all follow):
 *   under 1024px  one column, full width. Navigation opens from the menu button in the top bar with
 *                 full labels (phones and iPad portrait), so nobody has to guess what an icon means
 *   1024px and up the full navigation beside the content (iPad landscape, laptops, desktops), which
 *                 the user may collapse to a slim icon rail
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div
        className={cn(
          // min-h-dvh follows the visible height on phones, where the browser toolbar grows and shrinks.
          "min-h-dvh w-full bg-background grid grid-cols-1 transition-[grid-template-columns] duration-300",
          sidebarCollapsed ? "lg:grid-cols-[80px_1fr]" : "lg:grid-cols-[280px_1fr]"
        )}
      >
        {/* Navigation beside the content from 1024px up; below that it opens from the top bar. */}
        <DashboardSidebar collapsed={sidebarCollapsed} />

        <div className="relative flex min-h-dvh min-w-0 flex-col bg-background">
          <DashboardHeader />
          <WorkspaceShell>
             {children}
          </WorkspaceShell>
        </div>

        <AiCopilotDrawer />
        <RealtimeProvider />
      </div>
    </TradeQueryProvider>
  );
}

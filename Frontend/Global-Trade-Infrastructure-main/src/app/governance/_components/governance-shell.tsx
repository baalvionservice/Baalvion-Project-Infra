/**
 * @file governance-shell.tsx
 * @description Standard dashboard command shell for all consolidated governance
 * and oversight pages (client half — split out so the route segment config in
 * layout.tsx can live in a Server Component).
 */
'use client';

import { DashboardHeader } from "@/app/(dashboard)/_components/header";
import { DashboardSidebar } from "@/app/(dashboard)/_components/sidebar";

export function GovernanceShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <DashboardSidebar />
        <div className="flex flex-col">
            <DashboardHeader />
            <div className="flex-1 p-6 md:p-8 lg:p-6 overflow-auto">
              {children}
            </div>
        </div>
    </div>
  )
}
